import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { ApiService, PromotionInterface } from '../../../../shared-services/src/public-api';
import { HttpParams } from '@angular/common/http';

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

@Injectable()
export class PromoterService {
  private readonly apiService: ApiService = inject(ApiService);
  public readonly api = this.apiService.getBaseUrl();
  
  // Cache implementation
  private cache = new Map<string, CacheEntry<any>>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache duration

  /**
   * Get campaigns by status (e.g., active, paused, completed).
   * @param status The campaign status to filter by.
   * @returns An observable of the filtered campaigns.
   */
  getCampaignsByStatus(status: string): Observable<any> {
    const cacheKey = `campaigns_status_${status}`;
    const cached = this.cache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      return of(cached.data);
    }
    
    return this.apiService.get<any>(`campaign/?status=${status}`, undefined, undefined, true).pipe(
      tap(response => {
        if (response.success || response.data) {
          this.cache.set(cacheKey, {
            data: response,
            timestamp: now
          });
          this.cleanupCache();
        }
      }),
      catchError(error => {
        console.error(`Error fetching campaigns by status ${status}:`, error);
        return throwError(() => new Error(`Failed to fetch ${status} campaigns`));
      })
    );
  }

  /**
   * Get promotion by ID.
   * @param id The promotion ID.
   * @param userId The user ID.
   * @returns An observable of the promotion.
   */
  getPromotionById(id: string, userId: string): Observable<any> {
    const cacheKey = `promotion_${id}_user_${userId}`;
    const cached = this.cache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      return of(cached.data);
    }
    
    return this.apiService.get<any>(`promotion/${id}/${userId}`, undefined, undefined, true).pipe(
      tap(response => {
        if (response.success || response.data) {
          this.cache.set(cacheKey, {
            data: response,
            timestamp: now
          });
          this.cleanupCache();
        }
      }),
      catchError(error => {
        console.error(`Error fetching promotion ${id}:`, error);
        return throwError(() => new Error('Failed to fetch promotion details'));
      })
    );
  }

  /**
   * Promoter accept a campaign.
   * @param campaignId The campaign ID.
   * @param userId The user ID.
   * @returns An observable of the API response.
   */
  acceptCampaign(campaignId: string, userId: string): Observable<any> {
    return this.apiService.post<any>(`campaign/${campaignId}/accept`, { userId }, undefined, true).pipe(
      tap(response => {
        if (response.success) {
          // Invalidate relevant cache entries
          this.invalidateUserPromotionsCache(userId);
          this.invalidateCampaignsCache();
        }
      }),
      catchError(error => {
        console.error(`Error accepting campaign ${campaignId}:`, error);
        return throwError(() => new Error('Failed to accept campaign'));
      })
    );
  }

  /**
   * Get user's promotions with pagination and filtering.
   * @param userId The user ID.
   * @param filters Filter parameters.
   * @returns An observable of paginated promotions.
   */
  getUserPromotions(
    userId: string,
    filters?: {
      status?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Observable<{
    success: boolean;
    data: PromotionInterface[];
    totalPages: number;
    currentPage: number;
    total: number;
  }> {
    // Generate cache key
    const cacheKey = this.generateUserPromotionsCacheKey(userId, filters);
    const cached = this.cache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      return of(cached.data);
    }
    
    let params = new HttpParams();
    
    if (filters) {
      if (filters.status) params = params.set('status', filters.status);
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
      if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
      if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);
    }

    return this.apiService.get<any>(`promotion/user/${userId}`, params, undefined, true).pipe(
      tap(response => {
        if (response.success || response.data) {
          this.cache.set(cacheKey, {
            data: response,
            timestamp: now
          });
          this.cleanupCache();
        }
      }),
      catchError(error => {
        console.error(`Error fetching promotions for user ${userId}:`, error);
        return throwError(() => new Error('Failed to fetch user promotions'));
      })
    );
  }

  /**
   * Submit promotion proofs.
   * @param formData Form data containing proofs.
   * @param userId The user ID.
   * @returns An observable of the API response.
   */
  submitProof(formData: FormData, userId: string): Observable<any> {
    return this.apiService.post<any>(`promotion/submit-proof/${userId}`, formData, undefined, true).pipe(
      tap(response => {
        if (response.success) {
          // Invalidate cache for this user's promotions
          this.invalidateUserPromotionsCache(userId);
          
          // If response contains promotionId, invalidate specific promotion cache
          if (response.data?.promotionId) {
            this.cache.delete(`promotion_${response.data.promotionId}_user_${userId}`);
          }
        }
      }),
      catchError(error => {
        console.error('Error submitting proof:', error);
        return throwError(() => new Error('Failed to submit proof'));
      })
    );
  }

  /**
   * Download a promotion media.
   * This action registers the promoter for the campaign.
   * @param campaignId The campaign ID.
   * @param promoterId The promoter ID.
   * @param promotionId The promotion ID.
   * @returns An observable of the API response.
   */
  downloadPromotion(campaignId: string, promoterId: string, promotionId: string): Observable<any> {
    const payload = {
      campaignId,
      promoterId,
      promotionId
    };
    
    return this.apiService.post<any>('promotion/download', payload, undefined, true).pipe(
      tap(response => {
        if (response.success) {
          // Invalidate relevant cache entries
          this.invalidateUserPromotionsCache(promoterId);
          this.invalidateCampaignsCache();
          
          // Invalidate specific promotion cache
          this.cache.delete(`promotion_${promotionId}_user_${promoterId}`);
        }
      }),
      catchError(error => {
        console.error(`Error downloading promotion ${promotionId}:`, error);
        return throwError(() => new Error('Failed to download promotion'));
      })
    );
  }

  /**
   * Clear all cache entries for a specific user.
   * @param userId The user ID.
   */
  clearUserCache(userId: string): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((value, key) => {
      if (key.includes(`user_${userId}`) || key.startsWith(`user_promotions_${userId}`)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cache entries for campaigns.
   */
  invalidateCampaignsCache(): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((value, key) => {
      if (key.startsWith('campaigns_')) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Invalidate all cache entries for a user's promotions.
   * @param userId The user ID.
   */
  invalidateUserPromotionsCache(userId: string): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((value, key) => {
      if (key.startsWith(`user_promotions_${userId}`)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cache.
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics (for debugging/monitoring).
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Generate cache key for user promotions.
   */
  private generateUserPromotionsCacheKey(
    userId: string,
    filters?: {
      status?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): string {
    const parts = [
      `user_promotions_${userId}`,
      `page_${filters?.page || 1}`,
      `limit_${filters?.limit || 50}`
    ];
    
    if (filters?.status) {
      parts.push(`status_${filters.status}`);
    }
    if (filters?.sortBy) {
      parts.push(`sortBy_${filters.sortBy}`);
    }
    if (filters?.sortOrder) {
      parts.push(`sortOrder_${filters.sortOrder}`);
    }
    
    return parts.join('|');
  }

  /**
   * Clean up expired cache entries.
   */
  private cleanupCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    // Check cache size and clean up if needed
    if (this.cache.size > 100) {
      // If cache grows too large, remove oldest entries
      const sortedEntries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // Keep only the 50 most recent entries
      const entriesToKeep = sortedEntries.slice(-50);
      this.cache.clear();
      entriesToKeep.forEach(([key, value]) => this.cache.set(key, value));
      return;
    }
    
    // Regular cleanup of expired entries
    this.cache.forEach((value, key) => {
      if (now - value.timestamp > this.CACHE_DURATION) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}