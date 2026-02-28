// main-content.component.ts (Updated)
import { Component, inject, signal, computed, DestroyRef, effect, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../../common/services/user.service';
import { DashboardService } from './../dashboard.service';
import { DeviceService } from '../../../../../shared-services/src/public-api';

// Import child components
import { DashboardHeaderComponent } from './components/dashboard-header/dashboard-header.component';
import { CommunityFeedComponent } from './components/community-feed/community-feed.component';
import { PerformanceMetricsComponent } from './components/performance-metrics/performance-metrics.component';
import { QuickStatsComponent } from './components/quick-stats/quick-stats.component';
import { Activity, RecentActivityComponent } from './components/recent-activity/recent-activity.component';
import { TrendingSectionComponent } from './components/trending-section/trending-section.component';
import { ConnectionsSectionComponent } from './components/connections-section/connections-section.component';
import { LearningSectionComponent } from './components/learning-section/learning-section.component';
import { TestimonialsComponent } from '../testimonial/testimonial.component';

// Import banner components
import { ProfileNotifierBannerComponent } from './notification-banner/profiile-notifier/profile-notifier-banner.component';
import { PromoBannerComponent } from './notification-banner/promo/promo-banner.component';
import { GeneralMsgNotifierBannerComponent } from './notification-banner/general-msg-notifier/general-msg-notifier-banner.component';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { FeedPost, FeedService } from '../../community/feeds/feed.service';
import { CommunityFeedService } from './components/community-feed/community-feed.service';


interface DashboardStat {
  icon: string;
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down';
  color: string;
  subtitle?: string;
}

interface CampaignSummary {
  active: number;
  completed: number;
  totalBudget: number;
  spentBudget: number;
  totalPromoters: number;
}

interface PromotionSummary {
  total: number;
  accepted: number;
  submitted: number;
  validated: number;
  paid: number;
  totalEarnings: number;
  pendingEarnings: number;
  availableEarnings: number;
}

export interface CommunityPost {
  id: string;
  author: string;
  role: string;
  avatar?: string;
  content: string;
  type: 'earnings' | 'campaign' | 'question' | 'tip' | 'achievement' | 'milestone';
  earnings?: number;
  campaignName?: string;
  budget?: number;
  progress?: number;
  milestone?: string;
  time: string;
  fullTime: string; // Make sure this is included
  likes: number;
  comments: number;
  shares: number;
  badge?: 'top-promoter' | 'verified' | 'rising-star';
  isOnline?: boolean;
  hashtags?: string[];
  recentComments?: Array<{
    id: string;
    author: string;
    content: string;
  }>;
  isFeatured?: boolean;
  createdAt: Date;
}

interface TrendingItem {
  id: string;
  rank: number;
  title: string;
  description: string;
  mentions: number;
}

interface SuggestedConnection {
  id: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  completed: number;
}

interface LearningCourse {
  id: string;
  title: string;
  description: string;
  image: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  lessons: number;
  progress: number;
}

interface CommunityStats {
  connections: number;
  likes: number;
  posts: number;
  comments: number;
}

@Component({
  selector: 'main-container',
  imports: [
    CommonModule,
    // Child components
    DashboardHeaderComponent,
    CommunityFeedComponent,
    PerformanceMetricsComponent,
    QuickStatsComponent,
    RecentActivityComponent,
    TrendingSectionComponent,
    ConnectionsSectionComponent,
    LearningSectionComponent,
    // Existing components
    TestimonialsComponent,
    ProfileNotifierBannerComponent,
    PromoBannerComponent,
    GeneralMsgNotifierBannerComponent,
    MatIconModule
  ],
  providers: [FeedService, CommunityFeedService],
  templateUrl: './main-content.component.html',
  styleUrls: ['./main-content.component.scss'],
})
export class DashboardMainContainer {

  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly deviceService = inject(DeviceService);
  private userService = inject(UserService);
  public user = this.userService.user;
   private feedService = inject(FeedService);
   private communityFeedService = inject(CommunityFeedService);

   commactivityStats = this.communityFeedService.activityStats;


  public router = inject(Router);
  private dialog = inject(MatDialog);

    // Get data from feed service
  private feedPosts = this.feedService.posts;
  // likedPosts = this.feedService.likedPosts;
   likedPosts: WritableSignal<Set<string>> = signal(new Set<string>());
  // savedPosts = this.feedService.savedPosts;
  savedPosts: WritableSignal<Set<string>> = signal(new Set<string>());
  trendingHashtags = this.feedService.trendingHashtags;
  liveActivities = this.feedService.liveActivities;
  activityStats = this.feedService.activityStats;


  constructor() {
    
    // Load feed data when component initializes
    effect(() => {
      const currentUser = this.user();
      if (currentUser?._id) {
        this.feedService.loadFeedPosts(currentUser._id, 'all');
      } 
    });
  
  }

  likedPostsSet = computed(() => this.likedPosts());
  savedPostsSet = computed(() => this.savedPosts());

  // === Existing Signals ===
  //communityNotifications = signal(3);
  unreadMessages = signal(2);
  unreadNotifications = signal(5);
  viewPeriod = signal<'weekly' | 'monthly' | 'yearly'>('weekly');
  trendingItems = signal<TrendingItem[]>([]); // Your existing trends
  suggestedConnections = signal<SuggestedConnection[]>([]); // Your existing connections
  learningCourses = signal<LearningCourse[]>([]); // Your existing courses

  // === NEW SIGNALS (Add these) ===
  followingTrends = signal<Set<string>>(new Set());
  savedCourses = signal<Set<string>>(new Set());
  pendingConnections = signal<Set<string>>(new Set());
  connectedConnections = signal<Set<string>>(new Set());
  trendingCategories = signal<string[]>(['All', 'Marketing', 'Promotion', 'Earnings', 'Technology']);
  activeTrendingCategory = signal<string>('All');
  connectionFilters = signal<string[]>(['All', 'Marketers', 'Promoters', 'Top Rated']);
  activeConnectionFilter = signal<string>('All');

  // === Computed Properties ===
  isMobile = computed(() => {
    return this.deviceService.deviceState().isMobile;
  });

  communityStats = computed((): CommunityStats => {
    return {
      connections: 24,
      likes: 156,
      posts: 8,
      comments: 42
    };
  });

  campaignSummary = computed((): CampaignSummary => {
    const userData = this.user();
    if (!userData?.campaigns) {
      return { active: 0, completed: 0, totalBudget: 0, spentBudget: 0, totalPromoters: 0 };
    }

    const activeCampaigns = userData.campaigns.filter(c => c.status === 'active');
    const completedCampaigns = userData.campaigns.filter(c => c.status === 'completed' || c.status === 'expired' || c.status === 'paused');
    const totalBudget = userData.campaigns.reduce((sum, c) => sum + c.budget, 0);
    const spentBudget = userData.campaigns.reduce((sum, c) => sum + c.spentBudget, 0);
    const totalPromoters = userData.campaigns.reduce((sum, c) => sum + c.currentPromoters, 0);

    return {
      active: activeCampaigns.length,
      completed: completedCampaigns.length,
      totalBudget,
      spentBudget,
      totalPromoters
    };
  });

  promotionSummary = computed((): PromotionSummary => {
    const userData = this.user();
    if (!userData?.promotion) {
      return { 
        total: 0, 
        accepted: 0, 
        submitted: 0, 
        validated: 0, 
        paid: 0, 
        totalEarnings: 0, 
        pendingEarnings: 0, 
        availableEarnings: 0 
      };
    }

    const promotions = userData.promotion;
    const wallet = userData.wallets?.promoter;
    
    const accepted = promotions.filter(p => p.status === 'accepted').length;
    const submitted = promotions.filter(p => p.status === 'submitted').length;
    const validated = promotions.filter(p => p.status === 'validated').length;
    const paid = promotions.filter(p => p.status === 'paid').length;

    const totalEarnings = promotions
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + (p.payoutAmount ?? 0), 0);
    
    const pendingEarnings = promotions
      .filter(p => p.status === 'validated')
      .reduce((sum, p) => sum + (p.payoutAmount ?? 0), 0);

    return {
      total: promotions.length,
      accepted,
      submitted,
      validated,
      paid,
      totalEarnings,
      pendingEarnings,
      availableEarnings: wallet?.balance || 0
    };
  });

  dashboardStats = computed((): DashboardStat[] => {
    const userData = this.user();
    if (!userData) return [];

    if (userData.role === 'marketer') {
      const summary = this.campaignSummary();
      const wallet = userData.wallets?.marketer;
      
      return [
        {
          icon: 'campaign',
          label: 'Active Campaigns',
          value: summary.active.toString(),
          change: '+2',
          trend: 'up',
          color: '#667eea',
          subtitle: `${summary.totalPromoters} promoters`
        },
        {
          icon: 'account_balance_wallet',
          label: 'Campaign Budget',
          value: `₦${(summary.totalBudget / 1000).toFixed(0)}K`,
          change: '+8',
          trend: 'up',
          color: '#ff9800',
          subtitle: `₦${(summary.spentBudget / 1000).toFixed(0)}K spent`
        },
        {
          icon: 'savings',
          label: 'Available Balance',
          value: `₦${((wallet?.balance || 0) / 1000).toFixed(0)}K`,
          color: '#4caf50',
          subtitle: `₦${((wallet?.reserved || 0) / 1000).toFixed(0)}K reserved`
        },
      ];
    } else {
      const summary = this.promotionSummary();
      const wallet = userData.wallets?.promoter;
      
      return [
        {
          icon: 'monetization_on',
          label: 'Available Earnings',
          value: `₦${summary.availableEarnings}`,
          color: '#4caf50',
          subtitle: `₦${summary.pendingEarnings} pending`
        },
        {
          icon: 'assignment_turned_in',
          label: 'Completed Promotions',
          value: summary.paid.toString(),
          change: '+3',
          trend: 'up',
          color: '#2196f3',
          subtitle: `${summary.total} total promotions`
        },
        {
          icon: 'pending_actions',
          label: 'Pending Review',
          value: summary.submitted.toString(),
          change: '+1',
          trend: 'up',
          color: '#ff9800',
          subtitle: `${summary.validated} validated`
        },
        {
          icon: 'star',
          label: 'Rating',
          value: userData.rating?.toString() || '0',
          change: '+0.2',
          trend: 'up',
          color: '#ff5722',
          subtitle: `0 reviews`
        }
      ];
    }
  });

  recentActivity = computed((): Activity[] => {
    const userData = this.user();
    if (!userData) return [];
    
    const transactions: Activity[] = [];
    
    if (userData.wallets?.marketer?.transactions) {
      transactions.push(...userData.wallets.marketer.transactions.map(t => ({
        id: t._id || `marketer-${Date.now()}`,
        description: t.description || 'Transaction',
        amount: t.amount || 0,
        type: (t.type || ((t.amount ?? 0) > 0 ? 'credit' : 'debit')) as 'credit' | 'debit',
        createdAt: t.createdAt || new Date(),
        status: (t.status as 'completed' | 'pending' | 'failed') || 'completed',
        walletType: 'marketer' as const,
        _id: t._id,
        category: t.category
      })));
    }
    
    if (userData.wallets?.promoter?.transactions) {
      transactions.push(...userData.wallets.promoter.transactions.map(t => ({
        id: t._id || `promoter-${Date.now()}`,
        description: t.description || 'Transaction',
        amount: t.amount || 0,
        type: (t.type || ((t.amount ?? 0) > 0 ? 'credit' : 'debit')) as 'credit' | 'debit',
        createdAt: t.createdAt || new Date(),
        status: (t.status as 'completed' | 'pending' | 'failed') || 'completed',
        walletType: 'promoter' as const,
        _id: t._id,
        category: t.category
      })));
    }
    
    return transactions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  });

  // === EXISTING METHODS ===
  getCommunityGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning! Ready to grow your business today?';
    if (hour < 17) return 'Good afternoon! How\'s your day going?';
    return 'Good evening! Time to review your progress!';
  }

  getOnlineCount(): string {
    const count = Math.floor(Math.random() * 500) + 100;
    return `${count}+`;
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

  /* openMessages(): void {
    this.router.navigate(['dashboard/messages']);
  } */

 /*  openNotifications(): void {
    this.router.navigate(['dashboard/notifications']);
  }

  openStorefront(): void {
    this.router.navigate(['dashboard/storefront']);
  }

  openPromoterProfile(): void {
    this.router.navigate(['dashboard/profile']);
  }

  openLeaderboard(): void {
    this.router.navigate(['dashboard/leaderboard']);
  } */

  openAdSchool(): void {
    this.router.navigate(['dashboard/learning']);
  }

  setViewPeriod(period: 'weekly' | 'monthly' | 'yearly'): void {
    this.viewPeriod.set(period);
  }

  viewTrending(): void {
    this.router.navigate(['dashboard/trending']);
  }

  connectUser(userId: string): void {
    this.snackBar.open('Connection request sent!', 'OK', { duration: 3000 });
  }

  continueCourse(courseId: string): void {
    this.router.navigate(['dashboard/learning', courseId]);
  }

  isLiked(postId: string): boolean {
    return this.likedPosts().has(postId);
  }

  isSaved(postId: string): boolean {
    return this.savedPosts().has(postId);
  }

  toggleLike(postId: string): void {
    const currentLikes = new Set(this.likedPosts());
    if (currentLikes.has(postId)) {
      currentLikes.delete(postId);
      this.snackBar.open('Post unliked', 'OK', { duration: 2000 });
    } else {
      currentLikes.add(postId);
      this.snackBar.open('Post liked!', 'OK', { duration: 2000 });
    }
    this.likedPosts.set(currentLikes);
  }

  toggleSave(postId: string): void {
    const currentSaved = new Set(this.savedPosts());
    if (currentSaved.has(postId)) {
      currentSaved.delete(postId);
      this.snackBar.open('Post unsaved', 'OK', { duration: 2000 });
    } else {
      currentSaved.add(postId);
      this.snackBar.open('Post saved!', 'OK', { duration: 2000 });
    }
    this.savedPosts.set(currentSaved);
  }

  followTrend(trendId: string): void {
    const following = new Set(this.followingTrends());
    if (following.has(trendId)) {
      following.delete(trendId);
      this.snackBar.open('Unfollowed trend', 'OK', { duration: 2000 });
    } else {
      following.add(trendId);
      this.snackBar.open('Now following this trend', 'OK', { duration: 2000 });
    }
    this.followingTrends.set(following);
  }

  openSettings(): void {
    this.router.navigate(['dashboard/settings']);
  }

  viewAllConnections(): void {
    this.router.navigate(['dashboard/connections']);
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
    this.router.navigate(['dashboard/campaigns']);
  }

  withdrawWallet(): void {
    this.router.navigate(['dashboard/transactions/withdrawal']);
  }

  viewWallet(): void {
    this.router.navigate(['dashboard/transactions']);
  }

  formatCurrency(amount: number): string {
    return `₦${amount.toLocaleString()}`;
  }

  logout(): void {
    this.authService.signOut()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: (error: HttpErrorResponse) => {
          this.snackBar.open('Sign-out failed', 'OK', { duration: 3000 });
        }
      });
  }

  switchUser(role: string): void {
    const roleObject = {
      role,
      userId: this.user()?._id
    };
    
    this.dashboardService.switchUser(roleObject)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            window.location.reload();
          }
        },
        error: (error: HttpErrorResponse) => {
          const errorMessage = error.error?.message || 'Server error occurred, please try again.';
          this.snackBar.open(errorMessage, 'Ok', { duration: 3000 });
        }
      });
  }

  // === NEW METHODS (Add these) ===


  onSaveCourse(courseId: string): void {
    const currentSaved = new Set(this.savedCourses());
    if (currentSaved.has(courseId)) {
      currentSaved.delete(courseId);
      this.snackBar.open('Course removed from saved', 'OK', { duration: 2000 });
    } else {
      currentSaved.add(courseId);
      this.snackBar.open('Course saved for later!', 'OK', { duration: 2000 });
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
    this.snackBar.open('Refreshing connections...', 'OK', { duration: 2000 });
    // In a real app, you would fetch new connections here
  }

  onActivityClick(activity: Activity): void {
    this.router.navigate(['dashboard/transactions'], { 
      queryParams: { transactionId: activity.id } 
    });
  }

  onTrendClick(trend: TrendingItem): void {
    this.router.navigate(['dashboard/trending'], { 
      queryParams: { trend: trend.id } 
    });
  }

  onMessageConnection(connectionId: string): void {
    this.router.navigate(['dashboard/messages'], { 
      queryParams: { userId: connectionId } 
    });
  }

  onProfileClick(connection: SuggestedConnection): void {
    this.router.navigate(['dashboard/profile', connection.id]);
  }

  onPostMenu(postId: string): void {
    console.log('Post menu clicked:', postId);
    // You could implement a menu or modal here
  }

  // Handle view post navigation
  onViewPost(postId: string): void {
    this.router.navigate(['/dashboard/community/post', postId]);
  }

  // Handle hashtag click navigation
  onHashtagClick(tag: string): void {
    this.router.navigate(['/dashboard/community'], { 
      queryParams: { hashtag: tag }
    });
  }

  // Update the onLike method to use the feed service
  onLike(post: CommunityPost): void {
    // Find the original post from feed service
    const originalPost = this.feedPosts().find(p => p._id === post.id);
    if (originalPost) {
      this.feedService.toggleLike(originalPost,  this.user()?._id ?? '').subscribe({
        next: () => {
          // Success message is handled in the service
        },
        error: (error) => {
          this.snackBar.open('Failed to like post', 'OK', { duration: 3000 });
        }
      });
    }
  }

  // Update the onSave method to use the feed service
  onSave(postId: string): void {
    this.feedService.toggleSave(postId, this.user()?._id ?? '').subscribe({
      next: () => {
        // Success message is handled in the service
      },
      error: (error) => {
        this.snackBar.open('Failed to save post', 'OK', { duration: 3000 });
      }
    });
  }

  // Update sharePost to use the feed service
  sharePost(post: CommunityPost): void {
    const originalPost = this.feedPosts().find(p => p._id === post.id);
    if (originalPost) {
      if (navigator.share) {
        navigator.share({
          title: `${post.author} on MarketSpase`,
          text: post.content,
          url: `${window.location.origin}/dashboard/community/post/${post.id}`
        }).catch(() => {
          this.copyToClipboard(post.id);
        });
      } else {
        this.copyToClipboard(post.id);
      }
      
      this.feedService.sharePost(originalPost._id, this.user()?._id ?? '').subscribe();
    }
  }

  private copyToClipboard(postId: string): void {
    const url = `${window.location.origin}/dashboard/community/post/${postId}`;
    navigator.clipboard.writeText(url).then(() => {
      this.snackBar.open('Link copied to clipboard!', 'OK', { duration: 2000 });
    });
  }

  // Update openComments to navigate to the post with comments fragment
  openComments(postId: string): void {
    this.router.navigate(['/dashboard/community/post', postId], {
      fragment: 'comments'
    });
  }
}