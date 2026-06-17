import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, finalize } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../../../shared-services/src/public-api';

export interface AdminPostAuthor {
  _id: string;
  username: string;
  displayName: string;
  avatar: string;
  role: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
  isDeleted?: boolean;
}

export interface AdminPostListItem {
  _id: string;
  author: AdminPostAuthor | null;
  content: string;
  type: string;
  source: string;
  status: string;
  isFeatured: boolean;
  featuredUntil: string | null;
  featuredBy: string | null;
  campaign?: { name: string } | null;
  product?: { name: string } | null;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  mediaCount: number;
  primaryMediaType: string | null;
  hashtags: Array<{ tag: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPostDetail {
  _id: string;
  author: AdminPostAuthor | null;
  content: string;
  type: string;
  source: string;
  status: string;
  isFeatured: boolean;
  featuredUntil: string | null;
  featuredBy: { _id: string; displayName: string; username: string } | null;
  campaign?: { name: string; status?: string; budget?: number; currency?: string } | null;
  product?: { name: string; price?: number; currency?: string } | null;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  mediaCount: number;
  primaryMediaType: string | null;
  hashtags: Array<{ tag: string }>;
  createdAt: string;
  updatedAt: string;
  challenge?: { name?: string; tag?: string; reward?: number };
  tip?: { content?: string };
  earnings?: { amount?: number; campaignName?: string };
  media: Array<{ url: string; type: string; thumbnail?: string; altText?: string; order?: number }>;
  mentions: Array<{ userId?: string; username?: string; displayName?: string }>;
  settings?: { postAnonymously?: boolean; disableComments?: boolean; allowExternalShare?: boolean };
  moderation?: { reviewedBy?: string; reviewedAt?: string; reason?: string; flagReason?: string };
  recommendation?: { score?: number; reason?: string };
  trendingScore: number;
  saveCount: number;
  chatCount: number;
  socialMetrics?: { externalShares?: number; externalClicks?: number; profileVisits?: number };
  reach?: { impressions?: number; uniqueViews?: number };
}

export interface AdminPostPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface AdminPostListResponse {
  posts: AdminPostListItem[];
  pagination: AdminPostPagination;
}

export interface AdminPostFilters {
  page: number;
  limit: number;
  status?: string;
  type?: string;
  source?: string;
  search?: string;
  sort?: string;
  isFeatured?: string;
  authorId?: string;
}

@Injectable({ providedIn: 'root' })
export class PostService {
  private apiService = inject(ApiService);
  private readonly apiUrl = 'api/v1/feed/admin';

  private loadingSignal = signal(false);
  readonly loading = this.loadingSignal.asReadonly();

  getPosts(filters: AdminPostFilters): Observable<AdminPostListResponse> {
    let params = new HttpParams()
      .set('page', String(filters.page))
      .set('limit', String(filters.limit));

    if (filters.status) params = params.set('status', filters.status);
    if (filters.type) params = params.set('type', filters.type);
    if (filters.source) params = params.set('source', filters.source);
    if (filters.search?.trim()) params = params.set('search', filters.search.trim());
    if (filters.sort) params = params.set('sort', filters.sort);
    if (filters.isFeatured !== undefined && filters.isFeatured !== '') {
      params = params.set('isFeatured', filters.isFeatured);
    }
    if (filters.authorId) params = params.set('authorId', filters.authorId);

    this.loadingSignal.set(true);

    return this.apiService
      .get<{ success: boolean; data: AdminPostListResponse }>(`${this.apiUrl}/posts`, params, undefined, true)
      .pipe(
        map((response) => ({
          posts: response?.data?.posts || [],
          pagination: response?.data?.pagination || { page: 1, limit: 20, total: 0, pages: 0 }
        })),
        finalize(() => this.loadingSignal.set(false))
      );
  }

  getPostDetail(postId: string): Observable<AdminPostDetail> {
    this.loadingSignal.set(true);
    return this.apiService
      .get<{ success: boolean; data: AdminPostDetail }>(`${this.apiUrl}/posts/${postId}`, undefined, undefined, true)
      .pipe(
        map((response) => response?.data as AdminPostDetail),
        finalize(() => this.loadingSignal.set(false))
      );
  }

  toggleFeature(postId: string, isFeatured: boolean, durationDays: number = 7): Observable<{ isFeatured: boolean; featuredUntil: string }> {
    return this.apiService
      .patch<{ success: boolean; data: { isFeatured: boolean; featuredUntil: string } }>(
        `${this.apiUrl}/posts/${postId}/feature`,
        { isFeatured, durationDays },
        undefined,
        true
      )
      .pipe(map((response) => response?.data));
  }

  deletePost(postId: string, permanent: boolean = false): Observable<any> {
    const params = permanent ? `?permanent=true` : '';
    return this.apiService
      .delete<{ success: boolean; data: any }>(
        `${this.apiUrl}/posts/${postId}${params}`,
        undefined,
        undefined,
        true
      );
  }

  // ---- Spotlight Rotation API ----

  getSpotlightConfig(): Observable<{ config: any | null; activePost: any | null }> {
    return this.apiService
      .get<{ success: boolean; data: { config: any; activePost: any } }>(`${this.apiUrl}/spotlight`, undefined, undefined, true)
      .pipe(map((response) => response?.data || { config: null, activePost: null }));
  }

  updateSpotlightConfig(postIds: string[], intervalMinutes: number = 120): Observable<any> {
    return this.apiService
      .put<{ success: boolean; data: any }>(
        `${this.apiUrl}/spotlight`,
        { postIds, intervalMinutes },
        undefined,
        true
      )
      .pipe(map((response) => response?.data));
  }

  clearSpotlight(): Observable<any> {
    return this.apiService
      .delete<{ success: boolean; data: any }>(`${this.apiUrl}/spotlight`, undefined, undefined, true);
  }
}
