import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { FeedPost } from '../../community/feeds/feed.service';
import { ApiService } from '@shared/services';

export interface ProfileSocialProfiles {
  website?: string;
  instagram?: string;
  tiktok?: string;
  facebook?: string;
  x?: string;
  youtube?: string;
  linkedin?: string;
}

export interface MarketerPortfolioCampaign {
  _id: string;
  title: string;
  category: string;
  status: string;
  mediaUrl?: string | null;
  thumbnailUrl?: string | null;
  budget: number;
  spentBudget: number;
  totalClicks: number;
  billableClicks: number;
  costPerClick: number;
  createdAt: string | Date;
}

export interface MarketerPortfolioProduct {
  _id: string;
  name: string;
  category: string;
  price: number;
  currency: string;
  image?: string | null;
  purchaseCount: number;
  viewCount: number;
  averageRating: number;
  ratingCount: number;
  isPublished: boolean;
  createdAt: string | Date;
}

export interface PromoterCampaignHighlight {
  _id: string;
  campaignId?: string | null;
  title: string;
  category: string;
  status: string;
  mediaUrl?: string | null;
  thumbnailUrl?: string | null;
  promotionUrl?: string | null;
  upi?: string | null;
  totalClicks: number;
  billableClicks: number;
  earnedAmount: number;
  acceptedAt?: string | Date | null;
}

export interface PromoterProductHighlight {
  _id: string;
  uniqueCode: string;
  productId?: string | null;
  productName: string;
  category: string;
  storeName: string;
  storeLogo?: string | null;
  image?: string | null;
  price: number;
  currency: string;
  clickCount: number;
  conversionCount: number;
  earnings: number;
  conversionRate: number;
  averageOrderValue: number;
  createdAt: string | Date;
}

export interface ProfileUser {
  _id: string;
  uid: string;
  username: string;
  displayName: string;
  avatar: string;
  personalInfo?: {
    biography?: string;
    address?: {
      city?: string;
      country?: string;
    };
    createdAt?: Date;
  };
  professionalInfo?: {
    jobTitle?: string;
    profileHeadline?: string;
    skills?: string[];
    businessProfile?: {
      brandName?: string;
      brandSummary?: string;
      uniqueSellingPoints?: string[];
    };
    socialProfiles?: ProfileSocialProfiles;
  };
  role: 'marketer' | 'promoter' | 'admin';
  rating: number;
  ratingCount: number;
  isVerified: boolean;
  createdAt: Date;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  totalLikes: number;
  totalEngagements?: number;
  isFollowing: boolean;
  isOwnProfile: boolean;
  socialMetrics?: {
    totalEngagements: number;
    feedPosts: number;
    feedComments: number;
    feedShares: number;
    feedSaves: number;
    forumThreads: number;
    forumReplies: number;
    forumLikes: number;
    newFollowers30Days: number;
    profileFollowers: number;
    storeFollowers: number;
    recentPosts30Days: number;
    recentThreads30Days: number;
    recentReplies30Days: number;
  };
  marketerProfile?: {
    businessOverview?: {
      brandName?: string;
      brandSummary?: string;
      uniqueSellingPoints?: string[];
      socialProfiles?: ProfileSocialProfiles;
      primaryStore?: {
        _id: string;
        name: string;
        logo?: string | null;
        category?: string | null;
        storeLink?: string | null;
        isVerified?: boolean;
      } | null;
    };
    storeSummary?: {
      storeCount: number;
      totalProducts: number;
      totalStoreFollowers: number;
      totalViews: number;
      totalSales: number;
      conversionRate: number;
      promoterTraffic: number;
      activeCampaigns: number;
    };
    analytics?: {
      totalCampaigns: number;
      totalCampaignClicks: number;
      totalBillableClicks: number;
      totalCampaignSpend: number;
      totalOrders: number;
      totalSalesAmount: number;
      pendingEscrowAmount: number;
    };
    performance?: {
      periodDays: number;
      recentCampaignsCreated: number;
      recentProductsUploaded: number;
      recentOrders: number;
      recentSalesAmount: number;
    };
    topCampaigns?: MarketerPortfolioCampaign[];
    topProducts?: MarketerPortfolioProduct[];
  } | null;
  promoterProfile?: {
    analytics?: {
      totalAcceptedCampaigns: number;
      totalCampaignClicks: number;
      totalBillableCampaignClicks: number;
      totalCampaignEarnings: number;
      totalAffiliateClicks: number;
      totalAffiliateSales: number;
      totalAffiliateEarnings: number;
    };
    commissionSummary?: {
      totalAttributedSales: number;
      totalCommissionEarned: number;
      pendingCommission: number;
      releasedCommission: number;
    };
    performance?: {
      periodDays: number;
      recentAcceptedCampaigns: number;
      recentAffiliateClicks: number;
      recentAffiliateSales: number;
      recentAffiliateEarnings: number;
      recentAttributedSales: number;
      recentCommissionEarned: number;
    };
    topCampaigns?: PromoterCampaignHighlight[];
    topProductPromotions?: PromoterProductHighlight[];
  } | null;
  badgeProfile?: {
    level: number;
    levelTitle: string;
    experiencePoints: number;
    badgesEarned: number;
    lastBadgeUnlockedAt?: string | null;
  };
  gamificationProfile?: {
    totalExperiencePoints: number;
    currentLevel: number;
    currentLevelTitle: string;
    currentLevelMinExperiencePoints: number;
    nextLevel?: number | null;
    nextLevelTitle?: string | null;
    nextLevelMinExperiencePoints?: number | null;
    experiencePointsToNextLevel: number;
    progressPercent: number;
    totalEvents: number;
    milestonesUnlocked: number;
    badgesUnlocked: number;
    lastActionKey?: string | null;
    lastExperiencePointsAwarded: number;
    lastEventAt?: string | null;
    recentLevelUpAt?: string | null;
    highestLevelReachedAt?: string | null;
    lastMilestoneKey?: string | null;
    lastMilestoneUnlockedAt?: string | null;
  };
}

export interface FollowUser {
  _id: string;
  displayName: string;
  username: string;
  avatar?: string;
}

export interface SuggestedUser {
  _id: string;
  displayName: string;
  username: string;
  avatar?: string;
  isFollowing?: boolean; // optional
}

export interface PaginatedResponse<T> {
  //[key: string]: T[]; // 'followers' or 'following' or 'posts'
  total: number;
  page: number;
  totalPages: number;
  posts?: T[] | undefined; // for posts
  followers?: T[]; // for followers
  following?: T[]; // for following
}

@Injectable()
export class ProfileService {
  private apiService: ApiService = inject(ApiService);
  private baseUrl = 'api/v1/profile';

  // New signals
  suggestedUsers = signal<SuggestedUser[]>([]);
  loadingSuggested = signal(false);

  getProfile(userId: string, currentUserId: string | null, view: 'full' | 'summary' = 'full'): Observable<ProfileUser> {
    const params = new URLSearchParams();
    if (currentUserId) {
      params.set('currentUserId', currentUserId);
    }
    if (view === 'summary') {
      params.set('view', 'summary');
    }

    const queryString = params.toString();
    const url = `${this.baseUrl}/${userId}/profile${queryString ? `?${queryString}` : ''}`;
    return this.apiService.get<ProfileUser>(url);
  }

  getUserPosts(userId: string, page: number = 1, limit: number = 10, currentUserId: string | null = null): Observable<PaginatedResponse<FeedPost>> {
    let url = `${this.baseUrl}/${userId}/posts?page=${page}&limit=${limit}`;
    if (currentUserId) {
      url += `&currentUserId=${currentUserId}`;
    }
    return this.apiService.get<PaginatedResponse<FeedPost>>(url);
  }

  getFollowers(userId: string, page: number = 1, limit: number = 20, currentUserId?: string): Observable<PaginatedResponse<FollowUser>> {
    let url = `${this.baseUrl}/${userId}/followers?page=${page}&limit=${limit}`;
    if (currentUserId) {
      url += `&currentUserId=${currentUserId}`;
    }
    return this.apiService.get<PaginatedResponse<FollowUser>>(url);
  }

  getFollowing(userId: string, page: number = 1, limit: number = 20): Observable<PaginatedResponse<FollowUser>> {
    return this.apiService.get<PaginatedResponse<FollowUser>>(
      `${this.baseUrl}/${userId}/following?page=${page}&limit=${limit}`
    );
  }

  toggleFollow(userId: string, currentUserId: string | null): Observable<{ followed: boolean }> {
    return this.apiService.post<{ followed: boolean }>(`${this.baseUrl}/${userId}/follow`, { currentUserId });
  }

  fetchSuggestedUsers(userId: string, limit = 5): Observable<SuggestedUser[]> {
    this.loadingSuggested.set(true);
    return this.apiService.get<SuggestedUser[]>(
      `${this.baseUrl}/suggested?userId=${userId}&limit=${limit}`
    ).pipe(
      tap({
        next: (users) => {
          this.suggestedUsers.set(users);
          this.loadingSuggested.set(false);
        },
        error: () => this.loadingSuggested.set(false)
      })
    );
  }
  
}
