import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe, TitleCasePipe } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { finalize, interval } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../common/services/user.service';
import {
  AnalyticsResponse,
  CollaborationService,
  PromoterBreakdownRow,
} from '../collaboration/collaboration.service';

type DashboardRole = 'marketer' | 'promoter';

interface SummaryCard {
  label: string;
  value: string;
  caption: string;
  icon: string;
  tone: 'primary' | 'success' | 'warning' | 'info';
}

interface TimeSeriesBar {
  date: string;
  label: string;
  trackedVisits: number;
  billableClicks: number;
  invalidClicks: number;
  duplicateClicks: number;
  spend?: number;
  earnings?: number;
  trackedWidth: number;
  billableWidth: number;
}

interface BreakdownBar {
  label: string;
  value: number;
  width: number;
  helper: string;
}

@Component({
  selector: 'app-campaign-analytics',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule,
  ],
  providers: [CurrencyPipe, DatePipe, DecimalPipe, TitleCasePipe],
  templateUrl: './campaign-analytics.component.html',
  styleUrls: ['./campaign-analytics.component.scss'],
})
export class CampaignAnalyticsComponent {
  private readonly collaborationService = inject(CollaborationService);
  private readonly userService = inject(UserService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly currencyPipe = inject(CurrencyPipe);
  private readonly decimalPipe = inject(DecimalPipe);
  private readonly titleCasePipe = inject(TitleCasePipe);
  private readonly datePipe = inject(DatePipe);

  readonly currentUser = this.userService.user;
  readonly loading = signal(true);
  readonly refreshing = signal(false);
  readonly generatedAt = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly analytics = signal<AnalyticsResponse['data'] | null>(null);

  readonly filtersForm = this.fb.nonNullable.group({
    range: ['30'],
    startDate: [''],
    endDate: [''],
    campaignId: [''],
    promoterId: [''],
  });

  readonly dashboardRole = computed<DashboardRole | null>(() => {
    const role = this.currentUser()?.role;
    return role === 'marketer' || role === 'promoter' ? role : null;
  });

  readonly heading = computed(() =>
    this.dashboardRole() === 'marketer' ? 'Campaign Analytics' : 'Promotion Analytics'
  );

  readonly helperCopy = computed(() =>
    this.dashboardRole() === 'marketer'
      ? 'Track live campaign performance, promoter traction, spend quality, and remaining room to scale.'
      : 'Watch your accepted promotions, click quality, and earnings without leaving the promoter workflow.'
  );

  readonly campaignOptions = computed(() => this.analytics()?.campaignBreakdown ?? []);
  readonly promoterOptions = computed(() => this.analytics()?.promoterBreakdown ?? []);
  readonly promotionOptions = computed(() => this.analytics()?.promotionBreakdown ?? []);

  readonly summaryCards = computed<SummaryCard[]>(() => {
    const data = this.analytics();
    const role = this.dashboardRole();
    if (!data || !role) {
      return [];
    }

    const summary = data.summary;
    const trackedVisits = Number(summary.trackedVisits || 0);
    const billableClicks = Number(summary.billableClicks || 0);
    const invalidClicks = Number(summary.invalidClicks || 0);
    const qualityRate = Number(summary.qualityRate || 0);

    if (role === 'marketer') {
      return [
        {
          label: 'Tracked Visits',
          value: this.formatNumber(trackedVisits),
          caption: `${this.formatNumber(billableClicks)} billable clicks from active campaign traffic`,
          icon: 'ads_click',
          tone: 'primary',
        },
        {
          label: 'Campaign Spend',
          value: this.formatCurrency(summary.spend || 0),
          caption: `${this.formatCurrency(summary.remainingBudget || 0)} budget still available`,
          icon: 'payments',
          tone: 'warning',
        },
        {
          label: 'Active Promoters',
          value: this.formatNumber(summary.activePromoters || 0),
          caption: `${this.formatNumber(summary.activePromotions || 0)} live promotion links tied to campaigns`,
          icon: 'groups',
          tone: 'info',
        },
        {
          label: 'Traffic Quality',
          value: `${this.formatNumber(qualityRate, 1)}%`,
          caption: `${this.formatNumber(invalidClicks)} invalid or low-quality clicks filtered out`,
          icon: 'verified',
          tone: 'success',
        },
      ];
    }

    return [
      {
        label: 'Tracked Visits',
        value: this.formatNumber(trackedVisits),
        caption: `${this.formatNumber(billableClicks)} billable clicks credited to you`,
        icon: 'ads_click',
        tone: 'primary',
      },
      {
        label: 'Total Earnings',
        value: this.formatCurrency(summary.earnings || 0),
        caption: `${this.formatCurrency(summary.averageEarningPerBillableClick || 0)} average earning per billable click`,
        icon: 'savings',
        tone: 'success',
      },
      {
        label: 'Active Promotions',
        value: this.formatNumber(summary.activePromotions || 0),
        caption: `${this.formatNumber(summary.linkedCampaigns || 0)} linked campaigns in your current mix`,
        icon: 'bolt',
        tone: 'info',
      },
      {
        label: 'Traffic Quality',
        value: `${this.formatNumber(qualityRate, 1)}%`,
        caption: `${this.formatNumber(invalidClicks)} invalid or duplicate clicks held back`,
        icon: 'shield',
        tone: 'warning',
      },
    ];
  });

  readonly chartRows = computed<TimeSeriesBar[]>(() => {
    const rows = this.analytics()?.timeSeries ?? [];
    const maxValue = Math.max(...rows.map((row) => Math.max(row.trackedVisits, row.billableClicks, 1)), 1);

    return rows.map((row) => ({
      ...row,
      label: this.datePipe.transform(row.date, 'MMM d') || row.date,
      trackedWidth: Math.max((row.trackedVisits / maxValue) * 100, row.trackedVisits ? 8 : 0),
      billableWidth: Math.max((row.billableClicks / maxValue) * 100, row.billableClicks ? 8 : 0),
    }));
  });

  readonly deviceBreakdown = computed<BreakdownBar[]>(() => {
    const rows = this.analytics()?.deviceBreakdown ?? [];
    const total = rows.reduce((sum, row) => sum + Number(row.count || 0), 0) || 1;
    return rows.map((row) => ({
      label: this.titleCasePipe.transform(row.deviceType || 'unknown') || 'Unknown',
      value: Number(row.count || 0),
      width: (Number(row.count || 0) / total) * 100,
      helper: `${this.formatNumber((Number(row.count || 0) / total) * 100, 1)}% of tracked visits`,
    }));
  });

  readonly sourceBreakdown = computed<BreakdownBar[]>(() => {
    const rows = this.analytics()?.sourceBreakdown ?? [];
    const total = rows.reduce((sum, row) => sum + Number(row.count || 0), 0) || 1;
    return rows.map((row) => ({
      label: this.humanizeSource(row.source || 'direct'),
      value: Number(row.count || 0),
      width: (Number(row.count || 0) / total) * 100,
      helper: `${this.formatNumber((Number(row.count || 0) / total) * 100, 1)}% of tracked visits`,
    }));
  });

  constructor() {
    this.filtersForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (value.range !== 'custom' && (value.startDate || value.endDate)) {
          this.filtersForm.patchValue(
            { startDate: '', endDate: '' },
            { emitEvent: false }
          );
        }

        this.loadAnalytics(true);
      });

    effect((onCleanup) => {
      const role = this.dashboardRole();
      const user = this.currentUser();
      if (!role || !user?._id) {
        return;
      }

      this.loadAnalytics();

      const refreshSub = interval(60000).subscribe(() => this.loadAnalytics(true));

      onCleanup(() => refreshSub.unsubscribe());
    });
  }

  refreshNow(): void {
    this.loadAnalytics(true);
  }

  clearFilters(): void {
    this.filtersForm.setValue({
      range: '30',
      startDate: '',
      endDate: '',
      campaignId: '',
      promoterId: '',
    });
  }

  exportCsv(kind: 'timeSeries' | 'campaigns' | 'promoters' | 'promotions'): void {
    const data = this.analytics();
    if (!data) {
      return;
    }

    const lookup = {
      timeSeries: {
        filename: 'marketspase-analytics-timeseries.csv',
        rows: data.timeSeries,
      },
      campaigns: {
        filename: 'marketspase-campaign-breakdown.csv',
        rows: data.campaignBreakdown ?? [],
      },
      promoters: {
        filename: 'marketspase-promoter-breakdown.csv',
        rows: data.promoterBreakdown ?? [],
      },
      promotions: {
        filename: 'marketspase-promotion-breakdown.csv',
        rows: data.promotionBreakdown ?? [],
      },
    } as const;

    const selected = lookup[kind];
    if (!selected.rows.length) {
      this.snackBar.open('There is no data to export for that view yet.', 'Close', { duration: 2600 });
      return;
    }

    const csv = this.toCsv(selected.rows as unknown as Array<Record<string, unknown>>);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selected.filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  openCampaignRoom(campaignId?: string | null): void {
    if (!campaignId) {
      return;
    }

    this.router.navigate(['/dashboard/campaigns/collaboration'], {
      queryParams: { campaignId },
    });
  }

  openPromotionRoom(promotionId?: string | null): void {
    if (!promotionId) {
      return;
    }

    this.router.navigate(['/dashboard/campaigns/collaboration'], {
      queryParams: { promotionId },
    });
  }

  openPromoterConversation(row: PromoterBreakdownRow): void {
    if (!row.promoterId) {
      return;
    }

    this.router.navigate(['/dashboard/campaigns/collaboration'], {
      queryParams: { targetUserId: row.promoterId },
    });
  }

  trackByLabel(_index: number, item: { label: string }): string {
    return item.label;
  }

  trackByDate(_index: number, item: { date: string }): string {
    return item.date;
  }

  trackByCampaign(_index: number, item: { campaignId?: string; title: string }): string {
    return item.campaignId || item.title;
  }

  trackByPromoter(_index: number, item: PromoterBreakdownRow): string {
    return item.promoterId;
  }

  trackByPromotion(_index: number, item: { promotionId?: string; upi?: string }): string {
    return item.promotionId || item.upi || `${_index}`;
  }

  private loadAnalytics(silent: boolean = false): void {
    const user = this.currentUser();
    const role = this.dashboardRole();
    if (!user?._id || !role) {
      return;
    }

    if (silent) {
      this.refreshing.set(true);
    } else {
      this.loading.set(true);
    }
    this.error.set(null);

    const rawValue = this.filtersForm.getRawValue();
    const filters = {
      range: rawValue.range,
      startDate: rawValue.range === 'custom' ? rawValue.startDate || null : null,
      endDate: rawValue.range === 'custom' ? rawValue.endDate || null : null,
      campaignId: rawValue.campaignId || null,
      promoterId: role === 'marketer' ? rawValue.promoterId || null : null,
    };

    const request = role === 'marketer'
      ? this.collaborationService.getMarketerAnalytics(user._id, filters)
      : this.collaborationService.getPromoterAnalytics(user._id, filters);

    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading.set(false);
          this.refreshing.set(false);
        })
      )
      .subscribe({
        next: (response) => {
          this.analytics.set(response.data);
          this.generatedAt.set(response.generatedAt);
        },
        error: (error) => {
          const message = error?.error?.message || 'We could not load analytics right now.';
          this.error.set(message);
          this.snackBar.open(message, 'Close', { duration: 3200 });
        },
      });
  }

  formatCurrency(value: number): string {
    return this.currencyPipe.transform(value || 0, 'NGN', 'symbol', '1.0-0') || '₦0';
  }

  formatNumber(value: number, digits: number = 0): string {
    const format = digits > 0 ? `1.${digits}-${digits}` : '1.0-0';
    return this.decimalPipe.transform(value || 0, format) || '0';
  }

  private humanizeSource(source: string): string {
    const normalized = String(source || 'direct').replace(/[_-]+/g, ' ').trim();
    return this.titleCasePipe.transform(normalized) || 'Direct';
  }

  private toCsv(rows: Array<Record<string, unknown>>): string {
    const headers = Array.from(
      rows.reduce((set, row) => {
        Object.keys(row).forEach((key) => set.add(key));
        return set;
      }, new Set<string>())
    );

    const escape = (value: unknown) => {
      const stringValue = String(value ?? '');
      if (/[",\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const lines = [
      headers.join(','),
      ...rows.map((row) => headers.map((header) => escape(row[header])).join(',')),
    ];

    return lines.join('\n');
  }
}
