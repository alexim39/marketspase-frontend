import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api';
import { inject } from '@angular/core'; 

export interface AppMetrics {
  totalUsers: number;
  totalMarketers: number;
  totalPromoters: number;
  totalAdmins: number;
  totalMarketingReps: number;
  totalActiveUsers: number;
  totalVerifiedUsers: number;
  totalReferrals: number;
  totalEarnedFromReferrals: number;
  engagementRate: number;
  verificationRate: number;
  lastUpdated: string;
}

@Injectable()
export class AppMetricsService {

  private apiUrl = 'api/v1/metrics';
  private apiService: ApiService = inject(ApiService);

  getMetrics(): Observable<AppMetrics> {
    return this.apiService.get<{ success: boolean; data: AppMetrics }>(this.apiUrl, undefined, undefined, true)
      .pipe(map(res => res.data));
  }

  // Optional: with history later
  getMetricsWithHistory(days: number = 30): Observable<any> {
    const params = new HttpParams()
      .set('includeHistorical', 'true')
      .set('days', days.toString());

    return this.apiService.get(this.apiUrl, params, undefined, true);
  }
}