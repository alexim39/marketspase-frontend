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
  templateUrl: './funding.component.html',
  styleUrls: ['./funding.component.scss']
})
export class WalletFundingComponent implements OnInit {
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

              // get update user record
              this.userService.getUser(this.user()?.uid || '')
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                error: (error) => {
                  console.error('Failed to refresh user:', error);
                }
              });

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
    this.router.navigate(['dashboard/campaigns/create']);
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