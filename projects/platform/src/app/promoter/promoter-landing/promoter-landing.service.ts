import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { ApiService } from '../../../../../shared-services/src/public-api';

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

@Injectable()
export class PromoterLandingService {
  private readonly apiService: ApiService = inject(ApiService);
  public readonly api = this.apiService.getBaseUrl();
  private readonly apiUrl = 'promotion';
  private readonly apiUrl2 = 'campaign';
  
  // Cache implementation
  private cache = new Map<string, CacheEntry<any>>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache duration
  
  /**
   * Get user promotions.
   * @param userId The user ID.
   * @returns An observable of the user promotions.
   */
  getUserPromotions(userId: string): Observable<any> {
    const cacheKey = `user_promotions_${userId}`;
    const cached = this.cache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      return of(cached.data);
    }
    
    return this.apiService.get<any>(`${this.apiUrl}/user/${userId}`, undefined, undefined, true).pipe(
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
   * Get campaigns by status with pagination.
   * @param status The campaign status to filter by.
   * @param userId The user id to target.
   * @param pagination Pagination options (page, limit).
   * @returns An observable of the filtered campaigns with pagination metadata.
   */
  getCampaignsByStatus(
    status: string, 
    userId: string | undefined, 
    pagination: { page?: number; limit?: number } = {}
  ): Observable<any> {
    const { page = 1, limit = 20 } = pagination;
    
    // Generate cache key
    const cacheKey = this.generateCampaignsCacheKey(status, userId, page, limit);
    const cached = this.cache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      return of(cached.data);
    }
    
    // Build query string manually
    const queryParams = new URLSearchParams({
      status: status,
      userId: userId || '',
      page: page.toString(),
      limit: limit.toString()
    }).toString();
    
    return this.apiService.get<any>(
      `${this.apiUrl2}/?${queryParams}`, 
      undefined, 
      undefined, 
      true
    ).pipe(
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
        console.error(`Error fetching ${status} campaigns:`, error);
        return throwError(() => new Error(`Failed to fetch ${status} campaigns`));
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
    return this.apiService.post<any>(`${this.apiUrl2}/${campaignId}/accept`, { userId }, undefined, true).pipe(
      tap(response => {
        if (response.success) {
          // Invalidate relevant cache entries
          this.invalidateCampaignsCache();
          this.invalidateUserPromotionsCache(userId);
          
          // If response contains specific campaign data, invalidate that cache too
          if (response.data?.campaignId) {
            this.invalidateCampaignCache(response.data.campaignId);
          }
        }
      }),
      catchError(error => {
        console.error(`Error accepting campaign ${campaignId}:`, error);
        return throwError(() => new Error('Failed to accept campaign'));
      })
    );
  }

  /**
   * Clear cache for specific user's promotions.
   * @param userId The user ID.
   */
  clearUserPromotionsCache(userId: string): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((value, key) => {
      if (key.startsWith(`user_promotions_${userId}`)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear cache for specific campaign.
   * @param campaignId The campaign ID.
   */
  invalidateCampaignCache(campaignId: string): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((value, key) => {
      if (key.includes(`campaign_${campaignId}`)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Invalidate all cache entries for campaigns.
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
   * Generate cache key for campaigns by status.
   */
  private generateCampaignsCacheKey(
    status: string, 
    userId: string | undefined, 
    page: number, 
    limit: number
  ): string {
    return `campaigns_status_${status}_${userId || 'anonymous'}_page_${page}_limit_${limit}`;
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

  /**
   * Pre-cache data for better UX (optional).
   * Use this to pre-load common data on app initialization.
   */
  preCacheCommonData(userId: string): void {
    // Pre-cache first page of active campaigns
    if (userId) {
      this.getCampaignsByStatus('active', userId, { page: 1, limit: 20 })
        .subscribe();
      
      this.getUserPromotions(userId)
        .subscribe();
    }
  }
}