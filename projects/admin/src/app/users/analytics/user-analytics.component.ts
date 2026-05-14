import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, finalize, map } from 'rxjs';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  AnalyticsDistributionItem,
  GeographicDistributionItem,
  MonthlySignupItem,
  UserAnalyticsData,
  UserAnalyticsService,
} from './user-analytics.service';

@Component({
  selector: 'app-user-analytics',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  providers: [UserAnalyticsService],
  templateUrl: './user-analytics.component.html',
  styleUrls: ['./user-analytics.component.scss'],
})
export class UserAnalyticsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly analyticsService = inject(UserAnalyticsService);

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
}
