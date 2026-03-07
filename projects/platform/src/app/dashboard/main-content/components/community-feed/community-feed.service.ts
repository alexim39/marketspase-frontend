// community-feed.service.ts
import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { Observable, catchError, map, of, switchMap, interval, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../../../../../../shared-services/src/public-api';

export interface CommunityAuthor {
  _id: string;
  displayName: string;
  avatar: string;
  role: string;
  badge?: string;
}

export interface CommunityPost {
  _id: string;
  author: CommunityAuthor | null;
  content: string;
  type: 'earnings' | 'campaign' | 'question' | 'tip' | 'achievement' | 'milestone';
  earnings?: { amount: number; milestone?: string };
  campaign?: { name: string; budget?: number; progress?: number };
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isLiked: boolean;
  isSaved: boolean;
  hashtags: string[];
  createdAt: string;
  isFeatured?: boolean;
  // Add media field
  media?: Array<{
    url: string;
    type: 'image' | 'video' | 'link';
    thumbnail?: string;
  }>;
}

export interface TrendingHashtag {
  tag: string;
  count: number;
}

export interface LiveActivity {
  id: string;
  type: 'like' | 'comment' | 'post' | 'earnings';
  author: string;
  message: string;
  time: string;
}

export interface ActivityStats {
  activeUsers: number;
  postsToday: number;
  totalEngagement: number;
  topHashtag: string;
}

@Injectable()
export class CommunityFeedService {
  private apiService = inject(ApiService);
  private destroyRef = inject(DestroyRef);
  private readonly apiUrl = 'feed';

  // State signals
  private postsSignal = signal<CommunityPost[]>([]);
  private likedPostsSignal = signal<Set<string>>(new Set());
  private savedPostsSignal = signal<Set<string>>(new Set());
  private loadingSignal = signal<boolean>(false);
  private trendingHashtagsSignal = signal<TrendingHashtag[]>([]);
  private liveActivitiesSignal = signal<LiveActivity[]>([]);
  private activityStatsSignal = signal<ActivityStats>({
    activeUsers: 0,
    postsToday: 0,
    totalEngagement: 0,
    topHashtag: ''
  });

  // Public readonly signals
  posts = this.postsSignal.asReadonly();
  likedPosts = this.likedPostsSignal.asReadonly();
  savedPosts = this.savedPostsSignal.asReadonly();
  loading = this.loadingSignal.asReadonly();
  trendingHashtags = this.trendingHashtagsSignal.asReadonly();
  liveActivities = this.liveActivitiesSignal.asReadonly();
  activityStats = this.activityStatsSignal.asReadonly();

  constructor() {
    // Auto-refresh data periodically
    this.startBackgroundRefresh();
  }

  /**
   * Load feed posts for a user
   */
  loadFeedPosts(userId: string, type?: string, hashtag?: string): void {
    if (!userId) {
      console.warn('No userId provided');
      return;
    }

    this.loadingSignal.set(true);

    const params: any = {
      page: 1,
      limit: 20,
      userId
    };
    
    if (type && type !== 'all') params.type = type;
    if (hashtag) params.hashtag = hashtag;

    this.apiService.get<any>(`${this.apiUrl}/community`, params, undefined, true)
      .pipe(
        map(response => this.extractPosts(response)),
        tap(data => {
          if (data) {
            this.updatePosts(data.posts);
            this.updateInteractionSets(data.posts);
            this.updateActivityStats(data.stats);
          }
        }),
        catchError(error => {
          console.error('Failed to load feed:', error);
          return of(null);
        })
      )
      .subscribe({
        complete: () => this.loadingSignal.set(false)
      });
  }

  /**
   * Toggle like on a post
   */
  toggleLike(postId: string, id: string): Observable<any> {

     // 1. Ensure the key matches backend expectations
    const body = { userId: id }; 

    const wasLiked = this.likedPostsSignal().has(postId);
    
    // Optimistic update
    this.updatePostLike(postId, !wasLiked);

    return this.apiService.post(`${this.apiUrl}/${postId}/like`, body, undefined, true)
      .pipe(
        catchError(error => {
          // Revert on error
          this.updatePostLike(postId, wasLiked);
          return of(null);
        })
      );
  }

  /**
   * Toggle save on a post
   */
  toggleSave(postId: string, userId: string): Observable<any> {
    const wasSaved = this.savedPostsSignal().has(postId);
    
    // Optimistic update
    this.updatePostSave(postId, !wasSaved);

    return this.apiService.post(`${this.apiUrl}/${postId}/save`, { userId })
      .pipe(
        catchError(error => {
          this.updatePostSave(postId, wasSaved);
          return of(null);
        })
      );
  }

  /**
   * Share a post
   */
  sharePost(postId: string, userId: string): Observable<any> {
    return this.apiService.post(`${this.apiUrl}/${postId}/share`, { platform: 'copy', userId })
      .pipe(
        tap(() => {
          this.incrementShareCount(postId);
        })
      );
  }

  /**
   * Format time for display
   */
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

  // ========== Private Methods ==========

  private extractPosts(response: any): { posts: CommunityPost[], stats: any } | null {
    if (!response) return null;

    const data = response.data || response;
    const posts = data.posts || data;
    
    if (!Array.isArray(posts)) return null;

    return {
      posts: posts.map(post => this.mapToCommunityPost(post)),
      stats: data.stats || null
    };
  }

  private mapToCommunityPost(post: any): CommunityPost {
    const author = post.author ? {
      _id: post.author._id,
      displayName: post.author.displayName || post.author.username || 'Anonymous',
      avatar: post.author.avatar || 'img/avatar.png',
      role: post.author.role || 'user',
      badge: post.author.badge
    } : null;

    // Extract hashtags as strings
    const hashtags = (post.hashtags || [])
      .map((h: any) => typeof h === 'string' ? h : h.tag)
      .filter((t: string) => t);

    return {
      _id: post._id,
      author,
      content: post.content || '',
      type: post.type || 'campaign',
      earnings: post.earnings ? {
        amount: post.earnings.amount || 0,
        milestone: post.earnings.milestone
      } : undefined,
      campaign: post.campaign ? {
        name: post.campaign.name || '',
        budget: post.campaign.budget,
        progress: post.campaign.progress
      } : undefined,
      likeCount: post.likeCount || 0,
      commentCount: post.commentCount || 0,
      shareCount: post.shareCount || 0,
      isLiked: post.isLiked || false,
      isSaved: post.isSaved || false,
      hashtags,
      createdAt: post.createdAt,
      isFeatured: post.isFeatured,
      // Add media mapping
      media: post.media ? post.media.map((m: any) => ({
        url: m.url,
        type: m.type,
        thumbnail: m.thumbnail
      })) : undefined
    };
  }

  private updatePosts(posts: CommunityPost[]): void {
    this.postsSignal.update(current => {
      const existingIds = new Set(current.map(p => p._id));
      const newPosts = posts.filter(p => !existingIds.has(p._id));
      return [...current, ...newPosts];
    });
  }

  private updateInteractionSets(posts: CommunityPost[]): void {
    // Update liked posts
    const liked = new Set(this.likedPostsSignal());
    const saved = new Set(this.savedPostsSignal());

    posts.forEach(post => {
      if (post.isLiked) liked.add(post._id);
      if (post.isSaved) saved.add(post._id);
    });

    this.likedPostsSignal.set(liked);
    this.savedPostsSignal.set(saved);
  }

  private updatePostLike(postId: string, liked: boolean): void {
    // Update liked set
    this.likedPostsSignal.update(set => {
      const newSet = new Set(set);
      if (liked) newSet.add(postId);
      else newSet.delete(postId);
      return newSet;
    });

    // Update post like count
    this.postsSignal.update(posts =>
      posts.map(p => {
        if (p._id === postId) {
          return {
            ...p,
            likeCount: liked ? p.likeCount + 1 : p.likeCount - 1,
            isLiked: liked
          };
        }
        return p;
      })
    );
  }

  private updatePostSave(postId: string, saved: boolean): void {
    this.savedPostsSignal.update(set => {
      const newSet = new Set(set);
      if (saved) newSet.add(postId);
      else newSet.delete(postId);
      return newSet;
    });

    this.postsSignal.update(posts =>
      posts.map(p => {
        if (p._id === postId) {
          return { ...p, isSaved: saved };
        }
        return p;
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

  private updateActivityStats(stats: any): void {
    if (!stats) return;

    this.activityStatsSignal.update(current => ({
      ...current,
      ...stats
    }));
  }

  private startBackgroundRefresh(): void {
    // Refresh trending hashtags every 5 minutes
    interval(300000)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => this.fetchTrendingHashtags())
      )
      .subscribe(hashtags => {
        this.trendingHashtagsSignal.set(hashtags);
      });

    // Simulate live activities
    interval(30000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.postsSignal().length > 0) {
          this.addRandomLiveActivity();
        }
      });
  }

  private fetchTrendingHashtags(): Observable<TrendingHashtag[]> {
    return this.apiService.get<any>(`${this.apiUrl}/trending/hashtags`)
      .pipe(
        map(response => response?.data || response || []),
        catchError(() => of([]))
      );
  }

  private addRandomLiveActivity(): void {
    const posts = this.postsSignal();
    if (posts.length === 0) return;

    const randomPost = posts[Math.floor(Math.random() * posts.length)];
    if (!randomPost.author) return;

    const activities = [
      {
        type: 'like' as const,
        author: 'Someone',
        message: `liked ${randomPost.author.displayName}'s post`
      },
      {
        type: 'comment' as const,
        author: 'A user',
        message: `commented on ${randomPost.author.displayName}'s post`
      },
      {
        type: 'earnings' as const,
        author: 'A promoter',
        message: 'just hit a milestone!'
      }
    ];

    const random = activities[Math.floor(Math.random() * activities.length)];
    
    const newActivity: LiveActivity = {
      id: Date.now().toString(),
      ...random,
      time: this.formatTime(new Date().toISOString())
    };

    this.liveActivitiesSignal.update(activities => 
      [newActivity, ...activities].slice(0, 3)
    );

    // Remove after 5 seconds
    setTimeout(() => {
      this.liveActivitiesSignal.update(activities =>
        activities.filter(a => a.id !== newActivity.id)
      );
    }, 5000);
  }
}