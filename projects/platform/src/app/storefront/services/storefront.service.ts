// store.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../../../../shared-services/src/public-api';
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

@Injectable()
export class StorefrontService {
  private snackBar = inject(MatSnackBar);
  private apiService = inject(ApiService);
  private readonly apiUrl = 'stores';
  

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

  getProductById(productId: string): Observable<{ data: Product }> {
    return this.apiService.get<{ data: Product }>(`${this.apiUrl}/storefront/products/${productId}/detail`, undefined, undefined, true);
  }

  getProductReviews(productId: string, params: { page: number; limit: number }): Observable<{ data: any[] }> {
    return this.apiService.get<{ data: any[] }>(`${this.apiUrl}/storefront/products/${productId}/reviews`, undefined, undefined, true);
  }

  getRelatedProducts(productId: string, params: { limit: number }): Observable<{ data: Product[] }> {
    return this.apiService.get<{ data: Product[] }>(`${this.apiUrl}/storefront/products/${productId}/related`, undefined, undefined, true);
  }

  getStoreById(storeId: string): Observable<{ data: Store }> {
    return this.apiService.get<{ data: Store }>(`${this.apiUrl}/storefront/store/${storeId}`, undefined, undefined, true);
  }

}