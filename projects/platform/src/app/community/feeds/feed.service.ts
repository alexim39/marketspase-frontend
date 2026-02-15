import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { Observable, catchError, map, of, tap, throwError, interval, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../../../../shared-services/src/public-api';

export interface FeedAuthor {
  _id: string;
  username: string;
  displayName: string;
  avatar: string;
  role: string;
  rating?: number;
}

export interface FeedPost {
  _id: string;
  author: FeedAuthor;
  content: string;
  type: 'earnings' | 'campaign' | 'question' | 'tip' | 'achievement' | 'milestone';
  earnings?: {
    amount: number;
    currency: string;
    milestone?: string;
    campaignId?: string;
  };
  campaign?: {
    campaignId: string;
    name: string;
    budget: number;
    status: string;
  };
  tip?: {
    title: string;
    category: string;
    views: number;
  };
  media?: Array<{
    url: string;
    type: 'image' | 'video' | 'link';
    thumbnail?: string;
  }>;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  saveCount: number;
  isLiked: boolean;
  isSaved: boolean;
  badge?: 'top-promoter' | 'verified' | 'rising-star' | 'expert' | 'veteran';
  hashtags: Array<{ tag: string }>;
  mentions: Array<{ username: string }>;
  isFeatured: boolean;
  createdAt: string;
  time: string; // Formatted time
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

@Injectable({
  providedIn: 'root'
})
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

  // Public readonly signals
  public posts = this.postsSignal.asReadonly();
  public likedPosts = this.likedPostsSignal.asReadonly();
  public savedPosts = this.savedPostsSignal.asReadonly();
  public loading = this.loadingSignal.asReadonly();
  public error = this.errorSignal.asReadonly();
  public hasMore = this.hasMoreSignal.asReadonly();
  public trendingHashtags = this.trendingHashtagsSignal.asReadonly();

  // Computed signals
  public featuredPost = computed(() => 
    this.postsSignal().find(post => post.isFeatured)
  );

  public regularPosts = computed(() => 
    this.postsSignal().filter(post => !post.isFeatured)
  );

  constructor() {
    this.loadTrendingHashtags();
    
    // Refresh trending hashtags every 5 minutes
    interval(300000)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => this.fetchTrendingHashtags())
      )
      .subscribe(hashtags => {
        this.trendingHashtagsSignal.set(hashtags);
      });
  }

  // Load feed posts
// Load feed posts
loadFeedPosts(userId: string, type?: string, hashtag?: string, reset: boolean = false): void {
  if (reset) {
    this.currentPageSignal.set(1);
    this.hasMoreSignal.set(true);
    this.postsSignal.set([]);
  }

  if (!this.hasMoreSignal() || this.loadingSignal()) {
    return;
  }

  this.loadingSignal.set(true);
  this.errorSignal.set(null);

  let url = `${this.apiUrl}/list?page=${this.currentPageSignal()}&limit=20&userId=${userId}`;
  if (type) url += `&type=${type}`;
  if (hashtag) url += `&hashtag=${hashtag}`;

  this.apiService.get<any>(url)
    .pipe(
      tap(response => {
        console.log('returned ', response);
        
        // Extract posts from the nested structure
        const postsData = response?.data?.posts || [];
        const pagination = response?.data?.pagination || { page: 1, limit: 20, total: 0, pages: 1 };
        
        const currentPosts = this.postsSignal();
        
        // Map the posts with formatted time
        const newPosts = postsData.map((post: any) => ({
          ...post,
          time: this.formatTime(post.createdAt),
          // Ensure nested objects are properly structured
          earnings: post.earnings || { amount: 0, currency: 'NGN' },
          campaign: post.campaign ? {
            ...post.campaign,
            // Handle case where campaignId is an object
            campaignId: post.campaign.campaignId?._id || post.campaign.campaignId
          } : undefined,
          tip: post.tip || { title: '', category: '', views: 0 },
          media: post.media || [],
          hashtags: post.hashtags || [],
          likeCount: post.likes?.length || 0,
          commentCount: post.comments?.length || 0,
          shareCount: post.shares?.length || 0
        }));

        this.postsSignal.set(reset ? newPosts : [...currentPosts, ...newPosts]);
        this.hasMoreSignal.set(pagination.page < pagination.pages);
        this.currentPageSignal.update(page => page + 1);

        // Update liked/saved sets
        const likedSet = new Set(this.likedPostsSignal());
        const savedSet = new Set(this.savedPostsSignal());
        
        newPosts.forEach((post: any) => {
          if (post.isLiked) likedSet.add(post._id);
          if (post.isSaved) savedSet.add(post._id);
        });

        this.likedPostsSignal.set(likedSet);
        this.savedPostsSignal.set(savedSet);
      }),
      catchError(error => {
        console.error('Feed loading error:', error);
        this.errorSignal.set(error.message || 'Failed to load feed');
        return of(null);
      }),
      tap(() => this.loadingSignal.set(false))
    )
    .subscribe();
}

  // Like/unlike post
  toggleLike(post: FeedPost): Observable<any> {
    const wasLiked = this.likedPostsSignal().has(post._id);
    
    // Optimistic update
    this.likedPostsSignal.update(set => {
      const newSet = new Set(set);
      if (wasLiked) {
        newSet.delete(post._id);
      } else {
        newSet.add(post._id);
      }
      return newSet;
    });

    // Update post like count
    this.postsSignal.update(posts => 
      posts.map(p => {
        if (p._id === post._id) {
          return {
            ...p,
            likeCount: wasLiked ? p.likeCount - 1 : p.likeCount + 1,
            isLiked: !wasLiked
          };
        }
        return p;
      })
    );

    return this.apiService.post(`${this.apiUrl}/${post._id}/like`, {})
      .pipe(
        catchError(error => {
          // Revert on error
          this.likedPostsSignal.update(set => {
            const newSet = new Set(set);
            if (wasLiked) {
              newSet.add(post._id);
            } else {
              newSet.delete(post._id);
            }
            return newSet;
          });

          this.postsSignal.update(posts => 
            posts.map(p => {
              if (p._id === post._id) {
                return {
                  ...p,
                  likeCount: wasLiked ? p.likeCount : p.likeCount,
                  isLiked: wasLiked
                };
              }
              return p;
            })
          );

          this.errorSignal.set('Failed to like post');
          return throwError(() => error);
        })
      );
  }

  // Save/unsave post
  toggleSave(postId: string): Observable<any> {
    const wasSaved = this.savedPostsSignal().has(postId);
    
    // Optimistic update
    this.savedPostsSignal.update(set => {
      const newSet = new Set(set);
      if (wasSaved) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });

    // Update post save count
    this.postsSignal.update(posts => 
      posts.map(p => {
        if (p._id === postId) {
          return {
            ...p,
            saveCount: wasSaved ? p.saveCount - 1 : p.saveCount + 1,
            isSaved: !wasSaved
          };
        }
        return p;
      })
    );

    return this.apiService.post(`${this.apiUrl}/${postId}/save`, {})
      .pipe(
        catchError(error => {
          // Revert on error
          this.savedPostsSignal.update(set => {
            const newSet = new Set(set);
            if (wasSaved) {
              newSet.add(postId);
            } else {
              newSet.delete(postId);
            }
            return newSet;
          });

          this.postsSignal.update(posts => 
            posts.map(p => {
              if (p._id === postId) {
                return {
                  ...p,
                  saveCount: wasSaved ? p.saveCount : p.saveCount,
                  isSaved: wasSaved
                };
              }
              return p;
            })
          );

          this.errorSignal.set('Failed to save post');
          return throwError(() => error);
        })
      );
  }

  // Share post
  sharePost(post: FeedPost, platform: string = 'copy'): Observable<any> {
    return this.apiService.post(`${this.apiUrl}/${post._id}/share`, { platform });
  }

  // Create post
  createPost(postData: Partial<any>): Observable<FeedPost> {
  // createPost(postData: Partial<FeedPost>): Observable<FeedPost> {
    return this.apiService.post<FeedPost>(`${this.apiUrl}/create`, postData)
      .pipe(
        tap(newPost => {
          this.postsSignal.update(posts => [
            {
              ...newPost,
              time: this.formatTime(newPost.createdAt)
            },
            ...posts
          ]);
        })
      );
  }

  // Load trending hashtags
  private loadTrendingHashtags(): void {
    this.fetchTrendingHashtags().subscribe(hashtags => {
      this.trendingHashtagsSignal.set(hashtags);
    });
  }

  private fetchTrendingHashtags(): Observable<Hashtag[]> {
    return this.apiService.get<Hashtag[]>(`${this.apiUrl}/trending/hashtags`)
      .pipe(
        catchError(() => of([]))
      );
  }

  // Format time
  private formatTime(dateString: string): string {
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
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }
}