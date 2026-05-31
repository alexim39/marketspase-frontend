import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../../shared-services/src/public-api';

export type CollaborationReviewStatus = 'published' | 'flagged' | 'hidden' | 'removed';
export type CollaborationReviewAction = 'publish' | 'hide' | 'remove' | 'restore';

export interface CollaborationReviewModerationFilters {
  page?: number;
  limit?: number;
  status?: CollaborationReviewStatus | 'all';
  search?: string;
  flaggedOnly?: boolean;
}

export interface CollaborationReviewActor {
  _id: string;
  displayName: string;
  username?: string;
  avatar?: string;
  role?: string;
  isVerified?: boolean;
}

export interface CollaborationReviewFlag {
  user?: string;
  reason?: string;
  details?: string;
  createdAt?: string;
}

export interface AdminCollaborationReview {
  _id: string;
  reviewer?: CollaborationReviewActor | null;
  reviewee?: CollaborationReviewActor | null;
  campaign?: { _id: string; title: string; status?: string } | null;
  promotion?: { _id: string; upi: string; status?: string } | null;
  relationshipType: string;
  rating: number;
  title?: string;
  comment?: string;
  status: CollaborationReviewStatus;
  flagCount: number;
  flags?: CollaborationReviewFlag[];
  moderationNotes?: string;
  adminResponse?: string;
  createdAt: string;
}

export interface CollaborationReviewQueueResponse {
  success: boolean;
  data: AdminCollaborationReview[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary: {
    totalReviews: number;
    published: number;
    flagged: number;
    hidden: number;
    removed: number;
  };
}

@Injectable({ providedIn: 'root' })
export class UserReviewModerationService {
  private readonly apiService = inject(ApiService);

  getReviews(filters: CollaborationReviewModerationFilters): Observable<CollaborationReviewQueueResponse> {
    let params = new HttpParams();

    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '' || value === 'all') {
        return;
      }

      params = params.set(key, String(value));
    });

    return this.apiService.get<CollaborationReviewQueueResponse>(
      'api/v1/collaboration/admin/reviews',
      params,
      undefined,
      true
    );
  }

  moderateReview(reviewId: string, payload: {
    action: CollaborationReviewAction;
    note?: string;
    response?: string;
  }): Observable<{ success: boolean; message: string; data?: AdminCollaborationReview | null }> {
    return this.apiService.patch<{ success: boolean; message: string; data?: AdminCollaborationReview | null }>(
      `api/v1/collaboration/admin/reviews/${reviewId}`,
      payload,
      undefined,
      true
    );
  }
}
