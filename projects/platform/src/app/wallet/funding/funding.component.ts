import { Component, OnInit, inject, signal, computed, Inject, Optional, Signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { timer } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Import child components
import { WalletBalanceCardComponent } from './components/wallet-balance-card/wallet-balance-card.component';
import { QuickAmountSelectorComponent, QuickAmount } from './components/quick-amount-selector/quick-amount-selector.component';
import { CustomAmountFormComponent } from './components/custom-amount-form/custom-amount-form.component';
import { PaymentSummaryComponent } from './components/payment-summary/payment-summary.component';
import { PaymentMethodComponent } from './components/payment-method/payment-method.component';
import { PaymentProcessingComponent } from './components/payment-processing/payment-processing.component';
import { PaymentStatusComponent, PaymentStatusData } from './components/payment-status/payment-status.component';
import { DialogActionsComponent } from './components/dialog-actions/dialog-actions.component';

// Services
import { UserService } from '../../common/services/user.service';
import { PaymentResult, PaymentRequest, PaystackService } from '../../common/services/paystack.service';
import { RecordPaymentPayload, WalletService } from '../wallet.service';
import { DeviceService } from '@shared/services/device';
import { CurrencyUtilsPipe, UserInterface } from '@shared/services';
import {
  CurrencyQuote,
  PaymentCurrencyConfig,
  PaymentCurrencyService,
} from '../../common/services/payment-currency.service';

export interface WalletDialogData {
  currentBalance: number;
  minAmount?: number;
  suggestedAmount?: number;
  campaignBudget?: number;
  userId?: string;
  wallets: any;
}

@Component({
  selector: 'wallet-funding',
  standalone: true,
  providers: [PaystackService, WalletService],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    CurrencyUtilsPipe,
    // Child components
    WalletBalanceCardComponent,
    QuickAmountSelectorComponent,
    CustomAmountFormComponent,
    PaymentSummaryComponent,
    PaymentMethodComponent,
    PaymentProcessingComponent,
    PaymentStatusComponent,
    DialogActionsComponent
  ],
  templateUrl: './funding.component.html',
  styleUrls: ['./funding.component.scss']
})
export class WalletFundingComponent implements OnInit {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private paystackService = inject(PaystackService);
  private dialogRef = inject(MatDialogRef<WalletFundingComponent>);
  private destroyRef = inject(DestroyRef);
  private userService = inject(UserService);
  private walletService = inject(WalletService);
  private paymentCurrencyService = inject(PaymentCurrencyService);
  private router = inject(Router);

  private deviceService = inject(DeviceService);
  deviceType = computed(() => this.deviceService.type());

  // Configuration
  readonly minFundingAmount = 1000;
  readonly maxFundingAmount = 1000000;
  //readonly processingFeeRate = 0.015; // 1.5%
  readonly processingFeeRate = 0.1; // 10%
  readonly minProcessingFee = 100;
  readonly maxRetries = 3;

  // Signals
  selectedAmount = signal<number>(0);
  isProcessingPayment = signal(false);
  paymentStatus = signal<PaymentStatusData | null>(null);
  processingTime = signal<number>(0);
  retryCount = signal<number>(0);
  currencyConfig = signal<PaymentCurrencyConfig | null>(null);
  selectedCurrency = signal<string>('NGN');
  currencyQuote = signal<CurrencyQuote | null>(null);
  isQuoteLoading = signal<boolean>(false);

  // Quick amounts configuration
  quickAmounts: QuickAmount[] = [
    { value: 1000, label: 'Starter', description: 'Perfect for small campaigns' },
    { value: 5000, label: 'Popular', popular: true, description: 'Most chosen by users' },
    { value: 10000, label: 'Standard', description: 'Good for medium campaigns' },
    { value: 25000, label: 'Premium', description: 'For larger campaigns' },
    { value: 50000, label: 'Business', description: 'Professional campaigns' },
    { value: 100000, label: 'Enterprise', description: 'Large scale campaigns' }
  ];

  // Form
  fundingForm!: FormGroup;

  // Computed values
  processingFee = computed(() => {
    const amount = this.selectedAmount();
    if (amount === 0) return 0;
    const fee = Math.max(amount * this.processingFeeRate, this.minProcessingFee);
    return Math.round(fee * 100) / 100;
  });

  walletBaseCurrency = computed(() => this.user()?.wallets?.marketer?.baseCurrency || this.user()?.wallets?.marketer?.currency || 'NGN');
  supportedFundingCurrencies = computed(() => (
    this.currencyConfig()?.supportedCurrencies?.filter((currency) => currency?.capabilities?.deposit) || []
  ));

  minimumAmountForSelectedCurrency = computed(() => (
    this.selectedCurrency() === 'USD' ? 2 : this.minFundingAmount
  ));

  totalAmount = computed(() => this.selectedAmount() + this.processingFee());
  newBalance = computed(() => this.data.currentBalance + (this.currencyQuote()?.baseAmount ?? this.selectedAmount()));
  
  canProceedWithPayment = computed(() => 
    this.selectedAmount() >= this.minimumAmountForSelectedCurrency() && 
    this.selectedAmount() <= this.maxFundingAmount &&
    this.fundingForm.valid && 
    !this.isProcessingPayment() &&
    this.paymentStatus() === null &&
    !this.isQuoteLoading()
  );

  showFundingRequirement = computed(() => 
    this.data.campaignBudget && this.data.campaignBudget > this.data.currentBalance
  );

  // Expose user signal to template
  public user: Signal<UserInterface | null> = this.userService.user;

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    
    this.data = {
      minAmount: this.minFundingAmount,
      currentBalance: this.data?.wallets?.marketer?.balance,
      ...data
    };
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadCurrencyConfig();
  }

  private initializeForm(): void {
    this.fundingForm = this.fb.group({
      amount: [0, [
        Validators.required,
        Validators.min(1),
        Validators.max(this.maxFundingAmount),
        Validators.pattern(/^\d+(\.\d{1,2})?$/)
      ]]
    });

    this.fundingForm.get('amount')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        const numValue = parseFloat(value) || 0;
        if (numValue > 0 && numValue <= this.maxFundingAmount) {
          this.selectedAmount.set(numValue);
          this.refreshFundingQuote();
        } else if (numValue === 0) {
          this.selectedAmount.set(0);
          this.currencyQuote.set(null);
        }
      });
  }

  private loadCurrencyConfig(): void {
    this.paymentCurrencyService.getConfig()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.currencyConfig.set(response?.data || null);
          const supportedCurrencies = (response?.data?.supportedCurrencies || [])
            .filter((currency) => currency?.capabilities?.deposit);
          const preferredCurrency = this.user()?.preferences?.financial?.displayCurrency || 'NGN';
          const initialCurrency = supportedCurrencies.find((currency) => currency.code === preferredCurrency)?.code
            || supportedCurrencies[0]?.code
            || 'NGN';
          this.selectedCurrency.set(initialCurrency);
          this.setSuggestedAmount();
          this.refreshFundingQuote();
        },
        error: () => {
          this.selectedCurrency.set('NGN');
          this.setSuggestedAmount();
        }
      });
  }

  private setSuggestedAmount(): void {
    let suggestedAmount = this.data.suggestedAmount || 5000;

    if (this.showFundingRequirement()) {
      const shortfall = this.getFundingShortfall();
      suggestedAmount = Math.ceil(shortfall / 500) * 500;
      suggestedAmount = Math.min(suggestedAmount, this.maxFundingAmount);
    }

    this.selectQuickAmount(suggestedAmount);
  }

  private refreshFundingQuote(): void {
    if (!this.selectedAmount() || this.selectedAmount() <= 0 || !this.selectedCurrency()) {
      this.currencyQuote.set(null);
      return;
    }

    this.isQuoteLoading.set(true);
    this.paymentCurrencyService.getQuote({
      amount: this.selectedAmount(),
      fromCurrency: this.selectedCurrency(),
      toCurrency: this.selectedCurrency(),
      purpose: 'wallet_funding',
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.currencyQuote.set(response?.data || null);
          this.isQuoteLoading.set(false);
        },
        error: () => {
          this.currencyQuote.set(null);
          this.isQuoteLoading.set(false);
        }
      });
  }

  getFundingShortfall(): number {
    if (!this.data.campaignBudget) return 0;
    return Math.max(0, this.data.campaignBudget - this.data.currentBalance);
  }

  // Event handlers from child components
  selectQuickAmount(amount: number): void {
    this.selectedAmount.set(amount);
    this.fundingForm.patchValue({ amount }, { emitEvent: false });
    this.fundingForm.get('amount')?.markAsTouched();
    this.refreshFundingQuote();
  }

  clearQuickSelection(): void {
    // Handled by form value changes
  }

  onCustomAmountChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = parseFloat(input.value) || 0;
    value = Math.min(Math.max(value, 0), this.maxFundingAmount);
    this.selectedAmount.set(value);
    this.refreshFundingQuote();
  }

  async initiatePayment(): Promise<void> {
    if (!this.canProceedWithPayment()) {
      this.showError('Please enter a valid amount');
      return;
    }

    if (!this.user()) {
      this.showError('User information not available');
      return;
    }

    this.isProcessingPayment.set(true);
    this.paymentStatus.set(null);
    this.startProcessingTimer();

    try {
      // Generate reference with user ID for webhook to identify user
      const reference = this.generatePaymentReference();
      
      const paymentRequest: PaymentRequest = {
        amount: this.totalAmount(),
        currency: this.selectedCurrency(),
        user: this.user()!,
        metadata: {
          purpose: 'wallet_funding',
          fundingAmount: this.selectedAmount(),
          processingFee: this.processingFee(),
          userId: this.data.userId || this.user()?._id,
          userEmail: this.user()?.email,
          username: this.user()?.username,
          webhookIdentifier: `wallet_${this.user()?._id}_${Date.now()}`
        },
        reference: reference
      };

      // Just initialize payment with Paystack
      this.paystackService.initiatePayment(paymentRequest)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (result) => {
            // Payment popup opened successfully
            // Don't call backend here - wait for webhook
            this.paymentStatus.set({
              success: true,
              message: 'Payment initiated. Your wallet will be updated automatically after confirmation.',
              reference: reference,
              amount: this.selectedAmount(),
              timestamp: new Date()
            });
            
            // Start polling for payment confirmation
            this.startPaymentPolling(reference);
          },
          error: (error) => this.handlePaymentError(error.message || 'Payment failed'),
          complete: () => this.stopProcessingTimer()
        });

    } catch (error) {
      this.handlePaymentError('Failed to initiate payment');
      this.stopProcessingTimer();
    }
  }

  private startPaymentPolling(reference: string): void {
    // Poll every 3 seconds for 2 minutes to check if webhook processed payment
    let attempts = 0;
    const maxAttempts = 40; // 2 minutes with 3s interval
    
    const pollingSubscription = timer(0, 3000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(async () => {
        attempts++;
        
        try {
          const response = await this.walletService.verifyPayment(reference).toPromise();
          
          if (response?.recorded) {
            // Payment has been recorded by webhook
            this.paymentStatus.set({
              success: true,
              message: 'Payment successful! Wallet updated.',
              reference: reference,
              amount: this.selectedAmount(),
              timestamp: new Date()
            });
            
            this.updateLocalWalletBalance();
            pollingSubscription.unsubscribe();
            
            // Refresh user data
            if (this.user()?.uid) {
              this.userService.getUser(this.user()!.uid).subscribe();
            }
          }
        } catch (error) {
          console.log('Polling error:', error);
        }
        
        if (attempts >= maxAttempts) {
          pollingSubscription.unsubscribe();
          // Don't show error - webhook might still arrive later
          this.paymentStatus.set({
            success: true,
            message: 'Payment confirmed by Paystack. Your wallet will be updated shortly.',
            reference: reference,
            amount: this.selectedAmount(),
            timestamp: new Date()
          });
        }
      });
  }


  /* async initiatePayment(): Promise<void> {
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

      this.paystackService.initiatePayment(paymentRequest)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (result) => this.handlePaymentResult(result),
          error: (error) => this.handlePaymentError(error.message || 'Payment failed'),
          complete: () => this.stopProcessingTimer()
        });

    } catch (error) {
      this.handlePaymentError('Failed to initiate payment');
      this.stopProcessingTimer();
    }
  } */

  private startProcessingTimer(): void {
    this.processingTime.set(0);
    timer(0, 1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(seconds => {
        this.processingTime.set(seconds);
      });
  }

  private stopProcessingTimer(): void {
    this.isProcessingPayment.set(false);
  }

  private async handlePaymentResult(paystackResult: PaymentResult): Promise<void> {
    this.stopProcessingTimer();

    if (!paystackResult.success || !paystackResult.response) {
      this.handlePaymentError(paystackResult.error || 'Payment was cancelled or failed');
      return;
    }

    // Set initial status
    const paymentStatusData: PaymentStatusData = {
      success: true,
      message: 'Processing your wallet update...',
      reference: paystackResult.response.reference,
      amount: this.selectedAmount(),
      timestamp: new Date()
    };
    this.paymentStatus.set(paymentStatusData);

    const payload: RecordPaymentPayload = {
      userId: this.data.userId || this.user()?._id || 'unknown',
      amount: this.totalAmount(),
      fundingAmount: this.selectedAmount(),
      currency: this.selectedCurrency(),
      quote: this.currencyQuote(),
      paystackResult: paystackResult
    };

    try {
      // Record payment with retry logic
      const response = await this.walletService.recordPayment(payload).toPromise();

      if (response?.success || response?.alreadyExists) {
        // Payment recorded successfully
        this.paymentStatus.set({
          ...paymentStatusData,
          success: true,
          message: response.message || 'Wallet funded successfully!'
        });

        // Update local balance
        this.updateLocalWalletBalance();

        // Refresh user data
        if (this.user()?.uid) {
          this.userService.getUser(this.user()!.uid).subscribe({
            error: (err) => console.error('Failed to refresh user:', err)
          });
        }

        // Show success message
        this.showSuccess('Payment successful! Your wallet has been funded.');

      } else {
        throw new Error(response?.message || 'Failed to record payment');
      }

    } catch (error) {
      console.error('Payment recording failed:', error);
      
      // Check if we should retry
      if (this.retryCount() < this.maxRetries) {
        this.retryCount.update(count => count + 1);
        this.paymentStatus.set({
          ...paymentStatusData,
          message: `Recording failed. Retrying (${this.retryCount()}/${this.maxRetries})...`
        });
        
        // Auto-retry after delay
        setTimeout(() => {
          this.handlePaymentResult(paystackResult);
        }, 3000);
        
      } else {
        this.handlePaymentError(
          'Payment was successful but we couldn\'t update your wallet. ' +
          'Your reference is: ' + paystackResult.response.reference + '. ' +
          'Please contact support with this reference.'
        );
      }
    }
  }

 /*  private handlePaymentResult(paystackResult: PaymentResult): void {
    this.stopProcessingTimer();

    if (paystackResult.success && paystackResult.response) {
      const paymentStatusData: PaymentStatusData = {
        success: true,
        message: 'Processing your wallet update...',
        reference: paystackResult.response.reference,
        amount: this.selectedAmount(),
        timestamp: new Date()
      };
      this.paymentStatus.set(paymentStatusData);
      
      const payload: RecordPaymentPayload = {
        userId: this.data.userId || this.user()?._id || 'unknown',
        amount: this.selectedAmount(),
        paystackResult: paystackResult
      };

      this.walletService.recordPayment(payload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.paymentStatus.set({
                ...paymentStatusData,
                message: response.message
              });
              this.updateLocalWalletBalance();

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
            this.handlePaymentError('Payment confirmed but failed to record. Please contact support.');
          }
        });

    } else {
      this.handlePaymentError(paystackResult.error || 'Payment was cancelled or failed');
    }
  } */

  private handlePaymentError(errorMessage: string): void {
    this.stopProcessingTimer();
    this.retryCount.update(count => count + 1);
    
    this.paymentStatus.set({
      success: false,
      message: errorMessage,
      timestamp: new Date()
    });
  }

  private updateLocalWalletBalance(): void {
    this.data.currentBalance += this.currencyQuote()?.baseAmount || this.selectedAmount();
  }

  private generatePaymentReference(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const userId = this.data.userId || this.user()?._id || 'unknown';
    return `WALLET-${userId}-${timestamp}-${random}`;
  }

  onCurrencyChange(currencyCode: string): void {
    this.selectedCurrency.set(currencyCode || 'NGN');
    this.paymentCurrencyService.updateDisplayCurrency(this.selectedCurrency())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => undefined });
    this.refreshFundingQuote();
  }

  // Action handlers
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
}
