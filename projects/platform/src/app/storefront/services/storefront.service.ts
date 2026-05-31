// store.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '@shared/services';
import { Product, Store } from '../../store/models';

export interface StoreResponse {
  success: boolean;
  data: Store | null;
  message?: string;
  analytics?: StoreAnalytics;
  popularProducts?: Product[];
}


export interface StoreAnalytics {
  dailyViews: DailyView[];
  salesData: SalesData;
  promoterPerformance: PromoterPerformance[];
}

export interface DailyView {
  date: string;
  views: number;
  uniqueVisitors: number;
  promoterTraffic: number;
}

export interface SalesData {
  totalRevenue: number;
  promoterDrivenSales: number;
  conversionRate: number;
  topProducts: TopProduct[];
}

export interface TopProduct {
  product: Product;
  sales: number;
  revenue: number;
}

export interface PromoterPerformance {
  promoter: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  clicks: number;
  conversions: number;
  commissionEarned: number;
}


export interface ProductImage {
  url: string;
  altText?: string;
  isMain: boolean;
  order: number;
}

export interface StorefrontProductReview {
  _id: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  verifiedPurchase?: boolean;
  helpfulCount?: number;
  reportCount?: number;
  isFeatured?: boolean;
  isOwnReview?: boolean;
  isHelpfulByCurrentUser?: boolean;
  isReportedByCurrentUser?: boolean;
  status?: 'pending' | 'approved' | 'rejected' | 'flagged' | string;
  response?: {
    content: string;
    createdAt: string | Date;
    responderName?: string;
  } | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  user?: {
    _id: string;
    displayName?: string;
    avatar?: string | null;
  } | null;
}

export interface StorefrontProductReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: Record<number, number>;
  verifiedCount?: number;
  withImagesCount?: number;
}

export interface StorefrontProductReviewListResponse {
  success?: boolean;
  data: StorefrontProductReview[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary?: StorefrontProductReviewSummary;
}

export interface StorefrontProductReviewMutationResponse {
  success?: boolean;
  message?: string;
  data: StorefrontProductReview | null;
  summary?: {
    averageRating: number;
    totalReviews: number;
  };
}

@Injectable()
export class StorefrontService {
  private snackBar = inject(MatSnackBar);
  private apiService = inject(ApiService);
  private readonly apiUrl = 'api/v1/stores';
  

  // Cache for store data (simple in-memory cache)
  private storeCache = new Map<string, { data: Store; timestamp: number }>();
  private cacheDuration = 5 * 60 * 1000; // 5 minutes cache

  
  /**
   * Clear store cache
   */
  clearCache(storeLink?: string): void {
    if (storeLink) {
      this.storeCache.delete(storeLink);
    } else {
      this.storeCache.clear();
    }
  }

  /**
   * Get store by store link
   */
  getStoreByLink(storeLink: string, includeAnalytics: boolean = true): Observable<StoreResponse> {
    // Check cache first
    const cached = this.storeCache.get(storeLink);
    if (cached && (Date.now() - cached.timestamp) < this.cacheDuration) {
      return new Observable(observer => {
        observer.next({ success: true, data: cached.data });
        observer.complete();
      });
    }

    const endpoint = `${this.apiUrl}/storefront/link/${storeLink}`;
    const params = new HttpParams().set('includeAnalytics', includeAnalytics.toString());

    return this.apiService.get<StoreResponse>(endpoint, params, undefined, true ).pipe(
      tap(response => {
        if (response.success && response.data) {
          // Cache the store data
          this.storeCache.set(storeLink, {
            data: response.data,
            timestamp: Date.now()
          });
        }
      }),
      catchError(error => {
        console.error('Error fetching store:', error);
        this.snackBar.open(
          error.error?.message || 'Failed to load store',
          'Close',
          { duration: 5000, panelClass: ['error-snackbar'] }
        );
        throw error;
      })
    );
  }

  /**
   * Get store products with pagination and filtering
   */
  getStoreProducts(
    storeId: string,
    options: {
      page?: number;
      limit?: number;
      category?: string;
      sortBy?: string;
      minPrice?: number;
      maxPrice?: number;
      inStock?: boolean;
      featured?: boolean;
      search?: string;
    } = {}
  ): Observable<{ success: boolean; data: Product[]; total: number; page: number; totalPages: number }> {
    const params: any = {};
    
    // Add pagination
    params.page = options.page?.toString() || '1';
    params.limit = options.limit?.toString() || '12';
    
    // Add filters
    if (options.category) params.category = options.category;
    if (options.sortBy) params.sortBy = options.sortBy;
    if (options.minPrice !== undefined) params.minPrice = options.minPrice.toString();
    if (options.maxPrice !== undefined) params.maxPrice = options.maxPrice.toString();
    if (options.inStock !== undefined) params.inStock = options.inStock.toString();
    if (options.featured !== undefined) params.featured = options.featured.toString();
    if (options.search) params.search = options.search;
    
    return this.apiService.get<{ success: boolean; data: Product[]; total: number; page: number; totalPages: number }>(
      `${this.apiUrl}/storefront/${storeId}/products`,
      params, undefined, true
    ).pipe(
      catchError(error => {
        this.snackBar.open('Failed to load store products', 'Close', { duration: 3000 });
        throw error;
      })
    );
  }

  getProductById(
    productId: string,
    trackingContext: {
      ref?: string | null;
      promoter?: string | null;
      clicked?: boolean;
      trackingCode?: string | null;
    } = {}
  ): Observable<{ data: Product }> {
    let params = new HttpParams();

    if (trackingContext.ref) {
      params = params.set('ref', trackingContext.ref);
    }
    if (trackingContext.promoter) {
      params = params.set('promoter', trackingContext.promoter);
    }
    if (trackingContext.clicked) {
      params = params.set('clicked', '1');
    }
    if (trackingContext.trackingCode) {
      params = params.set('trackingCode', trackingContext.trackingCode);
    }

    return this.apiService.get<{ data: Product }>(
      `${this.apiUrl}/storefront/products/${productId}/detail`,
      params,
      undefined,
      true
    );
  }

  getProductReviews(
    productId: string,
    params: {
      page?: number;
      limit?: number;
      sortBy?: 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful';
      rating?: number;
      verifiedOnly?: boolean;
      withImagesOnly?: boolean;
    } = {}
  ): Observable<StorefrontProductReviewListResponse> {
    let queryParams = new HttpParams();

    if (params.page) queryParams = queryParams.set('page', String(params.page));
    if (params.limit) queryParams = queryParams.set('limit', String(params.limit));
    if (params.sortBy) queryParams = queryParams.set('sortBy', params.sortBy);
    if (params.rating) queryParams = queryParams.set('rating', String(params.rating));
    if (params.verifiedOnly !== undefined) queryParams = queryParams.set('verifiedOnly', String(params.verifiedOnly));
    if (params.withImagesOnly !== undefined) queryParams = queryParams.set('withImagesOnly', String(params.withImagesOnly));

    return this.apiService.get<StorefrontProductReviewListResponse>(
      `${this.apiUrl}/storefront/products/${productId}/reviews`,
      queryParams,
      undefined,
      true
    );
  }

  getCurrentUserProductReview(productId: string): Observable<{ success?: boolean; data: StorefrontProductReview | null }> {
    return this.apiService.get<{ success?: boolean; data: StorefrontProductReview | null }>(
      `${this.apiUrl}/storefront/products/${productId}/reviews/me`,
      undefined,
      undefined,
      true
    );
  }

  createProductReview(
    productId: string,
    payload: {
      rating: number;
      title?: string;
      comment: string;
    }
  ): Observable<StorefrontProductReviewMutationResponse> {
    return this.apiService.post<StorefrontProductReviewMutationResponse>(
      `${this.apiUrl}/storefront/products/${productId}/reviews`,
      payload,
      undefined,
      true
    );
  }

  updateProductReview(
    reviewId: string,
    payload: {
      rating?: number;
      title?: string;
      comment?: string;
    }
  ): Observable<StorefrontProductReviewMutationResponse> {
    return this.apiService.put<StorefrontProductReviewMutationResponse>(
      `${this.apiUrl}/storefront/reviews/${reviewId}`,
      payload,
      undefined,
      true
    );
  }

  deleteProductReview(reviewId: string): Observable<{ success?: boolean; message?: string; summary?: { averageRating: number; totalReviews: number } }> {
    return this.apiService.delete<{ success?: boolean; message?: string; summary?: { averageRating: number; totalReviews: number } }>(
      `${this.apiUrl}/storefront/reviews/${reviewId}`,
      undefined,
      undefined,
      true
    );
  }

  toggleReviewHelpful(reviewId: string): Observable<{ success?: boolean; message?: string; data?: { helpfulCount: number; isHelpfulByCurrentUser: boolean } }> {
    return this.apiService.post<{ success?: boolean; message?: string; data?: { helpfulCount: number; isHelpfulByCurrentUser: boolean } }>(
      `${this.apiUrl}/storefront/reviews/${reviewId}/helpful`,
      {},
      undefined,
      true
    );
  }

  reportReview(reviewId: string, reason: string): Observable<{ success?: boolean; message?: string }> {
    return this.apiService.post<{ success?: boolean; message?: string }>(
      `${this.apiUrl}/storefront/reviews/${reviewId}/report`,
      { reason },
      undefined,
      true
    );
  }

  getRelatedProducts(productId: string, params: { limit: number }): Observable<{ data: Product[] }> {
    return this.apiService.get<{ data: Product[] }>(`${this.apiUrl}/storefront/products/${productId}/related`, undefined, undefined, true);
  }

  getStoreById(storeId: string): Observable<{ data: Store }> {
    return this.apiService.get<{ data: Store }>(`${this.apiUrl}/storefront/store/${storeId}`, undefined, undefined, true);
  }

  createStorefrontOrder(payload: any): Observable<any> {
    return this.apiService.post<any>(`${this.apiUrl}/storefront/orders`, payload, undefined, true);
  }

  confirmStorefrontPayment(orderId: string, payload: any): Observable<any> {
    return this.apiService.post<any>(`${this.apiUrl}/storefront/orders/${orderId}/confirm-payment`, payload, undefined, true);
  }

  confirmStorefrontDelivery(orderId: string, payload: any): Observable<any> {
    return this.apiService.post<any>(`${this.apiUrl}/storefront/orders/${orderId}/confirm-delivery`, payload, undefined, true);
  }

  subscribeStoreNewsletter(storeId: string, email: string, payload?: { source?: string; referrer?: string; metadata?: any }): Observable<any> {
    return this.apiService.post<any>(
      `${this.apiUrl}/storefront/${storeId}/subscribers`,
      { email, ...(payload || {}) },
      undefined,
      true
    );
  }

}
