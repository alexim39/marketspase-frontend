import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services';

export interface ForumUser {
  _id: string;
  displayName: string;
  username: string;
  avatar?: string;
  isVerified?: boolean;
  role?: string;
  badge?: string;
}

export interface ForumMediaItem {
  url: string;
  type: 'image' | 'video' | 'audio';
  filename?: string;
  originalName?: string;
  size?: number;
  mimeType?: string;
  thumbnail?: string;
}

export interface ForumPollOption {
  optionId: string;
  label: string;
  voteCount: number;
  hasVoted?: boolean;
}

export interface ForumPoll {
  question: string;
  options: ForumPollOption[];
  allowMultiple: boolean;
  closesAt?: string | null;
  totalVotes: number;
  isClosed: boolean;
}

export interface Thread {
  _id: string;
  title: string;
  content: string;
  author: ForumUser;
  tags: string[];
  topicTags: string[];
  category?: string;
  media?: ForumMediaItem | null;
  mediaItems?: ForumMediaItem[];
  mediaCount?: number;
  isCarousel?: boolean;
  poll?: ForumPoll | null;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  shareCount?: number;
  followerCount?: number;
  engagementScore?: number;
  trendingScore?: number;
  createdAt: string;
  updatedAt: string;
  isLiked?: boolean;
  isFollowing?: boolean;
  isPinned?: boolean;
  pinnedAt?: string;
  pinnedBy?: string;
  pinOrder?: number;
}

export interface Reply {
  _id: string;
  content: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
  author: ForumUser;
  isDeleted?: boolean;
  isLiked?: boolean;
  likeCount?: number;
  parentComment?: string | Comment;
  thread?: string | Thread;
  replyCount?: number;
  isReply?: boolean;
  replies?: Reply[];
}

export interface Comment {
  _id: string;
  content: string;
  author: ForumUser;
  createdAt: string | Date;
  updatedAt?: string | Date;
  likeCount: number;
  replies?: Reply[];
  isLiked?: boolean;
  replyCount?: number;
  isReply?: boolean;
}

export interface CommunityStats {
  totalMembers: number;
  totalDiscussions: number;
  totalComments: number;
  todayDiscussions: number;
  todayComments: number;
  todayActivity: number;
}

export interface PinnedThread extends Thread {
  replyCount?: number;
  url?: string;
}

export interface TrendingThread extends Thread {
  activityCount?: number;
  stats?: {
    views: number;
    likes: number;
    comments: number;
  };
}

export interface ActiveUser {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
  avatarColor: string;
  postCount: number;
  commentCount?: number;
  totalLikes?: number;
  role?: string;
  badge?: string;
}

export interface HotTopic {
  topic: string;
  label: string;
  threadCount: number;
  followerCount: number;
  engagementScore: number;
  latestActivityAt?: string;
}

export interface ForumFollows {
  followedTopics: string[];
  followedThreads: Thread[];
}

@Injectable()
export class ForumService {
  constructor(private apiService: ApiService) {}

  createThread(formData: FormData): Observable<any> {
    return this.apiService.post<any>('forum/threads/new', formData, undefined, true);
  }

  getThreads(params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    category?: string;
    tag?: string;
    topic?: string;
    search?: string;
    following?: boolean;
  }): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }

    return this.apiService.get<any>('forum/threads', httpParams, undefined, true);
  }

  getThreadById(id: string): Observable<any> {
    return this.apiService.get<any>(`forum/thread/${id}`, undefined, undefined, true);
  }

  searchThreads(
    query: string,
    sortBy?: string,
    category?: string,
    pagination?: { page?: number; limit?: number },
    topic?: string
  ): Observable<any> {
    let params = new HttpParams().set('q', query);
    if (sortBy) params = params.set('sortBy', sortBy);
    if (category) params = params.set('category', category);
    if (topic) params = params.set('topic', topic);
    if (pagination?.page !== undefined) params = params.set('page', pagination.page.toString());
    if (pagination?.limit !== undefined) params = params.set('limit', pagination.limit.toString());
    return this.apiService.get<any>('forum/threads/search', params, undefined, true);
  }

  getThreadsByTag(tag: string, params?: { page?: number; limit?: number }): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit !== undefined) httpParams = httpParams.set('limit', params.limit.toString());
    }
    return this.apiService.get<any>(`forum/threads/tags/${tag}`, httpParams, undefined, true);
  }

  updateThread(threadId: string, data: {
    title?: string;
    content?: string;
    tags?: string[];
    topicTags?: string[];
    category?: string;
    poll?: any;
  }): Observable<any> {
    return this.apiService.put<any>(`forum/threads/${threadId}`, data, undefined, true);
  }

  deleteThread(threadId: string, _userId?: string): Observable<any> {
    return this.apiService.delete<any>(`forum/thread/${threadId}/me`, undefined, undefined, true);
  }

  toggleLikeThread(threadId: string, _userId?: string): Observable<any> {
    return this.apiService.put<any>('forum/thread/like', { threadId }, undefined, true);
  }

  followThread(threadId: string): Observable<any> {
    return this.apiService.post<any>(`forum/thread/${threadId}/follow`, {}, undefined, true);
  }

  followTopic(topic: string): Observable<any> {
    return this.apiService.post<any>(`forum/topics/${encodeURIComponent(topic)}/follow`, {}, undefined, true);
  }

  getForumFollows(): Observable<{ success: boolean; data: ForumFollows }> {
    return this.apiService.get<{ success: boolean; data: ForumFollows }>('forum/follows', undefined, undefined, true);
  }

  voteOnPoll(threadId: string, optionIds: string[]): Observable<any> {
    return this.apiService.post<any>(`forum/thread/${threadId}/poll/vote`, { optionIds }, undefined, true);
  }

  getCommunityStats(): Observable<{ success: boolean; data: CommunityStats }> {
    return this.apiService.get<{ success: boolean; data: CommunityStats }>('forum/stats', undefined, undefined, true);
  }

  getPinnedThreads(limit?: number): Observable<{ success: boolean; data: PinnedThread[] }> {
    let params: HttpParams | undefined;
    if (limit) {
      params = new HttpParams().set('limit', limit.toString());
    }
    return this.apiService.get<{ success: boolean; data: PinnedThread[] }>('forum/threads/pinned', params, undefined, true);
  }

  getTrendingThreads(limit?: number, timeframe?: string): Observable<{ success: boolean; data: TrendingThread[] }> {
    let params = new HttpParams();
    if (limit) params = params.set('limit', limit.toString());
    if (timeframe) params = params.set('timeframe', timeframe);
    return this.apiService.get<{ success: boolean; data: TrendingThread[] }>('forum/threads/trending', params, undefined, true);
  }

  getActiveUsers(limit?: number, timeframe?: string): Observable<{ success: boolean; data: ActiveUser[] }> {
    let params = new HttpParams();
    if (limit) params = params.set('limit', limit.toString());
    if (timeframe) params = params.set('timeframe', timeframe);
    return this.apiService.get<{ success: boolean; data: ActiveUser[] }>('forum/users/active', params, undefined, true);
  }

  getPopularTags(limit?: number, timeframe?: string): Observable<{ success: boolean; data: string[] }> {
    let params = new HttpParams();
    if (limit) params = params.set('limit', limit.toString());
    if (timeframe) params = params.set('timeframe', timeframe);
    return this.apiService.get<{ success: boolean; data: string[] }>('forum/tags/popular', params, undefined, true);
  }

  getHotTopics(limit?: number, timeframe?: string): Observable<{ success: boolean; data: HotTopic[] }> {
    let params = new HttpParams();
    if (limit) params = params.set('limit', limit.toString());
    if (timeframe) params = params.set('timeframe', timeframe);
    return this.apiService.get<{ success: boolean; data: HotTopic[] }>('forum/topics/hot', params, undefined, true);
  }

  getCategories(): Observable<any> {
    return this.apiService.get<any>('forum/categories', undefined, undefined, true);
  }

  addComment(threadId: string, content: string, _authorId?: string, parentCommentId?: string): Observable<any> {
    return this.apiService.post<any>('forum/thread/comment/new', { content, threadId, parentCommentId }, undefined, true);
  }

  addCommentReply(content: string, _authorId: string | undefined, commentId: string): Observable<any> {
    return this.apiService.post<any>('forum/thread/comment/reply', { content, commentId }, undefined, true);
  }

  toggleLikeComment(commentId: string, _userId?: string): Observable<any> {
    return this.apiService.post<any>('forum/comments/like', { commentId }, undefined, true);
  }

  toggleLikeReply(replyId: string, _userId?: string): Observable<any> {
    return this.apiService.post<any>('forum/comments/reply/like', { replyId }, undefined, true);
  }

  deleteComment(commentId: string, _userId?: string): Observable<{ success: boolean }> {
    return this.apiService.delete<{ success: boolean }>(`forum/comment/${commentId}/me`, undefined, undefined, true);
  }

  deleteReply(replyId: string, _userId?: string): Observable<{ success: boolean }> {
    return this.apiService.delete<{ success: boolean }>(`forum/reply/${replyId}/me`, undefined, undefined, true);
  }

  updateComment(commentId: string, content: string, _userId?: string): Observable<any> {
    return this.apiService.put<any>(`forum/comments/${commentId}`, { content }, undefined, true);
  }

  pinThread(threadId: string, _userId?: string, pinOrder?: number): Observable<any> {
    return this.apiService.put<any>(`forum/threads/${threadId}/pin`, { pinOrder }, undefined, true);
  }

  unpinThread(threadId: string, _userId?: string): Observable<any> {
    return this.apiService.put<any>(`forum/threads/${threadId}/unpin`, {}, undefined, true);
  }

  togglePinThread(threadId: string, _userId?: string): Observable<any> {
    return this.apiService.put<any>(`forum/threads/${threadId}/toggle-pin`, {}, undefined, true);
  }

  getAllPinnedThreads(includeStats: boolean = true): Observable<any> {
    const params = new HttpParams().set('includeStats', includeStats.toString());
    return this.apiService.get<any>('forum/threads/pinned/all', params, undefined, true);
  }

  reorderPinnedThreads(_userId: string, threadOrders: Array<{ threadId: string; order: number }>): Observable<any> {
    return this.apiService.put<any>('forum/threads/pinned/reorder', { threadOrders }, undefined, true);
  }
}
