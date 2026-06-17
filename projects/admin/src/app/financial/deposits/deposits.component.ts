import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged, finalize, map } from 'rxjs';

import {
  DepositListResponse,
  DepositRecord,
  DepositSummary,
  FinancialService,
} from '../financial.service';
import { FinanceSectionNavComponent } from '../shared/finance-section-nav.component';

const EMPTY_SUMMARY: DepositSummary = {
  totalAmount: 0,
  totalNativeAmount: 0,
  totalFees: 0,
  totalCount: 0,
  successfulAmount: 0,
  successfulCount: 0,
  pendingAmount: 0,
  pendingCount: 0,
  failedAmount: 0,
  failedCount: 0,
  averageDeposit: 0,
  statuses: [],
  gateways: [],
  currencies: [],
  dailyTrend: [],
};

@Component({
  selector: 'app-admin-deposits',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatTooltipModule,
    FinanceSectionNavComponent,
  ],
  providers: [FinancialService],
  templateUrl: './deposits.component.html',
  styleUrls: ['./deposits.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepositsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly financialService = inject(FinancialService);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(true);
  readonly refreshing = signal(false);
  readonly exporting = signal(false);
  readonly error = signal<string | null>(null);
  readonly deposits = signal<DepositRecord[]>([]);
  readonly summary = signal<DepositSummary>(EMPTY_SUMMARY);
  readonly totalItems = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = signal(50);
  readonly pageSizeOptions = [25, 50, 100, 200, 500];
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalItems() / this.pageSize())));

  readonly pageNumbers = computed(() => {
    const t = this.totalPages(); const c = this.currentPage();
    const pages: number[] = [];
    const start = Math.max(1, c - 2); const end = Math.min(t, c + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });

  readonly displayedColumns = [
    'user',
    'amount',
    'gateway',
    'reference',
    'status',
    'date',
    'actions',
  ];

  readonly statusOptions = [
    { value: 'all', label: 'All statuses' },
    { value: 'successful', label: 'Successful' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'failed', label: 'Failed' },
    { value: 'abandoned', label: 'Abandoned' },
    { value: 'reversed', label: 'Reversed' },
  ];

  readonly gatewayOptions = [
    { value: 'all', label: 'All gateways' },
    { value: 'paystack', label: 'Paystack' },
    { value: 'flutterwave', label: 'Flutterwave' },
    { value: 'bank_transfer', label: 'Bank transfer' },
    { value: 'system', label: 'System' },
  ];

  readonly currencyOptions = [
    { value: 'all', label: 'All currencies' },
    { value: 'NGN', label: 'NGN' },
    { value: 'USD', label: 'USD' },
    { value: 'GBP', label: 'GBP' },
    { value: 'EUR', label: 'EUR' },
  ];

  readonly walletOptions = [
    { value: 'all', label: 'All wallets' },
    { value: 'marketer', label: 'Marketer wallet' },
    { value: 'promoter', label: 'Promoter wallet' },
  ];

  readonly filtersForm = this.fb.nonNullable.group({
    search: [''],
    status: ['all'],
    gateway: ['all'],
    currency: ['all'],
    walletType: ['all'],
    fromDate: [''],
    toDate: [''],
  });

  readonly baseCurrency = computed(() => this.summary().currencies[0]?.key || 'NGN');
  readonly trendMax = computed(() => this.summary().dailyTrend.reduce((max, item) => Math.max(max, item.amount), 0));
  readonly successRate = computed(() => {
    const total = this.summary().totalCount || 0;
    return total ? (this.summary().successfulCount / total) * 100 : 0;
  });

  readonly summaryCards = computed(() => [
    {
      label: 'Total deposits',
      value: this.formatCurrency(this.summary().totalAmount, this.baseCurrency()),
      note: `${this.summary().totalCount.toLocaleString()} deposit records`,
      icon: 'south_west',
      tone: 'primary',
    },
    {
      label: 'Successful deposits',
      value: this.formatCurrency(this.summary().successfulAmount, this.baseCurrency()),
      note: `${this.successRate().toFixed(1)}% success rate`,
      icon: 'verified',
      tone: 'success',
    },
    {
      label: 'Pending review',
      value: this.formatCurrency(this.summary().pendingAmount, this.baseCurrency()),
      note: `${this.summary().pendingCount.toLocaleString()} pending or processing`,
      icon: 'pending_actions',
      tone: 'warning',
    },
    {
      label: 'Average deposit',
      value: this.formatCurrency(this.summary().averageDeposit, this.baseCurrency()),
      note: `${this.formatCurrency(this.summary().totalFees, this.baseCurrency())} recorded fees`,
      icon: 'analytics',
      tone: 'info',
    },
  ]);

  constructor() {
    this.setupFilterReload();
    this.loadDeposits();
  }

  refresh(): void {
    this.loadDeposits(true);
  }

  clearFilters(): void {
    this.filtersForm.reset({
      search: '',
      status: 'all',
      gateway: 'all',
      currency: 'all',
      walletType: 'all',
      fromDate: '',
      toDate: '',
    });
    this.currentPage.set(1);
    this.loadDeposits();
  }

  goToPage(page: number): void {
    const t = Math.max(1, Math.min(page, this.totalPages()));
    if (t === this.currentPage()) return;
    this.currentPage.set(t);
    this.loadDeposits();
  }

  onPageInput(e: Event): void {
    const i = e.target as HTMLInputElement;
    const p = parseInt(i.value, 10);
    if (!isNaN(p) && p >= 1 && p <= this.totalPages()) this.goToPage(p);
    i.value = '';
  }

  onPageSizeChange(size: string | number): void {
    const n = typeof size === 'string' ? parseInt(size, 10) : size;
    this.pageSize.set(n);
    this.currentPage.set(1);
    this.loadDeposits();
  }

  async copyReference(deposit: DepositRecord): Promise<void> {
    if (!deposit.reference) {
      return;
    }

    try {
      await navigator.clipboard.writeText(deposit.reference);
      this.showSuccess('Payment reference copied');
    } catch {
      this.showError('Unable to copy reference');
    }
  }

  exportDeposits(): void {
    this.exporting.set(true);
    this.financialService.exportDeposits({
      format: 'csv',
      ...this.buildFilterParams(),
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.exporting.set(false)),
      )
      .subscribe({
        next: (response) => {
          if (!response?.success) {
            this.showError('Unable to export deposits');
            return;
          }

          this.downloadCsv(response.data.csv, response.data.filename, response.data.mimeType);
          this.showSuccess(`Exported ${response.data.exported.toLocaleString()} deposit records`);
        },
        error: (error) => {
          console.error('Deposit export failed:', error);
          this.showError('Unable to export deposits');
        },
      });
  }

  getStatusClass(status: string): string {
    const normalized = status || 'default';
    if (['successful', 'completed', 'paid'].includes(normalized)) return 'status-success';
    if (['pending', 'processing', 'initiated'].includes(normalized)) return 'status-warning';
    if (['failed', 'declined', 'cancelled', 'abandoned'].includes(normalized)) return 'status-danger';
    if (normalized === 'reversed' || normalized === 'refunded') return 'status-muted';
    return 'status-default';
  }

  getStatusIcon(status: string): string {
    if (['successful', 'completed', 'paid'].includes(status)) return 'check_circle';
    if (['pending', 'processing', 'initiated'].includes(status)) return 'schedule';
    if (['failed', 'declined', 'cancelled', 'abandoned'].includes(status)) return 'error';
    if (status === 'reversed' || status === 'refunded') return 'undo';
    return 'help';
  }

  getTrendWidth(amount: number): number {
    const max = this.trendMax();
    if (!max) return 0;
    return Math.max(6, Math.min(100, (amount / max) * 100));
  }

  private setupFilterReload(): void {
    this.filtersForm.valueChanges
      .pipe(
        debounceTime(260),
        map((value) => JSON.stringify(value)),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.currentPage.set(1);
        this.loadDeposits();
      });
  }

  private loadDeposits(manualRefresh = false): void {
    if (manualRefresh) {
      this.refreshing.set(true);
    } else {
      this.loading.set(true);
    }

    this.error.set(null);

    this.financialService.getDeposits({
      ...this.buildFilterParams(),
      page: this.currentPage(),
      limit: this.pageSize(),
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading.set(false);
          this.refreshing.set(false);
        }),
      )
      .subscribe({
        next: (response: DepositListResponse) => {
          this.deposits.set(response.deposits || []);
          this.totalItems.set(response.total || 0);
          this.summary.set(response.summary || EMPTY_SUMMARY);
        },
        error: (error) => {
          console.error('Deposit loading failed:', error);
          this.error.set(error?.error?.message || 'Unable to load deposits right now.');
          this.deposits.set([]);
          this.summary.set(EMPTY_SUMMARY);
        },
      });
  }

  private buildFilterParams(): {
    search?: string;
    status?: string;
    gateway?: string;
    currency?: string;
    walletType?: string;
    fromDate?: string;
    toDate?: string;
  } {
    const raw = this.filtersForm.getRawValue();
    return {
      search: raw.search.trim() || undefined,
      status: raw.status !== 'all' ? raw.status : undefined,
      gateway: raw.gateway !== 'all' ? raw.gateway : undefined,
      currency: raw.currency !== 'all' ? raw.currency : undefined,
      walletType: raw.walletType !== 'all' ? raw.walletType : undefined,
      fromDate: raw.fromDate || undefined,
      toDate: raw.toDate || undefined,
    };
  }

  private downloadCsv(csv: string, filename: string, mimeType: string): void {
    const blob = new Blob([csv], { type: `${mimeType || 'text/csv'};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `deposits_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private formatCurrency(value: number, currency = 'NGN'): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar'],
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3500,
      panelClass: ['error-snackbar'],
    });
  }
}
