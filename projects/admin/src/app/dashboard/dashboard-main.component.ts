import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import {
  AdminFraudPulseResponse,
  AdminLiveActivityItem,
  AdminOverviewStats,
  DashboardService,
} from './dashboard.service';

@Component({
  selector: 'app-dashboard-main',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatProgressBarModule],
  templateUrl: './dashboard-main.component.html',
  styleUrls: ['./dashboard-main.component.scss']
})
export class DashboardMainComponent {
  private readonly dashboardService = inject(DashboardService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loadingOverview = signal(true);
  readonly loadingActivity = signal(true);
  readonly overview = signal<AdminOverviewStats | null>(null);
  readonly activityFeed = signal<AdminLiveActivityItem[]>([]);
  readonly fraudPulse = signal<AdminFraudPulseResponse | null>(null);
  readonly activitySummary = signal({
    feedPosts24h: 0,
    forumThreads24h: 0,
    campaigns24h: 0,
    products24h: 0,
    total24h: 0,
  });

  readonly heroCards = computed(() => {
    const overview = this.overview();
    if (!overview) {
      return [];
    }

    return [
      {
        key: 'users',
        label: 'Users',
        value: overview.users.totalUsers.toLocaleString(),
        meta: `${overview.users.marketers.toLocaleString()} marketers | ${overview.users.promoters.toLocaleString()} promoters`,
        icon: 'groups',
        tone: 'info',
      },
      {
        key: 'campaigns',
        label: 'Ad campaigns',
        value: overview.ads.totalCampaigns.toLocaleString(),
        meta: `${overview.ads.activeCampaigns.toLocaleString()} active | ${overview.ads.pendingCampaigns.toLocaleString()} pending`,
        icon: 'campaign',
        tone: 'primary',
      },
      {
        key: 'promotions',
        label: 'Promotions',
        value: overview.ads.totalPromotions.toLocaleString(),
        meta: `${overview.ads.activeCampaigns.toLocaleString()} live campaigns | ${overview.ads.totalCampaignClicks.toLocaleString()} clicks tracked`,
        icon: 'ads_click',
        tone: 'warning',
      },
      {
        key: 'commerce',
        label: 'Storefront sales',
        value: `NGN ${overview.commerce.grossMerchandiseValue.toLocaleString()}`,
        meta: `${overview.commerce.paidOrders.toLocaleString()} paid orders | ${overview.commerce.totalProducts.toLocaleString()} live products`,
        icon: 'storefront',
        tone: 'success',
      },
    ];
  });

    readonly quickActions = [
      {
        title: 'Manage feed posts',
        description: 'Browse, search, feature in spotlight, and moderate all social feed posts.',
        route: '/dashboard/posts',
        icon: 'post_add',
      },
      {
        title: 'Review fraud cases',
        description: 'Inspect suspicious promotion traffic, pause links, and suspend repeat offenders.',
        route: '/dashboard/promotions/fraud',
        icon: 'shield',
      },
      {
        title: 'Manage promotion ledger',
        description: 'Review promotion performance, payout outcomes, and link health across the marketplace.',
        route: '/dashboard/promotions',
        icon: 'ads_click',
      },
      {
        title: 'Manage storefronts',
        description: 'Inspect stores, products, and marketplace readiness across marketers.',
        route: '/dashboard/stores',
        icon: 'store',
      },
      {
        title: 'Moderate product reviews',
        description: 'Approve, reject, or clear flagged storefront ratings before they affect public trust.',
        route: '/dashboard/stores/reviews',
        icon: 'rate_review',
      },
      {
        title: 'Handle payouts and refunds',
        description: 'Review withdrawal requests, transfer history, and payment recovery work.',
        route: '/dashboard/financial',
        icon: 'account_balance_wallet',
      },
      {
        title: 'Tune rewards and gamification',
        description: 'Adjust streak, badge, gamification, and payment settings for live growth loops.',
        route: '/dashboard/settings/login-streaks',
        icon: 'emoji_events',
      },
  ];

  constructor() {
    this.loadDashboard();
  }

  readonly fraudHighlights = computed(() => {
    const pulse = this.fraudPulse();
    if (!pulse) {
      return [];
    }

    return [
      {
        label: 'Open fraud cases',
        value: pulse.count.toLocaleString(),
        detail: pulse.count > 0 ? 'Needs admin review' : 'No active fraud cases',
      },
      ...pulse.recent.slice(0, 2).map((item) => ({
        label: item.title,
        value: item.promoter,
        detail: `${item.riskLevel} risk | ${item.status.replace(/_/g, ' ')}`,
      })),
    ];
  });

  readonly activePrograms = computed(() => {
    const overview = this.overview();
    if (!overview) {
      return [];
    }

    return [
      {
        label: 'Marketplace community',
        value: `${overview.community.totalFeedPosts.toLocaleString()} posts | ${overview.community.totalThreads.toLocaleString()} discussions`,
        detail: `${this.activitySummary().total24h.toLocaleString()} fresh activities in the last 24 hours`,
      },
      {
        label: 'Storefront engine',
        value: `${overview.commerce.totalStores.toLocaleString()} stores | ${overview.commerce.totalProducts.toLocaleString()} published products`,
        detail: `${overview.commerce.paidOrders.toLocaleString()} paid orders captured`,
      },
      {
        label: 'Rewards system',
        value: `${overview.rewards.activeStreakUsers.toLocaleString()} streaking users | ${overview.rewards.badgeAwards.toLocaleString()} badge awards`,
        detail: `${overview.rewards.leveledUsers.toLocaleString()} users have moved beyond level 1`,
      },
    ];
  });

  refreshDashboard(): void {
    this.dashboardService.clearCache();
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.loadOverview();
    this.loadActivity();
    this.loadFraudPulse();
  }

  private loadOverview(): void {
    this.loadingOverview.set(true);
    this.dashboardService.getAdminOverview()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loadingOverview.set(false)),
      )
      .subscribe({
        next: (data) => {
          this.overview.set(data);
        },
        error: (error) => {
          console.error('Error loading admin overview:', error);
          this.overview.set(null);
        },
      });
  }

  private loadActivity(): void {
    this.loadingActivity.set(true);
    this.dashboardService.getLiveActivity(12)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loadingActivity.set(false)),
      )
      .subscribe({
        next: (data) => {
          this.activityFeed.set(data.activities || []);
          this.activitySummary.set(data.summary || {
            feedPosts24h: 0,
            forumThreads24h: 0,
            campaigns24h: 0,
            products24h: 0,
            total24h: 0,
          });
        },
        error: (error) => {
          console.error('Error loading admin activity feed:', error);
          this.activityFeed.set([]);
        },
      });
  }

  private loadFraudPulse(): void {
    this.dashboardService.getFraudPulse()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.fraudPulse.set(data);
        },
        error: (error) => {
          console.error('Error loading admin fraud pulse:', error);
          this.fraudPulse.set(null);
        },
      });
  }
}
