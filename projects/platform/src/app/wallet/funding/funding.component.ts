import { Component, OnInit, OnDestroy, inject, signal, computed, Inject, Optional, Signal, DestroyRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { timer } from 'rxjs';
import { UserService } from '../../common/services/user.service';
import { PaymentResult, PaymentRequest, PaystackService } from '../../common/services/paystack.service';
import { RecordPaymentPayload, WalletService } from '../wallet.service';
import { Router } from '@angular/router';
import { UserInterface } from '../../../../../shared-services/src/public-api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface WalletDialogData {
  currentBalance: number;
  minAmount?: number;
  suggestedAmount?: number;
  campaignBudget?: number;
  userId?: string;
}

interface QuickAmount {
  value: number;
  label: string;
  popular?: boolean;
  description?: string;
}

interface PaymentStatusData {
  success: boolean;
  message: string;
  reference?: string;
  amount?: number;
  timestamp?: Date;
}

@Component({
  selector: 'wallet-funding',
  standalone: true,
  providers: [PaystackService, WalletService],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatProgressBarModule,
    MatDividerModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    CurrencyPipe,
    MatIconModule
  ],
  template: `
    <div class="wallet-funding-container" [class.processing]="isProcessingPayment()">
      <!-- Header -->
      <div class="dialog-header">
        <div class="header-content">
          <div class="header-icon">
            <mat-icon>account_balance_wallet</mat-icon>
          </div>
          <div class="header-text">
            <h2>Fund Your Wallet</h2>
            <p>Add money to your wallet to create and launch campaigns</p>
          </div>
        </div>
        <button 
          mat-icon-button 
          (click)="closeDialog()" 
          class="close-btn"
          [disabled]="isProcessingPayment()"
          matTooltip="Close dialog">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="dialog-content">
        <!-- Current Balance Card -->
        <div class="balance-section">
          <div class="balance-card">
            <div class="balance-info">
              <div class="balance-label">Current Balance</div>
              <div class="balance-amount">{{ data.currentBalance | currency: '₦':'symbol':'1.0-2' }}</div>
            </div>
            <div class="balance-icon">
              <mat-icon>account_balance</mat-icon>
            </div>
          </div>

          @if (showFundingRequirement()) {
            <div class="funding-requirement">
              <mat-icon>info</mat-icon>
              <div>
                <p class="requirement-title">Additional Funding Required</p>
                <p class="requirement-amount">
                  You need {{ getFundingShortfall() | currency: '₦':'symbol':'1.0-2' }} more to fund your campaign
                </p>
              </div>
            </div>
          }
        </div>

        <!-- Quick Amount Selection -->
        <div class="quick-amounts-section">
          <h3>Quick Select</h3>
          <div class="quick-amounts-grid">
            @for (amount of quickAmounts; track amount.value) {
              <button 
                mat-button 
                [class.selected]="selectedAmount() === amount.value"
                [class.popular]="amount.popular"
                [disabled]="isProcessingPayment() || paymentStatus() !== null"
                (click)="selectQuickAmount(amount.value)"
                class="quick-amount-btn"
                [matTooltip]="amount.description || ''"
                matTooltipPosition="above">
                @if (amount.popular) {
                  <span class="popular-badge">Popular</span>
                }
                <div class="amount-value">{{ amount.value | currency: '₦':'symbol':'1.0-0' }}</div>
                <div class="amount-label">{{ amount.label }}</div>
              </button>
            }
          </div>
        </div>

        <!-- Custom Amount Form -->
        <div class="custom-amount-section">
          <h3>Or Enter Custom Amount</h3>
          <form [formGroup]="fundingForm" class="funding-form">
            <mat-form-field class="amount-field" appearance="outline">
              <mat-label>Amount (₦)</mat-label>
              <span matTextPrefix>₦ </span>
              <input 
                matInput 
                type="number" 
                formControlName="amount" 
                placeholder="0.00"
                [disabled]="isProcessingPayment() || paymentStatus() !== null"
                (input)="onCustomAmountChange($event)"
                (focus)="clearQuickSelection()"
                min="0"
                max="1000000"
                step="100">
              <mat-hint>Minimum: ₦{{ minFundingAmount | number:'1.0-0' }} | Maximum: ₦{{ maxFundingAmount | number:'1.0-0' }}</mat-hint>
              
              @if (fundingForm.get('amount')?.hasError('required') && fundingForm.get('amount')?.touched) {
                <mat-error>Amount is required</mat-error>
              }
              @if (fundingForm.get('amount')?.hasError('min')) {
                <mat-error>Minimum amount is ₦{{ minFundingAmount | number:'1.0-0' }}</mat-error>
              }
              @if (fundingForm.get('amount')?.hasError('max')) {
                <mat-error>Maximum amount is ₦{{ maxFundingAmount | number:'1.0-0' }}</mat-error>
              }
              @if (fundingForm.get('amount')?.hasError('pattern')) {
                <mat-error>Please enter a valid amount</mat-error>
              }
            </mat-form-field>
          </form>
        </div>

        <!-- Payment Summary -->
        @if (selectedAmount() > 0 && !paymentStatus()) {
          <div class="payment-summary">
            <h3>Payment Summary</h3>
            <div class="summary-card">
              <div class="summary-row">
                <span>Amount to Fund</span>
                <span class="amount">{{ selectedAmount() | currency: '₦':'symbol':'1.0-2' }}</span>
              </div>
              <div class="summary-row">
                <span>Processing Fee ({{ (processingFeeRate * 100) | number:'1.1-1' }}%)</span>
                <span class="fee">{{ processingFee() | currency: '₦':'symbol':'1.0-2' }}</span>
              </div>
              <div class="summary-row total">
                <span>Total to Pay</span>
                <span class="amount">{{ totalAmount() | currency: '₦':'symbol':'1.0-2' }}</span>
              </div>
              <div class="summary-row">
                <span>New Wallet Balance</span>
                <span class="new-balance">{{ newBalance() | currency: '₦':'symbol':'1.0-2' }}</span>
              </div>
            </div>
          </div>
        }

        <!-- Payment Method -->
        @if (!paymentStatus()) {
          <div class="payment-method-section">
            <h3>Payment Method</h3>
            <div class="payment-method-card">
              <div class="payment-info">
                <mat-icon>payment</mat-icon>
                <div>
                  <p class="method-name">Paystack Payment Gateway</p>
                  <p class="method-description">Secure payment via debit card, bank transfer, or USSD</p>
                </div>
              </div>
              <div class="security-badges">
                <div class="badge" matTooltip="256-bit SSL encryption">
                  <mat-icon>security</mat-icon>
                  <span>SSL Secured</span>
                </div>
                <div class="badge" matTooltip="Payment Card Industry Data Security Standard compliant">
                  <mat-icon>verified</mat-icon>
                  <span>PCI DSS Compliant</span>
                </div>
                <div class="badge" matTooltip="Central Bank of Nigeria approved">
                  <mat-icon>account_balance</mat-icon>
                  <span>CBN Approved</span>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Payment Processing Overlay -->
        @if (isProcessingPayment()) {
          <div class="payment-processing">
            <mat-progress-bar mode="indeterminate" color="primary"></mat-progress-bar>
            <div class="processing-content">
              <mat-icon>hourglass_empty</mat-icon>
              <h4>Processing Payment</h4>
              <p>Please wait while we securely process your payment...</p>
              <p class="warning">⚠️ Do not close this window or navigate away</p>
              <div class="processing-timer">
                Processing time: {{ processingTime() }}s
              </div>
            </div>
          </div>
        }

        <!-- Payment Status -->
        @if (paymentStatus()) {
          <div class="payment-status" [class.success]="paymentStatus()!.success" [class.error]="!paymentStatus()!.success">
            <div class="status-content">
              <mat-icon>{{ paymentStatus()!.success ? 'check_circle' : 'error_outline' }}</mat-icon>
              <h4>{{ paymentStatus()!.success ? 'Payment Successful!' : 'Payment Failed' }}</h4>
              <p>{{ paymentStatus()!.message }}</p>
              
              @if (paymentStatus()!.success) {
                <div class="success-details">
                  <p><strong>Amount Added:</strong> {{ selectedAmount() | currency: '₦':'symbol':'1.0-2' }}</p>
                  <p><strong>Transaction Reference:</strong> {{ paymentStatus()!.reference }}</p>
                  <p><strong>Date:</strong> {{ paymentStatus()!.timestamp | date:'medium' }}</p>
                  <div class="celebration-animation">🎉</div>
                </div>
              } @else {
                <div class="error-details">
                  <p>Don't worry, your money is safe. No charges were made to your account.</p>
                  @if (retryCount() < maxRetries) {
                    <p>You can try again or contact support if the problem persists.</p>
                  }
                </div>
              }
            </div>
          </div>
        }

        <!-- Helpful Tips -->
        @if (!paymentStatus() && !isProcessingPayment()) {
          <div class="tips-section">
            <div class="tips-card">
              <div class="tips-header">
                <mat-icon>lightbulb</mat-icon>
                <span>Payment Tips</span>
              </div>
              <ul class="tips-list">
                <li>Ensure your card is enabled for online transactions</li>
                <li>Have sufficient balance for the total amount including fees</li>
                <li>Use a stable internet connection during payment</li>
                <li>Keep your transaction reference for records</li>
              </ul>
            </div>
          </div>
        }
      </div>

      <!-- Action Buttons -->
      <div class="dialog-actions">
        @if (!paymentStatus()) {
          <button 
            mat-button 
            (click)="closeDialog()" 
            class="cancel-btn"
            [disabled]="isProcessingPayment()">
            Cancel
          </button>
          <button 
            mat-flat-button 
            color="primary" 
            (click)="initiatePayment()" 
            class="pay-btn"
            [disabled]="!canProceedWithPayment() || isProcessingPayment()"
            [matTooltip]="getPayButtonTooltip()">
            @if (isProcessingPayment()) {
              <mat-progress-spinner diameter="20" color="accent"></mat-progress-spinner>
              Processing...
            } @else {
              <mat-icon>payment</mat-icon>
              Pay {{ totalAmount() | currency: '₦':'symbol':'1.0-2' }}
            }
          </button>
        } @else {
          @if (paymentStatus()!.success) {
            <button 
              mat-button 
              (click)="closeDialog()"
              class="cancel-btn">
              Close
            </button>
            <button 
              mat-flat-button 
              color="primary" 
              (click)="continueWithCampaign()"
              class="pay-btn">
              <mat-icon>rocket_launch</mat-icon>
              Continue to Campaign
            </button>
          } @else {
            @if (retryCount() < maxRetries) {
              <button 
                mat-button 
                (click)="resetPayment()"
                class="cancel-btn">
                <mat-icon>refresh</mat-icon>
                Try Again
              </button>
            }
            <button 
              mat-flat-button 
              color="primary" 
              (click)="closeDialog()"
              class="pay-btn">
              <mat-icon>close</mat-icon>
              Close
            </button>
          }
        }
      </div>
    </div>
  `,
  styleUrls: ['./funding.component.scss']
})
export class WalletFundingComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private paystackService = inject(PaystackService);
  private dialogRef = inject(MatDialogRef<WalletFundingComponent>);

  fundingForm!: FormGroup;
  private readonly destroyRef = inject(DestroyRef);

  private userService = inject(UserService);
  // Expose the signal directly to the template
  public user: Signal<UserInterface | null> = this.userService.user;
  private router = inject(Router);
  
  // Configuration
  readonly minFundingAmount = 500;
  readonly maxFundingAmount = 1000000;
  readonly processingFeeRate = 0.015; // 1.5%
  readonly minProcessingFee = 100;
  readonly maxRetries = 3;

  // Signals
  selectedAmount = signal<number>(0);
  isProcessingPayment = signal(false);
  paymentStatus = signal<PaymentStatusData | null>(null);
  processingTime = signal<number>(0);
  retryCount = signal<number>(0);

  // Computed values
  processingFee = computed(() => {
    const amount = this.selectedAmount();
    if (amount === 0) return 0;
    const fee = Math.max(amount * this.processingFeeRate, this.minProcessingFee);
    return Math.round(fee * 100) / 100;
  });

  totalAmount = computed(() => this.selectedAmount() + this.processingFee());
  newBalance = computed(() => this.data.currentBalance + this.selectedAmount());
  
  canProceedWithPayment = computed(() => 
    this.selectedAmount() >= this.minFundingAmount && 
    this.selectedAmount() <= this.maxFundingAmount &&
    this.fundingForm.valid && 
    !this.isProcessingPayment() &&
    this.paymentStatus() === null
  );

  showFundingRequirement = computed(() => 
    this.data.campaignBudget && this.data.campaignBudget > this.data.currentBalance
  );

  // Quick amounts configuration with better UX
  quickAmounts: QuickAmount[] = [
    { value: 1000, label: 'Starter', description: 'Perfect for small campaigns' },
    { value: 5000, label: 'Popular', popular: true, description: 'Most chosen by users' },
    { value: 10000, label: 'Standard', description: 'Good for medium campaigns' },
    { value: 25000, label: 'Premium', description: 'For larger campaigns' },
    { value: 50000, label: 'Business', description: 'Professional campaigns' },
    { value: 100000, label: 'Enterprise', description: 'Large scale campaigns' }
  ];

  private walletService = inject(WalletService);

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) public data: WalletDialogData
  ) {
    // Set default data if not provided
    this.data = {
      //currentBalance: 0,
      minAmount: this.minFundingAmount,
      ...data
    };
  }

  ngOnInit(): void {
    this.initializeForm();
    this.setSuggestedAmount();
    this.setupFormValidation();
  }

 
  ngOnDestroy(): void {
    // this.destroy$.next();
    // this.destroy$.complete();
  }



  private initializeForm(): void {
    this.fundingForm = this.fb.group({
      amount: [0, [
        Validators.required,
        Validators.min(this.minFundingAmount),
        Validators.max(this.maxFundingAmount),
        Validators.pattern(/^\d+(\.\d{1,2})?$/) // Allow up to 2 decimal places
      ]]
    });

    // Subscribe to form changes with debouncing
      this.fundingForm.get('amount')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        const numValue = parseFloat(value) || 0;
        if (numValue >= this.minFundingAmount && numValue <= this.maxFundingAmount) {
          this.selectedAmount.set(numValue);
        } else if (numValue === 0) {
          this.selectedAmount.set(0);
        }
      })
  }

  private setupFormValidation(): void {
    // Add custom validators
    this.fundingForm.get('amount')?.addValidators([
      this.customAmountValidator.bind(this)
    ]);
  }

  private customAmountValidator(control: any) {
    const value = parseFloat(control.value);
    if (!value) return null;
    
    if (value % 50 !== 0) {
      return { 'notMultiple': { value: control.value, multiple: 50 } };
    }
    return null;
  }

  private setSuggestedAmount(): void {
    let suggestedAmount = this.data.suggestedAmount || 5000;

    // If there's a campaign budget shortfall, suggest that amount
    if (this.showFundingRequirement()) {
      const shortfall = this.getFundingShortfall();
      // Round up to nearest 500 for better UX
      suggestedAmount = Math.ceil(shortfall / 500) * 500;
      suggestedAmount = Math.min(suggestedAmount, this.maxFundingAmount);
    }

    this.selectQuickAmount(suggestedAmount);
  }

  getFundingShortfall(): number {
    if (!this.data.campaignBudget) return 0;
    return Math.max(0, this.data.campaignBudget - this.data.currentBalance);
  }

  selectQuickAmount(amount: number): void {
    this.selectedAmount.set(amount);
    this.fundingForm.patchValue({ amount }, { emitEvent: false });
    this.fundingForm.get('amount')?.markAsTouched();
  }

  clearQuickSelection(): void {
    // This is called when user starts typing in custom amount field
    // We don't need to clear selectedAmount as it will be updated by form changes
  }

  onCustomAmountChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = parseFloat(input.value) || 0;
    
    // Ensure the value is within bounds
    value = Math.min(Math.max(value, 0), this.maxFundingAmount);
    this.selectedAmount.set(value);
  }

  async initiatePayment(): Promise<void> {
    if (!this.canProceedWithPayment()) {
      this.showError('Please enter a valid amount');
      return;
    }

    if (!this.user()) {
      this.showError('User information not available. Please refresh and try again.');
      return;
    }

    this.isProcessingPayment.set(true);
    this.paymentStatus.set(null);
    this.startProcessingTimer();

    try {
      const paymentRequest: PaymentRequest = {
        amount: this.totalAmount(),
        user: this.user()!,
        metadata: {
          purpose: 'wallet_funding',
          fundingAmount: this.selectedAmount(),
          processingFee: this.processingFee(),
          currentBalance: this.data.currentBalance,
          userId: this.data.userId || this.user()?._id,
          timestamp: new Date().toISOString()
        },
        reference: this.generatePaymentReference()
      };

      // Subscribe to payment result
        this.paystackService.initiatePayment(paymentRequest)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (result) => this.handlePaymentResult(result),
          error: (error) => this.handlePaymentError(error.message || 'Payment failed'),
          complete: () => this.stopProcessingTimer()
        })

    } catch (error) {
      this.handlePaymentError('Failed to initiate payment');
      this.stopProcessingTimer();
    }
  }

  private startProcessingTimer(): void {
    this.processingTime.set(0);
      timer(0, 1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(seconds => {
        this.processingTime.set(seconds);
      })
  }

  private stopProcessingTimer(): void {
    this.isProcessingPayment.set(false);
  }

  // private handlePaymentResult(result: PaymentResult): void {
  //   this.stopProcessingTimer();

  //   if (result.success && result.response) {
  //     this.paymentStatus.set({
  //       success: true,
  //       message: 'successfully added fund to your wallet',//`Successfully added ${this.selectedAmount() | currency: 'NGN':'symbol':'1.0-2'} to your wallet`,
  //       reference: result.response.reference,
  //       amount: this.selectedAmount(),
  //       timestamp: new Date()
  //     });

  //     // Update the wallet balance
  //     this.updateWalletBalance();
      
  //     this.showSuccess('Wallet funded successfully! 🎉');
      
  //     // Auto-close after success (optional)
  //     // setTimeout(() => this.continueWithCampaign(), 3000);
      
  //   } else {
  //     this.handlePaymentError(result.error || 'Payment was cancelled or failed');
  //   }
  // }


  private handlePaymentResult(paystackResult: PaymentResult): void {
    this.stopProcessingTimer();

    if (paystackResult.success && paystackResult.response) {
      const paymentStatusData = {
        success: true,
        message: 'Processing your wallet update...',
        reference: paystackResult.response.reference,
        amount: this.selectedAmount(),
        timestamp: new Date()
      };
      this.paymentStatus.set(paymentStatusData);
      
      // Step 1: Prepare the data to send to the backend
      const payload: RecordPaymentPayload = {
        userId: this.data.userId || this.user()?._id || 'unknown',
        amount: this.selectedAmount(),
        paystackResult: paystackResult //result.response.reference
      };

      // Step 2: Call the backend endpoint to verify and record the payment
        this.walletService.recordPayment(payload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
           if (response.success) {
              // The backend has confirmed and updated the wallet
              this.paymentStatus.set({
                ...paymentStatusData,
                message: response.message//'Successfully added fund to your wallet',
              });
              this.updateLocalWalletBalance();
              //this.showSuccess(`${response.message} 🎉`);
           }
          },
          error: (backendError) => {
            // The backend verification failed. Show a more serious error message.
            this.handlePaymentError('Payment confirmed but failed to record. Please contact support.');
            //console.error('Backend recording error:', backendError);
          }
        })

    } else {
      this.handlePaymentError(paystackResult.error || 'Payment was cancelled or failed');
    }
  }

  private handlePaymentError(errorMessage: string): void {
    this.stopProcessingTimer();
    this.retryCount.update(count => count + 1);
    
    this.paymentStatus.set({
      success: false,
      message: errorMessage,
      timestamp: new Date()
    });
    
    //this.showError('Payment failed. Please try again.');
  }

  // Rename this method to avoid confusion
  private updateLocalWalletBalance(): void {
    this.data.currentBalance += this.selectedAmount();
  }

  private generatePaymentReference(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const userId = this.data.userId || this.user()?._id || 'unknown';
    return `WALLET-${userId}-${timestamp}-${random}`;
  }

  resetPayment(): void {
    this.paymentStatus.set(null);
    this.isProcessingPayment.set(false);
    this.processingTime.set(0);
  }

  continueWithCampaign(): void {
    this.dialogRef.close({ 
      success: true, 
      amount: this.selectedAmount(),
      newBalance: this.newBalance(),
      reference: this.paymentStatus()?.reference,
      timestamp: this.paymentStatus()?.timestamp
    });
    this.router.navigate(['dashboard/campaign/create']);
  }

  closeDialog(): void {
    if (this.isProcessingPayment()) {
      const confirmClose = confirm('Payment is in progress. Are you sure you want to close?');
      if (!confirmClose) return;
    }

    const result = this.paymentStatus()?.success ? {
      success: true,
      amount: this.selectedAmount(),
      newBalance: this.newBalance(),
      reference: this.paymentStatus()?.reference,
      timestamp: this.paymentStatus()?.timestamp
    } : null;
    
    this.dialogRef.close(result);
  }

  getPayButtonTooltip(): string {
    if (!this.canProceedWithPayment()) {
      if (this.selectedAmount() < this.minFundingAmount) {
        return `Minimum amount is ₦${this.minFundingAmount}`;
      }
      if (this.selectedAmount() > this.maxFundingAmount) {
        return `Maximum amount is ₦${this.maxFundingAmount}`;
      }
      if (!this.fundingForm.valid) {
        return 'Please enter a valid amount';
      }
    }
    return 'Proceed to secure payment';
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, '✓', { 
      duration: 5000,
      panelClass: 'success-snackbar'
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'OK', { 
      duration: 7000,
      panelClass: 'error-snackbar'
    });
  }

  // Accessibility helpers
  getAriaLabel(): string {
    return `Fund wallet dialog. Current balance: ${this.data.currentBalance}. Selected amount: ${this.selectedAmount()}`;
  }
}