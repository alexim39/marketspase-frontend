import { Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef, DestroyRef, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, filter, tap } from 'rxjs';

import { ProfileService, ProfileUser, FollowUser, ProfileSocialProfiles } from './services/profile.service';
import { FeedPostCardComponent } from '../community/feeds/feed-post-card/feed-post-card.component';
import { FeedPost, FeedService } from '../community/feeds/feed.service';
import { UserService } from '../common/services/user.service';
import { CommentDialogComponent } from '../community/feeds/comment-dialog/comment-dialog.component';
import { ProfileSkeletonComponent } from './components/profile-skeleton.component';
import { BadgeOverviewPayload, BadgeService, UserBadge } from '../common/services/badge.service';

// Extend FeedPost to include interaction flags (returned by backend)
interface FeedPostWithFlags extends FeedPost {
  isLikedByMe?: boolean;
  isSavedByMe?: boolean;
}

interface ProfileMetricCard {
  label: string;
  value: number;
  icon: string;
  caption: string;
  kind?: 'number' | 'currency' | 'percent';
}

interface SocialLinkItem {
  key: string;
  label: string;
  value: string;
  url: string;
  icon: string;
}

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    FeedPostCardComponent,
    ProfileSkeletonComponent
  ],
  providers: [ProfileService, FeedService],
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
})
export class ProfilePageComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private profileService = inject(ProfileService);
  private feedService = inject(FeedService);
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  private badgeService = inject(BadgeService);

  // Current logged-in user
  currentUser = this.userService.user; // signal

  // Profile data
  profile = signal<ProfileUser | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  badgeOverview = signal<BadgeOverviewPayload | null>(null);
  badgeLoading = signal(false);
  badgeError = signal<string | null>(null);

  // Posts
  posts = signal<FeedPostWithFlags[]>([]);
  postsPage = signal(1);
  postsHasMore = signal(true);
  postsLoading = signal(false);

  // Liked and saved states (local sets for optimistic UI updates)
  likedPosts = signal<Set<string>>(new Set());
  savedPosts = signal<Set<string>>(new Set());

  // Followers/Following lists
  followers = signal<FollowUser[]>([]);
  following = signal<FollowUser[]>([]);
  followersPage = signal(1);
  followingPage = signal(1);
  followersHasMore = signal(true);
  followingHasMore = signal(true);
  loadingFollowers = signal(false);
  loadingFollowing = signal(false);
  followersLoadingMore = signal(false);
  followingLoadingMore = signal(false);

  // Tabs
  activeTabIndex = signal<number>(0);

  activeTab = computed(() => {
    const index = this.activeTabIndex();
    return index === 0 ? 'posts' : index === 1 ? 'followers' : index === 2 ? 'following' : 'badges';
  });

  isMarketerProfile = computed(() => this.profile()?.role === 'marketer');
  isPromoterProfile = computed(() => this.profile()?.role === 'promoter');
  profileHeadline = computed(() => this.profile()?.professionalInfo?.profileHeadline?.trim() || '');
  profileSummary = computed(() => {
    const profile = this.profile();
    if (!profile) {
      return '';
    }

    return profile.marketerProfile?.businessOverview?.brandSummary?.trim()
      || profile.personalInfo?.biography?.trim()
      || 'No bio yet';
  });
  activeSocialLinks = computed(() => {
    const marketerLinks = this.profile()?.marketerProfile?.businessOverview?.socialProfiles;
    const profileLinks = this.profile()?.professionalInfo?.socialProfiles;
    return this.buildSocialLinks(marketerLinks || profileLinks || {});
  });
  overviewMetrics = computed<ProfileMetricCard[]>(() => {
    const profile = this.profile();
    const social = profile?.socialMetrics;
    if (!profile || !social) {
      return [];
    }

    return [
      {
        label: 'Total Engagements',
        value: social.totalEngagements || 0,
        icon: 'bolt',
        caption: 'Feed and forum interactions earned so far',
      },
      {
        label: 'Followers',
        value: profile.followersCount || 0,
        icon: 'groups',
        caption: `${social.newFollowers30Days || 0} new in the last 30 days`,
      },
      {
        label: 'Feed Presence',
        value: social.feedPosts || 0,
        icon: 'dynamic_feed',
        caption: `${social.feedComments || 0} comments and ${social.feedShares || 0} shares`,
      },
      {
        label: 'Forum Activity',
        value: social.forumThreads || 0,
        icon: 'forum',
        caption: `${social.forumReplies || 0} replies contributed`,
      },
    ];
  });
  roleMetrics = computed<ProfileMetricCard[]>(() => {
    const profile = this.profile();
    if (!profile) {
      return [];
    }

    if (profile.role === 'marketer' && profile.marketerProfile) {
      const analytics = profile.marketerProfile.analytics;
      const performance = profile.marketerProfile.performance;
      const storeSummary = profile.marketerProfile.storeSummary;

      return [
        {
          label: 'Campaign Clicks',
          value: analytics?.totalCampaignClicks || 0,
          icon: 'ads_click',
          caption: `${analytics?.totalBillableClicks || 0} billable clicks across campaigns`,
        },
        {
          label: 'Sales Volume',
          value: analytics?.totalSalesAmount || 0,
          icon: 'payments',
          caption: `${analytics?.totalOrders || 0} paid storefront orders`,
          kind: 'currency',
        },
        {
          label: 'Store Reach',
          value: storeSummary?.totalViews || 0,
          icon: 'storefront',
          caption: `${storeSummary?.totalStoreFollowers || 0} store followers`,
        },
        {
          label: '30-Day Output',
          value: performance?.recentCampaignsCreated || 0,
          icon: 'trending_up',
          caption: `${performance?.recentProductsUploaded || 0} products uploaded recently`,
        },
      ];
    }

    if (profile.role === 'promoter' && profile.promoterProfile) {
      const analytics = profile.promoterProfile.analytics;
      const performance = profile.promoterProfile.performance;
      const commission = profile.promoterProfile.commissionSummary;

      return [
        {
          label: 'Campaign Clicks',
          value: analytics?.totalCampaignClicks || 0,
          icon: 'ads_click',
          caption: `${analytics?.totalAcceptedCampaigns || 0} accepted ad campaigns`,
        },
        {
          label: 'Affiliate Clicks',
          value: analytics?.totalAffiliateClicks || 0,
          icon: 'touch_app',
          caption: `${analytics?.totalAffiliateSales || 0} attributed sales so far`,
        },
        {
          label: 'Earned Commissions',
          value: commission?.totalCommissionEarned || 0,
          icon: 'savings',
          caption: `${commission?.pendingCommission || 0} still pending release`,
          kind: 'currency',
        },
        {
          label: '30-Day Momentum',
          value: performance?.recentAffiliateClicks || 0,
          icon: 'insights',
          caption: `${performance?.recentCommissionEarned || 0} commission earned this period`,
        },
      ];
    }

    return [];
  });

  badgeLevelSummary = computed(() => {
    const gamificationProfile = this.badgeOverview()?.gamificationProfile || this.profile()?.gamificationProfile;
    if (gamificationProfile) {
      return {
        level: gamificationProfile.currentLevel,
        levelTitle: gamificationProfile.currentLevelTitle,
        experiencePoints: gamificationProfile.totalExperiencePoints,
        badgesEarned: gamificationProfile.badgesUnlocked,
        nextLevel: gamificationProfile.nextLevel,
        experiencePointsToNextLevel: gamificationProfile.experiencePointsToNextLevel,
        progressPercent: gamificationProfile.progressPercent,
      };
    }

    return this.badgeOverview()?.badgeProfile || this.profile()?.badgeProfile || null;
  });
  featuredBadges = computed(() => this.badgeOverview()?.featuredBadges || []);
  nextBadges = computed(() => this.badgeOverview()?.nextBadges || []);

  followersFetched = signal(false);
  followingFetched = signal(false);

  // Infinite scroll anchors
  @ViewChild('scrollAnchor') scrollAnchor!: ElementRef;
  @ViewChild('followersScrollAnchor') followersScrollAnchor!: ElementRef;
  @ViewChild('followingScrollAnchor') followingScrollAnchor!: ElementRef;

  private postsObserver: IntersectionObserver | null = null;
  private followersObserver: IntersectionObserver | null = null;
  private followingObserver: IntersectionObserver | null = null;
  private readonly compactNumberFormatter = new Intl.NumberFormat('en-NG', {
    notation: 'compact',
    maximumFractionDigits: 1,
  });
  private readonly currencyFormatter = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  });

  constructor() {
    // Effect to load followers/following when tab changes
    effect(() => {
      const tab = this.activeTab();
      const profile = this.profile();
      if (!profile) return;

      if (tab === 'followers' && !this.followersFetched() && !this.loadingFollowers()) {
        this.loadFollowers(true);
      } else if (tab === 'following' && !this.followingFetched() && !this.loadingFollowing()) {
        this.loadFollowing(true);
      }
    });
  }

  ngOnInit(): void {
    // Listen to route params and load the appropriate profile
    this.route.paramMap
      .pipe(
        switchMap(params => {
          const userId = params.get('id');
          const currentUserId = this.currentUser()?._id;
          
          // Case 1: We have an :id parameter – view that user's profile
          if (userId) {
            // Validate MongoDB ObjectId format
            if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
              // Invalid ID – redirect to current user's profile or home
              if (currentUserId) {
                this.router.navigate(['/profile', currentUserId]);
              } else {
                this.router.navigate(['/']);
              }
              return []; // stop the stream
            }
            return this.profileService.getProfile(userId, currentUserId ?? '');
          }
          
          // Case 2: No :id parameter – load the current user's profile
          if (!currentUserId) {
            // Not logged in – redirect to home
            this.router.navigate(['/']);
            return [];
          }
          return this.profileService.getProfile(currentUserId, currentUserId);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (profile) => {
          if (profile) {
            this.profile.set(profile);
            this.loading.set(false);
            this.loadPosts(true); // load first page of posts
            this.loadBadgeOverview(profile._id);
          }
        },
        error: (err) => {
          this.error.set('Failed to load profile');
          this.loading.set(false);
        }
      });
  }

  ngOnDestroy(): void {
    this.postsObserver?.disconnect();
    this.followersObserver?.disconnect();
    this.followingObserver?.disconnect();
  }

  // ---------- Posts ----------
  loadPosts(reset = false): void {
    const profile = this.profile();
    if (!profile || this.postsLoading() || (!reset && !this.postsHasMore())) return;

    this.postsLoading.set(true);
    const page = reset ? 1 : this.postsPage();
    this.profileService.getUserPosts(profile._id, page).subscribe({
      next: (res) => {
        const newPosts = (res.posts || []) as FeedPostWithFlags[];
        
        if (reset) {
          this.posts.set(newPosts);
          this.postsPage.set(2);
          this.updateLikedSavedSets(newPosts, reset);
        } else {
          this.posts.update(prev => [...prev, ...newPosts]);
          this.postsPage.update(p => p + 1);
          this.updateLikedSavedSets(newPosts, false);
        }
        this.postsHasMore.set(res.page < res.totalPages);
        this.postsLoading.set(false);
        this.setupPostsInfiniteScroll();
      },
      error: () => {
        this.postsLoading.set(false);
        this.snackBar.open('Failed to load posts', 'Dismiss', { duration: 3000 });
      }
    });
  }

  private updateLikedSavedSets(posts: FeedPostWithFlags[], replace: boolean = true): void {
    if (replace) {
      this.likedPosts.set(new Set());
      this.savedPosts.set(new Set());
    }
    const likedSet = replace ? new Set<string>() : new Set(this.likedPosts());
    const savedSet = replace ? new Set<string>() : new Set(this.savedPosts());

    for (const post of posts) {
      if (post.isLikedByMe) {
        likedSet.add(post._id);
      }
      if (post.isSavedByMe) {
        savedSet.add(post._id);
      }
    }
    this.likedPosts.set(likedSet);
    this.savedPosts.set(savedSet);
  }

  private setupPostsInfiniteScroll(): void {
    if (!this.scrollAnchor) return;
    if (this.postsObserver) this.postsObserver.disconnect();

    this.postsObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && this.postsHasMore() && !this.postsLoading()) {
        this.loadPosts();
      }
    }, { threshold: 0.5 });

    this.postsObserver.observe(this.scrollAnchor.nativeElement);
  }

  // ---------- Followers ----------
  loadFollowers(reset = false): void {
    const profile = this.profile();
    if (!profile || this.loadingFollowers() || (!reset && !this.followersHasMore())) return;

    const loadMore = !reset && this.followers().length > 0;
    if (loadMore) {
      this.followersLoadingMore.set(true);
    } else {
      this.loadingFollowers.set(true);
      this.followers.set([]);
      this.followersPage.set(1);
      this.followersHasMore.set(true);
    }

    const page = reset ? 1 : this.followersPage();
    this.profileService.getFollowers(profile._id, page, 20).subscribe({
      next: (res) => {
        // Check if res is an array (unwrapped) or an object with followers property
        let newFollowers: FollowUser[] = [];
        if (Array.isArray(res)) {
          newFollowers = res;
          // If unwrapped, we don't have pagination info – assume all loaded
          this.followersHasMore.set(false);
        } else {
          newFollowers = (res as any).followers || [];
          this.followersHasMore.set((res as any).page < (res as any).totalPages);
        }
        
        if (reset || page === 1) {
          this.followers.set(newFollowers);
        } else {
          this.followers.update(prev => [...prev, ...newFollowers]);
        }
        
        this.followersPage.update(p => p + 1);
        this.loadingFollowers.set(false);
        this.followersLoadingMore.set(false);
        this.setupFollowersInfiniteScroll();
        this.followersFetched.set(true);
      },
      error: () => {
        this.loadingFollowers.set(false);
        this.followersLoadingMore.set(false);
        this.snackBar.open('Failed to load followers', 'Dismiss', { duration: 3000 });
      }
    });
    
  }

  private setupFollowersInfiniteScroll(): void {
    if (!this.followersScrollAnchor) return;
    if (this.followersObserver) this.followersObserver.disconnect();

    this.followersObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && this.followersHasMore() && !this.followersLoadingMore()) {
        this.loadFollowers();
      }
    }, { threshold: 0.5 });

    this.followersObserver.observe(this.followersScrollAnchor.nativeElement);
  }

  // ---------- Following ----------
  loadFollowing(reset = false): void {
    const profile = this.profile();
    if (!profile || this.loadingFollowing() || (!reset && !this.followingHasMore())) return;

    const loadMore = !reset && this.following().length > 0;
    if (loadMore) {
      this.followingLoadingMore.set(true);
    } else {
      this.loadingFollowing.set(true);
      this.following.set([]);
      this.followingPage.set(1);
      this.followingHasMore.set(true);
    }

    const page = reset ? 1 : this.followingPage();
    this.profileService.getFollowing(profile._id, page, 20).subscribe({
      next: (res) => {
        let newFollowing: FollowUser[] = [];
        if (Array.isArray(res)) {
          newFollowing = res;
          this.followingHasMore.set(false);
        } else {
          newFollowing = (res as any).following || [];
          this.followingHasMore.set((res as any).page < (res as any).totalPages);
        }
        if (reset || page === 1) {
          this.following.set(newFollowing);
        } else {
          this.following.update(prev => [...prev, ...newFollowing]);
        }
        this.followingPage.update(p => p + 1);
        this.loadingFollowing.set(false);
        this.followingLoadingMore.set(false);
        this.followingFetched.set(true);
        this.setupFollowingInfiniteScroll();
      },
      error: () => {
        this.loadingFollowing.set(false);
        this.followingLoadingMore.set(false);
        this.snackBar.open('Failed to load following', 'Dismiss', { duration: 3000 });
      }
    });
  }

  private setupFollowingInfiniteScroll(): void {
    if (!this.followingScrollAnchor) return;
    if (this.followingObserver) this.followingObserver.disconnect();

    this.followingObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && this.followingHasMore() && !this.followingLoadingMore()) {
        this.loadFollowing();
      }
    }, { threshold: 0.5 });

    this.followingObserver.observe(this.followingScrollAnchor.nativeElement);
  }

  // ---------- Actions ----------
  trackBadge(_: number, badge: UserBadge): string {
    return badge.id;
  }

  trackMetric(_: number, metric: ProfileMetricCard): string {
    return metric.label;
  }

  trackSocialLink(_: number, link: SocialLinkItem): string {
    return link.key;
  }

  formatMetricValue(metric: ProfileMetricCard): string {
    if (metric.kind === 'currency') {
      return this.currencyFormatter.format(metric.value || 0);
    }

    if (metric.kind === 'percent') {
      return `${metric.value || 0}%`;
    }

    return this.compactNumberFormatter.format(metric.value || 0);
  }

  toggleFollow(): void {
    const profile = this.profile();
    if (!profile || profile.isOwnProfile) return;

    const currentUserId = this.currentUser()?._id;
    this.profileService.toggleFollow(profile._id, currentUserId ?? '').subscribe({
      next: (res) => {
        this.profile.update(p => {
          if (!p) return p;
          return {
            ...p,
            isFollowing: res.followed,
            followersCount: res.followed ? p.followersCount + 1 : p.followersCount - 1,
          };
        });
        this.snackBar.open(res.followed ? 'Followed' : 'Unfollowed', 'OK', { duration: 2000 });
      },
      error: () => {
        this.snackBar.open('Action failed', 'Dismiss', { duration: 3000 });
      }
    });
  }

  reloadBadges(): void {
    const userId = this.profile()?._id;
    if (userId) {
      this.loadBadgeOverview(userId);
    }
  }

  private loadBadgeOverview(userId: string): void {
    if (!userId) {
      return;
    }

    this.badgeLoading.set(true);
    this.badgeService.loadOverview(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (!response?.success) {
            this.badgeError.set('We could not load badges right now.');
            this.badgeLoading.set(false);
            return;
          }

          this.badgeOverview.set(response.data);
          this.badgeError.set(null);
          this.badgeLoading.set(false);
        },
        error: () => {
          this.badgeError.set('We could not load badges right now.');
          this.badgeLoading.set(false);
        }
      });
  }

  // Edit profile (navigate to settings)
  editProfile(): void {
    this.router.navigate(['/dashboard/settings/account']);
  }

  // View another profile
  viewProfile(userId: string): void {
    this.router.navigate(['/dashboard/profile', userId]);
  }

  // ---------- Post interactions ----------
  onLike(post: FeedPostWithFlags): void {
    const userId = this.currentUser()?._id;
    if (!userId) {
      this.snackBar.open('You must be logged in', 'OK', { duration: 2000 });
      return;
    }

    const isLiked = this.likedPosts().has(post._id);
    if (isLiked) {
      this.likedPosts.update(set => {
        const newSet = new Set(set);
        newSet.delete(post._id);
        return newSet;
      });
      post.likeCount = (post.likeCount || 0) - 1;
      post.isLikedByMe = false;
    } else {
      this.likedPosts.update(set => {
        const newSet = new Set(set);
        newSet.add(post._id);
        return newSet;
      });
      post.likeCount = (post.likeCount || 0) + 1;
      post.isLikedByMe = true;
    }

    this.feedService.toggleLike(post, userId).subscribe({
      error: () => {
        // Revert on error
        if (isLiked) {
          this.likedPosts.update(set => {
            const newSet = new Set(set);
            newSet.add(post._id);
            return newSet;
          });
          post.likeCount = (post.likeCount || 0) + 1;
          post.isLikedByMe = true;
        } else {
          this.likedPosts.update(set => {
            const newSet = new Set(set);
            newSet.delete(post._id);
            return newSet;
          });
          post.likeCount = (post.likeCount || 0) - 1;
          post.isLikedByMe = false;
        }
        this.snackBar.open('Failed to update like', 'OK', { duration: 2000 });
      }
    });
  }

  onSave(postId: string): void {
    const userId = this.currentUser()?._id;
    if (!userId) {
      this.snackBar.open('You must be logged in', 'OK', { duration: 2000 });
      return;
    }

    const post = this.posts().find(p => p._id === postId);
    const isSaved = this.savedPosts().has(postId);

    if (isSaved) {
      this.savedPosts.update(set => {
        const newSet = new Set(set);
        newSet.delete(postId);
        return newSet;
      });
      if (post) post.isSavedByMe = false;
    } else {
      this.savedPosts.update(set => {
        const newSet = new Set(set);
        newSet.add(postId);
        return newSet;
      });
      if (post) post.isSavedByMe = true;
    }

    this.feedService.toggleSave(postId, userId).subscribe({
      error: () => {
        // Revert on error
        if (isSaved) {
          this.savedPosts.update(set => {
            const newSet = new Set(set);
            newSet.add(postId);
            return newSet;
          });
          if (post) post.isSavedByMe = true;
        } else {
          this.savedPosts.update(set => {
            const newSet = new Set(set);
            newSet.delete(postId);
            return newSet;
          });
          if (post) post.isSavedByMe = false;
        }
        this.snackBar.open('Failed to update save', 'OK', { duration: 2000 });
      }
    });
  }

  onComment(postId: string): void {
    this.dialog.open(CommentDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'comment-dialog-panel',
      disableClose: true,
      data: { postId }
    });
  }

  onShare(post: FeedPostWithFlags): void {
    const userId = this.currentUser()?._id;
    if (!userId) {
      this.snackBar.open('You must be logged in', 'OK', { duration: 2000 });
      return;
    }

    if (navigator.share) {
      navigator.share({
        title: `${post.author?.displayName || 'User'} on MarketSpase`,
        text: post.content,
        url: `${window.location.origin}/feed/${post._id}`
      }).catch(() => this.copyPostLink(post._id));
    } else {
      this.copyPostLink(post._id);
    }

    this.feedService.sharePost(post._id, userId).subscribe({
      error: () => {
        this.snackBar.open('Failed to record share', 'OK', { duration: 2000 });
      }
    });
  }

  private copyPostLink(postId: string): void {
    const url = `${window.location.origin}/feed/${postId}`;
    navigator.clipboard.writeText(url).then(() => {
      this.snackBar.open('Link copied to clipboard!', 'OK', { duration: 2000 });
    });
  }

  onHashtagClick(hashtag: string): void {
    this.router.navigate(['/dashboard/community/feeds'], { queryParams: { tag: hashtag } });
  }

  private buildSocialLinks(profiles: ProfileSocialProfiles | Record<string, string | undefined>): SocialLinkItem[] {
    const platformMeta: Record<string, { label: string; icon: string; baseUrl?: string }> = {
      website: { label: 'Website', icon: 'language' },
      instagram: { label: 'Instagram', icon: 'photo_camera', baseUrl: 'https://instagram.com/' },
      tiktok: { label: 'TikTok', icon: 'smart_display', baseUrl: 'https://www.tiktok.com/@' },
      facebook: { label: 'Facebook', icon: 'thumb_up', baseUrl: 'https://facebook.com/' },
      x: { label: 'X', icon: 'alternate_email', baseUrl: 'https://x.com/' },
      youtube: { label: 'YouTube', icon: 'play_circle', baseUrl: 'https://youtube.com/' },
      linkedin: { label: 'LinkedIn', icon: 'badge', baseUrl: 'https://linkedin.com/in/' },
    };

    return Object.entries(profiles)
      .map(([key, rawValue]) => {
        const value = String(rawValue || '').trim();
        const meta = platformMeta[key];
        if (!value || !meta) {
          return null;
        }

        return {
          key,
          label: meta.label,
          value,
          url: this.normalizeSocialUrl(value, meta.baseUrl),
          icon: meta.icon,
        } satisfies SocialLinkItem;
      })
      .filter((item): item is SocialLinkItem => Boolean(item));
  }

  private normalizeSocialUrl(value: string, baseUrl?: string): string {
    if (/^https?:\/\//i.test(value)) {
      return value;
    }

    if (!baseUrl) {
      return `https://${value.replace(/^\/+/, '')}`;
    }

    const cleanValue = value.replace(/^@/, '').replace(/^\/+/, '');
    return `${baseUrl}${cleanValue}`;
  }
}
