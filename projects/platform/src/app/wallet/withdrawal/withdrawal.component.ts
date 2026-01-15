import {
  Component,
  Input,
  OnInit,
  ViewChild,
  ElementRef,
  inject,
  signal,
  computed,
  DestroyRef,
  Signal,
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
  AbstractControl,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { WithdrawalService, SavedAccountInterface, WithdrawalRequestData } from './withdrawal.service';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
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
import { HelpDialogComponent, UserInterface } from '../../../../../shared-services/src/public-api';
import { UserService } from '../../common/services/user.service';

interface BankInterface {
  code: string;
  name: string;
}

interface AccountResolutionResponse {
  status: boolean;
  data: {
    account_name: string;
  };
}


/**
 * Component for handling fund withdrawals.
 * Provides functionality to withdraw funds to bank accounts with account name resolution.
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
    MatProgressSpinnerModule
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
  readonly pendingBalance = signal<number>(this.user()?.wallets?.promoter.reserved ?? 0);
  readonly isBalanceLoading = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly isResolvingAccount = signal<boolean>(false);
  readonly banks = signal<BankInterface[]>([]);
  readonly savedAccounts = signal<SavedAccountInterface[]>([]);

  // Search functionality
  private readonly searchControl = new Subject<string>();
  readonly searchTerm = signal<string>('');

  // Form properties
  withdrawForm!: FormGroup;
  selectedBankName = signal<string>('');

  // Constants
  private readonly MIN_WITHDRAWAL_AMOUNT = 100;
  private readonly WITHDRAWAL_FEE_RATE = 0.15; // 15%

  readonly payableAmount = signal<number>(0);

  // New private method for consistent fee calculation
  private calculateFee(amount: number): number {
    return amount * this.WITHDRAWAL_FEE_RATE;
  }


readonly totalDeduction = computed(() => {
  const amount = this.withdrawForm?.get('amount')?.value || 0;
  const withdrawalAmount = parseFloat(amount) || 0;
  
  // Total deduction = withdrawal amount + 15% fee
  return withdrawalAmount + (withdrawalAmount * this.WITHDRAWAL_FEE_RATE);
});



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
  
  // Calculate payable amount: withdrawal amount minus 15% fee
  const payable = withdrawalAmount * (1 - this.WITHDRAWAL_FEE_RATE);
  this.payableAmount.set(Math.max(0, Math.round(payable * 100) / 100));
}

  

  // Keep your existing maxWithdrawableAmount if you still need it for validation
  readonly maxWithdrawableAmount = computed(() => {
    const availableBalance = this.availableBalance();
    const percentageRate = this.WITHDRAWAL_FEE_RATE;
    
    // Calculate max amount with percentage fee only
    const maxAmount = availableBalance / (1 + percentageRate);
    
    // Ensure the amount is at least the minimum withdrawal amount
    return Math.max(0, Math.floor(maxAmount));
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
    this.availableBalance.set(this.user()?.wallets?.promoter.balance || 0);
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
      userId: [this.user()?._id]
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
    //this.fetchBalance();
    this.loadBanks();
    this.loadSavedAccounts();
  }


  // Balance methods
  fetchBalance(): void {
    if (!this.user()?._id) return;

    this.isBalanceLoading.set(true);
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

  // Account resolution
  private resolveAccountName(): void {
    const accountNumber = this.withdrawForm.get('accountNumber')?.value;
    const bankCode = this.withdrawForm.get('bank')?.value;

    if (!accountNumber || !bankCode || accountNumber.length !== 10) {
      this.withdrawForm.patchValue({ accountName: '' });
      return;
    }

    this.isResolvingAccount.set(true);

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.withdrawalService.PAYSTACK_SECRET_KEY}`
    });

    const url = `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`;

    this.http.get<AccountResolutionResponse>(url, { headers })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          const errorMessage = error.error?.message || 'Failed to resolve account name. Please check account details.';
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

    this.isSubmitting.set(true);

    const formData: WithdrawalRequestData = {
      ...this.withdrawForm.value,
      bankName: this.selectedBankName(),
      bankCode: this.withdrawForm.get('bank')?.value,
      payableAmount: this.payableAmount(),
      totalDeduction: this.totalDeduction(),
      finalAmount: this.withdrawForm.get('amount')?.value
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
      saveAccount: false
    });
  }

  // Utility methods
  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  showDescription(): void {
    this.dialog.open(HelpDialogComponent, {
      data: {
        help: 'This dashboard shows your current account balance and allows you to request withdrawals. Available balance is the amount you can withdraw immediately. Pending balance includes funds that are being processed.'
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

  test() {
    this.withdrawalService.test()
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
          }
        }
      });
  }
}