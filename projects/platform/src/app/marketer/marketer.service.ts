import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { ApiService } from '../../../../shared-services/src/public-api';

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface FilterParams {
  status?: string;
  category?: string;
  campaignType?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  message: string;
  success: boolean;
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCampaigns: number;
    hasNext: boolean;
    hasPrev: boolean;
    limit: number;
  };
}

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

@Injectable()
export class MarketerService {
  private readonly apiService: ApiService = inject(ApiService);
  public readonly api = this.apiService.getBaseUrl();
  private readonly apiUrl = 'campaign';
  
  // Cache implementation
  private cache = new Map<string, CacheEntry<any>>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache duration
  
  /**
   * Get campaigns for a marketer with pagination and filtering
   * @param userId - The marketer's user ID
   * @param pagination - Pagination parameters (page and limit)
   * @param filters - Filter parameters (status, search, etc.)
   * @returns An observable of the paginated campaigns response
   */
  getMarketerCampaign(
    userId: string, 
    pagination?: PaginationParams,
    filters?: FilterParams
  ): Observable<PaginatedResponse<any>> {
    // Generate cache key based on all parameters
    const cacheKey = this.generateCacheKey(userId, pagination, filters);
    const cached = this.cache.get(cacheKey);
    const now = Date.now();
    
    // Return cached data if available and not expired
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      return of(cached.data);
    }
    
    // Build query parameters
    const params: any = {};
    
    // Add pagination parameters if provided
    if (pagination?.page) {
      params.page = pagination.page.toString();
    }
    if (pagination?.limit) {
      params.limit = pagination.limit.toString();
    }

    // Add filter parameters if provided
    if (filters?.status && filters.status !== 'all') {
      params.status = filters.status;
    }
    if (filters?.search) {
      params.search = filters.search;
    }
    if (filters?.category) {
      params.category = filters.category;
    }
    if (filters?.campaignType) {
      params.campaignType = filters.campaignType;
    }
    if (filters?.sortBy) {
      params.sortBy = filters.sortBy;
    }
    if (filters?.sortOrder) {
      params.sortOrder = filters.sortOrder;
    }

    return this.apiService.get<PaginatedResponse<any>>(
      `${this.apiUrl}/user/${userId}`,
      params, // Pass both pagination and filter parameters as query params
      undefined, 
      true
    ).pipe(
      tap(response => {
        if (response.success) {
          // Cache the successful response
          this.cache.set(cacheKey, {
            data: response,
            timestamp: now
          });
          
          // Clean up expired cache entries periodically
          this.cleanupCache();
        }
      }),
      catchError(error => {
        console.error('Error fetching marketer campaigns:', error);
        return throwError(() => new Error('Failed to fetch campaigns'));
      })
    );
  }
  
  /**
   * Clear cache for specific user's campaigns
   * @param userId - User ID to clear cache for
   */
  clearUserCampaignCache(userId: string): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((value, key) => {
      if (key.startsWith(`marketer_campaigns_${userId}_`)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }
  
  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * Invalidate all cache entries for campaigns
   * Useful when a new campaign is created or existing one is updated
   */
  invalidateCampaignsCache(): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((value, key) => {
      if (key.startsWith('marketer_campaigns_')) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }
  
  /**
   * Get cache statistics (for debugging/monitoring)
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
  
  /**
   * Generate a unique cache key based on parameters
   */
  private generateCacheKey(
    userId: string, 
    pagination?: PaginationParams,
    filters?: FilterParams
  ): string {
    const parts = [
      `marketer_campaigns_${userId}`,
      `page_${pagination?.page || 1}`,
      `limit_${pagination?.limit || 50}`
    ];
    
    if (filters) {
      if (filters.status && filters.status !== 'all') {
        parts.push(`status_${filters.status}`);
      }
      if (filters.search) {
        parts.push(`search_${filters.search}`);
      }
      if (filters.category) {
        parts.push(`category_${filters.category}`);
      }
      if (filters.campaignType) {
        parts.push(`type_${filters.campaignType}`);
      }
      if (filters.sortBy) {
        parts.push(`sortBy_${filters.sortBy}`);
      }
      if (filters.sortOrder) {
        parts.push(`sortOrder_${filters.sortOrder}`);
      }
    }
    
    return parts.join('|');
  }
  
  /**
   * Clean up expired cache entries
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