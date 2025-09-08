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
  Signal
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
  AbstractControl
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { PaymentService, SavedAccountInterface, WithdrawalRequestData } from '../payment.service';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Subject, EMPTY, of } from 'rxjs';
import { 
  debounceTime, 
  distinctUntilChanged, 
  switchMap,
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

interface BalanceResponse {
  availableBalance: number;
  pendingBalance: number;
  totalBalance?: number;
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
  providers: [PaymentService],
  template: `
  <div class="withdrawal-container">
    <div class="withdrawal-header">
      <div class="breadcrumb">
        <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" (click)="scrollToTop()">
          <mat-icon>home</mat-icon> Dashboard
        </a>
        <mat-icon>chevron_right</mat-icon>
        <a>Payments</a>
        <mat-icon>chevron_right</mat-icon>
        <span class="current">Withdraw Funds</span>
      </div>

      <div class="header-main">
        <h1>
          <mat-icon class="withdrawal-icon">payments</mat-icon>
          Payment Dashboard
          <button mat-icon-button class="help" (click)="showDescription()" matTooltip="Help">
            <mat-icon>help_outline</mat-icon>
          </button>
        </h1>
        <p>Manage your account balance and withdrawal requests</p>
      </div>
    </div>

    <div class="withdrawal-content">
      <!-- Account Balance Card -->
      <mat-card class="balance-card">
        <div class="card-header">
          <h2>
            <mat-icon class="balance-icon">account_balance_wallet</mat-icon>
            Account Balance
          </h2>
          <button 
            mat-icon-button 
            matTooltip="Refresh balance" 
            (click)="refreshBalance()" 
            [disabled]="isBalanceLoading()" 
            style="cursor: pointer;">
            <mat-icon>refresh</mat-icon>
          </button>
        </div>

        <div class="balance-content">
          <div class="balance-amount" *ngIf="!isBalanceLoading()">
            <span class="currency">₦</span>
            <span class="amount">{{ availableBalance()  | number:'1.2-2' }}</span>
          </div>
          
          <mat-spinner *ngIf="isBalanceLoading()" diameter="20"></mat-spinner>

          <div class="balance-details">
            <div class="detail-item">
              <mat-icon class="detail-icon">arrow_upward</mat-icon>
              <div class="detail-text">
                <div class="detail-label">Available</div>
                <div class="detail-value">₦{{ availableBalance()   | number:'1.2-2' }}</div>
              </div>
            </div>

            <div class="detail-item">
              <mat-icon class="detail-icon">pending</mat-icon>
              <div class="detail-text">
                <div class="detail-label">Pending</div>
                <div class="detail-value">₦{{ pendingBalance() | number:'1.2-2' }}</div>
              </div>
            </div>
          </div>
        </div>
      </mat-card>

      <!-- Withdrawal Card -->
      <mat-card class="withdrawal-card">
        <div class="card-header">
          <h2>Fund Withdrawal Request</h2>
          <button mat-raised-button title="Manage Accounts" [matMenuTriggerFor]="accountMenu" aria-label="Manage Accounts">
            <mat-icon>manage_accounts</mat-icon> Manage Accounts
          </button>
        </div>

        <mat-accordion>
          <mat-expansion-panel [expanded]="true">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon>account_balance_wallet</mat-icon> Withdrawal Details
              </mat-panel-title>
            </mat-expansion-panel-header>

            <div class="form-container">
              <!-- Saved Accounts -->
              <div class="saved-accounts-section" *ngIf="savedAccounts().length > 0">
                <h3>Use Saved Account</h3>
                <mat-form-field appearance="outline">
                  <mat-label>Select Saved Account</mat-label>
                  <mat-select (selectionChange)="populateForm($event.value)">
                    <mat-option value="">-- Select Account --</mat-option>
                    <mat-option *ngFor="let account of savedAccounts()" [value]="account._id">
                      {{ account.bank }} - {{ account.accountNumber }} ({{ account.accountName }})
                    </mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <form [formGroup]="withdrawForm" (ngSubmit)="onSubmit()">
                <mat-form-field appearance="outline">
                  <mat-label>Select Bank</mat-label>
                  <mat-select #bankSelect formControlName="bank" (selectionChange)="onBankChange($event)">
                    <div class="search-container">
                      <input 
                        #searchInput 
                        matInput 
                        type="search" 
                        (input)="onSearchChange($event)" 
                        placeholder="Search Bank" 
                        style="background-color: #fff;" 
                        (focus)="true" />
                    </div>
                    <mat-option *ngFor="let bank of filteredBanks()" [value]="bank.code">
                      {{ bank.name }}
                    </mat-option>
                  </mat-select>
                  <mat-error *ngIf="withdrawForm.get('bank')?.hasError('required')">
                    Please select a bank
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Account Number</mat-label>
                  <input 
                    matInput 
                    type="text" 
                    formControlName="accountNumber"
                    placeholder="Enter 10-digit account number"
                    maxlength="10" />
                  <mat-hint>Must be 10 digits</mat-hint>
                  <mat-error *ngIf="withdrawForm.get('accountNumber')?.hasError('required')">
                    Account number is required
                  </mat-error>
                  <mat-error *ngIf="withdrawForm.get('accountNumber')?.hasError('minlength') || withdrawForm.get('accountNumber')?.hasError('maxlength')">
                    Account number must be exactly 10 digits
                  </mat-error>
                  <mat-error *ngIf="withdrawForm.get('accountNumber')?.hasError('pattern')">
                    Account number must contain only numbers
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Account Name</mat-label>
                  <input 
                    matInput 
                    type="text" 
                    formControlName="accountName" 
                    readonly 
                    placeholder="Will be auto-filled when you enter account number" />
                  <mat-progress-bar 
                    *ngIf="isResolvingAccount()" 
                    mode="indeterminate" 
                    style="height: 2px;">
                  </mat-progress-bar>
                  <mat-error *ngIf="withdrawForm.get('accountName')?.hasError('required')">
                    Account name is required
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Amount to Withdraw (₦)</mat-label>
                  <input 
                    matInput 
                    type="number" 
                    formControlName="amount" 
                    placeholder="Minimum ₦100" 
                    [max]="availableBalance()"
                    min="100" />
                  <mat-hint>Available: ₦{{ availableBalance() | number:'1.2-2' }}</mat-hint>
                  <mat-error *ngIf="withdrawForm.get('amount')?.hasError('required')">
                    Amount is required
                  </mat-error>
                  <mat-error *ngIf="withdrawForm.get('amount')?.hasError('min')">
                    Minimum withdrawal amount is ₦100
                  </mat-error>
                  <mat-error *ngIf="withdrawForm.get('amount')?.hasError('max')">
                    Amount exceeds available balance
                  </mat-error>
                </mat-form-field>

                <div class="form-actions">
                  <mat-slide-toggle formControlName="saveAccount">
                    Save this account for future withdrawals
                  </mat-slide-toggle>
                  <button 
                    mat-flat-button 
                    color="primary" 
                    type="submit" 
                    [disabled]="withdrawForm.invalid || isSubmitting()">
                    <mat-icon>send</mat-icon> 
                    {{ isSubmitting() ? 'Processing...' : 'Submit Request' }}
                  </button>
                </div>
              </form>
            </div>
          </mat-expansion-panel>

          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon>history</mat-icon> Recent Withdrawals
              </mat-panel-title>
            </mat-expansion-panel-header>
            <div class="recent-withdrawals">
              <p>No recent withdrawals</p>
            </div>
          </mat-expansion-panel>
        </mat-accordion>
      </mat-card>
    </div>
  </div>

  <mat-menu #accountMenu="matMenu">
    <button mat-menu-item (click)="openSavedAccount()">
      <mat-icon>list_alt</mat-icon> View Saved Accounts
    </button>
    <a mat-menu-item routerLink="../transactions" routerLinkActive="active" (click)="scrollToTop()">
      <mat-icon>receipt_long</mat-icon> Transaction History
    </a> 
  </mat-menu>
  `,
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
  private readonly paymentService = inject(PaymentService);
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
  
  // Computed values
  readonly filteredBanks = computed(() => {
    const search = this.searchTerm().toLowerCase();
    const allBanks = this.banks();
    
    if (!search) return allBanks;
    
    return allBanks.filter(bank => 
      bank.name.toLowerCase().includes(search)
    );
  });

  // Form properties
  withdrawForm!: FormGroup;
  selectedBankName = signal<string>('');

  // Constants
  private readonly PAYSTACK_SECRET_KEY = 'sk_test_2b176cfecf4bf2bf8ed1de53b55f868dc4ed9127';
  private readonly MIN_WITHDRAWAL_AMOUNT = 100;

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
    //console.log('WithdrawalComponent initialized with user:', this.user());
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
      amount: ['', [
        Validators.required, 
        Validators.min(this.MIN_WITHDRAWAL_AMOUNT),
        this.maxAmountValidator.bind(this)
      ]],
      userId: [this.user()?._id]
    });

    this.setupFormSubscriptions();
  }

  private setupFormSubscriptions(): void {
    // Watch for account number and bank changes to resolve account name
    const accountNumberControl = this.withdrawForm.get('accountNumber');
    const bankControl = this.withdrawForm.get('bank');
    
    if (accountNumberControl && bankControl) {
      accountNumberControl.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.resolveAccountName());
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

  // Custom validator for maximum amount
  private maxAmountValidator(control: AbstractControl) {
    const value = control.value;
    const maxAmount = this.availableBalance();
    
    if (value && maxAmount && value > maxAmount) {
      return { max: { actual: value, max: maxAmount } };
    }
    
    return null;
  }

  // Balance methods
  fetchBalance(): void {
    if (!this.user()?._id) return;

    this.isBalanceLoading.set(true);
    
    this.paymentService.getBalance(this.user()?._id  ?? '')
      .pipe(
        catchError(error => {
          console.error('Error fetching balance:', error);
          this.showErrorMessage('Failed to fetch balance. Please try again.');
          return EMPTY;
        }),
        finalize(() => this.isBalanceLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: BalanceResponse) => {
          this.availableBalance.set(response.availableBalance || 0);
          this.pendingBalance.set(response.pendingBalance || 0);
        }
      });
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
      'Authorization': `Bearer ${this.PAYSTACK_SECRET_KEY}`
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
    // Mock data - replace with actual service call
    // const mockAccounts: SavedAccountInterface[] = [
    //   { 
    //     _id: '1', 
    //     bank: 'Access Bank', 
    //     bankCode: '044', 
    //     accountNumber: '0040342224', 
    //     accountName: 'John Doe' 
    //   },
    //   { 
    //     _id: '2', 
    //     bank: 'GTBank', 
    //     bankCode: '058', 
    //     accountNumber: '0123456789', 
    //     accountName: 'Jane Smith' 
    //   }
    // ];
    
    
    
    if (this.user()?.savedAccounts?.length === 0) {
      //console.warn('No saved accounts found for user:', this.user._id);
      this.savedAccounts.set([]);
    } else {
      //console.log('Loaded saved accounts:', savedAccounts);
      this.savedAccounts.set(this.user()?.savedAccounts || []);
    }
  }

  populateForm(accountId: string): void {
    const selectedAccount = this.savedAccounts().find(acc => acc._id === accountId);
    
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
      bankCode: this.withdrawForm.get('bank')?.value
    };

    this.paymentService.withdrawRequest(formData)
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
}