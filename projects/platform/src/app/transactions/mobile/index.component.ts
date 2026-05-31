import { CommonModule, TitleCasePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Signal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CurrencyUtilsPipe, UserInterface } from '@shared/services';
import { Transaction } from '../transactions.model';
import { TransactionSummaryComponent } from '../summary/transaction-summary.component';

type TransactionFilter = 'all' | 'credits' | 'debits' | 'campaigns' | 'earnings' | 'spending';
type TransactionGroupLabel = 'Today' | 'Yesterday' | 'Earlier';

interface TransactionGroup {
  label: TransactionGroupLabel;
  items: Transaction[];
}

@Component({
  selector: 'app-transactions-mobile',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    TitleCasePipe,
    CurrencyUtilsPipe,
  ],
  templateUrl: './index.component.html',
  styleUrl: './index.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileTransactionsComponent {
  @Input({ required: true }) user!: Signal<UserInterface | null>;

  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly activeFilter = signal<TransactionFilter>('all');
  readonly statusFilter = signal<string>('all');
  readonly searchTerm = signal<string>('');
  readonly isLoading = signal(false);
  readonly visibleLimit = signal(20);

  readonly walletType = computed<'promoter' | 'marketer'>(() =>
    this.user()?.role === 'promoter' ? 'promoter' : 'marketer'
  );

  readonly walletCurrency = computed(() => {
    const user = this.user();
    const walletType = this.walletType();
    return user?.wallets?.[walletType]?.currency || user?.wallets?.promoter?.currency || 'NGN';
  });

  readonly transactions = computed<Transaction[]>(() => {
    const user = this.user();
    if (!user) return [];

    const walletTransactions = user.wallets?.[this.walletType()]?.transactions;
    return Array.isArray(walletTransactions)
      ? walletTransactions.map((transaction: any) => this.normalizeTransaction(transaction)).sort((left, right) => {
          const leftTime = new Date(left?.createdAt || 0).getTime();
          const rightTime = new Date(right?.createdAt || 0).getTime();
          return rightTime - leftTime;
        })
      : [];
  });

  readonly currentBalance = computed(() => {
    const user = this.user();
    if (!user) return 0;
    return user.wallets?.[this.walletType()]?.balance ?? 0;
  });

  readonly currentReserved = computed(() => {
    const user = this.user();
    if (!user) return 0;
    return user.wallets?.[this.walletType()]?.reserved ?? 0;
  });

  readonly totalAmount = computed(() => {
    if (this.user()?.role === 'promoter') {
      return this.transactions()
        .filter((transaction) => transaction.type === 'credit')
        .reduce((sum, transaction) => sum + (transaction.amount ?? 0), 0);
    }

    return this.transactions()
      .filter((transaction) => transaction.type === 'debit')
      .reduce((sum, transaction) => sum + (transaction.amount ?? 0), 0);
  });

  readonly filterOptions = computed<Array<{ key: TransactionFilter; label: string; icon: string }>>(() => {
    const roleSpecific =
      this.user()?.role === 'promoter'
        ? { key: 'earnings' as const, label: 'Earnings', icon: 'trending_up' }
        : { key: 'spending' as const, label: 'Spending', icon: 'paid' };

    return [
      { key: 'all', label: 'All', icon: 'receipt_long' },
      { key: 'credits', label: 'Credits', icon: 'add_circle' },
      { key: 'debits', label: 'Debits', icon: 'remove_circle' },
      { key: 'campaigns', label: 'Campaigns', icon: 'campaign' },
      roleSpecific,
    ];
  });

  readonly filteredTransactions = computed(() => {
    let filtered = this.transactions();
    const filter = this.activeFilter();
    const status = this.statusFilter();
    const search = this.searchTerm().trim().toLowerCase();

    if (filter === 'credits') filtered = filtered.filter((transaction) => transaction.type === 'credit');
    if (filter === 'debits') filtered = filtered.filter((transaction) => transaction.type === 'debit');
    if (filter === 'campaigns') filtered = filtered.filter((transaction) => transaction.category === 'campaign');
    if (filter === 'earnings') {
      filtered = filtered.filter(
        (transaction) =>
          transaction.type === 'credit' &&
          (transaction.category === 'promotion' || transaction.category === 'bonus')
      );
    }
    if (filter === 'spending') {
      filtered = filtered.filter(
        (transaction) =>
          transaction.type === 'debit' &&
          (transaction.category === 'campaign' || transaction.category === 'promotion')
      );
    }

    if (status !== 'all') {
      filtered = filtered.filter((transaction) => this.normalizeStatus(transaction.status) === status);
    }

    if (search) {
      filtered = filtered.filter((transaction) => {
        const haystack = [
          transaction.description,
          transaction.category,
          transaction.status,
          transaction.amount,
          (transaction as any).relatedCampaign,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(search);
      });
    }

    return filtered;
  });

  readonly visibleTransactions = computed(() => this.filteredTransactions().slice(0, this.visibleLimit()));

  readonly groups = computed<TransactionGroup[]>(() => this.groupByDay(this.visibleTransactions()));

  readonly hasMore = computed(() => this.visibleLimit() < this.filteredTransactions().length);

  readonly hasActiveFilters = computed(
    () => this.activeFilter() !== 'all' || this.statusFilter() !== 'all' || this.searchTerm().trim().length > 0
  );

  setFilter(filter: TransactionFilter): void {
    this.activeFilter.set(filter);
    this.visibleLimit.set(20);
  }

  setStatusFilter(status: string): void {
    this.statusFilter.set(status);
    this.visibleLimit.set(20);
  }

  applySearch(value: string): void {
    this.searchTerm.set(value);
    this.visibleLimit.set(20);
  }

  clearFilters(): void {
    this.activeFilter.set('all');
    this.statusFilter.set('all');
    this.searchTerm.set('');
    this.visibleLimit.set(20);
  }

  loadMore(): void {
    this.visibleLimit.update((current) => current + 20);
  }

  refreshTransactions(): void {
    this.isLoading.set(true);
    setTimeout(() => {
      this.isLoading.set(false);
      this.snackBar.open('Transactions refreshed', 'Close', { duration: 2000 });
    }, 650);
  }

  viewTransactionSummary(): void {
    const dialogRef = this.dialog.open(TransactionSummaryComponent, {
      width: '100vw',
      maxWidth: '100vw',
      height: '92vh',
      maxHeight: '92vh',
      panelClass: 'transaction-summary-dialog',
      data: {
        user: this.user(),
        role: this.user()?.role || 'promoter',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.refresh) this.refreshTransactions();
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  formatTime(date: string): string {
    return new Date(date).toLocaleTimeString('en-NG', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getCategoryIcon(category?: string): string {
    switch (category) {
      case 'deposit':
        return 'account_balance_wallet';
      case 'withdrawal':
        return 'payments';
      case 'campaign':
        return 'campaign';
      case 'promotion':
        return 'local_offer';
      case 'bonus':
        return 'card_giftcard';
      case 'fee':
        return 'receipt';
      case 'refund':
        return 'undo';
      default:
        return 'receipt_long';
    }
  }

  getStatusIcon(status?: string): string {
    switch (this.normalizeStatus(status)) {
      case 'successful':
        return 'check_circle';
      case 'pending':
        return 'schedule';
      case 'failed':
        return 'error';
      default:
        return 'help_outline';
    }
  }

  normalizeStatus(status?: string): string {
    switch ((status || '').toLowerCase()) {
      case 'completed':
        return 'successful';
      case 'processing':
      case 'reserved':
        return 'pending';
      case 'rejected':
      case 'reversed':
        return 'failed';
      default:
        return (status || '').toLowerCase() || 'pending';
    }
  }

  private groupByDay(list: Transaction[]): TransactionGroup[] {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;

    const grouped: Record<TransactionGroupLabel, Transaction[]> = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    };

    for (const transaction of list) {
      const created = new Date(transaction.createdAt || 0).getTime();
      if (created >= startOfToday) grouped.Today.push(transaction);
      else if (created >= startOfYesterday) grouped.Yesterday.push(transaction);
      else grouped.Earlier.push(transaction);
    }

    return (['Today', 'Yesterday', 'Earlier'] as const)
      .map((label) => ({ label, items: grouped[label] }))
      .filter((group) => group.items.length > 0);
  }

  private normalizeTransaction(transaction: any): Transaction {
    const type = transaction?.type === 'credit' ? 'credit' : 'debit';
    const category = [
      'deposit',
      'withdrawal',
      'campaign',
      'promotion',
      'bonus',
      'fee',
      'refund',
    ].includes(transaction?.category)
      ? transaction.category
      : 'fee';

    return {
      ...transaction,
      amount: Number(transaction?.amount ?? 0),
      type,
      category,
      status: transaction?.status || 'pending',
      createdAt: String(transaction?.createdAt || new Date().toISOString()),
    };
  }
}
