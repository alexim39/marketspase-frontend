import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { Observable, catchError, map, of, throwError, interval, switchMap, finalize, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../../../../shared-services/src/public-api';

// ============ INTERFACES ============
export interface FeedAuthor {
  _id: string;
  username: string;
  displayName: string;
  avatar: string;
  role: string;
  rating?: number;
  badge?: 'top-promoter' | 'verified' | 'rising-star' | 'expert' | 'veteran';
}

// feed.service.ts - Update the FeedPost interface

export interface FeedPost {
  _id: string;
  author?: {
    _id: string;
    displayName: string;
    username?: string;
    avatar: string;
    role: string;
    rating?: number;
    badge?: string;
  } | null;
  content: string;
  type: 'earnings' | 'campaign' | 'question' | 'tip' | 'achievement' | 'milestone';
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
  };
  tip?: {
    title?: string;
    category?: string;
    views?: number;
  };
  media?: Array<{
    url: string;
    type: 'image' | 'video' | 'link';
    thumbnail?: string;
  }>;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isLiked: boolean;
  isSaved: boolean;
  hashtags: Array<{ tag: string }> | string[];
  createdAt: string;
  isFeatured?: boolean;
  badge?: string;
  saveCount?: number;
  mentions?: any;
  featuredUntil?: any;
  status?: string;
  updatedAt?: Date;
  settings?: any;
}

export interface FeedResponse {
  posts: FeedPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface Hashtag {
  tag: string;
  count: number;
  posts: string[];
}

export interface LiveActivity {
  id: string;
  type: 'like' | 'comment' | 'post' | 'earnings';
  author: string;
  authorId: string;
  avatar?: string;
  message: string;
  time: string;
  postId?: string;
  postContent?: string;
}

export interface ActivityStats {
  activeUsers: number;
  postsToday: number;
  totalEngagement: number;
  topHashtag: string;
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
  likeCount: number;      // changed from `likes`
  isLiked: boolean;
  createdAt: string;
  replies?: FeedComment[]; // replies use same shape
  data: any; // to hold any additional data from the backend
}

export interface CommentsResponse {
  comments: FeedComment[];
  total: number;
  page: number;
  pages: number;
  data?: any; // to handle cases where comments are nested inside a data object
}


// ============ CONFIGURATION ============
const FEED_CONFIG = {
  POSTS_PER_PAGE: 10,
  MAX_LIVE_ACTIVITIES: 5,
  ACTIVITY_TIMEOUT: 5000,
  TRENDING_REFRESH_INTERVAL: 300000, // 5 minutes
  STATS_REFRESH_INTERVAL: 30000, // 30 seconds
  ACTIVITY_SIMULATION_INTERVAL: 45000, // 45 seconds
  RANDOM_ACTIVITY_CHANCE: 0.5,
  ACTIVE_USERS_MIN: 15,
  ACTIVE_USERS_MAX: 45,
  MAX_RECENT_COMMENTS: 2,
  COMMENT_PREVIEW_LENGTH: 50,
  POST_PREVIEW_LENGTH: 100
} as const;

// ============ SERVICE ============
@Injectable()
export class FeedService {
  private apiService: ApiService = inject(ApiService);
  private destroyRef = inject(DestroyRef);
  private readonly apiUrl = 'feed';

  // State signals
  private postsSignal = signal<FeedPost[]>([]);
  private likedPostsSignal = signal<Set<string>>(new Set());
  private savedPostsSignal = signal<Set<string>>(new Set());
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);
  private hasMoreSignal = signal<boolean>(true);
  private currentPageSignal = signal<number>(1);
  private trendingHashtagsSignal = signal<Hashtag[]>([]);
  private liveActivitiesSignal = signal<LiveActivity[]>([]);
  private activityStatsSignal = signal<ActivityStats>(this.getEmptyActivityStats());

  // Public readonly signals
  public posts = this.postsSignal.asReadonly();
  public likedPosts = this.likedPostsSignal.asReadonly();
  public savedPosts = this.savedPostsSignal.asReadonly();
  public loading = this.loadingSignal.asReadonly();
  public error = this.errorSignal.asReadonly();
  public hasMore = this.hasMoreSignal.asReadonly();
  public trendingHashtags = this.trendingHashtagsSignal.asReadonly();
  public liveActivities = this.liveActivitiesSignal.asReadonly();
  public activityStats = this.activityStatsSignal.asReadonly();

  // Computed signals
  public featuredPost = computed(() => {
    const posts = this.postsSignal();
    const featured = posts.find(post => post.isFeatured === true);
    if (featured) return featured;
    
    return [...posts].sort((a, b) => 
      this.calculateEngagement(b) - this.calculateEngagement(a)
    )[0];
  });

  public regularPosts = computed(() => 
    this.postsSignal().filter(post => !post.isFeatured)
  );

  public filteredByType = (type: string) => computed(() => 
    this.postsSignal().filter(post => post.type === type)
  );

  private commentLikedMap = new Map<string, boolean>();

  constructor() {
    this.initializeService();
  }

  // ============ INITIALIZATION ============
  private initializeService(): void {
    this.loadTrendingHashtags();
    this.startLiveActivitySimulation();
    this.setupPeriodicRefreshes();
  }

  private setupPeriodicRefreshes(): void {
    // Refresh trending hashtags
    interval(FEED_CONFIG.TRENDING_REFRESH_INTERVAL)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => this.fetchTrendingHashtags())
      )
      .subscribe(hashtags => this.trendingHashtagsSignal.set(hashtags));

    // Refresh activity stats
    interval(FEED_CONFIG.STATS_REFRESH_INTERVAL)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => this.fetchActivityStats())
      )
      .subscribe(stats => {
        if (stats) this.activityStatsSignal.set(stats);
      });
  }

  // ============ POST LOADING ============
loadFeedPosts(userId: string, type?: string, hashtag?: string, reset: boolean = false): void {
  if (!userId) {
    return;
  }

  //console.log('[FeedService] loadFeedPosts', { userId, type, hashtag, reset, page: this.currentPageSignal() });

  if (reset) this.resetFeedState();
  if (!this.shouldLoadMore()) return;

  this.setLoadingState(true);
  
  const params = this.buildFeedParams(userId, type, hashtag);
  
  this.apiService.get<any>(`${this.apiUrl}/community`, params, undefined, true)
   .pipe(
      map(response => {
        //console.log('[FeedService] Raw API response:', response);
        const extracted = this.extractPostsFromResponse(response);
        //console.log('[FeedService] After extractPostsFromResponse:', extracted);
        return extracted;
      }),
      tap((result: any) => {
        //console.log('[FeedService] Before handleFeedResponse, result.posts length:', result.posts?.length);
        this.handleFeedResponse(result, reset);
      }),
      catchError(error => this.handleFeedError(error)),
      finalize(() => this.setLoadingState(false))
    )
    .subscribe();
}

  private shouldLoadMore(): boolean {
    return this.hasMoreSignal() && !this.loadingSignal();
  }

  private resetFeedState(): void {
    this.currentPageSignal.set(1);
    this.hasMoreSignal.set(true);
    this.postsSignal.set([]);
  }

  private setLoadingState(isLoading: boolean): void {
    this.loadingSignal.set(isLoading);
    if (isLoading) this.errorSignal.set(null);
  }

  private buildFeedParams(userId: string, type?: string, hashtag?: string): any {
    const params: any = {
      page: this.currentPageSignal(),
      limit: FEED_CONFIG.POSTS_PER_PAGE,
      userId
    };
    
    if (type && type !== 'all') params.type = type;
    if (hashtag) params.hashtag = hashtag;
    
    return params;
  }

  private extractPostsFromResponse(response: any): { posts: any[], pagination: any } {
    // Handle different API response structures
    const data = response?.data || response;
    
    if (data?.posts && Array.isArray(data.posts)) {
      return { 
        posts: data.posts, 
        pagination: data.pagination || this.getDefaultPagination() 
      };
    }
    
    if (Array.isArray(data)) {
      return { posts: data, pagination: this.getDefaultPagination() };
    }
    
    if (Array.isArray(response)) {
      return { posts: response, pagination: this.getDefaultPagination() };
    }
    
    //console.warn('[FeedService] Unexpected response structure:', response);
    return { posts: [], pagination: this.getDefaultPagination() };
  }

  private getDefaultPagination() {
    return { page: 1, limit: FEED_CONFIG.POSTS_PER_PAGE, total: 0, pages: 1 };
  }


private handleFeedResponse(result: { posts: any[], pagination: any }, reset: boolean): void {
  //console.log('[FeedService] handleFeedResponse called with posts length:', result.posts.length);
  if (!result.posts.length) {
    if (reset) this.postsSignal.set([]);
    this.hasMoreSignal.set(false);
    return;
  }

  const newPosts = result.posts.map(post => {
    try {
      return this.processPost(post);
    } catch (err) {
      console.error('[FeedService] Error processing post:', post._id, err);
      return null;
    }
  }).filter(p => p !== null) as FeedPost[];

  //console.log('[FeedService] Mapped newPosts length:', newPosts.length);
  
  this.updatePostsSignal(newPosts, reset);
  this.updatePagination(result.pagination);
  this.updateLikedSavedSets(newPosts);
  this.updateActivityStats();
}

  private updatePostsSignal(newPosts: FeedPost[], reset: boolean): void {
    if (reset) {
      this.postsSignal.set(newPosts);
    } else {
      this.postsSignal.update(current => [...current, ...newPosts]);
    }
    //console.log('[FeedService] postsSignal length:', this.postsSignal().length);
  }

  private updatePagination(pagination: any): void {
    this.hasMoreSignal.set(pagination.page < pagination.pages);
    this.currentPageSignal.update(page => page + 1);
  }

  private updateLikedSavedSets(newPosts: FeedPost[]): void {
    const likedSet = new Set(this.likedPostsSignal());
    const savedSet = new Set(this.savedPostsSignal());
    
    newPosts.forEach(post => {
      if (post.isLiked) likedSet.add(post._id);
      if (post.isSaved) savedSet.add(post._id);
    });

    this.likedPostsSignal.set(likedSet);
    this.savedPostsSignal.set(savedSet);
  }

  private handleFeedError(error: any): Observable<null> {
    console.error('[FeedService] Feed loading error:', error);
    this.errorSignal.set(error.error?.message || 'Failed to load feed');
    this.postsSignal.set([]);
    return of(null);
  }

  // ============ POST PROCESSING ============
  private processPost(post: any): FeedPost {
    return {
      _id: post._id,
      author: this.processAuthor(post.author),
      content: post.content || '',
      type: post.type || 'campaign',
      earnings: this.processEarnings(post.earnings),
      campaign: this.processCampaign(post),
      tip: post.tip,
      media: post.media || [],
      likeCount: this.getCount(post, ['likes', 'likeCount']),
      commentCount: this.getCount(post, ['comments', 'commentCount']),
      shareCount: this.getCount(post, ['shares', 'shareCount']),
      saveCount: this.getCount(post, ['savedBy', 'saveCount']),
      isLiked: post.isLiked || false,
      isSaved: post.isSaved || false,
      badge: post.author?.badge,
      hashtags: this.extractHashtags(post.hashtags),
      mentions: post.mentions || [],
      isFeatured: post.isFeatured || false,
      featuredUntil: post.featuredUntil,
      status: post.status || 'published',
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      settings: post.settings
    };
  }

  private processAuthor(author: any): FeedAuthor | null {
    if (!author) return null;
    
    return {
      _id: author._id,
      username: author.username,
      displayName: author.displayName || author.username || 'Anonymous',
      avatar: author.avatar || 'img/avatar.png',
      role: author.role || 'user',
      rating: author.rating || 0,
      badge: author.badge
    };
  }

  private processEarnings(earnings: any): FeedPost['earnings'] | undefined {
    if (!earnings) return undefined;
    
    return {
      amount: earnings.amount || 0,
      currency: earnings.currency || 'NGN',
      milestone: earnings.milestone,
      campaignId: earnings.campaignId
    };
  }

  private processCampaign(post: any): FeedPost['campaign'] | undefined {
    if (!post.campaign) return undefined;
    
    const campaign = post.campaign;
    const campaignName = this.extractCampaignName(campaign);
    
    return {
      campaignId: this.extractCampaignId(campaign),
      name: campaignName,
      budget: campaign.budget || 0,
      spentBudget: campaign.spentBudget,
      status: campaign.status || '',
      progress: campaign.progress,
      mediaUrl: post.media?.[0]?.url || campaign.mediaUrl,
      mediaType: post.media?.[0]?.type || campaign.mediaType
    };
  }

  private extractCampaignName(campaign: any): string {
    if (typeof campaign.name === 'string') return campaign.name;
    if (campaign.campaignId?.name) return campaign.campaignId.name;
    return '';
  }

  private extractCampaignId(campaign: any): string {
    if (typeof campaign.campaignId === 'object') {
      return campaign.campaignId._id || '';
    }
    return campaign.campaignId || campaign.campaignId || '';
  }

  private getCount(post: any, possibleKeys: string[]): number {
    for (const key of possibleKeys) {
      if (Array.isArray(post[key])) return post[key].length;
      if (typeof post[key] === 'number') return post[key];
    }
    return 0;
  }

  private extractHashtags(hashtags: Hashtag[]): any[] {
    if (!Array.isArray(hashtags)) return [];
    
    return hashtags
      .map(h => typeof h === 'string' ? h : h?.tag || '')
      .filter(tag => tag);
  }

  // ============ POST INTERACTIONS ============
  toggleLike(post: FeedPost, id: string): Observable<any> {

    // 1. Ensure the key matches backend expectations
    const body = { userId: id }; 

    const wasLiked = this.likedPostsSignal().has(post._id);
    this.updateLikeOptimistically(post._id, !wasLiked);
    
    // 2. Remove the 'undefined' if it's blocking the body slot
    return this.apiService.post(`${this.apiUrl}/${post._id}/like`, body, undefined, true)
      .pipe(
        tap(() => this.handleLikeSuccess(post, wasLiked)),
        catchError(error => this.handleLikeError(post._id, wasLiked, error))
      );
  }


  private updateLikeOptimistically(postId: string, liked: boolean): void {
    this.likedPostsSignal.update(set => {
      const newSet = new Set(set);
      liked ? newSet.add(postId) : newSet.delete(postId);
      return newSet;
    });

    this.postsSignal.update(posts => 
      posts.map(p => {
        if (p._id === postId) {
          return {
            ...p,
            likeCount: p.likeCount + (liked ? 1 : -1),
            isLiked: liked
          };
        }
        return p;
      })
    );
  }

  private handleLikeSuccess(post: FeedPost, wasLiked: boolean): void {
    if (!wasLiked && post.author) {
      this.addLiveActivity({
        type: 'like',
        author: 'You',
        message: `liked ${post.author.displayName}'s post`,
        postId: post._id
      });
    }
  }

  private handleLikeError(postId: string, wasLiked: boolean, error: any): Observable<never> {
    this.updateLikeOptimistically(postId, wasLiked);
    this.errorSignal.set('Failed to like post');
    return throwError(() => error);
  }

  toggleSave(postId: string, userId: string): Observable<any> {
    const wasSaved = this.savedPostsSignal().has(postId);
    
    this.updateSaveOptimistically(postId, !wasSaved);
    
    return this.apiService.post(`${this.apiUrl}/${postId}/save`, { userId })
      .pipe(
        catchError(error => this.handleSaveError(postId, wasSaved, error))
      );
  }

  private updateSaveOptimistically(postId: string, saved: boolean): void {
    this.savedPostsSignal.update(set => {
      const newSet = new Set(set);
      saved ? newSet.add(postId) : newSet.delete(postId);
      return newSet;
    });

    this.postsSignal.update(posts => 
      posts.map(p => {
        if (p._id === postId) {
          return {
            ...p,
            // Use ?? 0 to safely handle potentially undefined saveCount
            saveCount: (p.saveCount ?? 0) + (saved ? 1 : -1),
            isSaved: saved
          };
        }
        return p;
      })
    );
  }

  private handleSaveError(postId: string, wasSaved: boolean, error: any): Observable<never> {
    this.updateSaveOptimistically(postId, wasSaved);
    this.errorSignal.set('Failed to save post');
    return throwError(() => error);
  }

  sharePost(postId: string, userId: string): Observable<any> {
    return this.apiService.post(`${this.apiUrl}/${postId}/share`, { platform: 'copy', userId })
      .pipe(
        tap(() => {
          this.incrementShareCount(postId);
        })
      );
  }

  private incrementShareCount(postId: string): void {
    this.postsSignal.update(posts =>
      posts.map(p => {
        if (p._id === postId) {
          return { ...p, shareCount: p.shareCount + 1 };
        }
        return p;
      })
    );
  }

  private updateShareCount(postId: string): void {
    this.postsSignal.update(posts => 
      posts.map(p => p._id === postId ? { ...p, shareCount: p.shareCount + 1 } : p)
    );
  }

  private addShareActivity(post: FeedPost): void {
    if (post.author) {
      this.addLiveActivity({
        type: 'post',
        author: 'Someone',
        message: `shared ${post.author.displayName}'s post`,
        postId: post._id
      });
    }
  }

  // ============ COMMENTS ============
  getComments(postId: string, page: number = 1, limit: number = 20): Observable<CommentsResponse> {
    const params = new HttpParams({ fromObject: { page: page.toString(), limit: limit.toString() } });
    return this.apiService.get(`${this.apiUrl}/${postId}/comments`, params, undefined, true)
      .pipe(
        map((response: any) => response?.data || response)  // ensure we have the inner data
      );
  }

  addComment(postId: string, content: string, userId: string, parentCommentId?: string): Observable<FeedComment> {
    const body: any = { content, userId };
    if (parentCommentId) body.parentCommentId = parentCommentId;
    return this.apiService.post(`${this.apiUrl}/${postId}/comments`, body)
      .pipe(
        map((response: any) => response?.data || response) 
      );
  }

  private incrementCommentCount(postId: string): void {
    this.postsSignal.update(posts => 
      posts.map(p => p._id === postId ? { ...p, commentCount: p.commentCount + 1 } : p)
    );
  }

  private addCommentActivity(postId: string): void {
    const post = this.postsSignal().find(p => p._id === postId);
    if (post?.author) {
      this.addLiveActivity({
        type: 'comment',
        author: 'Someone',
        message: `commented on ${post.author.displayName}'s post`,
        postId
      });
    }
  }

  // ============ SINGLE POST OPERATIONS ============
  getPostById(postId: string, userId?: string): Observable<FeedPost> {
    const params = userId ? new HttpParams({ fromObject: { userId } }) : undefined;

    return this.apiService.get<any>(`${this.apiUrl}/${postId}`, params, undefined, true)
      .pipe(
        map(response => response?.data || response),
        map(post => this.processPost(post))
      );
  }

  createPost(postData: any): Observable<FeedPost> {
    return this.apiService.post<any>(`${this.apiUrl}/create`, postData)
      .pipe(
        map(response => response?.data || response),
        map(newPost => this.processPost(newPost)),
        tap(processed => this.handleNewPost(processed))
      );
  }

  private handleNewPost(post: FeedPost): void {
    this.postsSignal.update(posts => [post, ...posts]);
    
    this.addLiveActivity({
      type: 'post',
      author: post.author?.displayName || 'Someone',
      message: 'just shared a new update',
      postId: post._id,
      postContent: post.content
    });
  }

  getMarketerCampaigns(userId: string, params?: any): Observable<any> {
    console.log('user ',userId)
    return this.apiService.get(`campaign/user/${userId}`, params, undefined, true);
  }

  // ============ TRENDING HASHTAGS ============
  private loadTrendingHashtags(): void {
    this.fetchTrendingHashtags().subscribe(hashtags => {
      this.trendingHashtagsSignal.set(hashtags);
    });
  }

  private fetchTrendingHashtags(): Observable<Hashtag[]> {
    return this.apiService.get<any>(`${this.apiUrl}/trending/hashtags`)
      .pipe(
        map(response => response?.data || response || []),
        catchError(() => of([]))
      );
  }

  // ============ ACTIVITY STATS ============
  private getEmptyActivityStats(): ActivityStats {
    return {
      activeUsers: 0,
      postsToday: 0,
      totalEngagement: 0,
      topHashtag: ''
    };
  }

  private fetchActivityStats(): Observable<ActivityStats | null> {
    const posts = this.postsSignal();
    
    return of({
      activeUsers: this.calculateActiveUsers(),
      postsToday: this.calculatePostsToday(posts),
      totalEngagement: this.calculateTotalEngagement(posts),
      topHashtag: this.findTopHashtag(posts)
    });
  }

  private calculateActiveUsers(): number {
    return Math.floor(Math.random() * 
      (FEED_CONFIG.ACTIVE_USERS_MAX - FEED_CONFIG.ACTIVE_USERS_MIN + 1)) + 
      FEED_CONFIG.ACTIVE_USERS_MIN;
  }

  private calculatePostsToday(posts: FeedPost[]): number {
    const today = new Date().toDateString();
    return posts.filter(post => 
      new Date(post.createdAt).toDateString() === today
    ).length;
  }

  private calculateTotalEngagement(posts: FeedPost[]): number {
    return posts.reduce((sum, post) => 
      sum + post.likeCount + post.commentCount + post.shareCount, 0
    );
  }

  private findTopHashtag(posts: FeedPost[]): string {
    const hashtagCounts = new Map<string, number>();
    
    posts.forEach(post => {
      post.hashtags?.forEach((tag: any) => {
        hashtagCounts.set(tag, (hashtagCounts.get(tag) || 0) + 1);
      });
    });

    return Array.from(hashtagCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  }

  private calculateEngagement(post: FeedPost): number {
    return post.likeCount + post.commentCount + post.shareCount;
  }

  private updateActivityStats(): void {
    this.fetchActivityStats().subscribe(stats => {
      if (stats) this.activityStatsSignal.set(stats);
    });
  }

  // ============ LIVE ACTIVITIES ============
  private addLiveActivity(activity: Partial<LiveActivity>): void {
    const newActivity: LiveActivity = {
      id: this.generateActivityId(),
      type: activity.type || 'post',
      author: activity.author || 'Someone',
      authorId: activity.authorId || '',
      avatar: activity.avatar,
      message: activity.message || 'interacted with a post',
      time: this.formatTime(new Date().toISOString()),
      postId: activity.postId,
      postContent: activity.postContent
    };

    this.liveActivitiesSignal.update(activities => 
      [newActivity, ...activities].slice(0, FEED_CONFIG.MAX_LIVE_ACTIVITIES)
    );

    setTimeout(() => {
      this.liveActivitiesSignal.update(activities => 
        activities.filter(a => a.id !== newActivity.id)
      );
    }, FEED_CONFIG.ACTIVITY_TIMEOUT);
  }

  private generateActivityId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private startLiveActivitySimulation(): void {
    interval(FEED_CONFIG.ACTIVITY_SIMULATION_INTERVAL)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.postsSignal().length > 0 && Math.random() > FEED_CONFIG.RANDOM_ACTIVITY_CHANCE) {
          this.generateRandomActivity();
        }
      });
  }

  private generateRandomActivity(): void {
    const posts = this.postsSignal();
    if (!posts.length) return;
    
    const randomPost = posts[Math.floor(Math.random() * posts.length)];
    if (!randomPost.author) return;
    
    const activities: Array<Partial<LiveActivity>> = [
      { type: 'like', message: `liked ${randomPost.author.displayName}'s post` },
      { type: 'comment', message: `commented on ${randomPost.author.displayName}'s post` },
      { type: 'earnings', message: 'just hit a milestone!' }
    ];
    
    const randomActivity = activities[Math.floor(Math.random() * activities.length)];
    this.addLiveActivity({ ...randomActivity, postId: randomPost._id });
  }

  // ============ UTILITIES ============
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

  getRecentComments(post: FeedPost): any[] {
    // This would normally come from the API
    return [];
  }

 /*  likeComment(postId: string, commentId: string, userId: string): Observable<any> {
    return this.apiService.post(`${this.apiUrl}/${postId}/comments/${commentId}/like`, { userId });
  } */

    likeComment(postId: string, commentId: string, userId: string): Observable<any> {
      return this.apiService.post(`${this.apiUrl}/${postId}/comments/${commentId}/like`, { userId })
        .pipe(map((response: any) => response?.data || response));
    }

}