import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, finalize, map } from 'rxjs';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  FinanceBreakdownItem,
  FinanceCurrencyItem,
  FinanceStatusItem,
  FinanceTrendItem,
  FinancialAnalyticsData,
  FinancialService,
} from '../financial.service';
import { FinanceSectionNavComponent } from '../shared/finance-section-nav.component';

@Component({
  selector: 'app-financial-analytics',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatIconModule,
    MatProgressBarModule,
    FinanceSectionNavComponent,
  ],
  providers: [FinancialService],
  templateUrl: './financial-analytics.component.html',
  styleUrls: ['./financial-analytics.component.scss'],
})
export class FinancialAnalyticsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly financialService = inject(FinancialService);

  readonly loading = signal(true);
  readonly refreshing = signal(false);
  readonly error = signal<string | null>(null);
  readonly analytics = signal<FinancialAnalyticsData | null>(null);

  readonly trendYearOptions = [3, 4, 5, 6];
  readonly topOptions = [6, 8, 10, 12];
  readonly fallbackYearOptions = this.buildFallbackYears();

  readonly filtersForm = this.fb.nonNullable.group({
    year: [new Date().getFullYear()],
    trendYears: [5],
    top: [8],
  });

  readonly availableYears = computed(() => this.analytics()?.availableYears || this.fallbackYearOptions);
  readonly baseCurrency = computed(() => this.analytics()?.baseCurrency || 'NGN');

  readonly summaryCards = computed(() => {
    const summary = this.analytics()?.summary;
    const currency = this.baseCurrency();

    if (!summary) {
      return [];
    }

    return [
      {
        label: 'Total cash in',
        value: this.formatCurrency(summary.totalCashIn, currency),
        note: `${this.formatCurrency(summary.walletFunding, currency)} wallet funding + ${this.formatCurrency(summary.storefrontVolume, currency)} storefront volume`,
        icon: 'south_west',
      },
      {
        label: 'Total cash out',
        value: this.formatCurrency(summary.totalCashOut, currency),
        note: `${summary.totalWithdrawalCount.toLocaleString()} withdrawals in year`,
        icon: 'north_east',
      },
      {
        label: 'Net cash flow',
        value: this.formatCurrency(summary.netCashFlow, currency),
        note: summary.netCashFlow >= 0 ? 'Positive movement for the selected year' : 'Outflow is ahead of inflow',
        icon: 'waterfall_chart',
      },
      {
        label: 'Platform revenue',
        value: this.formatCurrency(summary.platformRevenue, currency),
        note: 'Fee and subscription revenue proxy',
        icon: 'account_balance',
      },
      {
        label: 'Campaign spend',
        value: this.formatCurrency(summary.campaignSpend, currency),
        note: `${this.formatCurrency(summary.promoterPayouts, currency)} paid out to promoters`,
        icon: 'campaign',
      },
      {
        label: 'Available balance',
        value: this.formatCurrency(summary.activeBalance, currency),
        note: `${this.formatCurrency(summary.reservedBalance, currency)} still reserved`,
        icon: 'account_balance_wallet',
      },
      {
        label: 'Paid orders',
        value: summary.paidOrders.toLocaleString(),
        note: `${this.formatCurrency(summary.averageOrderValue, currency)} average order value`,
        icon: 'shopping_bag',
      },
      {
        label: 'Successful transactions',
        value: summary.successfulTransactions.toLocaleString(),
        note: `${summary.totalTransactions.toLocaleString()} total transaction records in the selected year`,
        icon: 'receipt_long',
      },
    ];
  });

  readonly monthlyTrendMax = computed(() => this.getTrendMax(this.analytics()?.monthlyTrend || []));
  readonly yearlyTrendMax = computed(() => this.getTrendMax(this.analytics()?.yearlyTrend || []));
  readonly incomeMax = computed(() => this.getAmountMax(this.analytics()?.incomeCategories || []));
  readonly expenseMax = computed(() => this.getAmountMax(this.analytics()?.expenseCategories || []));
  readonly currencyMax = computed(() => this.getAmountMax(this.analytics()?.currencyMix || []));
  readonly withdrawalMax = computed(() => this.getAmountMax(this.analytics()?.withdrawalStatuses || []));

  constructor() {
    this.setupFilters();
    this.loadAnalytics();
  }

  refresh(): void {
    this.loadAnalytics(true);
  }

  trackByKey(_index: number, item: { key: string }): string {
    return item.key;
  }

  getTrendBarWidth(item: FinanceTrendItem, max: number): number {
    return this.scaleWidth(Math.max(item.cashIn, item.cashOut, Math.abs(item.netFlow)), max);
  }

  getAmountBarWidth(item: FinanceBreakdownItem | FinanceCurrencyItem | FinanceStatusItem, max: number): number {
    return this.scaleWidth(item.amount, max);
  }

  private setupFilters(): void {
    this.filtersForm.valueChanges
      .pipe(
        debounceTime(180),
        map((value) => JSON.stringify(value)),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.loadAnalytics());
  }

  private loadAnalytics(manualRefresh = false): void {
    if (manualRefresh) {
      this.refreshing.set(true);
    } else {
      this.loading.set(true);
    }

    this.error.set(null);

    this.financialService.getFinancialAnalytics(this.filtersForm.getRawValue())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading.set(false);
          this.refreshing.set(false);
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response?.success) {
            this.error.set('Unable to load financial analytics right now.');
            return;
          }

          this.analytics.set(response.data);
        },
        error: (error) => {
          this.error.set(error?.error?.message || 'Unable to load financial analytics right now.');
        },
      });
  }

  private getTrendMax(items: FinanceTrendItem[]): number {
    return items.reduce((max, item) => Math.max(max, item.cashIn, item.cashOut, Math.abs(item.netFlow)), 0);
  }

  private getAmountMax(items: Array<{ amount: number }>): number {
    return items.reduce((max, item) => Math.max(max, item.amount || 0), 0);
  }

  private scaleWidth(value: number, max: number): number {
    if (!max) {
      return 0;
    }

    return Math.max(6, Math.min(100, (value / max) * 100));
  }

  private formatCurrency(value: number, currency = 'NGN'): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  }

  private buildFallbackYears(): number[] {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, index) => currentYear - index);
  }
}
