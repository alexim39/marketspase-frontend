import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  inject,
  signal,
  computed,
  DestroyRef,
  Signal,
  effect,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { WithdrawalService, SavedAccountInterface, WithdrawalRequestData } from './withdrawal.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Subject, EMPTY, of } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  catchError,
  finalize
} from 'rxjs/operators';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectChange, MatSelectModule, MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { SavedAccountsComponent } from './save-account-dialog/saved-account.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CurrencyUtilsPipe, HelpDialogComponent, UserInterface } from '../../../../../shared-services/src/public-api';
import { UserService } from '../../common/services/user.service';
import { TransactionSummaryComponent } from '../../transactions/summary/transaction-summary.component';

interface BankInterface {
  code: string;
  name: string;
}

/**
 * Component for handling fund withdrawals.
 * Provides functionality to withdraw funds to bank accounts with account name resolution.
 * Supports both promoter and marketer roles with role-specific balance display and fee structure.
 * - Promoters: 20% service charge applies
 * - Marketers: No service charge
 */
@Component({
  selector: 'async-withdrawal',
  standalone: true,
  imports: [
    FormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatMenuModule,
    MatProgressBarModule,
    MatSlideToggleModule,
    RouterModule,
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatExpansionModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    CurrencyUtilsPipe,
    TransactionSummaryComponent
  ],
  providers: [WithdrawalService],
  templateUrl: './withdrawal.component.html',
  styleUrls: ['./withdrawal.component.scss'],
})
export class WithdrawalComponent implements OnInit {
  private userService = inject(UserService);
  // Expose the signal directly to the template
  public user: Signal<UserInterface | null> = this.userService.user;

  // Injected services
  private readonly dialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly withdrawalService = inject(WithdrawalService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  // ViewChild references
  @ViewChild('bankSelect', { static: false }) bankSelect!: MatSelect;
  @ViewChild('searchInput', { static: false }) searchInput!: ElementRef;

  // Signals for reactive state management
  availableBalance = signal<number>(0);
  pendingBalance = signal<number>(0);
  readonly isBalanceLoading = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly isResolvingAccount = signal<boolean>(false);
  readonly banks = signal<BankInterface[]>([]);
  readonly savedAccounts = signal<SavedAccountInterface[]>([]);

  // Role-specific signals
  readonly userRole = computed(() => this.user()?.role || 'promoter');
  readonly isPromoter = computed(() => this.userRole() === 'promoter');
  readonly isMarketer = computed(() => this.userRole() === 'marketer');

  // Fee structure based on role
  private readonly PROMOTER_FEE_RATE = 0.20; // 20% for promoters
  private readonly MARKETER_FEE_RATE = 0; // 0% for marketers
  
  readonly feeRate = computed(() => 
    this.isPromoter() ? this.PROMOTER_FEE_RATE : this.MARKETER_FEE_RATE
  );

  // Wallet accessors based on role
  private readonly roleWallet = computed(() => {
    const user = this.user();
    const role = this.userRole();
    
    if (!user?.wallets) return null;
    
    return role === 'promoter' ? user.wallets.promoter : user.wallets.marketer;
  });

  // Role-specific balance signals
  readonly roleAvailableBalance = computed(() => this.roleWallet()?.balance || 0);
  readonly rolePendingBalance = computed(() => this.roleWallet()?.reserved || 0);
  readonly roleCurrency = computed(() => this.roleWallet()?.currency || 'NGN');

  // Constants
  public readonly MIN_WITHDRAWAL_AMOUNT = 100;

  // Search functionality
  private readonly searchControl = new Subject<string>();
  readonly searchTerm = signal<string>('');

  // Form properties
  withdrawForm!: FormGroup;
  selectedBankName = signal<string>('');

  readonly payableAmount = signal<number>(0);

  constructor() {
    // Effect to update balances when user role changes
    effect(() => {
      this.updateBalancesFromRole();
      // Reset payable amount when role changes
      this.updatePayableAmount();
    }, { allowSignalWrites: true });
  }

  private updateBalancesFromRole(): void {
    this.availableBalance.set(this.roleAvailableBalance());
    this.pendingBalance.set(this.rolePendingBalance());
  }

  // Calculate fee based on role
  private calculateFee(amount: number): number {
    return amount * this.feeRate();
  }

  // Total deduction based on role (with fee for promoters, no fee for marketers)
  readonly totalDeduction = computed(() => {
    const amount = this.withdrawForm?.get('amount')?.value || 0;
    const withdrawalAmount = parseFloat(amount) || 0;
    
    // For promoters: withdrawal amount + fee
    // For marketers: just withdrawal amount (no fee)
    return this.isPromoter() 
      ? withdrawalAmount + (withdrawalAmount * this.PROMOTER_FEE_RATE)
      : withdrawalAmount;
  });

  // Update payable amount based on role
  private updatePayableAmount(): void {
    const amountValue = this.withdrawForm?.get('amount')?.value;
    
    if (!amountValue || isNaN(amountValue)) {
      this.payableAmount.set(0);
      return;
    }
    
    const withdrawalAmount = parseFloat(amountValue);
    
    if (withdrawalAmount < this.MIN_WITHDRAWAL_AMOUNT) {
      this.payableAmount.set(0);
      return;
    }
    
    // For promoters: payable = amount - fee
    // For marketers: payable = amount (no fee)
    const payable = this.isPromoter()
      ? withdrawalAmount * (1 - this.PROMOTER_FEE_RATE)
      : withdrawalAmount;
    
    this.payableAmount.set(Math.max(0, Math.round(payable * 100) / 100));
  }

  // Get fee amount for display
  readonly feeAmount = computed(() => {
    const amount = this.withdrawForm?.get('amount')?.value || 0;
    const withdrawalAmount = parseFloat(amount) || 0;
    return this.calculateFee(withdrawalAmount);
  });

  // Max withdrawable amount based on available balance and role
  readonly maxWithdrawableAmount = computed(() => {
    const availableBalance = this.availableBalance();
    
    if (this.isMarketer()) {
      // Marketers can withdraw up to their full available balance
      return Math.max(0, Math.floor(availableBalance));
    } else {
      // Promoters: account for fee
      const maxAmount = availableBalance / (1 + this.PROMOTER_FEE_RATE);
      return Math.max(0, Math.floor(maxAmount));
    }
  });

  // Computed values
  readonly filteredBanks = computed(() => {
    const search = this.searchTerm().toLowerCase();
    const allBanks = this.banks();

    if (!search) return allBanks;

    return allBanks.filter(bank =>
      bank.name.toLowerCase().includes(search)
    );
  });

  ngOnInit(): void {
    this.initializeComponent();
    this.updateBalancesFromRole();
  }

  private initializeComponent(): void {
    this.validateUserInput();
    this.initializeForm();
    this.setupSearchFunctionality();
    this.loadInitialData();
  }

  private validateUserInput(): void {
    if (!this.user()?._id) {
      console.error('WithdrawalComponent: User is required');
      this.showErrorMessage('User information is missing. Please try again.');
      return;
    }
  }

  private initializeForm(): void {
    this.withdrawForm = this.fb.group({
      saveAccount: [false],
      bank: ['', [Validators.required]],
      accountNumber: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(10),
        Validators.pattern(/^\d{10}$/)
      ]],
      accountName: ['', [Validators.required]],
      amount: [
        '',
        [
          Validators.required,
          Validators.min(this.MIN_WITHDRAWAL_AMOUNT),
        ]
      ],
      userId: [this.user()?._id],
      role: [this.userRole()] // Add role to form data
    });

    this.setupFormSubscriptions();
  }

  private setupFormSubscriptions(): void {
    const accountNumberControl = this.withdrawForm.get('accountNumber');
    const amountControl = this.withdrawForm.get('amount');

    if (accountNumberControl) {
      accountNumberControl.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.resolveAccountName());
    }

    if (amountControl) {
      amountControl.valueChanges
        .pipe(
          debounceTime(100),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe(() => {
          this.updatePayableAmount();
          amountControl.updateValueAndValidity({ emitEvent: false });
        });
    }
  }

  private setupSearchFunctionality(): void {
    this.searchControl
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(searchTerm => {
        this.searchTerm.set(searchTerm);
      });
  }

  private loadInitialData(): void {
    this.loadBanks();
    this.loadSavedAccounts();
  }

  // Balance methods
  fetchBalance(): void {
    if (!this.user()?._id) return;
    this.isBalanceLoading.set(true);
    // You might want to add a service call here to refresh balance from backend
    setTimeout(() => {
      this.updateBalancesFromRole();
      this.isBalanceLoading.set(false);
    }, 500);
  }

  refreshBalance(): void {
    this.fetchBalance();
  }

  // Bank methods
  private loadBanks(): void {
    this.http.get<{ data: BankInterface[] }>('https://api.paystack.co/bank')
      .pipe(
        catchError(error => {
          console.error('Error loading banks:', error);
          this.showErrorMessage('Failed to load banks. Please refresh the page.');
          return of({ data: [] });
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(response => {
        this.banks.set(response.data || []);
      });
  }

  onBankChange(event: MatSelectChange): void {
    const selectedBankCode = event.value;
    let bankName = '';

    if (event.source?.selected instanceof MatOption) {
      bankName = event.source.selected.viewValue;
    }

    this.selectedBankName.set(bankName);

    // Clear account details when bank changes
    this.withdrawForm.patchValue({
      accountNumber: '',
      accountName: ''
    });
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchControl.next(target.value);
  }

  private resolveAccountName(): void {
    const accountNumber = this.withdrawForm.get('accountNumber')?.value;
    const bankCode = this.withdrawForm.get('bank')?.value;

    if (!accountNumber || !bankCode || accountNumber.length !== 10) {
      this.withdrawForm.patchValue({ accountName: '' });
      return;
    }

    this.isResolvingAccount.set(true);

    // Call your internal service instead of Paystack directly
    this.withdrawalService.resolveAccount(accountNumber, bankCode)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          const errorMessage = error.error?.message || 'Failed to resolve account name.';
          this.showErrorMessage(errorMessage);
          return EMPTY;
        }),
        finalize(() => this.isResolvingAccount.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          if (response.status && response.data?.account_name) {
            this.withdrawForm.patchValue({
              accountName: response.data.account_name
            });
          }
        }
      });
  }

  // Saved accounts
  private loadSavedAccounts(): void {
    if (this.user()?.savedAccounts?.length === 0) {
      this.savedAccounts.set([]);
    } else {
      this.savedAccounts.set(this.user()?.savedAccounts || []);
    }
  }

  populateForm(accountNumber: string): void {
    const selectedAccount = this.savedAccounts().find(acc => acc.accountNumber === accountNumber);

    if (!selectedAccount) return;

    this.withdrawForm.patchValue({
      bank: selectedAccount.bankCode,
      accountNumber: selectedAccount.accountNumber,
      accountName: selectedAccount.accountName
    });

    this.selectedBankName.set(selectedAccount.bank);
  }

  // Form submission
  onSubmit(): void {
    if (!this.withdrawForm.valid || this.isSubmitting()) {
      this.markFormGroupTouched(this.withdrawForm);
      return;
    }

    // Validate against role-specific available balance
    const amount = this.withdrawForm.get('amount')?.value;
    if (this.totalDeduction() > this.availableBalance()) {
      this.showErrorMessage(`Insufficient ${this.userRole()} balance. Your balance must cover the withdrawal amount${this.isPromoter() ? ' plus service fee' : ''}.`);
      return;
    }

    this.isSubmitting.set(true);

    const formData: WithdrawalRequestData = {
      ...this.withdrawForm.value,
      bankName: this.selectedBankName(),
      bankCode: this.withdrawForm.get('bank')?.value,
      payableAmount: this.payableAmount(),
      totalDeduction: this.totalDeduction(),
      feeAmount: this.feeAmount(),
      feeRate: this.feeRate(),
      finalAmount: this.withdrawForm.get('amount')?.value,
      role: this.userRole(), // Include role in withdrawal request
      currency: this.roleCurrency() // Include currency
    };

    this.withdrawalService.withdrawRequest(formData)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          const errorMessage = error.error?.message || 'Server error occurred, please try again.';
          this.showErrorMessage(errorMessage);
          return EMPTY;
        }),
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccessMessage('Withdrawal request submitted successfully!');
            this.resetForm();
            this.refreshBalance();

            // reload user record
            this.userService.getUser(this.user()?.uid || '')
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                error: (error) => {
                  console.error('Failed to refresh user:', error);
                }
              });
          }
        }
      });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  private resetForm(): void {
    this.withdrawForm.reset();
    this.selectedBankName.set('');
    this.withdrawForm.patchValue({
      userId: this.user()?._id,
      saveAccount: false,
      role: this.userRole()
    });
  }

  // Utility methods
  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  showDescription(): void {
    this.dialog.open(HelpDialogComponent, {
      data: {
        help: `This dashboard shows your current ${this.userRole()} account balance and allows you to request withdrawals. ${
          this.isPromoter() 
            ? 'A 20% service fee applies to all promoter withdrawals.' 
            : 'No service fee applies to marketer withdrawals.'
        } Available balance is the amount you can withdraw immediately. Pending balance includes funds that are being processed.`
      },
    });
  }

  openSavedAccount(): void {
    this.dialog.open(SavedAccountsComponent, {
      data: {
        savedAccounts: this.savedAccounts(),
        userId: this.user()?._id,
      },
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'OK', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['success-snackbar']
    });
  }

  // Role-specific display methods
  getRoleDisplayName(): string {
    return this.isPromoter() ? 'Promoter' : 'Marketer';
  }

  getBalanceLabel(): string {
    return `${this.getRoleDisplayName()} Available Balance`;
  }

  getPendingLabel(): string {
    return `${this.getRoleDisplayName()} Pending`;
  }

  getFeeDescription(): string {
    return this.isPromoter() 
      ? '20% service fee applies' 
      : 'No service fee for marketers';
  }

}