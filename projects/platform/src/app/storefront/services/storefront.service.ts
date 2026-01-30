// store.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
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

// export interface StoreModel {
//   _id: string;
//   owner: string;
//   name: string;
//   description?: string;
//   logo?: string;
//   category?: string;
//   isVerified: boolean;
//   verificationTier: 'basic' | 'premium';
//   storeLink: string;
//   whatsappNumber?: string;
//   whatsappTemplates?: string[];
//   analytics: {
//     totalViews: number;
//     totalSales: number;
//     conversionRate: number;
//     promoterTraffic: number;
//   };
//   activeCampaigns?: string[];
//   storeProducts?: string[];
//   createdAt: string;
//   updatedAt: string;
//   ownerDetails?: {
//     name: string;
//     email: string;
//     profilePicture?: string;
//   };
// }

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

// export interface ProductModel {
//   _id: string;
//   name: string;
//   description?: string;
//   price: number;
//   originalPrice?: number;
//   images?: ProductImage[];
//   category: string;
//   tags?: string[];
//   quantity: number;
//   manageStock: boolean;
//   lowStockAlert: number;
//   averageRating: number;
//   ratingCount: number;
//   viewCount: number;
//   purchaseCount: number;
//   isActive: boolean;
//   isFeatured: boolean;
//   createdAt: string;
//   updatedAt: string;
// }

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
   * Get store by ID
   */
//   getStoreById(storeId: string): Observable<StoreResponse> {
//     return this.http.get<StoreResponse>(`${this.apiUrl}/stores/${storeId}`).pipe(
//       catchError(error => {
//         console.error('Error fetching store by ID:', error);
//         this.snackBar.open(
//           'Failed to load store details',
//           'Close',
//           { duration: 3000 }
//         );
//         throw error;
//       })
//     );
//   }

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
        console.error('Error fetching store products:', error);
        this.snackBar.open(
          'Failed to load store products',
          'Close',
          { duration: 3000 }
        );
        throw error;
      })
    );
  }

  /**
   * Get store categories
   */
//   getStoreCategories(storeId: string): Observable<{ success: boolean; data: string[] }> {
//     return this.http.get<{ success: boolean; data: string[] }>(
//       `${this.apiUrl}/stores/${storeId}/categories`
//     ).pipe(
//       catchError(error => {
//         console.error('Error fetching store categories:', error);
//         throw error;
//       })
//     );
//   }

//   /**
//    * Increment store view count
//    */
//   incrementStoreViews(storeId: string, referrer?: string): Observable<{ success: boolean }> {
//     return this.http.post<{ success: boolean }>(
//       `${this.apiUrl}/stores/${storeId}/views`,
//       { referrer }
//     ).pipe(
//       catchError(error => {
//         console.error('Error incrementing store views:', error);
//         return [{ success: false }];
//       })
//     );
//   }

  /**
   * Search stores
   */
//   searchStores(query: string, page: number = 1, limit: number = 10): Observable<{
//     success: boolean;
//     data: StoreModel[];
//     total: number;
//     page: number;
//     totalPages: number;
//   }> {
//     return this.http.get<{
//       success: boolean;
//       data: StoreModel[];
//       total: number;
//       page: number;
//       totalPages: number;
//     }>(`${this.apiUrl}/stores/search`, {
//       params: { query, page: page.toString(), limit: limit.toString() }
//     }).pipe(
//       catchError(error => {
//         console.error('Error searching stores:', error);
//         throw error;
//       })
//     );
//   }

  /**
   * Get trending stores
   */
//   getTrendingStores(limit: number = 8): Observable<{ success: boolean; data: StoreModel[] }> {
//     return this.http.get<{ success: boolean; data: StoreModel[] }>(
//       `${this.apiUrl}/stores/trending`,
//       { params: { limit: limit.toString() } }
//     ).pipe(
//       catchError(error => {
//         console.error('Error fetching trending stores:', error);
//         throw error;
//       })
//     );
//   }

  /**
   * Get store analytics
   */
//   getStoreAnalytics(storeId: string, period: 'day' | 'week' | 'month' | 'year' = 'month'): Observable<{
//     success: boolean;
//     data: StoreAnalytics;
//   }> {
//     return this.http.get<{ success: boolean; data: StoreAnalytics }>(
//       `${this.apiUrl}/stores/${storeId}/analytics`,
//       { params: { period } }
//     ).pipe(
//       catchError(error => {
//         console.error('Error fetching store analytics:', error);
//         throw error;
//       })
//     );
//   }

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
   * Check if store link is available
   */
//   checkStoreLinkAvailability(storeLink: string): Observable<{ available: boolean }> {
//     return this.http.get<{ available: boolean }>(
//       `${this.apiUrl}/stores/check-link/${storeLink}`
//     ).pipe(
//       catchError(error => {
//         console.error('Error checking store link:', error);
//         throw error;
//       })
//     );
//   }

  /**
   * Get store verification status
   */
//   getStoreVerificationStatus(storeId: string): Observable<{
//     verified: boolean;
//     tier: 'basic' | 'premium';
//     verificationDate?: string;
//   }> {
//     return this.http.get<{
//       verified: boolean;
//       tier: 'basic' | 'premium';
//       verificationDate?: string;
//     }>(`${this.apiUrl}/stores/${storeId}/verification-status`);
//   }

  /**
   * Generate shareable store link
   */
//   generateStoreShareLink(store: StoreModel, platform?: 'whatsapp' | 'facebook' | 'twitter'): string {
//     const baseUrl = window.location.origin;
//     const storeUrl = `${baseUrl}/store/${store.storeLink}`;
//     const message = `Check out ${store.name}'s store on MarketSpase! ${store.description ? `\n\n${store.description}` : ''}`;
    
//     if (!platform) {
//       return storeUrl;
//     }
    
//     switch (platform) {
//       case 'whatsapp':
//         return `https://wa.me/?text=${encodeURIComponent(`${message}\n\n${storeUrl}`)}`;
//       case 'facebook':
//         return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(storeUrl)}`;
//       case 'twitter':
//         return `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(storeUrl)}`;
//       default:
//         return storeUrl;
//     }
//   }

  /**
   * Track store interaction
   */
//   trackStoreInteraction(storeId: string, interaction: 'click' | 'share' | 'save'): Observable<{ success: boolean }> {
//     return this.http.post<{ success: boolean }>(
//       `${this.apiUrl}/stores/${storeId}/interactions`,
//       { interaction }
//     ).pipe(
//       catchError(error => {
//         console.error('Error tracking store interaction:', error);
//         return [{ success: false }];
//       })
//     );
//   }
}