import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { ApiService } from '../../../../shared-services/src/public-api';

export interface RevenueStats {
  totalRevenue: number;
  revenueChange: number;
  currentMonthRevenue: number;
  previousMonthRevenue: number;
}

export interface EngagementStats {
  averageEngagement: number;
  engagementChange: number;
  currentWeekEngagement: number;
  previousWeekEngagement: number;
}

export interface CampaignStats {
  totalCampaigns: number;
  activeCampaigns: number;
  pendingCampaigns: number;
  completedCampaigns: number;
  activeCampaignsChange: number;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  usersChange: number;
}

@Injectable()
export class DashboardService {
  private apiService: ApiService = inject(ApiService);
  private readonly apiUrl = 'dashboard';
  
  // Cache responses for 5 minutes to prevent duplicate calls
  private readonly CACHE_DURATION = 5 * 60 * 1000;
  private cache = new Map<string, { data: any, timestamp: number }>();

  private getCached<T>(key: string, fetchFn: () => Observable<T>): Observable<T> {
    const cached = this.cache.get(key);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      return new Observable<T>(subscriber => {
        subscriber.next(cached.data);
        subscriber.complete();
      });
    }
    
    return fetchFn().pipe(
      map(data => {
        this.cache.set(key, { data, timestamp: now });
        return data;
      }),
      shareReplay(1)
    );
  }

  clearCache(): void {
    this.cache.clear();
  }

  clearCacheForKey(key: string): void {
    this.cache.delete(key);
  }

  getRevenueStats(): Observable<RevenueStats> {
    return this.getCached('revenue_stats', () =>
      this.apiService.get<{success: boolean, data: RevenueStats}>(`${this.apiUrl}/stats/revenue`)
        .pipe(map(response => response.data))
    );
  }

  getUserStats(): Observable<UserStats> {
    return this.getCached('user_stats', () =>
      this.apiService.get<{success: boolean, data: UserStats}>(`${this.apiUrl}/stats/users`)
        .pipe(map(response => response.data))
    );
  }

  getCampaignStats(): Observable<CampaignStats> {
    return this.getCached('campaign_stats', () =>
      this.apiService.get<{success: boolean, data: CampaignStats}>(`${this.apiUrl}/stats/campaigns`)
        .pipe(map(response => response.data))
    );
  }

  getEngagementStats(): Observable<EngagementStats> {
    return this.getCached('engagement_stats', () =>
      this.apiService.get<{success: boolean, data: EngagementStats}>(`${this.apiUrl}/stats/engagement`)
        .pipe(map(response => response.data))
    );
  }

  // Combined stats for better performance on dashboard
  getDashboardStats(): Observable<{
    revenue: RevenueStats;
    users: UserStats;
    campaigns: CampaignStats;
    engagement: EngagementStats;
  }> {
    return this.getCached('dashboard_stats', () =>
      this.apiService.get<{success: boolean, data: any}>(`${this.apiUrl}/stats/dashboard`)
        .pipe(map(response => response.data))
    );
  }
}