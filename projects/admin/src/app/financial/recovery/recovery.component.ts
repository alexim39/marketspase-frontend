import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
  DestroyRef,
  ViewChild,
} from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { lastValueFrom } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Material
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';

// Services
import { AdminService } from '../../common/services/user.service';
import { RecoveryService, RecoveryHistoryRecord } from './recovery.service';
import { FinanceSectionNavComponent } from '../shared/finance-section-nav.component';

// Dialog
import { ConfirmDialogComponent } from '../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-admin-recovery',
  standalone: true,
  providers: [RecoveryService, AdminService, CurrencyPipe, DatePipe],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTooltipModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatMenuModule,
    MatTabsModule,
    MatProgressBarModule,
    MatAutocompleteModule,
    MatOptionModule,
    MatRadioModule,
    MatCheckboxModule,
    FinanceSectionNavComponent,
  ],
  templateUrl: './recovery.component.html',
  styleUrls: ['./recovery.component.scss'],
})
export class RecoveryComponent implements OnInit {
  // Injections
  private readonly recoveryService = inject(RecoveryService);
  private readonly adminService = inject(AdminService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly currencyPipe = inject(CurrencyPipe);

  // === STATE ===
  readonly activeTab = signal<'new' | 'history'>('new');
  readonly isLoading = signal(false);
  readonly isProcessing = signal(false);
  readonly isConfirming = signal(false);

  // Step tracking for the recovery workflow
  readonly currentStep = signal<'search' | 'review' | 'draft' | 'confirm'>('search');

  // Selected user data
  readonly selectedUser = signal<any>(null);
  readonly userWallets = signal<any>(null);
  readonly userRecoveryHistory = signal<any>(null);
  readonly validationResult = signal<any>(null);

  // Draft created response
  readonly draftResponse = signal<any>(null);
  readonly confirmResponse = signal<any>(null);

  // Search
  readonly searchQuery = signal('');
  readonly users = signal<any[]>([]);
  readonly filteredUsers = computed(() => {
    const q = this.searchQuery().toLowerCase();
    if (!q) return [];
    return this.users().filter(u =>
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.displayName?.toLowerCase().includes(q)
    );
  });

  // === HISTORY STATE ===
  readonly historyRecords = signal<RecoveryHistoryRecord[]>([]);
  readonly historyDataSource = new MatTableDataSource<RecoveryHistoryRecord>([]);
  readonly historyTotal = signal(0);
  readonly historyPage = signal(0);
  readonly historyPageSize = signal(25);
  readonly isLoadingHistory = signal(false);
  readonly historyColumns = [
    'user',
    'walletType',
    'amount',
    'reason',
    'status',
    'requestedBy',
    'requestedAt',
    'actions',
  ];

  // === FORMS ===
  readonly searchForm = this.fb.group({
    query: ['', Validators.minLength(2)],
  });

  readonly recoveryForm = this.fb.group({
    walletType: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(1), Validators.max(1000000)]],
    reason: ['', [Validators.required, Validators.minLength(10)]],
    notes: [''],
  });

  readonly historyFiltersForm = this.fb.group({
    status: [''],
    dateRange: [null],
    targetUser: [''],
  });

  // View children
  @ViewChild('historyPaginator') historyPaginator!: MatPaginator;
  @ViewChild('historySort') historySort!: MatSort;

  ngOnInit(): void {
    this.adminService.fetchAdmin();
    this.setupSearchSubscription();
    this.loadHistory();
  }

  // === SEARCH ===
  private setupSearchSubscription(): void {
    this.searchForm.get('query')?.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(300),
        distinctUntilChanged(),
      )
      .subscribe(value => {
        if (value && value.length >= 2) {
          this.searchUsers(value);
        } else {
          this.users.set([]);
        }
      });
  }

  searchUsers(query: string): void {
    this.isLoading.set(true);
    this.searchQuery.set(query);

    this.recoveryService.searchUsers(query)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.users.set(res.data || []);
          this.isLoading.set(false);
        },
        error: () => {
          this.users.set([]);
          this.isLoading.set(false);
        },
      });
  }

  selectUser(user: any): void {
    this.selectedUser.set(user);
    this.userWallets.set(user.wallets || null);
    this.currentStep.set('review');
    this.validationResult.set(null);
    this.draftResponse.set(null);
    this.confirmResponse.set(null);

    // Reset form
    this.recoveryForm.reset({ walletType: '', amount: 0, reason: '', notes: '' });
    this.users.set([]);
    this.searchQuery.set('');
    this.searchForm.patchValue({ query: '' }, { emitEvent: false });

    // Load full user details including recovery history
    this.loadUserDetails(user._id);
  }

  loadUserDetails(userId: string): void {
    this.recoveryService.getUserDetails(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.userWallets.set(res.data.wallets || null);
            this.userRecoveryHistory.set(res.data.recoveryHistory || null);
          }
        },
        error: () => {
          this.showError('Failed to load user details');
        },
      });
  }

  clearSelection(): void {
    this.selectedUser.set(null);
    this.userWallets.set(null);
    this.userRecoveryHistory.set(null);
    this.validationResult.set(null);
    this.draftResponse.set(null);
    this.confirmResponse.set(null);
    this.currentStep.set('search');
    this.recoveryForm.reset({ walletType: '', amount: 0, reason: '', notes: '' });
  }

  // === WALLET HELPERS ===
  hasWallet(type: string): boolean {
    return !!this.userWallets()?.[type];
  }

  getWalletBalance(type: string): number {
    return this.userWallets()?.[type]?.balance || 0;
  }

  getWalletAvailable(type: string): number {
    return this.userWallets()?.[type]?.available || 0;
  }

  selectWallet(walletType: string): void {
    this.recoveryForm.patchValue({ walletType });
    this.validationResult.set(null);
    this.recoveryForm.get('amount')?.enable();

    // If amount is already entered, auto-validate
    if (this.recoveryForm.get('amount')?.valid && (this.recoveryForm.get('amount')?.value ?? 0) > 0) {
      this.validateRecovery();
    }

    this.showSuccess(`${walletType === 'promoter' ? 'Promoter' : 'Marketer'} wallet selected`);
  }

  // === VALIDATION ===
  validateRecovery(): void {
    if (this.recoveryForm.invalid) {
      this.markFormGroupTouched(this.recoveryForm);
      return;
    }

    const formVal = this.recoveryForm.value;
    const userId = this.selectedUser()._id;
    const walletType = formVal.walletType as string;

    if (!walletType) {
      this.showError('Please select a wallet type');
      return;
    }
    if (!formVal.amount || formVal.amount <= 0) {
      this.showError('Please enter a valid amount');
      return;
    }
    if (!this.hasWallet(walletType)) {
      this.showError(`${walletType} wallet not available for this user`);
      return;
    }

    this.isLoading.set(true);

    this.recoveryService.validateRecovery(userId, formVal.amount, walletType)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const result = res.data;
          if (result && result.valid) {
            // Store the full validation result including the valid flag
            this.validationResult.set({
              valid: true,
              data: result.data,
              error: null,
            });
            this.recoveryForm.setErrors(null);
          } else {
            this.validationResult.set({
              valid: false,
              error: result?.error || 'Validation failed',
              data: result?.data || null,
            });
            this.recoveryForm.setErrors({ validation: result?.error || 'Validation failed' });
          }
          this.isLoading.set(false);
        },
        error: (err) => {
          const msg = err.error?.error || err.error?.message || err.message || 'Validation failed';
          this.validationResult.set({ valid: false, error: msg, data: null });
          this.isLoading.set(false);
        },
      });
  }

  // === STEP 1: CREATE DRAFT ===
  submitDraft(): void {
    if (this.recoveryForm.invalid) {
      this.markFormGroupTouched(this.recoveryForm);
      return;
    }

    const formVal = this.recoveryForm.value;
    const adminId = this.adminService.adminData()?._id;

    if (!adminId) {
      this.showError('Admin not authenticated');
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        title: 'Create Recovery Draft',
        message: `This will create a DRAFT recovery request to deduct <strong>₦${formVal.amount?.toLocaleString()}</strong> from <strong>${this.selectedUser()?.username}</strong>'s <strong>${formVal.walletType}</strong> wallet.<br><br><strong>Reason:</strong> ${formVal.reason}<br><br><em>No funds will be deducted yet. This draft must be confirmed in the next step.</em>`,
        confirmText: 'Create Draft',
        cancelText: 'Cancel',
        disableClose: false,
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        this.isProcessing.set(true);

        this.recoveryService.createDraft({
          targetUserId: this.selectedUser()._id,
          amount: formVal.amount!,
          reason: formVal.reason!,
          walletType: formVal.walletType as string,
          metadata: { notes: formVal.notes, adminId },
        })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (res) => {
              if (res.success) {
                this.draftResponse.set(res.data);
                this.currentStep.set('draft');
                this.showSuccess(res.message);
              } else {
                this.showError(res.message || 'Failed to create draft');
              }
              this.isProcessing.set(false);
            },
            error: (err) => {
              const msg = err.error?.error || err.error?.message || err.message || 'Failed to create draft';
              this.showError(msg);
              this.isProcessing.set(false);
            },
          });
      }
    });
  }

  // === STEP 2: CONFIRM DRAFT ===
  confirmDraft(): void {
    const auditId = this.draftResponse()?.auditId;
    if (!auditId) {
      this.showError('No draft to confirm');
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '500px',
      data: {
        title: '⚠️ Confirm Fund Recovery',
        message: `You are about to <strong>DEDUCT</strong> <strong style="color:red;">₦${this.draftResponse()?.recovery?.amount?.toLocaleString()}</strong> from <strong>${this.draftResponse()?.targetUser?.username}</strong>'s <strong>${this.draftResponse()?.wallet?.type}</strong> wallet.<br><br>This action will:<br>
          • Deduct the amount from the user's balance<br>
          • Create a transaction record<br>
          • Log this action in the audit trail<br><br>
          <strong style="color:red;">This action cannot be automatically reversed.</strong>`,
        confirmText: 'Confirm & Execute',
        cancelText: 'Cancel',
        warning: true,
        disableClose: false,
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        this.isConfirming.set(true);

        this.recoveryService.confirmRecovery(auditId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (res) => {
              if (res.success) {
                this.confirmResponse.set(res.data);
                this.currentStep.set('confirm');
                this.showSuccess(res.message);
                this.loadHistory();
              } else {
                this.showError(res.message || 'Failed to confirm recovery');
              }
              this.isConfirming.set(false);
            },
            error: (err) => {
              const msg = err.error?.error || err.error?.message || err.message || 'Failed to confirm recovery';
              this.showError(msg);
              this.isConfirming.set(false);
            },
          });
      }
    });
  }

  // === CANCEL DRAFT ===
  cancelDraft(): void {
    const auditId = this.draftResponse()?.auditId;
    if (!auditId) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Cancel Recovery Draft',
        message: 'Are you sure you want to cancel this recovery draft?',
        confirmText: 'Yes, Cancel',
        cancelText: 'Keep Draft',
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        this.isLoading.set(true);
        this.recoveryService.cancelRecovery(auditId, 'Cancelled by admin')
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (res) => {
              if (res.success) {
                this.showSuccess('Draft cancelled');
                this.clearSelection();
                this.loadHistory();
              }
              this.isLoading.set(false);
            },
            error: (err) => {
              this.showError(err.message || 'Failed to cancel draft');
              this.isLoading.set(false);
            },
          });
      }
    });
  }

  // === START NEW RECOVERY ===
  startNewRecovery(): void {
    this.clearSelection();
    this.currentStep.set('search');
  }

  // === HISTORY ===
  loadHistory(): void {
    this.isLoadingHistory.set(true);

    const params: any = {
      page: this.historyPage() + 1,
      limit: this.historyPageSize(),
    };

    const filters = this.historyFiltersForm.value;
    if (filters.status) params.status = filters.status;
    if (filters.targetUser) params.targetUserId = filters.targetUser;

    this.recoveryService.getHistory(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.historyRecords.set(res.data.records || []);
            this.historyDataSource.data = res.data.records || [];
            this.historyTotal.set(res.data.pagination?.total || 0);
          }
          this.isLoadingHistory.set(false);
        },
        error: () => {
          this.isLoadingHistory.set(false);
        },
      });
  }

  onHistoryPageChange(event: any): void {
    this.historyPage.set(event.pageIndex);
    this.historyPageSize.set(event.pageSize);
    this.loadHistory();
  }

  applyHistoryFilters(): void {
    this.historyPage.set(0);
    this.loadHistory();
  }

  clearHistoryFilters(): void {
    this.historyFiltersForm.reset();
    this.historyPage.set(0);
    this.loadHistory();
  }

  // === UTILITY ===
  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      draft: 'status-pending',
      confirmed: 'status-processing',
      completed: 'status-success',
      cancelled: 'status-failed',
    };
    return map[status] || 'status-default';
  }

  getStatusIcon(status: string): string {
    const map: Record<string, string> = {
      draft: 'edit_note',
      confirmed: 'hourglass_top',
      completed: 'check_circle',
      cancelled: 'cancel',
    };
    return map[status] || 'help';
  }

  getWalletIcon(walletType: string): string {
    return walletType === 'marketer' ? 'shopping_cart' : 'account_balance';
  }

  markFormGroupTouched(formGroup: any): void {
    Object.values(formGroup.controls).forEach((control: any) => {
      control.markAsTouched();
      if (control instanceof FormBuilder) {
        this.markFormGroupTouched(control);
      }
    });
  }

  showSuccess(msg: string): void {
    this.snackBar.open(msg, 'Close', { duration: 5000, panelClass: ['success-snackbar'] });
  }

  showError(msg: string): void {
    this.snackBar.open(msg, 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
  }

  onTabChange(index: number): void {
    this.activeTab.set(index === 0 ? 'new' : 'history');
    if (index === 1) {
      this.loadHistory();
    }
  }

  get validationStatusText(): string {
    const v = this.validationResult();
    if (!v) {
      if (this.recoveryForm.get('amount')?.value && this.recoveryForm.get('walletType')?.value) {
        return 'Click "Validate" to check recovery eligibility';
      }
      return 'Enter amount and select wallet to proceed';
    }
    if (v.valid) {
      const data = v.data;
      const maxAllowed = data?.validation?.maximumAllowed?.toLocaleString() || '—';
      const newBal = data?.wallet?.newBalance?.toLocaleString() || '—';
      return `✓ Valid — Max allowed: ₦${maxAllowed}, New balance: ₦${newBal}`;
    }
    return `✗ ${v.error || 'Validation failed'}`;
  }

  get canValidate(): boolean {
    return !!(
      this.recoveryForm.get('walletType')?.valid &&
      this.recoveryForm.get('amount')?.valid &&
      this.selectedUser()
    );
  }

  get canDraft(): boolean {
    return this.validationResult()?.valid === true && !this.isProcessing();
  }

  // === VIEW AUDIT DETAIL ===
  viewAuditDetail(record: RecoveryHistoryRecord): void {
    this.dialog.open(ConfirmDialogComponent, {
      width: '550px',
      data: {
        title: 'Recovery Audit Details',
        message: `
          <div class="audit-detail">
            <div class="detail-row"><strong>ID:</strong> ${record._id}</div>
            <div class="detail-row"><strong>User:</strong> ${record.targetUserUsername} (${record.targetUserEmail || 'N/A'})</div>
            <div class="detail-row"><strong>Wallet:</strong> ${record.walletType}</div>
            <div class="detail-row"><strong>Amount:</strong> ₦${record.amount?.toLocaleString()}</div>
            <div class="detail-row"><strong>Reason:</strong> ${record.reason}</div>
            <div class="detail-row"><strong>Status:</strong> ${record.status}</div>
            <div class="detail-row"><strong>Requested By:</strong> ${record.requestedByUsername}</div>
            <div class="detail-row"><strong>Requested At:</strong> ${record.requestedAt ? new Date(record.requestedAt).toLocaleString() : 'N/A'}</div>
            ${record.confirmedByUsername ? `<div class="detail-row"><strong>Confirmed By:</strong> ${record.confirmedByUsername}</div>` : ''}
            ${record.confirmedAt ? `<div class="detail-row"><strong>Confirmed At:</strong> ${new Date(record.confirmedAt).toLocaleString()}</div>` : ''}
            ${record.transactionReference ? `<div class="detail-row"><strong>Transaction Ref:</strong> ${record.transactionReference}</div>` : ''}
            ${record.cancelledAt ? `<div class="detail-row"><strong>Cancelled At:</strong> ${new Date(record.cancelledAt).toLocaleString()}</div>` : ''}
            ${record.cancellationReason ? `<div class="detail-row"><strong>Cancellation Reason:</strong> ${record.cancellationReason}</div>` : ''}
            <div class="detail-row"><strong>Previous Balance:</strong> ₦${record.previousBalance?.toLocaleString()}</div>
            <div class="detail-row"><strong>New Balance:</strong> ₦${record.newBalance?.toLocaleString()}</div>
          </div>
        `,
        confirmText: 'Close',
        showCancel: false,
      },
    });
  }
}
