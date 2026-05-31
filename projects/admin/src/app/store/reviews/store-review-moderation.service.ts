import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../../shared-services/src/public-api';

export type ReviewModerationStatus = 'pending' | 'approved' | 'rejected' | 'flagged';
export type ReviewModerationAction = 'approve' | 'reject' | 'clear_flags' | 'feature' | 'respond' | 'delete';

export interface ReviewModerationFilters {
  page?: number;
  limit?: number;
  status?: ReviewModerationStatus | 'all';
  search?: string;
  rating?: number | null;
  storeId?: string;
  reportedOnly?: boolean;
  featured?: 'all' | 'true' | 'false';
}

export interface ReviewReporter {
  _id?: string;
  displayName: string;
  email?: string;
}

export interface ReviewReportReason {
  reason: string;
  reportedAt?: string;
  reporter?: ReviewReporter | null;
}

export interface ReviewUserSummary {
  _id: string;
  displayName: string;
  username?: string;
  email?: string;
  avatar?: string | null;
}

export interface ReviewProductSummary {
  _id: string;
  name: string;
  price?: number;
  slug?: string;
  averageRating?: number;
  ratingCount?: number;
  image?: string | null;
}

export interface ReviewStoreSummary {
  _id: string;
  name: string;
  storeLink?: string;
  logo?: string | null;
}

export interface ReviewModeratorSummary {
  _id: string;
  displayName: string;
  email?: string;
}

export interface AdminStoreReview {
  _id: string;
  title: string;
  comment: string;
  rating: number;
  status: ReviewModerationStatus;
  helpfulCount: number;
  reportCount: number;
  verifiedPurchase: boolean;
  isFeatured: boolean;
  moderationNotes?: string;
  moderatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  images: string[];
  response?: {
    content?: string;
    createdAt?: string;
    responderName?: string;
  } | null;
  metadata?: {
    device?: string;
    platform?: string;
    ipAddress?: string;
    userAgent?: string;
  };
  user?: ReviewUserSummary | null;
  product?: ReviewProductSummary | null;
  store?: ReviewStoreSummary | null;
  moderatedBy?: ReviewModeratorSummary | null;
  reportReasons: ReviewReportReason[];
}

export interface ReviewModerationSummary {
  totalReviews: number;
  pending: number;
  approved: number;
  rejected: number;
  flagged: number;
  reported: number;
  featured: number;
}

export interface ReviewModerationQueueResponse {
  success: boolean;
  data: AdminStoreReview[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasMore: boolean;
  };
  summary: ReviewModerationSummary;
}

export interface StorefrontReleaseRequestParticipant {
  _id?: string;
  displayName?: string;
  username?: string;
  email?: string;
  role?: string;
}

export interface StorefrontReleaseRequestItem {
  product?: {
    _id?: string;
    name?: string;
    price?: number;
    images?: Array<{ url?: string }>;
  } | null;
  promoterId?: StorefrontReleaseRequestParticipant | null;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  commissionEarned?: number;
}

export interface StorefrontReleaseRequestOrder {
  _id: string;
  orderNumber?: string;
  totalAmount: number;
  currency?: string;
  marketerReservedAmount?: number;
  promoterReservedAmount?: number;
  escrowStatus?: string;
  paymentStatus?: string;
  orderStatus?: string;
  deliveredAt?: string;
  createdAt?: string;
  store?: {
    _id?: string;
    name?: string;
    storeLink?: string;
    logo?: string;
  } | null;
  marketer?: StorefrontReleaseRequestParticipant | null;
  customer?: StorefrontReleaseRequestParticipant | null;
  guestCustomer?: {
    name?: string;
    email?: string;
    phone?: string;
  } | null;
  items: StorefrontReleaseRequestItem[];
  releaseRequest?: {
    status?: 'requested' | 'approved' | 'rejected';
    requestedBy?: StorefrontReleaseRequestParticipant | null;
    requestedByRole?: string;
    requestedAt?: string;
    deliveryStatus?: string;
    buyerReceived?: boolean;
    note?: string;
    reviewedBy?: StorefrontReleaseRequestParticipant | null;
    reviewedAt?: string;
    reviewNote?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class StoreReviewModerationService {
  private readonly apiService = inject(ApiService);
  private readonly apiUrl = 'api/v1/stores/admin';

  getReviews(filters: ReviewModerationFilters): Observable<ReviewModerationQueueResponse> {
    let params = new HttpParams();

    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '' || value === 'all') {
        return;
      }

      params = params.set(key, String(value));
    });

    return this.apiService.get<ReviewModerationQueueResponse>(`${this.apiUrl}/reviews`, params, undefined, true);
  }

  moderateReview(
    reviewId: string,
    payload: {
      action: ReviewModerationAction;
      note?: string;
      featured?: boolean;
      response?: string;
    }
  ): Observable<{ success: boolean; message: string; data?: AdminStoreReview | null }> {
    return this.apiService.patch<{ success: boolean; message: string; data?: AdminStoreReview | null }>(
      `${this.apiUrl}/reviews/${reviewId}/moderate`,
      payload,
      undefined,
      true
    );
  }

  getReleaseRequests(status: 'all' | 'requested' | 'approved' | 'rejected' = 'requested', limit: number = 30, skip: number = 0): Observable<{
    success: boolean;
    data: {
      orders: StorefrontReleaseRequestOrder[];
      pagination: {
        total: number;
        limit: number;
        skip: number;
        hasMore: boolean;
      };
    };
  }> {
    let params = new HttpParams()
      .set('status', status)
      .set('limit', String(limit))
      .set('skip', String(skip));

    return this.apiService.get<{
      success: boolean;
      data: {
        orders: StorefrontReleaseRequestOrder[];
        pagination: {
          total: number;
          limit: number;
          skip: number;
          hasMore: boolean;
        };
      };
    }>('api/v1/stores/storefront/orders/release-requests', params, undefined, true);
  }

  reviewReleaseRequest(orderId: string, decision: 'approved' | 'rejected', note?: string): Observable<{
    success: boolean;
    message: string;
    data?: {
      order: StorefrontReleaseRequestOrder;
    };
  }> {
    return this.apiService.post<{
      success: boolean;
      message: string;
      data?: {
        order: StorefrontReleaseRequestOrder;
      };
    }>(
      `api/v1/stores/storefront/orders/${orderId}/release-review`,
      { decision, note },
      undefined,
      true
    );
  }
}
