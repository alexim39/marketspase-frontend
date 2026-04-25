import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  DestroyRef,
  effect,
  ChangeDetectorRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EMPTY, Subject, debounceTime, distinctUntilChanged, catchError, finalize } from 'rxjs';
import { UserService } from '../../common/services/user.service';
import { CurrencyUtilsPipe, HelpDialogComponent } from '../../../../../shared-services/src/public-api';
import { TransferRequestData, TransferService, UserSearchResult } from './transfert.service';

interface TransferType {
  value: 'self' | 'other';
  label: string;
  description: string;
}

interface TransferDestination {
  type: 'marketer' | 'promoter';
  label: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'async-transfer-funds',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCardModule,
    MatRadioModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    CurrencyUtilsPipe
  ],
  templateUrl: './transfer-funds.component.html',
  styleUrls: ['./transfer-funds.component.scss'],
  providers: [TransferService]
})
export class TransferFundsComponent implements OnInit {
  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  private transferService = inject(TransferService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  // Search subject for debouncing
  private searchSubject = new Subject<string>();

  // Constants
  readonly MIN_TRANSFER_AMOUNT = 100;

  // Signals
  readonly user = this.userService.user;
  readonly isBalanceLoading = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly isSearchingUser = signal<boolean>(false);
  readonly searchResults = signal<UserSearchResult[]>([]);
  readonly selectedDestinationUser = signal<UserSearchResult | null>(null);
  
  // Current transfer type signal to force UI updates
  readonly currentTransferType = signal<'self' | 'other'>('self');
  
  // Promoter wallet balances
  readonly promoterAvailableBalance = signal<number>(0);
  readonly promoterPendingBalance = signal<number>(0);
  readonly promoterCurrency = signal<string>('NGN');

  // Marketer wallet balances (for display)
  readonly marketerBalance = signal<number>(0);
  readonly marketerCurrency = signal<string>('NGN');

  // Form - Initialize with default values
  transferForm: FormGroup = this.fb.group({
    transferType: ['self', Validators.required],
    destinationType: ['marketer', Validators.required],
    amount: ['', [
      Validators.required,
      Validators.min(this.MIN_TRANSFER_AMOUNT),
    ]],
    recipientUsername: [''],
    note: ['']
  });

  // Router link options
  readonly routerLinkActiveOptions = { exact: true };

  readonly TRANSFER_TYPES: TransferType[] = [
    {
      value: 'self',
      label: 'Transfer to My Marketer Wallet',
      description: 'Move funds to your marketer wallet for campaign payments and in-app transactions'
    },
    {
      value: 'other',
      label: 'Transfer to Another Promoter',
      description: 'Send funds to another promoter\'s wallet'
    }
  ];

  readonly DESTINATIONS: TransferDestination[] = [
   /*  {
      type: 'marketer',
      label: 'Marketer Wallet',
      icon: 'campaign',
      description: 'Funds can only be used for in-app transactions (campaigns, etc.)'
    }, */
    {
      type: 'promoter',
      label: 'Promoter Wallet',
      icon: 'person',
      description: 'Transfer to another promoter\'s available balance'
    }
  ];

  // Computed values
  readonly userRole = computed(() => this.user()?.role || 'promoter');
  readonly isPromoter = computed(() => this.userRole() === 'promoter');
  
  // Use the signal for transfer type instead of directly accessing form
  readonly isSelfTransfer = computed(() => this.currentTransferType() === 'self');
  readonly isOtherTransfer = computed(() => this.currentTransferType() === 'other');

  readonly maxTransferAmount = computed(() => {
    return Math.max(0, Math.floor(this.promoterAvailableBalance()));
  });

  constructor() {
    effect(() => {
      this.updateBalancesFromUser();
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    if (!this.isPromoter()) {
      this.showErrorMessage('Only promoters can transfer funds from their promoter wallet.');
      return;
    }
    
    // Set initial form state
    this.updateFormStateForTransferType('self');
    
    this.loadBalances();
    this.setupFormSubscriptions();
    this.setupSearchSubscription();
  }

  private updateFormStateForTransferType(type: 'self' | 'other'): void {
    const destinationControl = this.transferForm.get('destinationType');
    const recipientControl = this.transferForm.get('recipientUsername');
    
    // Update the signal to trigger UI changes
    this.currentTransferType.set(type);
    
    if (type === 'self') {
      destinationControl?.setValue('marketer', { emitEvent: false });
      destinationControl?.disable({ emitEvent: false });
      recipientControl?.setValue('', { emitEvent: false });
      recipientControl?.disable({ emitEvent: false });
      recipientControl?.clearValidators();
      this.selectedDestinationUser.set(null);
      this.searchResults.set([]);
    } else {
      destinationControl?.enable({ emitEvent: false });
      recipientControl?.enable({ emitEvent: false });
      // Don't set required validator automatically - let user search and select
      recipientControl?.clearValidators();
    }
    recipientControl?.updateValueAndValidity({ emitEvent: false });
    
    // Force change detection
    this.cdr.detectChanges();
  }

  private updateBalancesFromUser(): void {
    const user = this.user();
    if (!user?.wallets) return;

    const promoterWallet = user.wallets.promoter;
    const marketerWallet = user.wallets.marketer;

    this.promoterAvailableBalance.set(promoterWallet?.balance || 0);
    this.promoterPendingBalance.set(promoterWallet?.reserved || 0);
    this.promoterCurrency.set(promoterWallet?.currency || 'NGN');
    
    this.marketerBalance.set(marketerWallet?.balance || 0);
    this.marketerCurrency.set(marketerWallet?.currency || 'NGN');
  }

  private setupFormSubscriptions(): void {
    // Handle transfer type changes
    this.transferForm.get('transferType')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((type: 'self' | 'other') => {
        //console.log('Transfer type changed to:', type);
        this.updateFormStateForTransferType(type);
      });

    // Handle recipient username changes for search
    this.transferForm.get('recipientUsername')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(username => {
        // Only search if this is an "other" transfer, field is enabled, and username is valid
        if (this.isOtherTransfer() && username && username.length >= 3 && !this.selectedDestinationUser()) {
          //console.log('Searching for:', username);
          this.searchSubject.next(username);
        } else {
          this.searchResults.set([]);
        }
      });

    // Handle amount changes for validation
    this.transferForm.get('amount')?.valueChanges
      .pipe(
        debounceTime(100),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(value => {
        if (value) {
          const maxAmount = this.maxTransferAmount();
          if (value > maxAmount) {
            this.transferForm.get('amount')?.setValue(maxAmount, { emitEvent: false });
          }
        }
      });
  }

  private setupSearchSubscription(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(query => {
        this.searchUsers(query);
      });
  }

  private loadBalances(): void {
    const userId = this.user()?._id;
    if (!userId) return;

    this.isBalanceLoading.set(true);
    
    this.transferService.getWalletBalances(userId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isBalanceLoading.set(false))
      )
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.promoterAvailableBalance.set(response.data.promoter?.balance || 0);
            this.promoterPendingBalance.set(response.data.promoter?.reserved || 0);
            this.promoterCurrency.set(response.data.promoter?.currency || 'NGN');
            this.marketerBalance.set(response.data.marketer?.balance || 0);
            this.marketerCurrency.set(response.data.marketer?.currency || 'NGN');
          }
        },
        error: (error) => {
          //console.error('Failed to load balances:', error);
          this.showErrorMessage('Failed to load wallet balances. Please refresh.');
        }
      });
  }

  private searchUsers(query: string): void {
    this.isSearchingUser.set(true);
    
    this.transferService.searchUsers(query, 'promoter', true)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSearchingUser.set(false))
      )
      .subscribe({
        next: (response) => {
          //console.log('Search results:', response.data);
          this.searchResults.set(response.data || []);
        },
        error: (error) => {
          //console.error('User search failed:', error);
          this.searchResults.set([]);
        }
      });
  }

  selectRecipient(user: UserSearchResult): void {
    //console.log('Selected recipient:', user);
    this.selectedDestinationUser.set(user);
    this.transferForm.get('recipientUsername')?.setValue(user.username, { emitEvent: false });
    this.searchResults.set([]);
    this.cdr.detectChanges();
  }

  clearSelectedRecipient(): void {
    this.selectedDestinationUser.set(null);
    this.transferForm.get('recipientUsername')?.setValue('', { emitEvent: false });
    this.searchResults.set([]);
    this.cdr.detectChanges();
  }

  refreshBalance(): void {
    this.loadBalances();
    const uid = this.user()?.uid;
    if (uid) {
      this.userService.getUser(uid)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe();
    }
  }

  onSubmit(): void {
    this.markFormGroupTouched(this.transferForm);
    
    // Check recipient selection for other transfer
    if (this.isOtherTransfer()) {
      if (!this.selectedDestinationUser()) {
        this.showErrorMessage('Please search and select a recipient.');
        return;
      }
    }
    
    if (!this.transferForm.valid) {
      this.showErrorMessage('Please fill in all required fields correctly.');
      return;
    }
    
    if (this.isSubmitting()) {
      return;
    }

    const amount = this.transferForm.get('amount')?.value;
    
    if (amount > this.promoterAvailableBalance()) {
      this.showErrorMessage('Insufficient available balance in promoter wallet.');
      return;
    }

    this.isSubmitting.set(true);

    const payload: TransferRequestData = {
      transferType: this.currentTransferType(),
      destinationType: this.transferForm.get('destinationType')?.value,
      amount: amount,
      recipientUsername: this.isOtherTransfer() ? this.selectedDestinationUser()?.username || null : null,
      recipientId: this.isOtherTransfer() ? this.selectedDestinationUser()?._id || null : null,
      note: this.transferForm.get('note')?.value || '',
      sourceUserId: this.user()?._id || ''
    };

    //console.log('Transfer payload:', payload);

    this.transferService.transferFunds(payload)
      .pipe(
        catchError((error) => {
          //console.error('Transfer error:', error);
          const errorMessage = error.error?.message || 'Transfer failed. Please try again.';
          this.showErrorMessage(errorMessage);
          return EMPTY;
        }),
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccessMessage(this.getSuccessMessage());
            this.resetForm();
            this.refreshBalance();
          }
        }
      });
  }

  private getSuccessMessage(): string {
    if (this.isSelfTransfer()) {
      return 'Funds transferred to your marketer wallet successfully!';
    }
    return `Funds transferred to ${this.selectedDestinationUser()?.displayName} successfully!`;
  }

  private resetForm(): void {
    this.transferForm.reset({
      transferType: 'self',
      destinationType: 'marketer',
      amount: '',
      recipientUsername: '',
      note: ''
    }, { emitEvent: false });
    
    this.updateFormStateForTransferType('self');
    this.selectedDestinationUser.set(null);
    this.searchResults.set([]);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control?.enabled) {
        control.markAsTouched();
      }
    });
  }

  showDescription(): void {
    const helpText = `
      <h3>Fund Transfer Options</h3>
      
      <h4>Transfer to Marketer Wallet (Self)</h4>
      <p>Move funds from your promoter wallet to your marketer wallet. 
      <strong>Important:</strong> Funds moved into your marketer wallet:</p>
      <ul>
        <li>Cannot be withdrawn to a bank account</li>
        <li>Can only be used for in-app transactions (campaigns, store purchases, etc.)</li>
      </ul>
      
      <h4>Transfer to Another User</h4>
      <p>Send funds to another user's available balance. The recipient can:</p>
      <ul>
        <li>Use the funds for campaigns and promotions</li>
        <li>Withdraw subject to standard promoter withdrawal fees</li>
        <li>Transfer to their own marketer wallet</li>
      </ul>
      
      <h4>Important Notes</h4>
      <ul>
        <li>Transfers are without service fees, instant and cannot be reversed</li>
        <li>Minimum transfer amount: ${this.MIN_TRANSFER_AMOUNT} ${this.promoterCurrency()}</li>
        <li>Only available balance (not pending/reserved) can be transferred</li>
      </ul>
    `;

    this.dialog.open(HelpDialogComponent, {
      data: { help: helpText },
      width: '500px'
    });
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
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

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: this.promoterCurrency(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
}