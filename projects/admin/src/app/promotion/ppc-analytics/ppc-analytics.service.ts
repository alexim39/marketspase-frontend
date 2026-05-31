import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../../../../shared-services/src/public-api';

export interface PpcAnalyticsRange {
  start: string;
  end: string;
}

export interface PpcOverviewSummary {
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
}

export interface PpcTimeSeriesPoint {
  bucket: string;
  totalClicks: number;
  billableClicks: number;
  invalidClicks: number;
  duplicateClicks: number;
  spend: number;
  billableRate: number;
  invalidRate: number;
  duplicateRate: number;
  clickToConversionRate: number;
}

export interface PpcOverviewResponse {
  success: boolean;
  data: {
    range: PpcAnalyticsRange;
    summary: PpcOverviewSummary;
    timeSeries: PpcTimeSeriesPoint[];
  };
  message?: string;
}

export interface PpcPromoterPatternIp {
  ip: string;
  country?: string;
  clicks: number;
  billableClicks: number;
  lastClickAt?: string;
}

export interface PpcPromoterPatternDevice {
  deviceType: string;
  clicks: number;
  billableClicks: number;
}

export interface PpcPromoterPatternCountry {
  country: string;
  clicks: number;
  billableClicks: number;
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
    lastClickAt?: string | null;
    billableRate: number;
    invalidRate: number;
    duplicateRate: number;
    clickToConversionRate: number;
  };
  patterns: {
    ips: PpcPromoterPatternIp[];
    devices: PpcPromoterPatternDevice[];
    countries: PpcPromoterPatternCountry[];
  };
  primaryAttribution?: {
    promotionId?: string;
    campaignId?: string;
    marketerId?: string;
    billableClicks?: number;
    spend?: number;
    lastClickAt?: string;
  } | null;
  anomalies: string[];
}

export interface PpcPromotersResponse {
  success: boolean;
  data: {
    promoters: PpcPromoterRow[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  message?: string;
}

@Injectable()
export class PpcAnalyticsService {
  private readonly apiService = inject(ApiService);
  private readonly apiUrl = 'api/v1/campaign/admin/ppc';

  getOverview(filters?: {
    startDate?: Date | null;
    endDate?: Date | null;
    range?: number | null;
    promoterId?: string | null;
    country?: string | null;
    granularity?: 'hourly' | 'daily';
  }): Observable<PpcOverviewResponse> {
    let params = new HttpParams();

    if (filters?.startDate) params = params.set('startDate', filters.startDate.toISOString());
    if (filters?.endDate) params = params.set('endDate', filters.endDate.toISOString());
    if (filters?.range) params = params.set('range', String(filters.range));
    if (filters?.promoterId) params = params.set('promoterId', filters.promoterId);
    if (filters?.country) params = params.set('country', filters.country);
    if (filters?.granularity) params = params.set('granularity', filters.granularity);

    return this.apiService.get<PpcOverviewResponse>(`${this.apiUrl}/overview`, params);
  }

  getPromoters(filters?: {
    startDate?: Date | null;
    endDate?: Date | null;
    range?: number | null;
    promoterId?: string | null;
    country?: string | null;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Observable<PpcPromotersResponse> {
    let params = new HttpParams();

    if (filters?.startDate) params = params.set('startDate', filters.startDate.toISOString());
    if (filters?.endDate) params = params.set('endDate', filters.endDate.toISOString());
    if (filters?.range) params = params.set('range', String(filters.range));
    if (filters?.promoterId) params = params.set('promoterId', filters.promoterId);
    if (filters?.country) params = params.set('country', filters.country);
    if (filters?.page) params = params.set('page', String(filters.page));
    if (filters?.limit) params = params.set('limit', String(filters.limit));
    if (filters?.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters?.sortOrder) params = params.set('sortOrder', filters.sortOrder);

    return this.apiService.get<PpcPromotersResponse>(`${this.apiUrl}/promoters`, params);
  }

  flagPromoter(promoterId: string, reason = ''): Observable<any> {
    return this.apiService.post(`${this.apiUrl}/promoters/${encodeURIComponent(promoterId)}/flag`, { reason });
  }

  warnPromoter(promoterId: string, message = ''): Observable<any> {
    return this.apiService.post(`${this.apiUrl}/promoters/${encodeURIComponent(promoterId)}/warn`, { message });
  }

  suspendPromoter(promoterId: string, reason = ''): Observable<any> {
    return this.apiService.post(`${this.apiUrl}/promoters/${encodeURIComponent(promoterId)}/suspend`, { reason });
  }
}

