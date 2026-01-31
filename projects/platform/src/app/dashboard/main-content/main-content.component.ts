import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../../common/services/user.service';
import { DashboardService } from './../dashboard.service';
import { TestimonialsComponent } from '../testimonial/testimonial.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProfileNotifierBannerComponent } from './notification-banner/profiile-notifier/profile-notifier-banner.component';
import { MatMenuModule } from '@angular/material/menu';
import { DeviceService } from '../../../../../shared-services/src/public-api';
import { PromoBannerComponent } from './notification-banner/promo/promo-banner.component';
import { GeneralMsgNotifierBannerComponent } from './notification-banner/general-msg-notifier/general-msg-notifier-banner.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { TitleCasePipe } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';


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



interface CommunityPost {
  id: string;
  author: string;
  role: string;
  avatar?: string;
  content: string;
  type: 'earnings' | 'campaign' | 'question' | 'tip';
  earnings?: number;
  campaignName?: string;
  budget?: number;
  time: string;
  likes: number;
  comments: number;
  badge?: 'top-promoter' | 'verified' | 'rising-star';
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
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
    TestimonialsComponent,
    ProfileNotifierBannerComponent,
    PromoBannerComponent,
    GeneralMsgNotifierBannerComponent
  ],
  templateUrl: './main-content.component.html',
  styleUrls: ['./main-content.component.scss'],
})
export class DashboardMainContainer {
  public router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly deviceService = inject(DeviceService);

  private userService = inject(UserService);
  public user = this.userService.user;

   isMobile = computed(() => {
    return this.deviceService.deviceState().isMobile;
  });







  private likedPosts = signal<Set<string>>(new Set());
  private savedPosts = signal<Set<string>>(new Set());
  // New social community signals
  communityPosts = signal<CommunityPost[]>([
    {
      id: '1',
      author: 'Sarah Johnson',
      role: 'Top Promoter',
      content: 'Just completed a 5-day campaign for a local restaurant! The engagement was amazing. Pro tip: Post during lunch hours for food-related promotions!',
      type: 'tip',
      time: '2h ago',
      likes: 42,
      comments: 8,
      badge: 'top-promoter'
    },
    {
      id: '2',
      author: 'Mike Chen',
      role: 'Marketer',
      content: 'Looking for promoters interested in tech products. We have new gadgets launching next week! Budget: ₦50,000',
      type: 'campaign',
      campaignName: 'Tech Gadgets Launch',
      budget: 50000,
      time: '4h ago',
      likes: 28,
      comments: 15,
      badge: 'verified'
    },
    {
      id: '3',
      author: 'Priya Sharma',
      role: 'Promoter',
      content: 'Earned ₦15,000 this week! Consistency is key. I post 3 times daily at optimal times.',
      type: 'earnings',
      earnings: 15000,
      time: '1d ago',
      likes: 56,
      comments: 12,
      badge: 'rising-star'
    }
  ]);

  trendingItems = signal<TrendingItem[]>([
    { id: '1', rank: 1, title: 'Festival Campaigns', description: 'Holiday season promotions', mentions: 245 },
    { id: '2', rank: 2, title: 'WhatsApp Reels', description: 'Video content strategies', mentions: 189 },
    { id: '3', rank: 3, title: 'Micro-Influencer', description: 'Building personal brand', mentions: 156 }
  ]);

  suggestedConnections = signal<SuggestedConnection[]>([
    { id: '1', name: 'Alex Turner', role: 'Fashion Marketer', avatar: 'assets/avatars/1.png', rating: 4.8, completed: 42 },
    { id: '2', name: 'Maya Rodriguez', role: 'Lifestyle Promoter', avatar: 'assets/avatars/2.png', rating: 4.9, completed: 67 },
    { id: '3', name: 'David Kim', role: 'Tech Entrepreneur', avatar: 'assets/avatars/3.png', rating: 4.7, completed: 31 }
  ]);

  learningCourses = signal<LearningCourse[]>([
    { 
      id: '1', 
      title: 'WhatsApp Marketing Mastery', 
      description: 'Learn to maximize engagement on WhatsApp status', 
      image: 'assets/courses/1.jpg',
      difficulty: 'Beginner',
      duration: '2h 30m',
      lessons: 12,
      progress: 30
    },
    { 
      id: '2', 
      title: 'Campaign Optimization', 
      description: 'Advanced strategies for better ROI', 
      image: 'assets/courses/2.jpg',
      difficulty: 'Intermediate',
      duration: '3h 45m',
      lessons: 18,
      progress: 0
    }
  ]);

  communityStats = computed((): CommunityStats => {
    return {
      connections: 24,
      likes: 156,
      posts: 8,
      comments: 42
    };
  });

  communityNotifications = signal(3);
  unreadMessages = signal(2);
  unreadNotifications = signal(5);
  viewPeriod = signal<'weekly' | 'monthly' | 'yearly'>('weekly');

  // New methods for social features
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
    this.router.navigate(['dashboard/community/create']);
  }

  openCommunityFeed(): void {
    this.router.navigate(['dashboard/community']);
  }

  openMessages(): void {
    this.router.navigate(['dashboard/messages']);
  }

  openNotifications(): void {
    this.router.navigate(['dashboard/notifications']);
  }

  openStorefront(): void {
    this.router.navigate(['dashboard/storefront']);
  }

  openPromoterProfile(): void {
    this.router.navigate(['dashboard/profile']);
  }

  openAdSchool(): void {
    this.router.navigate(['dashboard/learning']);
  }

  openLeaderboard(): void {
    this.router.navigate(['dashboard/leaderboard']);
  }

  setViewPeriod(period: 'weekly' | 'monthly' | 'yearly'): void {
    this.viewPeriod.set(period);
    // Here you would typically fetch data for the selected period
  }

  viewTrending(): void {
    this.router.navigate(['dashboard/trending']);
  }

  connectUser(userId: string): void {
    // Implement connection logic
    this.snackBar.open('Connection request sent!', 'OK', { duration: 3000 });
  }

  continueCourse(courseId: string): void {
    this.router.navigate(['dashboard/learning', courseId]);
  }

  // Add these methods
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
  this.snackBar.open('Now following this trend', 'OK', { duration: 2000 });
}

openSettings(): void {
  this.router.navigate(['dashboard/settings']);
}

viewAllConnections(): void {
  this.router.navigate(['dashboard/connections']);
}

openComments(postId: string): void {
  // Navigate to post comments or open modal
  this.router.navigate(['dashboard/community', postId]);
}

sharePost(postId: string): void {
  // Implement share functionality
  if (navigator.share) {
    navigator.share({
      title: 'MarketSpase Community Post',
      text: 'Check out this post on MarketSpase!',
      url: `${window.location.origin}/dashboard/community/${postId}`
    });
  } else {
    this.snackBar.open('Link copied to clipboard!', 'OK', { duration: 2000 });
    // Fallback: Copy to clipboard
    navigator.clipboard.writeText(`${window.location.origin}/dashboard/community/${postId}`);
  }
}

// Enhanced recent activity computation
recentActivity = computed(() => {
  const userData = this.user();
  if (!userData) return [];
  
  const transactions = [];
  
  if (userData.wallets?.marketer?.transactions) {
    transactions.push(...userData.wallets.marketer.transactions.map(t => ({
      ...t,
      walletType: 'marketer',
      id: `marketer-${t._id || Date.now()}`,
      type: t.type || ((t.amount ?? 0) > 0 ? 'credit' : 'debit')
    })));
  }
  
  if (userData.wallets?.promoter?.transactions) {
    transactions.push(...userData.wallets.promoter.transactions.map(t => ({
      ...t,
      walletType: 'promoter',
      id: `promoter-${t._id || Date.now()}`,
      type: t.type || ((t.amount ?? 0) > 0 ? 'credit' : 'debit')
    })));
  }
  
  // Sort by date, newest first and take the 5 most recent
  return transactions
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
});




  campaignSummary = computed((): CampaignSummary => {
    const userData = this.user();
    if (!userData?.campaigns) {
      return { active: 0, completed: 0, totalBudget: 0, spentBudget: 0, totalPromoters: 0 };
    }

    //console.log('Calculating campaign summary for user:', userData);

    const activeCampaigns = userData.campaigns.filter(c => c.status === 'active');
    //const completedCampaigns = userData.campaigns.filter(c => c.status === 'completed');
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

    // Calculate earnings from paid promotions
    const totalEarnings = promotions
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + (p.payoutAmount ?? 0), 0);
    
    // Calculate pending earnings (validated but not paid)
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

      //console.log('Dashboard Stats - Marketer:', { summary, wallet });
      
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
        // {
        //   icon: 'trending_up',
        //   label: 'Total Reach',
        //   value: '37K',
        //   change: '+25',
        //   trend: 'up',
        //   color: '#e91e63',
        //   subtitle: 'Last 30 days'
        // }
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
          subtitle: `${ 0 } reviews`
          //subtitle: `${userData.ratingCount || 0} reviews`
        }
      ];
    }
  });

  // recentActivity = computed(() => {
  //   const userData = this.user();
  //   if (!userData) return [];
    
  //   // Combine transactions from both wallets if available
  //   const transactions = [];
    
  //   if (userData.wallets?.marketer?.transactions) {
  //     transactions.push(...userData.wallets.marketer.transactions.map(t => ({
  //       ...t,
  //       walletType: 'marketer'
  //     })));
  //   }
    
  //   if (userData.wallets?.promoter?.transactions) {
  //     transactions.push(...userData.wallets.promoter.transactions.map(t => ({
  //       ...t,
  //       walletType: 'promoter'
  //     })));
  //   }
    
  //   // Sort by date, newest first and take the 5 most recent
  //   return transactions
  //     .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  //     .slice(0, 5);
  // });

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
          //console.error('Sign-out failed:', error.error.message);
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
}