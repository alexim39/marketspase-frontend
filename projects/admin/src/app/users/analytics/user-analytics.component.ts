import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, finalize, map } from 'rxjs';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  AnalyticsDistributionItem,
  GeographicDistributionItem,
  MonthlySignupItem,
  UserAnalyticsData,
  UserAnalyticsService,
} from './user-analytics.service';
import { ApiService } from '../../../../../shared-services/src/public-api';

interface GrowthPoint { label: string; count: number; cumulative: number; growth: number; }

@Component({
  selector: 'app-user-analytics',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  providers: [UserAnalyticsService],
  templateUrl: './user-analytics.component.html',
  styleUrls: ['./user-analytics.component.scss'],
})
export class UserAnalyticsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly analyticsService = inject(UserAnalyticsService);
  private readonly apiService = inject(ApiService);

  readonly loading = signal(true);
  readonly refreshing = signal(false);
  readonly error = signal<string | null>(null);
  readonly analytics = signal<UserAnalyticsData | null>(null);

  readonly roleOptions = [
    { value: 'all', label: 'All users' },
    { value: 'marketer', label: 'Marketers' },
    { value: 'promoter', label: 'Promoters' },
    { value: 'admin', label: 'Admins' },
  ] as const;

  readonly windowOptions = [
    { value: 30, label: '30 days' },
    { value: 90, label: '90 days' },
    { value: 180, label: '180 days' },
    { value: 365, label: '12 months' },
  ] as const;

  readonly topOptions = [8, 10, 12, 15];
  readonly monthOptions = [6, 12, 18, 24];

  readonly filtersForm = this.fb.nonNullable.group({
    role: ['all' as 'all' | 'marketer' | 'promoter' | 'admin'],
    windowDays: [90],
    top: [10],
    months: [12],
  });

  readonly summaryCards = computed(() => {
    const summary = this.analytics()?.summary;
    if (!summary) {
      return [];
    }

    return [
      {
        label: 'Total users',
        value: this.formatNumber(summary.totalUsers),
        note: `${summary.newUsersInWindow.toLocaleString()} joined in the selected window`,
        icon: 'groups',
      },
      {
        label: 'Recently seen',
        value: `${summary.windowSeenShare}%`,
        note: `${summary.usersSeenInWindow.toLocaleString()} users active in window`,
        icon: 'timeline',
      },
      {
        label: 'Verified accounts',
        value: `${summary.verifiedShare}%`,
        note: `${summary.verifiedUsers.toLocaleString()} verified users`,
        icon: 'verified_user',
      },
      {
        label: 'Profile depth',
        value: `${summary.averageProfileCompletion}%`,
        note: `${summary.completeProfileShare}% have strong profiles`,
        icon: 'account_circle',
      },
      {
        label: 'Average balance',
        value: this.formatCurrency(summary.averageBalance),
        note: `${this.formatCurrency(summary.totalBalance)} total wallet value`,
        icon: 'account_balance_wallet',
      },
      {
        label: 'Gamified users',
        value: this.formatNumber(summary.highLevelUsers),
        note: `${summary.activeStreakUsers.toLocaleString()} users have an active streak`,
        icon: 'emoji_events',
      },
      {
        label: 'Average age',
        value: summary.averageAge ? `${summary.averageAge}` : 'n/a',
        note: 'Based on users with date of birth set',
        icon: 'cake',
      },
      {
        label: 'Referral reach',
        value: this.formatNumber(summary.totalReferrals),
        note: `${summary.totalBadges.toLocaleString()} badges awarded across users`,
        icon: 'share',
      },
    ];
  });

  readonly maxTrendCount = computed(() => this.getMaxCount(this.analytics()?.distributions.monthlySignups || []));

  readonly topCountry = computed(() => this.analytics()?.distributions.countries[0] || null);
  readonly topState = computed(() => this.analytics()?.distributions.states[0] || null);

  constructor() {
    this.setupFilters();
    this.loadAnalytics();
    this.loadGrowth();
  }

  refresh(): void {
    this.loadAnalytics(true);
  }

  trackByKey(_index: number, item: { key: string }): string {
    return item.key;
  }

  getRoleWidth(item: GeographicDistributionItem, role: 'marketer' | 'promoter' | 'admin'): number {
    if (!item.count) {
      return 0;
    }

    return Math.max(0, Math.min(100, (item.roleBreakdown[role] / item.count) * 100));
  }

  getBarWidth(item: AnalyticsDistributionItem | MonthlySignupItem, max = 0): number {
    const denominator = max || item.count || 1;
    return Math.max(4, Math.min(100, (item.count / denominator) * 100));
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

    this.analyticsService.getAnalytics(this.filtersForm.getRawValue())
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
            this.error.set('Unable to load user analytics right now.');
            return;
          }

          this.analytics.set(response.data);
        },
        error: (error) => {
          this.error.set(error?.error?.message || 'Unable to load user analytics right now.');
        },
      });
  }

  private getMaxCount(items: Array<{ count: number }>): number {
    return items.reduce((max, item) => Math.max(max, item.count || 0), 0);
  }

  private formatNumber(value: number): string {
    return Number(value || 0).toLocaleString();
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  }

  // ── User Growth Sparkline ──
  readonly growthGranularity = signal<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  readonly growthPoints = signal<GrowthPoint[]>([]);
  readonly growthMax = signal(0);
  readonly growthCumulativeValues = computed(() => this.growthPoints().map(p => p.cumulative));
  readonly growthCountValues = computed(() => this.growthPoints().map(p => p.count));
  readonly growthCountMax = computed(() => this.growthPoints().reduce((m, p) => Math.max(m, p.count), 0));
  readonly growthFirstLabel = computed(() => this.growthPoints()[0]?.label || '');
  readonly growthLastLabel = computed(() => this.growthPoints()[this.growthPoints().length - 1]?.label || '');
  readonly growthLastCumulative = computed(() => this.growthPoints()[this.growthPoints().length - 1]?.cumulative || 0);
  readonly growthDots = computed(() => {
    const vals = this.growthCumulativeValues();
    const max = Math.max(1, this.growthMax());
    const len = vals.length;
    const step = len > 1 ? 800 / (len - 1) : 800;
    return vals.map((v, i) => ({ cx: i * step, cy: 120 - (v / max) * 120, v }));
  });
  readonly growthAreaPoints = computed(() => {
    const path = this.growthSparklinePath(this.growthCumulativeValues(), this.growthMax());
    const len = this.growthCumulativeValues().length;
    const lastX = len > 1 ? ((len - 1) * (800 / (len - 1))) : 800;
    return `0,120 ${path} ${lastX},120`;
  });

  yAxisTicks(): { y: number; label: string }[] {
    const max = Math.max(1, this.growthMax());
    return [0, 0.25, 0.5, 0.75, 1].map(pct => ({
      y: 120 - (pct * 120),
      label: Math.round(pct * max).toLocaleString(),
    }));
  }

  xAxisLabels(): { x: number; label: string }[] {
    const pts = this.growthPoints();
    if (!pts.length) return [];
    const step = pts.length > 1 ? 800 / (pts.length - 1) : 0;
    const maxLabels = Math.min(8, pts.length);
    const interval = Math.max(1, Math.floor(pts.length / maxLabels));
    return pts.filter((_, i) => i % interval === 0 || i === pts.length - 1).map(p => {
      const idx = pts.indexOf(p);
      return { x: idx * step, label: p.label };
    });
  }

  loadGrowth(): void {
    this.apiService.get<any>(`api/v1/user/admin/users/growth?granularity=${this.growthGranularity()}`).subscribe({
      next: (r) => {
        if (r.success) {
          const pts = r.data.points as GrowthPoint[];
          this.growthPoints.set(pts);
          this.growthMax.set(pts.reduce((m, p) => Math.max(m, p.cumulative), 0));
        }
      },
    });
  }

  setGrowthGranularity(g: typeof this.growthGranularity extends () => infer T ? T : never): void {
    this.growthGranularity.set(g);
    this.loadGrowth();
  }

  growthSparklinePath(values: number[], max: number, w = 800, h = 120): string {
    if (!values.length || !max) return '';
    const safeMax = Math.max(1, max);
    const step = values.length > 1 ? w / (values.length - 1) : w;
    return values.map((v, i) => {
      const x = i * step;
      const y = h - (Math.min(Math.max(v, 0), safeMax) / safeMax) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  growthBars(): { x: number; w: number; h: number; count: number }[] {
    const pts = this.growthPoints();
    if (!pts.length) return [];
    const max = Math.max(1, pts.reduce((m, p) => Math.max(m, p.count), 0));
    const barW = pts.length > 1 ? (790 / pts.length) - 2 : 60;
    return pts.map((p, i) => ({
      x: i * (barW + 2) + 1,
      w: Math.max(2, barW),
      h: Math.max(2, (p.count / max) * 110),
      count: p.count,
    }));
  }
}
