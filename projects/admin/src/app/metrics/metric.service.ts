import { Injectable, inject, signal } from '@angular/core';
import { Observable, finalize } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../../../shared-services/src/public-api';

export interface CampaignMetricRow {
  campaignId: string;
  title: string;
  status: string;
  landingViews: number;
  contactMe: number;
  formViews: number;
  leads: number;
  failures: number;
  conversionRate: number;
}

export interface MetricStats {
  totalViews: number;
  totalLeads: number;
  totalFailures: number;
  totalContactMe: number;
  totalFormViews: number;
  conversionRate: number;
}

export interface TopEntry {
  campaignId?: string;
  promoterId?: string;
  title?: string;
  name?: string;
  count: number;
}

export interface MetricsResponse {
  success: boolean;
  data: {
    summary: MetricStats;
    campaignBreakdown: CampaignMetricRow[];
    topCampaign: TopEntry | null;
    topPromoter: TopEntry | null;
  };
  generatedAt: string;
}

export interface AdminPromotionRow {
  promotionId: string | null;
  upi: string;
  promoterName: string;
  promoterAvatar?: string;
  landingViews: number;
  contactMe: number;
  formViews: number;
  leads: number;
  failures: number;
}

export interface AdminDailyRow {
  date: string;
  landingViews: number;
  contactMe: number;
  formViews: number;
  leads: number;
  failures: number;
}

export interface CampaignDetailResponse {
  success: boolean;
  data: {
    campaign: {
      campaignId: string;
      title: string;
      status: string;
      marketer: {
        name: string;
        email: string;
        avatar?: string;
      } | null;
    };
    summary: {
      totalViews: number;
      totalLeads: number;
      totalContactMe: number;
      totalFormViews: number;
      totalFailures: number;
      conversionRate: number;
    };
    promotionBreakdown: AdminPromotionRow[];
    dailySeries: AdminDailyRow[];
  };
  generatedAt: string;
}

@Injectable()
export class MetricService {
  private readonly apiService = inject(ApiService);
  private readonly apiBase = 'api/v1/campaign/admin/metrics';

  readonly loading = signal(false);

  getMetrics(range?: string, startDate?: string, endDate?: string): Observable<MetricsResponse> {
    let params = new HttpParams();
    if (range) params = params.set('range', range);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    this.loading.set(true);
    return this.apiService.get<MetricsResponse>(this.apiBase, params, undefined, true)
      .pipe(finalize(() => this.loading.set(false)));
  }

  getCampaignMetricsDetail(campaignId: string, range?: string, startDate?: string, endDate?: string): Observable<CampaignDetailResponse> {
    let params = new HttpParams();
    if (range) params = params.set('range', range);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    this.loading.set(true);
    return this.apiService.get<CampaignDetailResponse>(`${this.apiBase}/${campaignId}`, params, undefined, true)
      .pipe(finalize(() => this.loading.set(false)));
  }
}
