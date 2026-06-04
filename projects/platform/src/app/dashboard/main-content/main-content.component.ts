import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { UserInterface } from '@shared/services';
import { distinctUntilChanged, filter } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../../common/services/user.service';
import { DashboardService } from './../dashboard.service';
import { DashboardHeaderComponent } from './components/dashboard-header/dashboard-header.component';
import { DashboardStat, PerformanceMetricsComponent } from './components/performance-metrics/performance-metrics.component';
import { CampaignSummary, PromotionSummary, QuickStatsComponent } from './components/quick-stats/quick-stats.component';
import { Activity, RecentActivityComponent } from './components/recent-activity/recent-activity.component';
import { GeneralMsgNotifierBannerComponent } from './notification-banner/general-msg-notifier/general-msg-notifier-banner.component';
import { ProfileNotifierBannerComponent } from './notification-banner/profiile-notifier/profile-notifier-banner.component';
import { PromoBannerComponent } from './notification-banner/promo/promo-banner.component';
import { NotificationService } from '../notification/notification.service';

interface DashboardInsight {
  icon: string;
  title: string;
  description: string;
  tone: 'good' | 'warn' | 'neutral';
  actionLabel: string;
  route: string;
}

interface DashboardModule {
  icon: string;
  title: string;
  description: string;
  metric: string;
  route: string;
}

interface RevenueBreakdownItem {
  label: string;
  value: string;
  detail: string;
  icon: string;
}

@Component({
  selector: 'main-container',
  imports: [
    CommonModule,
    DashboardHeaderComponent,
    PerformanceMetricsComponent,
    QuickStatsComponent,
    RecentActivityComponent,
    ProfileNotifierBannerComponent,
    PromoBannerComponent,
    GeneralMsgNotifierBannerComponent,
    MatIconModule,
  ],
  providers: [DashboardService],
  templateUrl: './main-content.component.html',
  styleUrls: ['./main-content.component.scss'],
})
export class DashboardMainContainer {
  private readonly snackBar = inject(MatSnackBar);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly userService = inject(UserService);
  private readonly notificationService = inject(NotificationService);

  public readonly router = inject(Router);
  public readonly user = this.userService.user;

  private notificationPollingStarted = false;
  private initializedUserId: string | null = null;

  readonly unreadMessages = signal(0);
  readonly unreadNotifications = signal(0);
  readonly viewPeriod = signal<'weekly' | 'monthly' | 'yearly'>('weekly');

  readonly campaignSummary = computed<CampaignSummary>(() => {
    const user = this.user();
    const campaigns = Array.isArray(user?.campaigns) ? user.campaigns : [];

    if (!campaigns.length) {
      return { active: 0, completed: 0, totalBudget: 0, spentBudget: 0, engagedPromoters: 0 };
    }

    return {
      active: campaigns.filter((campaign) => campaign.status === 'active').length,
      completed: campaigns.filter((campaign) => ['completed', 'expired', 'paused'].includes(campaign.status)).length,
      totalBudget: campaigns.reduce((sum, campaign) => sum + Number(campaign.budget || 0), 0),
      spentBudget: campaigns.reduce((sum, campaign) => sum + Number(campaign.spentBudget || 0), 0),
      engagedPromoters: campaigns.reduce(
        (sum, campaign) => sum + Number(campaign.promotionSummary?.uniquePromoters ?? campaign.totalPromotions ?? 0),
        0
      ),
    };
  });

  readonly promotionSummary = computed<PromotionSummary>(() => {
    const user = this.user();
    const promotions = Array.isArray(user?.promotion) ? user.promotion : [];
    const promoterWallet = user?.wallets?.promoter;

    return {
      total: promotions.length,
      activeLinks: promotions.filter(
        (promotion) => promotion.status === 'accepted' && promotion.isActive !== false
      ).length,
      paid: promotions.filter((promotion) => promotion.status === 'paid').length,
      rejected: promotions.filter((promotion) => promotion.status === 'rejected').length,
      totalClicks: promotions.reduce(
        (sum, promotion) => sum + Number(promotion.clickStats?.totalClicks ?? 0),
        0
      ),
      billableClicks: promotions.reduce(
        (sum, promotion) => sum + Number(promotion.clickStats?.billableClicks ?? 0),
        0
      ),
      totalEarnings: promotions.reduce(
        (sum, promotion) => sum + Number(promotion.clickStats?.earnedAmount ?? promotion.payoutAmount ?? 0),
        0
      ),
      availableEarnings: promoterWallet?.balance || 0,
    };
  });

  readonly dashboardStats = computed<DashboardStat[]>(() => {
    const user = this.user();
    if (!user) return [];

    if (user.role === 'marketer') {
      const summary = this.campaignSummary();
      const wallet = user.wallets?.marketer;
      const utilization = summary.totalBudget > 0 ? (summary.spentBudget / summary.totalBudget) * 100 : 0;

      return [
        {
          icon: 'payments',
          label: 'Available Balance',
          value: this.formatCurrencyCompact(wallet?.balance || 0),
          color: '#16a34a',
          subtitle: `${this.formatCurrencyCompact(wallet?.reserved || 0)} reserved`,
        },
        {
          icon: 'campaign',
          label: 'Active Campaigns',
          value: String(summary.active),
          color: '#2563eb',
          subtitle: `${summary.engagedPromoters} engaged promoters`,
        },
        {
          icon: 'account_balance_wallet',
          label: 'Budget Utilization',
          value: `${Math.round(utilization)}%`,
          color: '#f59e0b',
          subtitle: `${this.formatCurrencyCompact(summary.spentBudget)} spent`,
        },
        {
          icon: 'storefront',
          label: 'Business Modules',
          value: '4',
          color: '#7c3aed',
          subtitle: 'Campaigns, stores, revenue, insights',
        },
      ];
    }

    const summary = this.promotionSummary();
    const wallet = user.wallets?.promoter;
    const billableRate = summary.totalClicks > 0 ? (summary.billableClicks / summary.totalClicks) * 100 : 0;

    return [
      {
        icon: 'monetization_on',
        label: 'Available Earnings',
        value: this.formatCurrencyCompact(wallet?.balance || 0),
        color: '#16a34a',
        subtitle: `${this.formatCurrencyCompact(summary.totalEarnings)} total earned`,
      },
      {
        icon: 'ads_click',
        label: 'Billable Rate',
        value: `${Math.round(billableRate)}%`,
        color: '#2563eb',
        subtitle: `${summary.billableClicks} of ${summary.totalClicks} clicks`,
      },
      {
        icon: 'link',
        label: 'Active Links',
        value: String(summary.activeLinks),
        color: '#f59e0b',
        subtitle: `${summary.total} promotions tracked`,
      },
      {
        icon: 'task_alt',
        label: 'Paid Promotions',
        value: String(summary.paid),
        color: '#7c3aed',
        subtitle: `${summary.rejected} rejected`,
      },
    ];
  });

  readonly revenueBreakdown = computed<RevenueBreakdownItem[]>(() => {
    const user = this.user();
    if (!user) return [];

    if (user.role === 'marketer') {
      const summary = this.campaignSummary();
      const wallet = user.wallets?.marketer;
      const remainingBudget = Math.max(summary.totalBudget - summary.spentBudget, 0);

      return [
        {
          icon: 'account_balance_wallet',
          label: 'Wallet balance',
          value: this.formatCurrencyCompact(wallet?.balance || 0),
          detail: `${this.formatCurrencyCompact(wallet?.reserved || 0)} reserved for live work`,
        },
        {
          icon: 'trending_down',
          label: 'Campaign spend',
          value: this.formatCurrencyCompact(summary.spentBudget),
          detail: `${this.formatCurrencyCompact(remainingBudget)} budget remaining`,
        },
        {
          icon: 'groups',
          label: 'Promoter reach',
          value: String(summary.engagedPromoters),
          detail: 'Promoters attached to your active campaigns',
        },
      ];
    }

    const summary = this.promotionSummary();

    return [
      {
        icon: 'account_balance_wallet',
        label: 'Withdrawable balance',
        value: this.formatCurrencyCompact(summary.availableEarnings),
        detail: 'Ready for withdrawal when policy permits',
      },
      {
        icon: 'payments',
        label: 'Total earnings',
        value: this.formatCurrencyCompact(summary.totalEarnings),
        detail: `${summary.billableClicks} billable clicks recorded`,
      },
      {
        icon: 'query_stats',
        label: 'Tracked activity',
        value: String(summary.totalClicks),
        detail: `${summary.activeLinks} active promotion links`,
      },
    ];
  });

  readonly businessModules = computed<DashboardModule[]>(() => {
    const user = this.user();
    if (user?.role === 'marketer') {
      return [
        {
          icon: 'campaign',
          title: 'Campaign analytics',
          description: 'Track campaign spend, promoter activity, and delivery status.',
          metric: `${this.campaignSummary().active} active`,
          route: '/dashboard/campaigns/analytics',
        },
        {
          icon: 'storefront',
          title: 'Storefront analytics',
          description: 'Review product sales, affiliate performance, and order activity.',
          metric: 'Products',
          route: '/dashboard/stores/promoted-products-analytics',
        },
        {
          icon: 'receipt_long',
          title: 'Orders and revenue',
          description: 'Monitor pending orders, payouts, wallet movement, and transfers.',
          metric: 'Wallet',
          route: '/dashboard/transactions',
        },
        {
          icon: 'support_agent',
          title: 'Customer operations',
          description: 'Open support insights, subscribers, and buyer engagement records.',
          metric: 'Support',
          route: '/dashboard/stores/support',
        },
      ];
    }

    return [
      {
        icon: 'work',
        title: 'Promotion analytics',
        description: 'Track billable clicks, accepted promotions, and campaign earnings.',
        metric: `${this.promotionSummary().activeLinks} live`,
        route: '/dashboard/campaigns/analytics',
      },
      {
        icon: 'inventory',
        title: 'Promoted products',
        description: 'Monitor store-product links, orders generated, and affiliate sales.',
        metric: 'Products',
        route: '/dashboard/stores/promotions',
      },
      {
        icon: 'payments',
        title: 'Transactions and withdrawals',
        description: 'Review earnings movement, pending withdrawals, and payout records.',
        metric: 'Wallet',
        route: '/dashboard/transactions',
      },
      {
        icon: 'gpp_bad',
        title: 'Account health',
        description: 'Review penalties, fraud signals, and performance risks.',
        metric: 'Risk',
        route: '/dashboard/campaigns/promotions/compliance',
      },
    ];
  });

  readonly businessInsights = computed<DashboardInsight[]>(() => {
    const user = this.user();
    if (!user) return [];

    if (user.role === 'marketer') {
      const summary = this.campaignSummary();
      const budgetUse = summary.totalBudget > 0 ? summary.spentBudget / summary.totalBudget : 0;

      return [
        {
          icon: budgetUse > 0.8 ? 'warning' : 'insights',
          title: budgetUse > 0.8 ? 'Budget pressure detected' : 'Budget is under control',
          description: budgetUse > 0.8
            ? 'Some campaigns may need a top-up soon to avoid stalled delivery.'
            : 'Your current campaign spend is within a manageable range.',
          tone: budgetUse > 0.8 ? 'warn' : 'good',
          actionLabel: 'Review campaigns',
          route: '/dashboard/campaigns',
        },
        {
          icon: 'storefront',
          title: 'Storefront performance',
          description: 'Use product analytics to see which promoters and products drive sales.',
          tone: 'neutral',
          actionLabel: 'Open analytics',
          route: '/dashboard/stores/promoted-products-analytics',
        },
      ];
    }

    const summary = this.promotionSummary();
    const billableRate = summary.totalClicks > 0 ? summary.billableClicks / summary.totalClicks : 0;

    return [
      {
        icon: billableRate < 0.35 && summary.totalClicks > 10 ? 'warning' : 'insights',
        title: billableRate < 0.35 && summary.totalClicks > 10 ? 'Low billable click rate' : 'Promotion activity looks stable',
        description: billableRate < 0.35 && summary.totalClicks > 10
          ? 'Review your links and traffic sources to keep your account quality high.'
          : 'Keep focusing on real audience engagement and clean promotion traffic.',
        tone: billableRate < 0.35 && summary.totalClicks > 10 ? 'warn' : 'good',
        actionLabel: 'View account health',
        route: '/dashboard/campaigns/promotions/compliance',
      },
      {
        icon: 'payments',
        title: 'Revenue action',
        description: 'Review your wallet and payout history before requesting withdrawals.',
        tone: 'neutral',
        actionLabel: 'Open wallet',
        route: '/dashboard/transactions',
      },
    ];
  });

  readonly recentActivity = computed<Activity[]>(() => {
    const user = this.user();
    if (!user) return [];

    const marketerTransactions = (user.wallets?.marketer?.transactions || []).map((transaction) => this.mapTransactionToActivity(transaction, 'marketer'));
    const promoterTransactions = (user.wallets?.promoter?.transactions || []).map((transaction) => this.mapTransactionToActivity(transaction, 'promoter'));

    return [...marketerTransactions, ...promoterTransactions]
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .slice(0, 5);
  });

  constructor() {
    this.notificationService.unreadCount$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((count) => this.unreadNotifications.set(count));

    toObservable(this.user)
      .pipe(
        filter((currentUser): currentUser is UserInterface => Boolean(currentUser?._id)),
        distinctUntilChanged((previousUser, currentUser) => previousUser?._id === currentUser._id),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((currentUser) => {
        if (this.initializedUserId !== currentUser._id) {
          this.initializedUserId = currentUser._id;
          this.notificationService.loadUnreadCount();
        }

        this.startNotificationPolling();
      });
  }

  getDashboardGreeting(): string {
    const hour = new Date().getHours();
    const role = this.user()?.role;

    if (role === 'marketer') {
      if (hour < 12) return 'Good morning. Your revenue, campaign spend, and storefront signals are ready.';
      if (hour < 17) return 'Good afternoon. Review campaign ROI and storefront performance at a glance.';
      return 'Good evening. Close the day with spend, sales, and conversion clarity.';
    }

    if (hour < 12) return 'Good morning. Your earnings and promotion performance are ready.';
    if (hour < 17) return 'Good afternoon. Review billable clicks, payouts, and activity signals.';
    return 'Good evening. Check your wallet, active links, and account performance.';
  }

  setViewPeriod(period: 'weekly' | 'monthly' | 'yearly'): void {
    this.viewPeriod.set(period);
  }

  createCampaign(): void {
    this.router.navigate(['dashboard/campaigns/create']);
  }

  browseCampaign(): void {
    this.router.navigate(['dashboard/campaigns']);
  }

  viewCampaigns(): void {
    this.router.navigate(['dashboard/campaigns']);
  }

  viewPromotions(): void {
    if (this.user()?.role === 'promoter') {
      this.router.navigate(['dashboard/campaigns/promotions']);
      return;
    }

    this.router.navigate(['dashboard/campaigns']);
  }

  withdrawWallet(): void {
    this.router.navigate(['dashboard/transactions/withdrawal']);
  }

  viewWallet(): void {
    this.router.navigate(['dashboard/transactions']);
  }

  openDashboardModule(route: string): void {
    this.router.navigateByUrl(route);
  }

  logout(): void {
    this.authService.signOut()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.router.navigate(['/']),
        error: () => this.snackBar.open('Sign-out failed', 'OK', { duration: 3000 }),
      });
  }

  onActivityClick(activity: Activity): void {
    this.router.navigate(['dashboard/transactions'], {
      queryParams: { transactionId: activity.id }
    });
  }

  private startNotificationPolling(): void {
    if (this.notificationPollingStarted) {
      return;
    }

    this.notificationPollingStarted = true;
    this.notificationService.startUnreadCountPolling(30000);
  }

  private mapTransactionToActivity(transaction: any, walletType: 'marketer' | 'promoter'): Activity {
    return {
      id: transaction._id || `${walletType}-${Date.now()}`,
      description: transaction.description || 'Wallet activity',
      amount: transaction.amount || 0,
      type: (transaction.type || ((transaction.amount ?? 0) > 0 ? 'credit' : 'debit')) as 'credit' | 'debit',
      createdAt: transaction.createdAt || new Date(),
      status: (transaction.status as 'completed' | 'pending' | 'failed') || 'completed',
      walletType,
      _id: transaction._id,
      category: transaction.category,
    };
  }

  protected formatCurrencyCompact(amount: number): string {
    if (!Number.isFinite(amount)) {
      return 'NGN 0';
    }

    if (Math.abs(amount) >= 1000) {
      return `NGN ${new Intl.NumberFormat('en-NG', {
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(amount)}`;
    }

    return `NGN ${Math.round(amount).toLocaleString('en-NG')}`;
  }
}
