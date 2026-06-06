import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { catchError, finalize, map, Observable, of, tap, throwError } from 'rxjs';
import { ApiService } from '@shared/services';

export interface FeedAuthor {
  _id: string;
  username: string;
  displayName: string;
  avatar: string;
  role: string;
  rating?: number;
  badge?: string;
  isVerified?: boolean;
}

export interface FeedProductSummary {
  productId?: string;
  storeId?: string;
  storeName?: string;
  storeLink?: string;
  name?: string;
  description?: string;
  category?: string;
  price?: number;
  originalPrice?: number;
  currency?: string;
  commissionRate?: number;
  commissionType?: string;
  fixedCommission?: number;
  productUrl?: string;
  mainImage?: string;
}

export interface FeedChallengeSummary {
  tag: string;
  title?: string;
  description?: string;
  rewardLabel?: string;
  startsAt?: string;
  endsAt?: string;
  isOfficial?: boolean;
}

export interface FeedStats {
  postsToday: number;
  activeUsers: number;
  totalEngagement: number;
  topHashtag: string;
}

export interface FeedTrendChallenge {
  tag: string;
  title: string;
  description?: string;
  rewardLabel?: string;
  postCount: number;
  totalEngagement: number;
}

export interface CreatorSpotlightEntry {
  _id: string;
  displayName: string;
  username: string;
  avatar?: string;
  role: string;
  rating?: number;
  badge?: string;
  engagementPoints: number;
  postCount: number;
}

export interface ForumHighlight {
  _id: string;
  title: string;
  content: string;
  author?: FeedAuthor | null;
  tags: string[];
  topicTags: string[];
  category?: string;
  commentCount: number;
  likeCount: number;
  viewCount: number;
  followerCount: number;
  trendingScore: number;
  media?: {
    url: string;
    type: 'image' | 'video' | 'audio';
    originalName?: string;
  } | null;
  mediaItems?: Array<{
    url: string;
    type: 'image' | 'video' | 'audio';
    originalName?: string;
  }>;
  createdAt: string;
  isPinned?: boolean;
}

export interface FeedHotTopic {
  topic: string;
  label: string;
  threadCount: number;
  followerCount: number;
  engagementScore: number;
  latestActivityAt?: string;
}

export interface ForumSpotlightEntry {
  _id: string;
  displayName: string;
  username: string;
  avatar?: string;
  role: string;
  badge?: string;
  threadCount: number;
  commentCount: number;
  engagementPoints: number;
}

export interface FeedPost {
  _id: string;
  author?: FeedAuthor | null;
  content: string;
  source?: 'manual' | 'campaign' | 'product';
  type: 'earnings' | 'campaign' | 'product' | 'story' | 'challenge' | 'question' | 'tip' | 'achievement' | 'milestone';
  earnings?: {
    amount: number;
    currency?: string;
    milestone?: string;
    campaignId?: string;
  };
  campaign?: {
    campaignId?: string;
    name: string;
    budget?: number;
    status?: string;
    progress?: number;
    spentBudget?: number;
    mediaUrl?: string;
    mediaType?: string;
    link?: string;
    category?: string;
    thumbnailUrl?: string;
  };
  product?: FeedProductSummary;
  challenge?: FeedChallengeSummary | null;
  tip?: {
    title?: string;
    category?: string;
    views?: number;
  };
  media?: Array<{
    url: string;
    type: 'image' | 'video' | 'link' | 'document';
    thumbnail?: string;
    altText?: string;
    order?: number;
  }>;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  chatCount: number;
  saveCount?: number;
  isLiked: boolean;
  isSaved: boolean;
  hashtags: Array<{ tag: string }> | string[];
  createdAt: string;
  updatedAt?: string;
  isFeatured?: boolean;
  badge?: string;
  mentions?: any[];
  featuredUntil?: any;
  status?: string;
  settings?: {
    postAnonymously?: boolean;
    disableComments?: boolean;
    allowExternalShare?: boolean;
  };
  phone?: string;
  recommendationScore?: number;
  spotlightScore?: number;
  mediaCount?: number;
  isCarousel?: boolean;
  primaryMediaType?: string | null;
}

export interface Hashtag {
  tag: string;
  count: number;
  posts?: string[];
}

export interface FeedComment {
  _id: string;
  user: {
    _id: string;
    displayName: string;
    username: string;
    avatar: string;
  };
  content: string;
  likeCount: number;
  isLiked: boolean;
  createdAt: string;
  replies?: FeedComment[];
  data: any;
}

export interface CommentsResponse {
  comments: FeedComment[];
  total: number;
  page: number;
  pages: number;
  data?: any;
}

interface CommunityFeedPayload {
  posts: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats?: FeedStats;
  trendingHashtags?: Hashtag[];
  trendingChallenges?: FeedTrendChallenge[];
  creatorSpotlight?: CreatorSpotlightEntry[];
  forumHighlights?: ForumHighlight[];
  hotTopics?: FeedHotTopic[];
  forumSpotlight?: ForumSpotlightEntry[];
  sortMode?: string;
  feedModel?: {
    mode?: string;
    ranker?: string;
    candidateWindow?: number;
    signals?: string[];
  };
}

export interface LiveActivity {
  id: string;
  type: 'like' | 'comment' | 'post' | 'earnings' | 'forum' | 'campaign' | 'product';
  author: string;
  authorId: string;
  avatar?: string;
  message: string;
  time: string;
  postId?: string;
  postContent?: string;
  actionUrl?: string;
}

interface DashboardLiveActivityResponse {
  success?: boolean;
  data?: {
    activities?: Array<Record<string, any>>;
  };
}

const FEED_CONFIG = {
  POSTS_PER_PAGE: 10
} as const;

@Injectable()
export class FeedService {
  private apiService = inject(ApiService);
  private readonly apiUrl = 'api/v1/feed';

  private postsSignal = signal<FeedPost[]>([]);
  private likedPostsSignal = signal<Set<string>>(new Set());
  private savedPostsSignal = signal<Set<string>>(new Set());
  private loadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);
  private hasMoreSignal = signal(true);
  private currentPageSignal = signal(1);
  private trendingHashtagsSignal = signal<Hashtag[]>([]);
  private trendingChallengesSignal = signal<FeedTrendChallenge[]>([]);
  private creatorSpotlightSignal = signal<CreatorSpotlightEntry[]>([]);
  private forumHighlightsSignal = signal<ForumHighlight[]>([]);
  private hotTopicsSignal = signal<FeedHotTopic[]>([]);
  private forumSpotlightSignal = signal<ForumSpotlightEntry[]>([]);
  private liveActivitiesSignal = signal<LiveActivity[]>([]);
  private activityStatsSignal = signal<FeedStats>({
    postsToday: 0,
    activeUsers: 0,
    totalEngagement: 0,
    topHashtag: ''
  });
  private sortModeSignal = signal<'for_you' | 'following' | 'trending' | 'latest'>('for_you');

  public posts = this.postsSignal.asReadonly();
  public likedPosts = this.likedPostsSignal.asReadonly();
  public savedPosts = this.savedPostsSignal.asReadonly();
  public loading = this.loadingSignal.asReadonly();
  public error = this.errorSignal.asReadonly();
  public hasMore = this.hasMoreSignal.asReadonly();
  public trendingHashtags = this.trendingHashtagsSignal.asReadonly();
  public trendingChallenges = this.trendingChallengesSignal.asReadonly();
  public creatorSpotlight = this.creatorSpotlightSignal.asReadonly();
  public forumHighlights = this.forumHighlightsSignal.asReadonly();
  public hotTopics = this.hotTopicsSignal.asReadonly();
  public forumSpotlight = this.forumSpotlightSignal.asReadonly();
  public liveActivities = this.liveActivitiesSignal.asReadonly();
  public activityStats = this.activityStatsSignal.asReadonly();
  public sortMode = this.sortModeSignal.asReadonly();

  public featuredPost = computed(() => {
    const posts = this.postsSignal();
    const featured = posts.find((post) => post.isFeatured);
    if (featured) return featured;

    return [...posts].sort((a, b) => {
      const scoreA = (a.recommendationScore || 0) + a.likeCount + a.commentCount + a.shareCount + (a.chatCount || 0);
      const scoreB = (b.recommendationScore || 0) + b.likeCount + b.commentCount + b.shareCount + (b.chatCount || 0);
      return scoreB - scoreA;
    })[0];
  });

  public regularPosts = computed(() => this.postsSignal().filter((post) => !post.isFeatured));

  setLiveActivities(activities: LiveActivity[]): void {
    this.liveActivitiesSignal.set(activities.slice(0, 6));
  }

  prependLiveActivity(activity: LiveActivity): void {
    this.liveActivitiesSignal.update((activities) => [activity, ...activities.filter((entry) => entry.id !== activity.id)].slice(0, 6));
  }

  loadLiveActivityFeed(limit: number = 6): Observable<LiveActivity[]> {
    const safeLimit = Math.max(1, Math.min(12, Math.trunc(Number(limit) || 6)));
    const params = new HttpParams().set('limit', String(safeLimit));

    return this.apiService
      .get<DashboardLiveActivityResponse>('api/v1/dashboard/stats/live-activity', params, undefined, true)
      .pipe(
        map((response) => {
          const activities = response?.data?.activities;
          return Array.isArray(activities) ? activities.map((activity) => this.normalizeLiveActivity(activity)) : [];
        }),
        tap((activities) => this.setLiveActivities(activities)),
        catchError((error) => {
          console.error('Failed to load feed live activity:', error);
          return of([]);
        })
      );
  }

  resetFeed(): void {
    this.currentPageSignal.set(1);
    this.hasMoreSignal.set(true);
    this.postsSignal.set([]);
    this.loadingSignal.set(false);
    this.errorSignal.set(null);
  }

  resetPagination(): void {
    this.currentPageSignal.set(1);
    this.hasMoreSignal.set(true);
  }

  loadFeedPosts(
    userId: string,
    type?: string,
    hashtag?: string,
    search?: string,
    reset: boolean = false,
    feedType: string = 'for_you',
    limit: number = FEED_CONFIG.POSTS_PER_PAGE
  ): void {
    if (!userId) return;

    if (reset) {
      this.resetPagination();
      this.postsSignal.set([]);
    }

    if (!this.hasMoreSignal() || this.loadingSignal()) {
      return;
    }

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    const params = new HttpParams({
      fromObject: {
        page: this.currentPageSignal().toString(),
        limit: Math.max(1, Math.min(24, Number(limit || FEED_CONFIG.POSTS_PER_PAGE))).toString(),
        userId,
        feedType
      }
    });

    let requestParams = params;
    if (type && type !== 'all') requestParams = requestParams.set('type', type);
    if (hashtag) requestParams = requestParams.set('hashtag', hashtag);
    if (search) requestParams = requestParams.set('search', search);

    this.apiService.get<any>(`${this.apiUrl}/community`, requestParams, undefined, true)
      .pipe(
        map((response) => this.extractCommunityResponse(response)),
        tap((payload) => this.handleCommunityFeed(payload, reset)),
        catchError((error) => this.handleFeedError(error)),
        finalize(() => this.loadingSignal.set(false))
      )
      .subscribe();
  }

  loadMoreFeedPosts(
    userId: string,
    type?: string,
    hashtag?: string,
    search?: string,
    feedType: string = 'for_you'
  ): void {
    this.loadFeedPosts(userId, type, hashtag, search, false, feedType);
  }

  toggleLike(post: FeedPost, userId: string): Observable<any> {
    const wasLiked = this.likedPostsSignal().has(post._id);
    this.updateLikeOptimistically(post._id, !wasLiked);

    return this.apiService.post(`${this.apiUrl}/${post._id}/like`, { userId }, undefined, true).pipe(
      catchError((error) => {
        this.updateLikeOptimistically(post._id, wasLiked);
        this.errorSignal.set('Failed to like post');
        return throwError(() => error);
      })
    );
  }

  toggleSave(postId: string, userId: string): Observable<any> {
    const wasSaved = this.savedPostsSignal().has(postId);
    this.updateSaveOptimistically(postId, !wasSaved);

    return this.apiService.post(`${this.apiUrl}/${postId}/save`, { userId }, undefined, true).pipe(
      catchError((error) => {
        this.updateSaveOptimistically(postId, wasSaved);
        this.errorSignal.set('Failed to save post');
        return throwError(() => error);
      })
    );
  }

  sharePost(postId: string, userId: string, platform: string = 'copy'): Observable<any> {
    return this.apiService.post(`${this.apiUrl}/${postId}/share`, { platform, userId }, undefined, true).pipe(
      tap(() => {
        this.postsSignal.update((posts) =>
          posts.map((post) => post._id === postId ? { ...post, shareCount: post.shareCount + 1 } : post)
        );
      })
    );
  }

  trackChatClick(postId: string, userId?: string): Observable<{ chatCount: number }> {
    const body = userId ? { userId } : {};
    return this.apiService.post<any>(`${this.apiUrl}/${postId}/chat-click`, body, undefined, true).pipe(
      map((response) => response?.data || response),
      tap((payload) => {
        const nextCount = typeof payload?.chatCount === 'number' ? payload.chatCount : null;
        this.postsSignal.update((posts) =>
          posts.map((post) =>
            post._id === postId
              ? { ...post, chatCount: nextCount ?? ((post.chatCount || 0) + 1) }
              : post
          )
        );
      })
    );
  }

  incrementCommentCount(postId: string, increment: number = 1): void {
    this.postsSignal.update((posts) =>
      posts.map((post) =>
        post._id === postId
          ? { ...post, commentCount: Math.max(0, Number(post.commentCount || 0) + increment) }
          : post
      )
    );
  }

  getComments(postId: string, page: number = 1, limit: number = 20): Observable<CommentsResponse> {
    const params = new HttpParams({ fromObject: { page: page.toString(), limit: limit.toString() } });
    return this.apiService.get(`${this.apiUrl}/${postId}/comments`, params, undefined, true).pipe(
      map((response: any) => response?.data || response)
    );
  }

  addComment(postId: string, content: string, userId: string, parentCommentId?: string): Observable<FeedComment> {
    const body: any = { content, userId };
    if (parentCommentId) body.parentCommentId = parentCommentId;

    return this.apiService.post(`${this.apiUrl}/${postId}/comments`, body, undefined, true).pipe(
      map((response: any) => response?.data || response)
    );
  }

  likeComment(postId: string, commentId: string, userId: string): Observable<any> {
    return this.apiService.post(`${this.apiUrl}/${postId}/comments/${commentId}/like`, { userId }, undefined, true).pipe(
      map((response: any) => response?.data || response)
    );
  }

  getPostById(postId: string, userId?: string): Observable<FeedPost> {
    const params = userId ? new HttpParams({ fromObject: { userId } }) : undefined;

    return this.apiService.get<any>(`${this.apiUrl}/${postId}`, params, undefined, true).pipe(
      map((response) => response?.data || response),
      map((post) => this.processPost(post))
    );
  }

  createPost(postData: FormData | Record<string, any>): Observable<FeedPost> {
    return this.apiService.post<any>(`${this.apiUrl}/create`, postData, undefined, true).pipe(
      map((response) => response?.data || response),
      map((post) => this.processPost(post)),
      tap((post) => {
        this.postsSignal.update((posts) => [post, ...posts]);
      })
    );
  }

  editPost(postId: string, payload: Record<string, any>): Observable<any> {
    return this.apiService.put(`${this.apiUrl}/${postId}`, payload, undefined, true);
  }

  deletePost(postId: string, userId: string): Observable<any> {
    const params = new HttpParams().set('userId', userId);
    return this.apiService.delete(`${this.apiUrl}/${postId}`, params, undefined, true).pipe(
      tap(() => {
        this.postsSignal.update((posts) => posts.filter((post) => post._id !== postId));
      })
    );
  }

  getMarketerCampaigns(userId: string, params?: any): Observable<any> {
    return this.apiService.get(`api/v1/campaign/user/${userId}`, params, undefined, true);
  }

  private extractCommunityResponse(response: any): CommunityFeedPayload {
    const data = response?.data || response || {};

    return {
      posts: Array.isArray(data.posts) ? data.posts : [],
      pagination: data.pagination || { page: 1, limit: FEED_CONFIG.POSTS_PER_PAGE, total: 0, pages: 1 },
      stats: data.stats,
      trendingHashtags: Array.isArray(data.trendingHashtags) ? data.trendingHashtags : [],
      trendingChallenges: Array.isArray(data.trendingChallenges) ? data.trendingChallenges : [],
      creatorSpotlight: Array.isArray(data.creatorSpotlight) ? data.creatorSpotlight : [],
      forumHighlights: Array.isArray(data.forumHighlights) ? data.forumHighlights : [],
      hotTopics: Array.isArray(data.hotTopics) ? data.hotTopics : [],
      forumSpotlight: Array.isArray(data.forumSpotlight) ? data.forumSpotlight : [],
      sortMode: data.sortMode || 'for_you',
      feedModel: data.feedModel
    };
  }

  private handleCommunityFeed(payload: CommunityFeedPayload, reset: boolean): void {
    const newPosts = payload.posts.map((post) => this.processPost(post));

    if (reset) {
      this.postsSignal.set(newPosts);
    } else {
      this.postsSignal.update((posts) => {
        const seen = new Set(posts.map((post) => post._id));
        const uniqueNewPosts = newPosts.filter((post) => {
          if (!post?._id || seen.has(post._id)) return false;
          seen.add(post._id);
          return true;
        });
        return [...posts, ...uniqueNewPosts];
      });
    }

    this.hasMoreSignal.set(payload.pagination.page < payload.pagination.pages);
    if (payload.pagination.page < payload.pagination.pages) {
      this.currentPageSignal.set(payload.pagination.page + 1);
    }

    this.trendingHashtagsSignal.set(payload.trendingHashtags || []);
    this.trendingChallengesSignal.set(payload.trendingChallenges || []);
    this.creatorSpotlightSignal.set(payload.creatorSpotlight || []);
    this.forumHighlightsSignal.set(payload.forumHighlights || []);
    this.hotTopicsSignal.set(payload.hotTopics || []);
    this.forumSpotlightSignal.set(payload.forumSpotlight || []);
    if (payload.stats) {
      this.activityStatsSignal.set(payload.stats);
    }

    const normalizedSort = payload.sortMode === 'following'
      ? 'following'
      : payload.sortMode === 'trending'
        ? 'trending'
        : payload.sortMode === 'latest'
          ? 'latest'
          : 'for_you';
    this.sortModeSignal.set(normalizedSort);
    this.updateLikedSavedSets(newPosts);
  }

  private processPost(post: any): FeedPost {
    return {
      _id: post._id,
      author: post.author ? {
        _id: post.author._id,
        username: post.author.username,
        displayName: post.author.displayName || post.author.username || 'Anonymous',
        avatar: post.author.avatar || 'img/avatar.png',
        role: post.author.role || 'user',
        rating: post.author.rating || 0,
        badge: post.author.badge,
        isVerified: post.author.isVerified || false
      } : null,
      content: post.content || '',
      source: post.source || 'manual',
      type: post.type || 'story',
      earnings: post.earnings,
      campaign: post.campaign ? {
        campaignId: typeof post.campaign.campaignId === 'object' ? post.campaign.campaignId?._id : post.campaign.campaignId,
        name: post.campaign.name || post.campaign.campaignId?.title || '',
        budget: post.campaign.budget || 0,
        status: post.campaign.status || '',
        progress: post.campaign.progress,
        spentBudget: post.campaign.spentBudget,
        mediaUrl: post.campaign.mediaUrl,
        mediaType: post.campaign.mediaType,
        link: post.campaign.link,
        category: post.campaign.category,
        thumbnailUrl: post.campaign.thumbnailUrl
      } : undefined,
      product: post.product ? {
        productId: typeof post.product.productId === 'object' ? post.product.productId?._id : post.product.productId,
        storeId: typeof post.product.storeId === 'object' ? post.product.storeId?._id : post.product.storeId,
        storeName: post.product.storeName || post.product.storeId?.name,
        storeLink: post.product.storeLink || post.product.storeId?.storeLink,
        name: post.product.name || post.product.productId?.name,
        description: post.product.description,
        category: post.product.category || post.product.productId?.category,
        price: post.product.price ?? post.product.productId?.price,
        originalPrice: post.product.originalPrice ?? post.product.productId?.originalPrice,
        currency: post.product.currency || post.product.productId?.currency || 'NGN',
        commissionRate: post.product.commissionRate,
        commissionType: post.product.commissionType,
        fixedCommission: post.product.fixedCommission,
        productUrl: post.product.productUrl,
        mainImage: post.product.mainImage || post.product.productId?.images?.[0]?.url
      } : undefined,
      challenge: post.challenge || null,
      tip: post.tip,
      media: Array.isArray(post.media) ? [...post.media].sort((a, b) => (a.order || 0) - (b.order || 0)) : [],
      likeCount: typeof post.likeCount === 'number' ? post.likeCount : Array.isArray(post.likes) ? post.likes.length : 0,
      commentCount: typeof post.commentCount === 'number' ? post.commentCount : Array.isArray(post.comments) ? post.comments.length : 0,
      shareCount: typeof post.shareCount === 'number' ? post.shareCount : Array.isArray(post.shares) ? post.shares.length : 0,
      chatCount: post.chatCount || 0,
      saveCount: typeof post.saveCount === 'number' ? post.saveCount : Array.isArray(post.savedBy) ? post.savedBy.length : 0,
      isLiked: Boolean(post.isLiked),
      isSaved: Boolean(post.isSaved),
      hashtags: Array.isArray(post.hashtags) ? post.hashtags : [],
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      isFeatured: Boolean(post.isFeatured),
      badge: post.author?.badge || post.badge,
      mentions: post.mentions || [],
      featuredUntil: post.featuredUntil,
      status: post.status || 'published',
      settings: post.settings,
      phone: post.phone,
      recommendationScore: post.recommendationScore || 0,
      spotlightScore: post.spotlightScore || 0,
      mediaCount: post.mediaCount || post.media?.length || 0,
      isCarousel: Boolean(post.isCarousel || (post.media?.length || 0) > 1),
      primaryMediaType: post.primaryMediaType || post.media?.[0]?.type || null
    };
  }

  private updateLikedSavedSets(posts: FeedPost[]): void {
    const liked = new Set(this.likedPostsSignal());
    const saved = new Set(this.savedPostsSignal());

    posts.forEach((post) => {
      if (post.isLiked) liked.add(post._id);
      if (post.isSaved) saved.add(post._id);
    });

    this.likedPostsSignal.set(liked);
    this.savedPostsSignal.set(saved);
  }

  private updateLikeOptimistically(postId: string, liked: boolean): void {
    this.likedPostsSignal.update((set) => {
      const next = new Set(set);
      liked ? next.add(postId) : next.delete(postId);
      return next;
    });

    this.postsSignal.update((posts) => posts.map((post) => {
      if (post._id !== postId) return post;
      return {
        ...post,
        likeCount: post.likeCount + (liked ? 1 : -1),
        isLiked: liked
      };
    }));
  }

  private updateSaveOptimistically(postId: string, saved: boolean): void {
    this.savedPostsSignal.update((set) => {
      const next = new Set(set);
      saved ? next.add(postId) : next.delete(postId);
      return next;
    });

    this.postsSignal.update((posts) => posts.map((post) => {
      if (post._id !== postId) return post;
      return {
        ...post,
        saveCount: (post.saveCount || 0) + (saved ? 1 : -1),
        isSaved: saved
      };
    }));
  }

  private handleFeedError(error: any): Observable<null> {
    this.errorSignal.set(error?.error?.message || 'Failed to load feed');
    return of(null);
  }

  private normalizeLiveActivity(activity: Record<string, any>): LiveActivity {
    const actionUrl = String(activity?.['actionUrl'] || '');
    const createdAt = activity?.['createdAt'] || activity?.['time'] || new Date().toISOString();
    const postId = String(activity?.['postId'] || this.extractFeedPostId(actionUrl) || '');
    const type = this.normalizeLiveActivityType(activity?.['type']);

    return {
      id: String(activity?.['id'] || activity?.['_id'] || `${type}:${createdAt}:${activity?.['authorId'] || ''}`),
      type,
      author: String(activity?.['author'] || 'MarketSpase update'),
      authorId: String(activity?.['authorId'] || ''),
      avatar: activity?.['avatar'] || 'img/avatar.png',
      message: String(activity?.['message'] || activity?.['title'] || 'shared a new update'),
      time: this.formatTime(createdAt),
      postId: postId || undefined,
      postContent: activity?.['title'] || activity?.['postContent'] || undefined,
      actionUrl: actionUrl || undefined,
    };
  }

  private normalizeLiveActivityType(type: unknown): LiveActivity['type'] {
    const value = String(type || '').toLowerCase();
    const supported: LiveActivity['type'][] = ['like', 'comment', 'post', 'earnings', 'forum', 'campaign', 'product'];
    return supported.includes(value as LiveActivity['type']) ? value as LiveActivity['type'] : 'post';
  }

  private extractFeedPostId(actionUrl: string): string | null {
    const match = String(actionUrl || '').match(/^\/feed\/([^/?#]+)/);
    return match?.[1] || null;
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
