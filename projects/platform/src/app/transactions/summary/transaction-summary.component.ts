import {
  Component,
  Input,
  Signal,
  computed,
  inject,
  signal,
  OnInit,
  DestroyRef,
  effect,
  Optional,
} from '@angular/core';
import { CommonModule, TitleCasePipe, DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, of } from 'rxjs';
import { CurrencyUtilsPipe, UserInterface } from '../../../../../shared-services/src/public-api';
import { RouterModule } from '@angular/router';
import { TransactionSummaryData, WithdrawalService } from '../../wallet/withdrawal/withdrawal.service';

interface PeriodOption {
  value: 'all' | 'today' | 'week' | 'month';
  label: string;
  icon: string;
}

export interface TransactionSummaryDialogData {
  user: UserInterface | null | Signal<UserInterface | null>;
  role: string | Signal<'promoter' | 'marketer' | 'marketing_rep' | 'admin'>;
}

@Component({
  selector: 'app-transaction-summary',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatButtonToggleModule,
    MatListModule,
    MatChipsModule,
    MatDialogModule,
    FormsModule,
    RouterModule,
    TitleCasePipe,
    DecimalPipe,
    CurrencyUtilsPipe,
  ],
  templateUrl: './transaction-summary.component.html',
  styleUrls: ['./transaction-summary.component.scss'],
  providers: [WithdrawalService]
})
export class TransactionSummaryComponent implements OnInit {
  // Inputs for standalone usage
  @Input() user!: Signal<UserInterface | null>;
  @Input() role!: Signal<'promoter' | 'marketer' | 'marketing_rep' | 'admin'>;

  private withdrawalService = inject(WithdrawalService);
  private destroyRef = inject(DestroyRef);
  
  // Optional injections for dialog usage
  private dialogRef = inject(MatDialogRef<TransactionSummaryComponent>, { optional: true });
  private dialogData = inject<TransactionSummaryDialogData>(MAT_DIALOG_DATA, { optional: true });

  // State signals
  readonly isLoading = signal<boolean>(false);
  readonly summaryData = signal<TransactionSummaryData | null>(null);
  readonly error = signal<string | null>(null);
  readonly selectedPeriod = signal<'all' | 'today' | 'week' | 'month'>('all');

  // Period options
  readonly periodOptions: PeriodOption[] = [
    { value: 'all', label: 'All Time', icon: 'calendar_today' },
    { value: 'today', label: 'Today', icon: 'today' },
    { value: 'week', label: 'This Week', icon: 'date_range' },
    { value: 'month', label: 'This Month', icon: 'calendar_month' },
  ];

  // Helper to get the current user value
  private getUserValue(): UserInterface | null {
    // Check @Input user signal
    if (this.user) {
      return this.user();
    }
    // Check dialog data
    if (this.dialogData?.user) {
      // If it's a signal, call it
      if (typeof this.dialogData.user === 'function') {
        return (this.dialogData.user as Signal<UserInterface | null>)();
      }
      // If it's a raw value
      return this.dialogData.user as UserInterface | null;
    }
    return null;
  }

  // Helper to get the current role value
  private getRoleValue(): 'promoter' | 'marketer' | 'marketing_rep' | 'admin' {
    // Check @Input role signal
    if (this.role) {
      return this.role();
    }
    // Check dialog data
    if (this.dialogData?.role) {
      // If it's a signal, call it
      if (typeof this.dialogData.role === 'function') {
        return (this.dialogData.role as Signal<string>)() as 'promoter' | 'marketer' | 'marketing_rep' | 'admin';
      }
      // If it's a raw value
      return this.dialogData.role as 'promoter' | 'marketer' | 'marketing_rep' | 'admin';
    }
    return 'promoter';
  }

  // Create signals that react to changes
  private readonly _currentUser = signal<UserInterface | null>(this.getUserValue());
  private readonly _currentRole = signal<'promoter' | 'marketer' | 'marketing_rep' | 'admin'>(this.getRoleValue());

  // Computed values
  readonly isPromoter = computed(() => this._currentRole() === 'promoter');
  readonly isMarketer = computed(() => this._currentRole() === 'marketer');
  readonly isInDialog = computed(() => !!this.dialogRef);

  readonly currency = computed(() => {
    const userData = this._currentUser();
    if (!userData) return 'NGN';
    const walletType = this.isPromoter() ? 'promoter' : 'marketer';
    return userData.wallets?.[walletType]?.currency || 'NGN';
  });

  readonly hasData = computed(() => this.summaryData() !== null);
  readonly recentTransactions = computed(() => this.summaryData()?.recentTransactions || []);
  readonly overview = computed(() => this.summaryData()?.overview);
  readonly metrics = computed(() => this.summaryData()?.metrics);

  constructor() {
    // Effect to reload data when period changes
    effect(() => {
      const period = this.selectedPeriod();
      const userId = this._currentUser()?._id;
      if (userId) {
        this.fetchSummaryData(period);
      }
    });
  }

  ngOnInit(): void {
    // Update signals with current values
    this._currentUser.set(this.getUserValue());
    this._currentRole.set(this.getRoleValue());
    
    this.fetchSummaryData(this.selectedPeriod());
  }

  fetchSummaryData(period: 'all' | 'today' | 'week' | 'month'): void {
    const userData = this._currentUser();
    const userId = userData?._id;
    const userRole = this._currentRole();

    if (!userId || !userRole) {
      this.error.set('User information not available');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    this.withdrawalService
      .getTransactionSummary({
        userId,
        role: userRole,
        period,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((err) => {
          //console.error('Error fetching transaction summary:', err);
          this.error.set(err.error?.message || 'Failed to load transaction summary');
          return of(null);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe((response) => {
        if (response?.success && response.data) {
          this.summaryData.set(response.data);
        } else if (response?.message) {
          this.error.set(response.message);
        }
      });
  }

  onPeriodChange(period: 'all' | 'today' | 'week' | 'month'): void {
    this.selectedPeriod.set(period);
  }

  refreshData(): void {
    // Update with latest values before fetching
    this._currentUser.set(this.getUserValue());
    this._currentRole.set(this.getRoleValue());
    this.fetchSummaryData(this.selectedPeriod());
  }

  closeDialog(): void {
    if (this.dialogRef) {
      this.dialogRef.close({ refresh: true });
    }
  }

  getStatusClass(status: string): string {
    const statusMap: Record<string, string> = {
      successful: 'status-success',
      completed: 'status-success',
      pending: 'status-pending',
      processing: 'status-pending',
      failed: 'status-failed',
      cancelled: 'status-failed',
    };
    return statusMap[status?.toLowerCase()] || 'status-default';
  }

  getCategoryIcon(category: string): string {
    const iconMap: Record<string, string> = {
      deposit: 'arrow_downward',
      withdrawal: 'arrow_upward',
      campaign: 'campaign',
      promotion: 'local_offer',
      bonus: 'card_giftcard',
      fee: 'receipt',
      refund: 'undo',
      transfer: 'swap_horiz',
    };
    return iconMap[category] || 'receipt_long';
  }

  formatRelativeTime(date: string): string {
    if (!date) return '';
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
  }
}