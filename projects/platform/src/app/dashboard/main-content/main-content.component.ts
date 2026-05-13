import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { DeviceService, UserInterface } from '@shared/services';
import { distinctUntilChanged, filter, interval } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../../common/services/user.service';
import { ProfileService, ProfileUser, SuggestedUser } from '../../profile/services/profile.service';
import { TutorialService, Section, VideoItem } from '../../tutorials/services/tutorial.service';
import { NotificationService } from '../notification/notification.service';
import {
  DashboardLiveActivity,
  DashboardLiveActivityPayload,
  DashboardService,
} from './../dashboard.service';
import { TestimonialsComponent } from '../testimonial/testimonial.component';
import { BadgeFeedComponent } from './components/badge-feed/badge-feed.component';
import { CommunityFeedComponent } from './components/community-feed/community-feed.component';
import { ConnectionsSectionComponent, SuggestedConnection } from './components/connections-section/connections-section.component';
import { DashboardHeaderComponent } from './components/dashboard-header/dashboard-header.component';
import { GamificationSpotlightComponent } from './components/gamification-spotlight/gamification-spotlight.component';
import { LearningCourse, LearningSectionComponent } from './components/learning-section/learning-section.component';
import { DashboardStat, PerformanceMetricsComponent } from './components/performance-metrics/performance-metrics.component';
import { CampaignSummary, CommunityStats, PromotionSummary, QuickStatsComponent } from './components/quick-stats/quick-stats.component';
import { Activity, RecentActivityComponent } from './components/recent-activity/recent-activity.component';
import { TrendingItem, TrendingSectionComponent } from './components/trending-section/trending-section.component';
import { GeneralMsgNotifierBannerComponent } from './notification-banner/general-msg-notifier/general-msg-notifier-banner.component';
import { ProfileNotifierBannerComponent } from './notification-banner/profiile-notifier/profile-notifier-banner.component';
import { PromoBannerComponent } from './notification-banner/promo/promo-banner.component';
import {
  CreatorSpotlightEntry,
  FeedHotTopic,
  FeedService,
  FeedTrendChallenge,
  ForumSpotlightEntry,
  LiveActivity as FeedLiveActivity,
} from '../../community/feeds/feed.service';
import { ForumService } from '../../community/forum/forum.service';

interface DashboardTrendingItem extends TrendingItem {
  kind: 'forum' | 'hashtag' | 'challenge';
  target: string;
}

interface ForumStatsSnapshot {
  totalMembers: number;
  totalDiscussions: number;
  totalComments: number;
  todayDiscussions: number;
  todayComments: number;
  todayActivity: number;
}

@Component({
  selector: 'main-container',
  imports: [
    CommonModule,
    DashboardHeaderComponent,
    CommunityFeedComponent,
    PerformanceMetricsComponent,
    QuickStatsComponent,
    RecentActivityComponent,
    GamificationSpotlightComponent,
    BadgeFeedComponent,
    TrendingSectionComponent,
    ConnectionsSectionComponent,
    LearningSectionComponent,
    TestimonialsComponent,
    ProfileNotifierBannerComponent,
    PromoBannerComponent,
    GeneralMsgNotifierBannerComponent,
    MatIconModule,
  ],
  providers: [DashboardService, FeedService, ForumService, ProfileService, TutorialService],
  templateUrl: './main-content.component.html',
  styleUrls: ['./main-content.component.scss'],
})
export class DashboardMainContainer {
  private readonly snackBar = inject(MatSnackBar);
  private readonly authService = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly deviceService = inject(DeviceService);
  private readonly userService = inject(UserService);
  private readonly feedService = inject(FeedService);
  private readonly forumService = inject(ForumService);
  private readonly profileService = inject(ProfileService);
  private readonly tutorialService = inject(TutorialService);
  private readonly notificationService = inject(NotificationService);

  public readonly router = inject(Router);
  public readonly user = this.userService.user;

  private readonly profileSnapshot = signal<ProfileUser | null>(null);
  private readonly forumStats = signal<ForumStatsSnapshot | null>(null);
  private readonly liveActivitySummary = signal<DashboardLiveActivityPayload['summary'] | null>(null);
  private readonly suggestedUsers = signal<SuggestedUser[]>([]);

  private notificationPollingStarted = false;
  private backgroundRefreshStarted = false;
  private initializedUserId: string | null = null;

  readonly unreadMessages = signal(0);
  readonly unreadNotifications = signal(0);
  readonly viewPeriod = signal<'weekly' | 'monthly' | 'yearly'>('weekly');
  readonly savedCourses = signal<Set<string>>(new Set());
  readonly followingTrends = signal<Set<string>>(new Set());
  readonly pendingConnections = signal<Set<string>>(new Set());
  readonly connectedConnections = signal<Set<string>>(new Set());
  readonly activeTrendingCategory = signal<string>('All');
  readonly activeConnectionFilter = signal<string>('All');
  readonly learningCourses = signal<LearningCourse[]>([]);

  readonly trendingCategories = signal<string[]>(['All', 'Forum', 'Hashtags', 'Challenges']);
  readonly connectionFilters = signal<string[]>(['All', 'Marketers', 'Promoters', 'Top Rated']);

  readonly commactivityStats = this.feedService.activityStats;
  readonly liveActivities = this.feedService.liveActivities;

  readonly isMobile = computed(() => this.deviceService.deviceState().isMobile);
  readonly trendingActiveUsers = computed(() =>
    this.commactivityStats().activeUsers ||
    this.forumStats()?.todayActivity ||
    this.liveActivitySummary()?.total24h ||
    0
  );
  readonly liveActivityUpdatedLabel = computed(() => {
    const summary = this.liveActivitySummary();
    if (!summary?.total24h) {
      return 'Updated just now';
    }

    return `${summary.total24h} fresh updates in the last 24h`;
  });

  readonly campaignSummary = computed<CampaignSummary>(() => {
    const user = this.user();
    if (!user?.campaigns?.length) {
      return { active: 0, completed: 0, totalBudget: 0, spentBudget: 0, totalPromoters: 0 };
    }

    const campaigns = Array.isArray(user.campaigns) ? user.campaigns : [];
    const active = campaigns.filter((campaign) => campaign.status === 'active').length;
    const completed = campaigns.filter((campaign) => ['completed', 'expired', 'paused'].includes(campaign.status)).length;

    return {
      active,
      completed,
      totalBudget: campaigns.reduce((sum, campaign) => sum + (campaign.budget || 0), 0),
      spentBudget: campaigns.reduce((sum, campaign) => sum + (campaign.spentBudget || 0), 0),
      totalPromoters: campaigns.reduce((sum, campaign) => sum + (campaign.currentPromoters || 0), 0),
    };
  });

  readonly promotionSummary = computed<PromotionSummary>(() => {
    const user = this.user();
    const promotions = Array.isArray(user?.promotion) ? user.promotion : [];
    const promoterWallet = user?.wallets?.promoter;

    return {
      total: promotions.length,
      accepted: promotions.filter((promotion) => promotion.status === 'accepted').length,
      submitted: promotions.filter((promotion) => promotion.status === 'submitted').length,
      validated: promotions.filter((promotion) => promotion.status === 'validated').length,
      paid: promotions.filter((promotion) => promotion.status === 'paid').length,
      totalEarnings: promotions
        .filter((promotion) => promotion.status === 'paid')
        .reduce((sum, promotion) => sum + (promotion.payoutAmount ?? 0), 0),
      pendingEarnings: promotions
        .filter((promotion) => promotion.status === 'validated')
        .reduce((sum, promotion) => sum + (promotion.payoutAmount ?? 0), 0),
      availableEarnings: promoterWallet?.balance || 0,
    };
  });

  readonly communityStats = computed<CommunityStats>(() => {
    const user = this.user();
    const profile = this.profileSnapshot();
    const activityLog = Array.isArray(user?.activityLog) ? user!.activityLog! : [];
    const forumThreadCount = activityLog.filter((entry) => /thread|forum/i.test(entry.action)).length;
    const commentCount = activityLog.filter((entry) => /comment|reply/i.test(entry.action)).length;

    return {
      connections: (profile?.followersCount || 0) + (profile?.followingCount || 0),
      likes: profile?.totalLikes || 0,
      posts: (profile?.postsCount || 0) + forumThreadCount,
      comments: commentCount,
    };
  });

  readonly dashboardStats = computed<DashboardStat[]>(() => {
    const user = this.user();
    if (!user) return [];

    const streak = user.loginStreak?.currentStreak || 0;
    const gamification = user.gamificationProfile;
    const levelLabel = gamification?.currentLevel ? `Lv ${gamification.currentLevel}` : 'Lv 1';
    const levelSubtitle = gamification
      ? `${gamification.totalExperiencePoints || 0} XP | ${streak} day streak`
      : `${streak} day streak`;

    if (user.role === 'marketer') {
      const summary = this.campaignSummary();
      const wallet = user.wallets?.marketer;

      return [
        {
          icon: 'campaign',
          label: 'Active Campaigns',
          value: String(summary.active),
          color: '#667eea',
          subtitle: `${summary.totalPromoters} promoters onboard`,
        },
        {
          icon: 'payments',
          label: 'Budget Committed',
          value: this.formatCurrencyCompact(summary.totalBudget),
          color: '#f59e0b',
          subtitle: `${this.formatCurrencyCompact(summary.spentBudget)} already spent`,
        },
        {
          icon: 'account_balance_wallet',
          label: 'Available Balance',
          value: this.formatCurrencyCompact(wallet?.balance || 0),
          color: '#16a34a',
          subtitle: `${this.formatCurrencyCompact(wallet?.reserved || 0)} reserved`,
        },
        {
          icon: 'military_tech',
          label: 'Current Level',
          value: levelLabel,
          color: '#7c3aed',
          subtitle: levelSubtitle,
        },
      ];
    }

    const summary = this.promotionSummary();
    const wallet = user.wallets?.promoter;

    return [
      {
        icon: 'monetization_on',
        label: 'Available Earnings',
        value: this.formatCurrencyCompact(wallet?.balance || 0),
        color: '#16a34a',
        subtitle: `${this.formatCurrencyCompact(summary.pendingEarnings)} pending release`,
      },
      {
        icon: 'task_alt',
        label: 'Paid Promotions',
        value: String(summary.paid),
        color: '#2563eb',
        subtitle: `${summary.total} total promotions`,
      },
      {
        icon: 'hourglass_top',
        label: 'Pending Review',
        value: String(summary.submitted),
        color: '#f59e0b',
        subtitle: `${summary.validated} validated`,
      },
      {
        icon: 'military_tech',
        label: 'Current Level',
        value: levelLabel,
        color: '#7c3aed',
        subtitle: levelSubtitle,
      },
    ];
  });

  readonly trendingItems = computed<DashboardTrendingItem[]>(() => {
    const forumTopics = this.feedService.hotTopics().map((topic, index) => this.mapHotTopic(topic, index));
    const hashtags = this.feedService.trendingHashtags().map((tag, index) => this.mapHashtagTrend(tag, forumTopics.length + index));
    const challenges = this.feedService.trendingChallenges().map((challenge, index) => this.mapChallengeTrend(
      challenge,
      forumTopics.length + hashtags.length + index
    ));

    return [...forumTopics, ...challenges, ...hashtags]
      .sort((left, right) => right.mentions - left.mentions)
      .slice(0, 8)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  });

  readonly suggestedConnections = computed<SuggestedConnection[]>(() => {
    const currentUserId = this.user()?._id;
    const spotlightEntries = new Map<string, SuggestedConnection>();

    this.feedService.creatorSpotlight().forEach((entry) => {
      if (!entry._id || entry._id === currentUserId) return;
      spotlightEntries.set(entry._id, this.mapCreatorSpotlight(entry));
    });

    this.feedService.forumSpotlight().forEach((entry) => {
      if (!entry._id || entry._id === currentUserId) return;
      if (!spotlightEntries.has(entry._id)) {
        spotlightEntries.set(entry._id, this.mapForumSpotlight(entry));
      }
    });

    const results = [...spotlightEntries.values()];
    if (results.length >= 6) {
      return results.slice(0, 6);
    }

    const enrichedSuggestions = this.suggestedUsers()
      .filter((entry) => entry._id !== currentUserId && !spotlightEntries.has(entry._id))
      .map((entry) => ({
        id: entry._id,
        name: entry.displayName || entry.username,
        role: 'Community member',
        avatar: entry.avatar || 'img/avatar.png',
        headlineMetric: '@' + entry.username,
        headlineLabel: 'to follow',
        secondaryMetric: 'Suggested',
        secondaryLabel: 'match',
        badge: undefined,
      }));

    return [...results, ...enrichedSuggestions].slice(0, 6);
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
        const isFreshUser = this.initializedUserId !== currentUser._id;
        this.initializedUserId = currentUser._id;

        this.startNotificationPolling();
        this.startBackgroundRefresh();
        this.loadDashboardData(currentUser, isFreshUser);
      });
  }

  getCommunityGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning! Ready to grow your business today?';
    if (hour < 17) return "Good afternoon! Let's turn your latest activity into results.";
    return "Good evening! Here's what your MarketSpase momentum looks like right now.";
  }

  createCommunityPost(): void {
    this.router.navigate(['dashboard/community/feeds/create']);
  }

  openCommunityFeed(): void {
    this.router.navigate(['dashboard/community/feeds']);
  }

  openCommunityForum(): void {
    this.router.navigate(['dashboard/community/discussion']);
  }

  openCampaigns(): void {
    this.router.navigate(['dashboard/campaigns']);
  }

  openAdSchool(): void {
    this.router.navigate(['dashboard/tutorials']);
  }

  setViewPeriod(period: 'weekly' | 'monthly' | 'yearly'): void {
    this.viewPeriod.set(period);
  }

  viewTrending(): void {
    this.router.navigate(['dashboard/community/feeds']);
  }

  connectUser(userId: string): void {
    const currentUserId = this.user()?._id;
    if (!currentUserId || !userId) {
      return;
    }

    this.profileService.toggleFollow(userId, currentUserId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.connectedConnections.update((current) => {
          const next = new Set(current);
          if (response.followed) {
            next.add(userId);
          } else {
            next.delete(userId);
          }
          return next;
        });

        this.snackBar.open(response.followed ? 'You are now following this account.' : 'Follow removed.', 'OK', {
          duration: 2500,
        });
      },
      error: () => {
        this.snackBar.open('We could not update this follow right now.', 'Close', { duration: 3500 });
      }
    });
  }

  continueCourse(_courseId: string): void {
    this.router.navigate(['dashboard/tutorials']);
  }

  followTrend(trendId: string): void {
    const trend = this.trendingItems().find((item) => item.id === trendId);
    if (!trend) {
      return;
    }

    const following = new Set(this.followingTrends());
    const isFollowing = following.has(trendId);

    if (trend.kind === 'forum') {
      this.forumService.followTopic(trend.target).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          if (isFollowing) {
            following.delete(trendId);
            this.snackBar.open('Topic unfollowed.', 'OK', { duration: 2200 });
          } else {
            following.add(trendId);
            this.snackBar.open('Topic followed.', 'OK', { duration: 2200 });
          }
          this.followingTrends.set(following);
        },
        error: () => {
          this.snackBar.open('We could not update this topic right now.', 'Close', { duration: 3200 });
        }
      });
      return;
    }

    if (isFollowing) {
      following.delete(trendId);
      this.snackBar.open('Removed from your watchlist.', 'OK', { duration: 2200 });
    } else {
      following.add(trendId);
      this.snackBar.open('Added to your watchlist.', 'OK', { duration: 2200 });
    }

    this.followingTrends.set(following);
  }

  openSettings(): void {
    this.router.navigate(['dashboard/settings']);
  }

  viewAllConnections(): void {
    this.router.navigate(['dashboard/community/feeds']);
  }

  createCampaign(): void {
    this.router.navigate(['dashboard/campaigns/create']);
  }

  browseCampaign(): void {
    if (this.user()?.role === 'promoter') {
      this.router.navigate(['dashboard/campaigns']);
      return;
    }

    this.router.navigate(['dashboard/community/feeds']);
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

  logout(): void {
    this.authService.signOut()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.router.navigate(['/']),
        error: () => this.snackBar.open('Sign-out failed', 'OK', { duration: 3000 }),
      });
  }

  onSaveCourse(courseId: string): void {
    const currentSaved = new Set(this.savedCourses());
    if (currentSaved.has(courseId)) {
      currentSaved.delete(courseId);
      this.snackBar.open('Removed from your saved list.', 'OK', { duration: 2200 });
    } else {
      currentSaved.add(courseId);
      this.snackBar.open('Saved for later.', 'OK', { duration: 2200 });
    }
    this.savedCourses.set(currentSaved);
  }

  onTrendingCategoryChange(category: string): void {
    this.activeTrendingCategory.set(category);
  }

  onConnectionFilterChange(filter: string): void {
    this.activeConnectionFilter.set(filter);
  }

  refreshConnections(): void {
    const currentUserId = this.user()?._id;
    if (!currentUserId) {
      return;
    }

    this.loadSuggestedConnections(currentUserId);
    this.loadFollowingState(currentUserId);
  }

  onActivityClick(activity: Activity): void {
    this.router.navigate(['dashboard/transactions'], {
      queryParams: { transactionId: activity.id }
    });
  }

  onTrendClick(trend: TrendingItem): void {
    if (this.isDashboardTrend(trend) && trend.kind === 'forum') {
      this.router.navigate(['dashboard/community/discussion'], {
        queryParams: { tag: trend.target }
      });
      return;
    }

    this.router.navigate(['dashboard/community/feeds']);
  }

  onViewConnection(connectionId: string): void {
    this.router.navigate(['dashboard/profile', connectionId]);
  }

  onProfileClick(connection: SuggestedConnection): void {
    this.router.navigate(['dashboard/profile', connection.id]);
  }

  onViewPost(postId: string): void {
    this.router.navigate(['/feed', postId]);
  }

  onHashtagClick(_tag: string): void {
    this.router.navigate(['/dashboard/community/feeds']);
  }

  private loadDashboardData(user: UserInterface, resetFeed: boolean): void {
    if (resetFeed || !this.feedService.posts().length) {
      this.feedService.resetFeed();
      this.feedService.loadFeedPosts(user._id, undefined, undefined, undefined, true, 'for_you');
    }

    this.loadProfileSnapshot(user._id);
    this.loadForumStats();
    this.loadLiveActivities();

    if (resetFeed) {
      this.loadSuggestedConnections(user._id);
      this.loadFollowingState(user._id);
      this.loadTutorialCourses(user.role);
      this.notificationService.loadNotifications();
    }
  }

  private startNotificationPolling(): void {
    if (this.notificationPollingStarted) {
      return;
    }

    this.notificationPollingStarted = true;
    this.notificationService.startPolling(30000);
  }

  private startBackgroundRefresh(): void {
    if (this.backgroundRefreshStarted) {
      return;
    }

    this.backgroundRefreshStarted = true;
    interval(60000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const currentUser = this.user();
        if (!currentUser?._id) {
          return;
        }

        this.loadProfileSnapshot(currentUser._id);
        this.loadForumStats();
        this.loadLiveActivities();
      });
  }

  private loadProfileSnapshot(userId: string): void {
    this.profileService.getProfile(userId, userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => this.profileSnapshot.set(profile),
        error: () => this.profileSnapshot.set(null),
      });
  }

  private loadForumStats(): void {
    this.forumService.getCommunityStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response?.success) {
            this.forumStats.set(response.data);
          }
        },
        error: () => this.forumStats.set(null),
      });
  }

  private loadSuggestedConnections(userId: string): void {
    this.profileService.fetchSuggestedUsers(userId, 8)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (users) => this.suggestedUsers.set(users || []),
        error: () => this.suggestedUsers.set([]),
      });
  }

  private loadFollowingState(userId: string): void {
    this.profileService.getFollowing(userId, 1, 100)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const followingIds = (response.following || []).map((entry) => entry._id);
          this.connectedConnections.set(new Set(followingIds));
        },
        error: () => this.connectedConnections.set(new Set()),
      });
  }

  private loadTutorialCourses(role: UserInterface['role']): void {
    this.tutorialService.getTutorials(role)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (sections) => this.learningCourses.set(this.mapTutorialsToCourses(sections || [])),
        error: () => this.learningCourses.set([]),
      });
  }

  private loadLiveActivities(): void {
    this.dashboardService.getLiveActivityFeed(10)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (!response?.success) {
            return;
          }

          this.liveActivitySummary.set(response.data.summary);
          this.feedService.setLiveActivities((response.data.activities || []).map((activity) => this.mapLiveActivity(activity)));
        },
        error: () => {
          this.liveActivitySummary.set(null);
          this.feedService.setLiveActivities([]);
        },
      });
  }

  private mapTutorialsToCourses(sections: Section[]): LearningCourse[] {
    const recentlyWatched = this.getRecentlyWatchedIds();

    return sections
      .flatMap((section) => section.videos.map((video) => ({ section, video })))
      .slice(0, 4)
      .map(({ section, video }) => this.mapVideoToCourse(section, video, recentlyWatched.has(video.id)));
  }

  private mapVideoToCourse(section: Section, video: VideoItem, watched: boolean): LearningCourse {
    return {
      id: video.id,
      title: video.title,
      description: video.description,
      image: video.thumbnail,
      difficulty: this.mapDifficulty(video.difficulty),
      duration: video.duration,
      lessons: 1,
      progress: watched ? 100 : 0,
      category: section.title,
      instructor: 'MarketSpase',
      rating: video.isPopular ? 5 : 4,
      enrolled: video.views,
    };
  }

  private mapDifficulty(value: string): 'Beginner' | 'Intermediate' | 'Advanced' {
    if (value === 'advanced') return 'Advanced';
    if (value === 'intermediate') return 'Intermediate';
    return 'Beginner';
  }

  private getRecentlyWatchedIds(): Set<string> {
    try {
      const raw = localStorage.getItem('recentlyWatched');
      if (!raw) {
        return new Set<string>();
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return new Set<string>();
      }

      return new Set(parsed.map((entry) => String(entry.id)));
    } catch {
      return new Set<string>();
    }
  }

  private mapLiveActivity(activity: DashboardLiveActivity): FeedLiveActivity {
    return {
      id: activity.id,
      type: activity.type as FeedLiveActivity['type'],
      author: activity.author,
      authorId: activity.authorId,
      avatar: activity.avatar,
      message: activity.message,
      time: this.feedService.formatTime(activity.createdAt),
      actionUrl: activity.actionUrl,
      postId: activity.type === 'post' ? activity.id.replace('feed:', '') : undefined,
      postContent: activity.title,
    };
  }

  private mapHotTopic(topic: FeedHotTopic, index: number): DashboardTrendingItem {
    return {
      id: `forum:${topic.topic}:${index}`,
      rank: index + 1,
      title: topic.label,
      description: `${topic.threadCount} active discussion${topic.threadCount === 1 ? '' : 's'} in the forum`,
      mentions: topic.engagementScore,
      category: 'Forum',
      trend: 'up',
      kind: 'forum',
      target: topic.topic,
    };
  }

  private mapHashtagTrend(tag: { tag: string; count: number }, index: number): DashboardTrendingItem {
    return {
      id: `hashtag:${tag.tag}:${index}`,
      rank: index + 1,
      title: `#${tag.tag}`,
      description: `${tag.count} community post${tag.count === 1 ? '' : 's'} using this tag`,
      mentions: tag.count,
      category: 'Hashtags',
      trend: 'new',
      kind: 'hashtag',
      target: tag.tag,
    };
  }

  private mapChallengeTrend(challenge: FeedTrendChallenge, index: number): DashboardTrendingItem {
    return {
      id: `challenge:${challenge.tag}:${index}`,
      rank: index + 1,
      title: challenge.title || `#${challenge.tag}`,
      description: challenge.description || `${challenge.postCount} posts joined this challenge`,
      mentions: challenge.totalEngagement || challenge.postCount,
      category: 'Challenges',
      trend: 'up',
      kind: 'challenge',
      target: challenge.tag,
    };
  }

  private mapCreatorSpotlight(entry: CreatorSpotlightEntry): SuggestedConnection {
    return {
      id: entry._id,
      name: entry.displayName || entry.username,
      role: entry.role || 'Community creator',
      avatar: entry.avatar || 'img/avatar.png',
      badge: entry.badge,
      headlineMetric: String(entry.engagementPoints || 0),
      headlineLabel: 'engagement',
      secondaryMetric: String(entry.postCount || 0),
      secondaryLabel: 'posts',
    };
  }

  private mapForumSpotlight(entry: ForumSpotlightEntry): SuggestedConnection {
    return {
      id: entry._id,
      name: entry.displayName || entry.username,
      role: entry.role || 'Forum contributor',
      avatar: entry.avatar || 'img/avatar.png',
      badge: entry.badge,
      headlineMetric: String(entry.engagementPoints || 0),
      headlineLabel: 'engagement',
      secondaryMetric: String((entry.threadCount || 0) + (entry.commentCount || 0)),
      secondaryLabel: 'contributions',
    };
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

  private formatCurrencyCompact(amount: number): string {
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

  private isDashboardTrend(trend: TrendingItem): trend is DashboardTrendingItem {
    return 'kind' in trend && 'target' in trend;
  }

  private formatNairaCompact(amount: number): string {
    if (amount >= 1000000) {
      return `₦${(amount / 1000000).toFixed(1)}M`;
    }

    if (amount >= 1000) {
      return `₦${(amount / 1000).toFixed(1)}K`;
    }

    return `₦${Math.round(amount).toLocaleString()}`;
  }
}
