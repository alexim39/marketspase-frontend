import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services';

export type PpcGranularity = 'hourly' | 'daily';

export interface PpcOverviewFilters {
  range?: string;
  startDate?: string | null;
  endDate?: string | null;
  promoterId?: string | null;
  country?: string | null;
  granularity?: PpcGranularity;
}

export interface PpcPromotersFilters {
  range?: string;
  startDate?: string | null;
  endDate?: string | null;
  promoterId?: string | null;
  country?: string | null;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PpcOverviewResponse {
  success: boolean;
  data: {
    range: { start: string | Date; end: string | Date };
    summary: {
      totalClicks: number;
      uniqueClicks: number;
      billableClicks: number;
      invalidClicks: number;
      duplicateClicks: number;
      spend: number;
      conversions: number;
      conversionRevenue: number;
      uniquePromoters: number;
      billableRate: number;
      invalidRate: number;
      duplicateRate: number;
      clickToConversionRate: number;
    };
    timeSeries: Array<{
      bucket: string;
      totalClicks: number;
      uniqueClicks?: number;
      billableClicks: number;
      invalidClicks: number;
      duplicateClicks: number;
      spend: number;
      billableRate: number;
      invalidRate: number;
      duplicateRate: number;
      clickToConversionRate: number;
    }>;
  };
}

export interface PpcPromoterRow {
  promoter: {
    _id: string;
    displayName: string;
    email: string;
    phone: string;
    isActive: boolean;
    fraudProfile?: any;
  };
  metrics: {
    totalClicks: number;
    uniqueClicks: number;
    billableClicks: number;
    invalidClicks: number;
    duplicateClicks: number;
    spend: number;
    conversions: number;
    conversionRevenue: number;
    lastClickAt?: string | Date | null;
    billableRate: number;
    invalidRate: number;
    duplicateRate: number;
    clickToConversionRate: number;
  };
  patterns: {
    ips: Array<{ ip: string; country?: string; clicks: number; billableClicks: number; lastClickAt?: string | Date | null }>;
    devices: Array<{ deviceType: string; clicks: number; billableClicks: number }>;
    countries: Array<{ country: string; clicks: number; billableClicks: number }>;
  };
  primaryAttribution?: {
    promotionId: string;
    campaignId: string;
    marketerId: string;
    billableClicks: number;
    spend: number;
    lastClickAt?: string | Date | null;
  } | null;
  anomalies: string[];
}

export interface PpcPromotersResponse {
  success: boolean;
  data: {
    promoters: PpcPromoterRow[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };
}

@Injectable({ providedIn: 'root' })
export class PpcAnalyticsService {
  private readonly api = inject(ApiService);

  private buildParams(filters: Record<string, unknown>): HttpParams {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value === null || value === undefined) return;
      const asString = String(value).trim();
      if (!asString) return;
      params = params.set(key, asString);
    });
    return params;
  }

  getOverview(filters: PpcOverviewFilters): Observable<PpcOverviewResponse> {
    const params = this.buildParams(filters as any);
    return this.api.get<PpcOverviewResponse>('api/v1/campaign/admin/ppc/overview', params, undefined, true);
  }

  getPromoters(filters: PpcPromotersFilters): Observable<PpcPromotersResponse> {
    const params = this.buildParams(filters as any);
    return this.api.get<PpcPromotersResponse>('api/v1/campaign/admin/ppc/promoters', params, undefined, true);
  }

  flagPromoter(promoterId: string, reason: string = ''): Observable<any> {
    return this.api.post<any>(`api/v1/campaign/admin/ppc/promoters/${promoterId}/flag`, { reason }, undefined, true);
  }

  warnPromoter(promoterId: string, message: string = ''): Observable<any> {
    return this.api.post<any>(`api/v1/campaign/admin/ppc/promoters/${promoterId}/warn`, { message }, undefined, true);
  }

  suspendPromoter(promoterId: string, reason: string = ''): Observable<any> {
    return this.api.post<any>(`api/v1/campaign/admin/ppc/promoters/${promoterId}/suspend`, { reason }, undefined, true);
  }
}

