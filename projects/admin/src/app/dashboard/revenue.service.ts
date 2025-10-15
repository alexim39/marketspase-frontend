// revenue.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
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

@Injectable()
export class RevenueService {

  private apiService: ApiService = inject(ApiService);
  public api = this.apiService.getBaseUrl();

  getRevenueStats(): Observable<RevenueStats> {
    return this.apiService.get<{success: boolean, data: RevenueStats}>(`user/stats/revenue`)
      .pipe(map(response => response.data));
  }

  getEngagementStats(): Observable<EngagementStats> {
    return this.apiService.get<{success: boolean, data: EngagementStats}>(`user/stats/engagement`)
      .pipe(map(response => response.data));
  }
}