import { inject, Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { ApiService } from '../../../../shared-services/src/public-api';
import { HttpParams, HttpHeaders } from '@angular/common/http';

// Enhanced interfaces
export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  role?: string;
  isActive?: boolean;
  isVerified?: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: {
    users: T[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export interface UserStatistics {
  roleCounts: {
    [key: string]: number;
  };
  totals: {
    total: number;
    active: number;
    verified: number;
  };
  recent: {
    recentRegistrations: number;
    recentActive: number;
  };
  monthlyGrowth: Array<{
    _id: {
      year: number;
      month: number;
    };
    count: number;
  }>;
}

export interface RoleStatistics {
  role: string;
  counts: {
    total: number;
    active: number;
    inactive: number;
    verified: number;
    unverified: number;
    deleted: number;
    recent: number;
  };
  financial: {
    totalBalance: number;
    averageBalance: number;
    currency: string;
  };
  engagement: {
    averageRating: number;
    totalRatings: number;
    percentageRated: number;
  };
  activity: {
    totalReferrals: number;
    totalEarned: number;
  };
}

export interface StatisticsResponse {
  success: boolean;
  data: UserStatistics | RoleStatistics;
}

// Helper function to build HttpParams
function buildHttpParams(params: any): HttpParams {
  let httpParams = new HttpParams();
  
  if (params) {
    Object.keys(params).forEach(key => {
      const value = params[key];
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });
  }
  
  return httpParams;
}

@Injectable()
export class UserService {
  private apiService: ApiService = inject(ApiService);
  private readonly apiUrl = 'user';
  
  // State management for reactive filtering
  private filtersSubject = new BehaviorSubject<UserFilters>({
    page: 1,
    limit: 50,
    search: '',
    sort: '-createdAt'
  });
  
  filters$ = this.filtersSubject.asObservable();
  
  // Cache for user data
  private cache = new Map<string, { data: any, timestamp: number }>();
  private readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

  /**
   * Get users with pagination and filters (using query parameters)
   */
  getAppUsers(filters?: UserFilters): Observable<PaginatedResponse<any>> {
    // Merge with current filters if provided
    const currentFilters = filters ? { ...this.filtersSubject.value, ...filters } : this.filtersSubject.value;
    
    // Update filters state
    this.filtersSubject.next(currentFilters);
    
    // Build query parameters
    const params = this.buildQueryParams(currentFilters);
    
    // Create cache key
    const cacheKey = `users_${JSON.stringify(currentFilters)}`;
    const cached = this.cache.get(cacheKey);
    const now = Date.now();
    
    // Return cached data if available
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      return of(cached.data);
    }
    
    // Make API call with proper HttpParams
    return this.apiService.get<PaginatedResponse<any>>(`${this.apiUrl}/admin/users`, params).pipe(
      map(response => {
        // Transform the response data
        const transformedData = {
          ...response,
          data: {
            ...response.data,
            users: response.data?.users?.map(this.transformUserData) || []
          }
        };
        
        // Cache the response
        this.cache.set(cacheKey, { data: transformedData, timestamp: now });
        
        // Clean up old cache entries
        this.cleanupCache();
        
        return transformedData;
      }),
      catchError(error => {
        console.error('Error fetching users:', error);
        return throwError(() => new Error('Failed to fetch users'));
      })
    );
  }
  
  /**
   * Get user summary statistics
   */
  getUserSummary(): Observable<StatisticsResponse> {
    const cacheKey = 'user_summary';
    const cached = this.cache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      return of(cached.data);
    }
    
    return this.apiService.get<StatisticsResponse>(`${this.apiUrl}/admin/users/summary`).pipe(
      tap(response => {
        if (response.success) {
          this.cache.set(cacheKey, { data: response, timestamp: now });
        }
      }),
      catchError(error => {
        console.error('Error fetching user summary:', error);
        return throwError(() => new Error('Failed to fetch user summary'));
      })
    );
  }
  
  /**
   * Get users by role with pagination and filters
   */
  getUsersByRole(role: string, filters?: UserFilters): Observable<PaginatedResponse<any>> {
    const params = filters ? this.buildQueryParams(filters) : undefined;
    return this.apiService.get<PaginatedResponse<any>>(`${this.apiUrl}/admin/users/role/${role}`, params).pipe(
      map(response => ({
        ...response,
        data: {
          ...response.data,
          users: response.data?.users?.map(this.transformUserData) || []
        }
      })),
      catchError(error => {
        console.error(`Error fetching users by role ${role}:`, error);
        return throwError(() => new Error(`Failed to fetch ${role} users`));
      })
    );
  }
  
  /**
   * Get statistics for a specific role
   */
  getStatsByRole(role: string): Observable<StatisticsResponse> {
    const cacheKey = `role_stats_${role}`;
    const cached = this.cache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      return of(cached.data);
    }
    
    return this.apiService.get<StatisticsResponse>(`${this.apiUrl}/admin/users/role/${role}/stats`).pipe(
      tap(response => {
        if (response.success) {
          this.cache.set(cacheKey, { data: response, timestamp: now });
        }
      }),
      catchError(error => {
        console.error(`Error fetching stats for role ${role}:`, error);
        return throwError(() => new Error(`Failed to fetch ${role} statistics`));
      })
    );
  }
  
  /**
   * Get user by ID
   */
  getUserById(id: string): Observable<any> {
    const cacheKey = `user_${id}`;
    const cached = this.cache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      return of(cached.data);
    }
    
    return this.apiService.get<any>(`${this.apiUrl}/admin/${id}`).pipe(
      map(response => ({
        ...response,
        data: this.transformUserData(response.data)
      })),
      tap(response => {
        if (response.success) {
          this.cache.set(cacheKey, { data: response, timestamp: now });
        }
      }),
      catchError(error => {
        console.error(`Error fetching user ${id}:`, error);
        return throwError(() => new Error('Failed to fetch user'));
      })
    );
  }
  
  /**
   * Update user status
   */
  updateUserStatus(id: string, isActive: boolean): Observable<any> {
    return this.apiService.patch<any>(`${this.apiUrl}/admin/${id}/status`, { isActive }).pipe(
      tap(response => {
        if (response.success) {
          // Clear cache for this user
          this.cache.delete(`user_${id}`);
          
          // Clear user lists cache
          this.clearUserListsCache();
        }
      }),
      catchError(error => {
        console.error(`Error updating user status ${id}:`, error);
        return throwError(() => new Error('Failed to update user status'));
      })
    );
  }
  
  /**
   * Stream users for export
   */
  streamUsers(): Observable<Blob> {
    const params = this.buildQueryParams(this.filtersSubject.value);
    
    // Set headers for blob response
    const headers = new HttpHeaders({
      'Accept': 'application/json, application/octet-stream'
    });
    
    return this.apiService.get(`${this.apiUrl}/admin/users/stream`, params, headers, false).pipe(
      map(response => response as Blob),
      catchError(error => {
        console.error('Error streaming users:', error);
        return throwError(() => new Error('Failed to export users'));
      })
    );
  }
  
  /**
   * Update filters
   */
  updateFilters(filters: Partial<UserFilters>): void {
    const current = this.filtersSubject.value;
    this.filtersSubject.next({ ...current, ...filters });
  }
  
  /**
   * Clear filters
   */
  clearFilters(): void {
    this.filtersSubject.next({
      page: 1,
      limit: 50,
      search: '',
      sort: '-createdAt'
    });
  }
  
  /**
   * Get current filters
   */
  getCurrentFilters(): UserFilters {
    return { ...this.filtersSubject.value };
  }
  
  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * Clear only user lists cache
   */
  clearUserListsCache(): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((value, key) => {
      if (key.startsWith('users_')) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }
  
  /**
   * Build query parameters from filters
   */
  private buildQueryParams(filters: UserFilters): HttpParams {
    return buildHttpParams(filters);
  }
  
  /**
   * Transform user data to ensure consistent structure
   */
  private transformUserData(user: any): any {
    // Ensure wallet data exists
    const wallets = user.wallets || {
      marketer: { balance: 0, reserved: 0, currency: 'NGN' },
      promoter: { balance: 0, reserved: 0, currency: 'NGN' }
    };
    
    // Ensure all required fields exist
    return {
      _id: user._id,
      uid: user.uid,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      avatar: user.avatar || '/img/avatar.png',
      isActive: user.isActive !== undefined ? user.isActive : true,
      isVerified: user.isVerified !== undefined ? user.isVerified : false,
      isDeleted: user.isDeleted !== undefined ? user.isDeleted : false,
      wallets: {
        marketer: {
          balance: wallets.marketer?.balance || 0,
          reserved: wallets.marketer?.reserved || 0,
          currency: wallets.marketer?.currency || 'NGN'
        },
        promoter: {
          balance: wallets.promoter?.balance || 0,
          reserved: wallets.promoter?.reserved || 0,
          currency: wallets.promoter?.currency || 'NGN'
        }
      },
      createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
      updatedAt: user.updatedAt ? new Date(user.updatedAt) : new Date()
    };
  }
  
  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.cache.forEach((value, key) => {
      if (now - value.timestamp > this.CACHE_DURATION) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}