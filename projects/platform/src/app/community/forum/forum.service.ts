import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../../../../shared-services/src/public-api';

export interface Thread {
  _id: string;
  title: string;
  content: string;
  author: {
    _id: string;
    displayName: string;
    username: string;
    avatar?: string;
  };
  tags: string[];
  media?: {
    url: string;
    type: 'image' | 'video' | 'audio';
    filename: string;
    originalName: string;
    size: number;
  };
  likeCount: number;
  commentCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  isLiked?: boolean;
  isPinned?: boolean;        // NEW
  pinnedAt?: string;          // NEW
  pinnedBy?: string;          // NEW
  pinOrder?: number;      
}

export interface Comment {
  _id: string;
  content: string;
  author: User;
  createdAt: Date;
  likeCount: number;
  replies?: Reply[]; 
  isLiked?: boolean;
  replyCount?: number;
  isReply?: boolean;
}

export interface User {
  _id: string;
  displayName: string;
  username: string;
  avatar: string;
  isVerified?: boolean;
}

export interface Reply {
  _id: string;  
  content: string;
  createdAt: Date;
  author: User;
  isDeleted?: boolean;
  isLiked?: boolean;
  likeCount?: number;
  parentComment?: Comment;
  thread?: Thread;
  updatedAt?: Date;
  replyCount?: number;
}

export interface CommunityStats {
  totalMembers: number;
  totalDiscussions: number;
  totalComments: number;
  todayDiscussions: number;
  todayComments: number;
  todayActivity: number;
}

export interface PinnedThread {
  _id: string;
  title: string;
  replyCount: number;
  author: {
    displayName: string;
    username: string;
    avatar?: string;
  };
  createdAt: string;
  url: string;
}

export interface TrendingThread {
  _id: string;
  title: string;
  tags: string[];
  activityCount: number;
  author: {
    displayName: string;
    username: string;
    avatar?: string;
  };
  createdAt: string;
  stats: {
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
}

export interface User {
  _id: string;
  displayName: string;
  username: string;
  avatar: string;
  isVerified?: boolean;
  role?: string;              // NEW - for permission checks
}

@Injectable()
export class ForumService {
  constructor(private apiService: ApiService) {}

  // Thread Operations
  createThread(formData: FormData): Observable<Thread> {
    return this.apiService.post<Thread>('forum/threads/new', formData, undefined, true);
  }

  getThreads(params?: { page?: number; limit?: number; sortBy?: string }): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit !== undefined) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
    }
    return this.apiService.get<any>('forum/threads', httpParams || undefined, undefined, true);
  }

  getThreadById(id: string): Observable<any> {
    return this.apiService.get<any>(`forum/thread/${id}`, undefined, undefined, true);
  }

 searchThreads(query: string, sortBy?: string, category?: string, pagination?: { page?: number; limit?: number }): Observable<any> {
  let params = new HttpParams().set('q', query);
  if (sortBy) params = params.set('sortBy', sortBy);
  if (category) params = params.set('category', category);
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

  updateThread(threadId: string, data: { title?: string; content?: string; tags?: string[] }, userId: string): Observable<Thread> {
    return this.apiService.put<Thread>(`forum/threads/${threadId}`, { ...data, userId }, undefined, true);
  }

  deleteThread(threadId: string, userId: string): Observable<any> {
    return this.apiService.delete<any>(`forum/thread/${threadId}/${userId}`, undefined, undefined, true);
  }

  toggleLikeThread(threadId: string, userId: string): Observable<any> {
    return this.apiService.put<any>(`forum/thread/like`, { threadId, userId }, undefined, true);
  }

  // Community Stats
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
    let params: HttpParams | undefined;
    if (limit || timeframe) {
      params = new HttpParams();
      if (limit) params = params.set('limit', limit.toString());
      if (timeframe) params = params.set('timeframe', timeframe);
    }
    return this.apiService.get<{ success: boolean; data: TrendingThread[] }>('forum/threads/trending', params, undefined, true);
  }

  getActiveUsers(limit?: number, timeframe?: string): Observable<{ success: boolean; data: ActiveUser[] }> {
    let params: HttpParams | undefined;
    if (limit || timeframe) {
      params = new HttpParams();
      if (limit) params = params.set('limit', limit.toString());
      if (timeframe) params = params.set('timeframe', timeframe);
    }
    return this.apiService.get<{ success: boolean; data: ActiveUser[] }>('forum/users/active', params, undefined, true);
  }

  getPopularTags(limit?: number, timeframe?: string): Observable<{ success: boolean; data: string[] }> {
    let params: HttpParams | undefined;
    if (limit || timeframe) {
      params = new HttpParams();
      if (limit) params = params.set('limit', limit.toString());
      if (timeframe) params = params.set('timeframe', timeframe);
    }
    return this.apiService.get<{ success: boolean; data: string[] }>('forum/tags/popular', params, undefined, true);
  }

  getCategories(): Observable<any> {
    return this.apiService.get<any>('forum/categories', undefined, undefined, true);
  }

  // Comment Operations
  addComment(threadId: string, content: string, authorId: string, parentCommentId?: string): Observable<any> {
    return this.apiService.post<Comment>(`forum/thread/comment/new`, { content, threadId, authorId, parentCommentId }, undefined, true);
  }

  addCommentReply(content: string, authorId: string, commentId: string): Observable<any> {
    return this.apiService.post<Comment>(`forum/thread/comment/reply`, { content, commentId, authorId }, undefined, true);
  }

  toggleLikeComment(commentId: string, userId: string): Observable<Comment> {
    return this.apiService.post<Comment>(`forum/comments/like`, { commentId, userId }, undefined, true);
  }

  toggleLikeReply(replyId: string, userId: string): Observable<Comment> {
    return this.apiService.post<Comment>(`forum/comments/reply/like`, { replyId, userId }, undefined, true);
  }

  deleteComment(commentId: string, userId: string): Observable<{ success: boolean }> {
    return this.apiService.delete<{ success: boolean }>(`forum/comment/${commentId}/${userId}`, undefined, undefined, true);
  }

  deleteReply(replyId: string, userId: string): Observable<{ success: boolean }> {
    return this.apiService.delete<{ success: boolean }>(`forum/reply/${replyId}/${userId}`, undefined, undefined, true);
  }

  updateComment(commentId: string, content: string, userId: string): Observable<Comment> {
    return this.apiService.put<Comment>(`forum/comments/${commentId}`, { content, userId }, undefined, true);
  }

  /**
   * Pin a thread (Admin/Moderator only)
   */
  pinThread(threadId: string, userId: string, pinOrder?: number): Observable<any> {
    return this.apiService.put<any>(`forum/threads/${threadId}/pin`, { userId, pinOrder }, undefined, true);
  }

  /**
   * Unpin a thread (Admin/Moderator only)
   */
  unpinThread(threadId: string, userId: string): Observable<any> {
    return this.apiService.put<any>(`forum/threads/${threadId}/unpin`, { userId }, undefined, true);
  }

  /**
   * Toggle pin status of a thread
   */
  togglePinThread(threadId: string, userId: string): Observable<any> {
    return this.apiService.put<any>(`forum/threads/${threadId}/toggle-pin`, { userId }, undefined, true);
  }

  /**
   * Get all pinned threads with full details
   */
  getAllPinnedThreads(includeStats: boolean = true): Observable<any> {
    const params = new HttpParams().set('includeStats', includeStats.toString());
    return this.apiService.get<any>('forum/threads/pinned/all', params, undefined, true);
  }

  /**
   * Reorder pinned threads
   */
  reorderPinnedThreads(userId: string, threadOrders: Array<{ threadId: string; order: number }>): Observable<any> {
    return this.apiService.put<any>('forum/threads/pinned/reorder', { userId, threadOrders }, undefined, true);
  }

}