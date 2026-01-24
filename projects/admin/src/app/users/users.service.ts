// users.service.ts - FIXED VERSION
import { inject, Injectable, signal } from '@angular/core';
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

export interface UsersResponse {
  success: boolean;
  data: {
    users: any[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  message?: string;
}

export interface StatisticsResponse {
  success: boolean;
  data: UserStatistics | RoleStatistics;
}

// Define the interface for filter state
interface FilterState {
  search: string;
  role: string;
  isActive: boolean | undefined;
  isVerified: boolean | undefined;
  page: number;
  limit: number;
  sort: string;
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
  
  // Current filters state using signal with proper interface
  private filters = signal<FilterState>({
    search: '',
    role: '',
    isActive: undefined,
    isVerified: undefined,
    page: 1,
    limit: 50,
    sort: ''
  });
  
  // BehaviorSubject to emit when users data changes
  private usersSubject = new BehaviorSubject<UsersResponse>({
    success: false,
    data: {
      users: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0
      }
    }
  });

  // Cache for user data
  private cache = new Map<string, { data: any, timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache duration

  // Update filters - FIXED: Use the proper type
  updateFilters(newFilters: Partial<FilterState>): void {
    this.filters.update(current => ({ ...current, ...newFilters }));
  }

  // Clear all filters
  clearFilters(): void {
    this.filters.set({
      search: '',
      role: '',
      isActive: undefined,
      isVerified: undefined,
      page: 1,
      limit: 50,
      sort: ''
    });
  }

  // Get users observable
  getAppUsers(): Observable<UsersResponse> {
    return this.usersSubject.asObservable();
  }

  // Load users with current filters
  loadUsers(): void {
    const currentFilters = this.filters();
    
    // Build query parameters
    let params = new HttpParams()
      .set('page', currentFilters.page.toString())
      .set('limit', currentFilters.limit.toString());

    if (currentFilters.search) {
      params = params.set('search', currentFilters.search);
    }
    
    if (currentFilters.role) {
      params = params.set('role', currentFilters.role);
    }
    
    if (currentFilters.isActive !== undefined) {
      params = params.set('isActive', currentFilters.isActive.toString());
    }
    
    if (currentFilters.isVerified !== undefined) {
      params = params.set('isVerified', currentFilters.isVerified.toString());
    }
    
    if (currentFilters.sort) {
      params = params.set('sort', currentFilters.sort);
    }

    // Make API call
    this.apiService.get<UsersResponse>(`${this.apiUrl}/admin/users`, params).subscribe({
      next: (response) => {
        this.usersSubject.next(response);
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.usersSubject.next({
          success: false,
          data: {
            users: [],
            pagination: {
              total: 0,
              page: 1,
              limit: 50,
              totalPages: 0
            }
          },
          message: 'Failed to load users'
        });
      }
    });
  }

  // Clear cache (triggers reload)
  clearUserListsCache(): void {
    this.loadUsers();
  }

  // Update user display name
  updateUserDisplayName(userId: string, displayName: string): Observable<any> {
    return this.apiService.patch(`${this.apiUrl}/admin/${userId}/display-name`, { displayName });
  }

  // Stream users for export
  streamUsers(): Observable<Blob> {
    const currentFilters = this.filters();
    const params = this.buildQueryParamsFromFilterState(currentFilters);
    
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
          users: response.data?.users || []
          // users: response.data?.users?.map(this.transformUserData) || []
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
        data: response.data
        // data: this.transformUserData(response.data)
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
   * Update filters for the behavior subject
   */
  updateFiltersSubject(filters: Partial<UserFilters>): void {
    const current = this.filtersSubject.value;
    this.filtersSubject.next({ ...current, ...filters });
  }
  
  /**
   * Clear filters for the behavior subject
   */
  clearFiltersSubject(): void {
    this.filtersSubject.next({
      page: 1,
      limit: 50,
      search: '',
      sort: '-createdAt'
    });
  }
  
  /**
   * Get current filters from behavior subject
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
   * Build query parameters from UserFilters
   */
  private buildQueryParams(filters: UserFilters): HttpParams {
    return buildHttpParams(filters);
  }
  
  /**
   * Build query parameters from FilterState
   */
  private buildQueryParamsFromFilterState(filters: FilterState): HttpParams {
    return buildHttpParams({
      page: filters.page,
      limit: filters.limit,
      search: filters.search,
      role: filters.role,
      isActive: filters.isActive,
      isVerified: filters.isVerified,
      sort: filters.sort
    });
  }
  
  // update user to marketing rep
  updateMarketingStatus(newValue: boolean, userId: string): any {
    return this.apiService.patch<any>(`${this.apiUrl}/admin/make-marketing-rep`, {newValue, userId}).pipe(map(response => response));
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