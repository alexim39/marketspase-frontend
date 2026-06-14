import { Component, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, debounceTime, distinctUntilChanged, Subscription, interval } from 'rxjs';

import { FinancialService, Transaction, WithdrawalRequest, FinancialStats } from './financial.service';
import { ConfirmDialogComponent } from './shared/confirm-dialog/confirm-dialog.component';
import { FinanceSectionNavComponent } from './shared/finance-section-nav.component';
import { WithdrawalDetailsDialogComponent } from './withdrawal-details-dialog/withdrawal-details-dialog.component';

@Component({
  selector: 'app-financial-management',
  templateUrl: './financial-mgt.component.html',
  styleUrls: ['./financial-mgt.component.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatIconModule, MatButtonModule, MatTabsModule, MatMenuModule,
    MatDialogModule, MatSnackBarModule, MatProgressSpinnerModule, MatProgressBarModule, MatTooltipModule,
    FinanceSectionNavComponent,
  ],
  providers: [FinancialService]
})
export class FinancialMgtComponent implements OnInit, OnDestroy {
  private readonly financialService = inject(FinancialService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly transactions = signal<Transaction[]>([]);
  readonly withdrawalRequests = signal<WithdrawalRequest[]>([]);
  readonly financialStats = signal<FinancialStats>({
    year: new Date().getFullYear(), baseCurrency: 'NGN', totalCashIn: 0, totalCashOut: 0, netCashFlow: 0,
    walletFunding: 0, storefrontVolume: 0, platformRevenue: 0, campaignSpend: 0, promoterPayouts: 0,
    walletRefunds: 0, totalTransactions: 0, successfulTransactions: 0, totalWithdrawalCount: 0,
    totalWithdrawalAmount: 0, successfulWithdrawalCount: 0, successfulWithdrawals: 0,
    processingWithdrawalCount: 0, processingWithdrawals: 0, pendingApprovalCount: 0, pendingApprovals: 0,
    failedWithdrawalCount: 0, failedWithdrawals: 0, activeBalance: 0, reservedBalance: 0,
    marketerAvailable: 0, marketerReserved: 0, promoterAvailable: 0, promoterReserved: 0,
    paidOrders: 0, totalOrders: 0, averageOrderValue: 0,
  });

  readonly isLoading = signal(true);
  readonly isWithdrawalsLoading = signal(true);
  readonly isTransactionsLoading = signal(true);
  readonly isExporting = signal(false);

  readonly searchTerm = signal('');
  readonly statusFilter = signal<'all' | 'processing' | 'successful' | 'failed' | 'reversed' | 'pending_approval'>('all');
  readonly dateRange = signal<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  readonly currentPage = signal(1);
  readonly pageSize = signal(50);
  readonly totalItems = signal(0);
  readonly totalPages = signal(0);
  readonly pageSizeOptions = [25, 50, 100, 200];

  readonly sortField = signal('createdAt');
  readonly sortDirection = signal<'asc' | 'desc'>('desc');
  readonly transactionSortField = signal('createdAt');
  readonly transactionSortDirection = signal<'asc' | 'desc'>('desc');

  readonly activeTab = signal<'withdrawals' | 'transactions'>('withdrawals');

  private readonly searchSubject = new Subject<string>();
  private readonly transactionSearchSubject = new Subject<string>();
  private pollingSubscription?: Subscription;

  readonly currencyLabel = computed(() => this.financialStats().baseCurrency === 'NGN' ? '₦' : this.financialStats().baseCurrency + ' ');
  readonly withdrawalSuccessRate = computed(() => this.financialStats().totalWithdrawalCount ? (this.financialStats().successfulWithdrawalCount / this.financialStats().totalWithdrawalCount) * 100 : 0);

  readonly withdrawalColumns = ['user', 'amount', 'netAmount', 'bankDetails', 'reference', 'status', 'date', 'actions'];
  readonly transactionColumns = ['user', 'type', 'amount', 'category', 'description', 'status', 'date'];

  readonly withdrawalPageNumbers = computed(() => this.buildPageNumbers(this.totalPages()));
  readonly transactionTotalPages = signal(0);
  readonly transactionTotalItems = signal(0);
  readonly transactionPageNumbers = computed(() => this.buildPageNumbers(this.transactionTotalPages()));
  readonly transactionSearchTerm = signal('');
  readonly transactionPage = signal(1);
  readonly transactionPageSize = signal(50);

  readonly statusMap: Record<string, { label: string; css: string; icon: string }> = {
    processing: { label: 'Processing', css: 'status-info', icon: 'schedule' },
    successful: { label: 'Completed', css: 'status-success', icon: 'check_circle' },
    failed: { label: 'Failed', css: 'status-danger', icon: 'error' },
    reversed: { label: 'Reversed', css: 'status-warning', icon: 'undo' },
    pending_approval: { label: 'Pending', css: 'status-warning', icon: 'pending_actions' },
    pending: { label: 'Pending', css: 'status-warning', icon: 'pending' },
    completed: { label: 'Completed', css: 'status-success', icon: 'check_circle' },
    cancelled: { label: 'Cancelled', css: 'status-muted', icon: 'cancel' },
    refunded: { label: 'Refunded', css: 'status-muted', icon: 'undo' },
  };

  constructor() {
    this.setupSearch();
    this.setupTransactionSearch();
    this.loadInitialData();
    this.startPolling();
  }

  ngOnInit(): void { }

  private setupSearch(): void {
    this.searchSubject.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => {
      this.currentPage.set(1);
      this.loadWithdrawals();
    });
  }

  private setupTransactionSearch(): void {
    this.transactionSearchSubject.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => {
      this.transactionPage.set(1);
      this.loadTransactions();
    });
  }

  private loadInitialData(): void {
    this.isLoading.set(true);
    this.financialService.getFinancialStats().subscribe({
      next: (stats) => { this.financialStats.set(stats); this.isLoading.set(false); },
      error: () => this.isLoading.set(false),
    });
    this.loadWithdrawals();
  }

  private startPolling(): void {
    this.pollingSubscription = interval(30000).subscribe(() => {
      this.financialService.getFinancialStats().subscribe(stats => this.financialStats.set(stats));
      if (this.activeTab() === 'withdrawals') this.loadWithdrawals();
    });
  }

  onTabChange(event: any): void {
    this.activeTab.set(event.index === 0 ? 'withdrawals' : 'transactions');
    if (this.activeTab() === 'transactions' && this.transactions().length === 0) this.loadTransactions();
  }

  loadWithdrawals(): void {
    this.isWithdrawalsLoading.set(true);
    this.financialService.getWithdrawalRequests({
      page: this.currentPage(), limit: this.pageSize(),
      search: this.searchTerm(), status: this.statusFilter(),
      fromDate: this.dateRange().start ? this.dateRange().start!.toISOString() : undefined,
      toDate: this.dateRange().end ? this.dateRange().end!.toISOString() : undefined,
    }).subscribe({
      next: (r) => {
        this.withdrawalRequests.set(r.requests || []);
        this.totalItems.set(r.total || 0);
        this.totalPages.set(Math.ceil(r.total / this.pageSize()) || 1);
        this.isWithdrawalsLoading.set(false);
      },
      error: () => this.isWithdrawalsLoading.set(false),
    });
  }

  loadTransactions(): void {
    this.isTransactionsLoading.set(true);
    this.financialService.getTransactions({
      page: this.transactionPage(), limit: this.transactionPageSize(),
    }).subscribe({
      next: (r) => {
        this.transactions.set(r.transactions || []);
        this.transactionTotalItems.set(r.total || 0);
        this.transactionTotalPages.set(Math.ceil(r.total / this.transactionPageSize()) || 1);
        this.isTransactionsLoading.set(false);
      },
      error: () => this.isTransactionsLoading.set(false),
    });
  }

  onSearchChange(e: Event): void { this.searchTerm.set((e.target as HTMLInputElement).value); this.searchSubject.next((e.target as HTMLInputElement).value); }
  onTransactionSearchChange(e: Event): void { this.transactionSearchTerm.set((e.target as HTMLInputElement).value); this.transactionSearchSubject.next((e.target as HTMLInputElement).value); }
  clearSearch(): void { this.searchTerm.set(''); this.currentPage.set(1); this.loadWithdrawals(); }
  clearTransactionSearch(): void { this.transactionSearchTerm.set(''); this.transactionPage.set(1); this.loadTransactions(); }

  setStatusFilter(s: typeof this.statusFilter extends () => infer T ? T : never): void { this.statusFilter.set(s); this.currentPage.set(1); this.loadWithdrawals(); }

  toggleSort(field: string): void {
    if (this.sortField() === field) { this.sortDirection.update(d => d === 'asc' ? 'desc' : 'asc'); }
    else { this.sortField.set(field); this.sortDirection.set('desc'); }
    this.currentPage.set(1); this.loadWithdrawals();
  }

  getSortIcon(field: string): string { if (this.sortField() !== field) return ''; return this.sortDirection() === 'asc' ? 'arrow_upward' : 'arrow_downward'; }

  goToPage(page: number): void { const t = Math.max(1, Math.min(page, this.totalPages())); if (t === this.currentPage()) return; this.currentPage.set(t); this.loadWithdrawals(); }
  onPageInput(e: Event): void { const i = e.target as HTMLInputElement; const p = parseInt(i.value, 10); if (!isNaN(p) && p >= 1 && p <= this.totalPages()) this.goToPage(p); i.value = ''; }
  onPageSizeChange(s: string | number): void { const n = typeof s === 'string' ? parseInt(s, 10) : s; this.pageSize.set(n); this.currentPage.set(1); this.loadWithdrawals(); }

  goToTransactionPage(page: number): void { const t = Math.max(1, Math.min(page, this.transactionTotalPages())); if (t === this.transactionPage()) return; this.transactionPage.set(t); this.loadTransactions(); }
  onTransactionPageInput(e: Event): void { const i = e.target as HTMLInputElement; const p = parseInt(i.value, 10); if (!isNaN(p) && p >= 1 && p <= this.transactionTotalPages()) this.goToTransactionPage(p); i.value = ''; }
  onTransactionPageSizeChange(s: string | number): void { const n = typeof s === 'string' ? parseInt(s, 10) : s; this.transactionPageSize.set(n); this.transactionPage.set(1); this.loadTransactions(); }

  private buildPageNumbers(total: number): number[] {
    const current = this.activeTab() === 'withdrawals' ? this.currentPage() : this.transactionPage();
    const t = Math.max(1, total); const c = current;
    const pages: number[] = []; const start = Math.max(1, c - 2); const end = Math.min(t, c + 2);
    for (let i = start; i <= end; i++) pages.push(i); return pages;
  }

  approveRequest(r: WithdrawalRequest): void {
    this.dialog.open(ConfirmDialogComponent, { data: { title: 'Approve Withdrawal', message: `Approve withdrawal of ${this.currencyLabel()}${r.amount.toLocaleString()} for ${r.userName}?`, confirmText: 'Approve', confirmClass: 'primary' } })
      .afterClosed().subscribe(v => { if (v?.confirmed) { this.financialService.approveWithdrawal(r.withdrawalId).subscribe({ next: () => { this.showSuccess('Withdrawal approved'); this.loadWithdrawals(); this.financialService.getFinancialStats().subscribe(s => this.financialStats.set(s)); }, error: () => this.showError('Failed to approve') }); } });
  }
  rejectRequest(r: WithdrawalRequest): void {
    this.dialog.open(ConfirmDialogComponent, { data: { title: 'Reject Withdrawal', message: `Reject withdrawal of ${this.currencyLabel()}${r.amount.toLocaleString()} for ${r.userName}?`, confirmText: 'Reject', confirmClass: 'warn', showInput: true, inputLabel: 'Reason' } })
      .afterClosed().subscribe(v => { if (v?.confirmed) { this.financialService.rejectWithdrawal(r.withdrawalId, v.input || '').subscribe({ next: () => { this.showSuccess('Withdrawal rejected'); this.loadWithdrawals(); this.financialService.getFinancialStats().subscribe(s => this.financialStats.set(s)); }, error: () => this.showError('Failed to reject') }); } });
  }
  retryRequest(r: WithdrawalRequest): void {
    this.dialog.open(ConfirmDialogComponent, { data: { title: 'Retry Withdrawal', message: `Retry withdrawal of ${this.currencyLabel()}${r.amount.toLocaleString()}?`, confirmText: 'Retry', confirmClass: 'primary' } })
      .afterClosed().subscribe(v => { if (v?.confirmed) { this.financialService.retryWithdrawal(r.withdrawalId).subscribe({ next: () => { this.showSuccess('Withdrawal retried'); this.loadWithdrawals(); }, error: () => this.showError('Failed to retry') }); } });
  }
  viewDetails(r: WithdrawalRequest): void { this.dialog.open(WithdrawalDetailsDialogComponent, { width: '700px', maxWidth: '94vw', data: { withdrawalId: r.withdrawalId } }); }

  exportWithdrawals(): void { this.isExporting.set(true); this.financialService.exportWithdrawals({ format: 'csv', status: this.statusFilter() }).subscribe({
    next: (r) => { if (r.success) window.open(r.data.url, '_blank'); this.isExporting.set(false); this.showSuccess('Exported'); },
    error: () => { this.isExporting.set(false); this.showError('Export failed'); }
  }); }
  exportTransactions(): void { this.isExporting.set(true); this.financialService.exportTransactions({ format: 'csv' }).subscribe({
    next: (r) => { if (r.success) window.open(r.data.url, '_blank'); this.isExporting.set(false); this.showSuccess('Exported'); },
    error: () => { this.isExporting.set(false); this.showError('Export failed'); }
  }); }

  private downloadBlob(blob: Blob, filename: string): void { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url); }

  getStatusConfig(status: string): { label: string; css: string; icon: string } { return this.statusMap[status] || { label: status, css: 'status-default', icon: 'help' }; }
  getCategoryLabel(cat: string): string { const m: Record<string,string> = { deposit:'Deposit', withdrawal:'Withdrawal', campaign:'Campaign', promotion:'Promotion', fee:'Fee', refund:'Refund', transfer:'Transfer', commission:'Commission', store_sale:'Store Sale', store_promotion:'Store Promo', ai_subscription:'AI Sub' }; return m[cat] || cat; }

  clearFilters(): void { this.searchTerm.set(''); this.statusFilter.set('all'); this.currentPage.set(1); this.loadWithdrawals(); }

  private showSuccess(m: string): void { this.snackBar.open(m, 'Close', { duration: 3000, panelClass: 'success-snackbar' }); }
  private showError(m: string): void { this.snackBar.open(m, 'Close', { duration: 5000, panelClass: 'error-snackbar' }); }

  ngOnDestroy(): void { this.pollingSubscription?.unsubscribe(); }
}
