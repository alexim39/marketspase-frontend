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

export interface PpcPromoterPayoutPolicy {
  _id?: string;
  promoter: string;
  enabled: boolean;
  isActive: boolean;
  payoutMode: 'fixed' | string;
  fixedPayoutPerClick: number;
  currency: string;
  reason: string;
  startsAt?: string | null;
  endsAt?: string | null;
  updatedAt?: string | null;
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
    promoterEarnings: number;
    platformRetainedAmount: number;
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
    promoterEarnings?: number;
    platformRetainedAmount?: number;
    lastClickAt?: string;
  } | null;
  payoutPolicy?: PpcPromoterPayoutPolicy | null;
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

export interface PpcPromotionLinkRecentClick {
  clickedAt?: string;
  status: 'billable' | 'duplicate' | 'invalid' | 'exhausted' | string;
  chargeStatus?: string;
  cost: number;
  promoterPayoutAmount?: number;
  platformRetainedAmount?: number;
  deviceType?: string;
  ip?: string;
  country?: string;
  region?: string;
  city?: string;
  source?: string;
  referrer?: string;
}

export interface PpcPromotionLinkBreakdown {
  promotionId: string;
  campaignId: string;
  marketerId: string;
  upi: string;
  promotionUrl: string;
  destinationUrl: string;
  campaign: {
    _id: string;
    title: string;
    status: string;
    category: string;
    mediaType: string;
    costPerClick: number;
    budget: number;
    spentBudget: number;
    currency: string;
  };
  promotion: {
    _id: string;
    status: string;
    isActive: boolean;
    acceptedAt?: string | null;
    fraudStatus?: any;
  };
  metrics: {
    totalClicks: number;
    uniqueClicks: number;
    billableClicks: number;
    invalidClicks: number;
    duplicateClicks: number;
    exhaustedClicks: number;
    spend: number;
    promoterEarnings: number;
    platformRetainedAmount: number;
    unitCost: number;
    promoterPayoutAmount: number;
    conversions: number;
    conversionRevenue: number;
    commissionEarned: number;
    firstClickAt?: string | null;
    lastClickAt?: string | null;
    billableRate: number;
    invalidRate: number;
    duplicateRate: number;
    clickToConversionRate: number;
  };
  patterns: {
    sources: string[];
    countries: string[];
    devices: string[];
  };
  recentClicks: PpcPromotionLinkRecentClick[];
  anomalies: string[];
}

export interface PpcPromotionLinksResponse {
  success: boolean;
  data: {
    promoterId: string;
    range: PpcAnalyticsRange;
    summary: {
      totalClicks: number;
      uniqueClicks: number;
      billableClicks: number;
      invalidClicks: number;
      duplicateClicks: number;
      exhaustedClicks: number;
      spend: number;
      promoterEarnings: number;
      platformRetainedAmount: number;
      promotionLinks: number;
      billableRate: number;
      invalidRate: number;
      duplicateRate: number;
      clickToConversionRate: number;
    };
    links: PpcPromotionLinkBreakdown[];
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

  getPromoterPromotionLinks(promoterId: string, filters?: {
    startDate?: Date | null;
    endDate?: Date | null;
    range?: number | null;
    country?: string | null;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Observable<PpcPromotionLinksResponse> {
    let params = new HttpParams();

    if (filters?.startDate) params = params.set('startDate', filters.startDate.toISOString());
    if (filters?.endDate) params = params.set('endDate', filters.endDate.toISOString());
    if (filters?.range) params = params.set('range', String(filters.range));
    if (filters?.country) params = params.set('country', filters.country);
    if (filters?.page) params = params.set('page', String(filters.page));
    if (filters?.limit) params = params.set('limit', String(filters.limit));
    if (filters?.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters?.sortOrder) params = params.set('sortOrder', filters.sortOrder);

    return this.apiService.get<PpcPromotionLinksResponse>(
      `${this.apiUrl}/promoters/${encodeURIComponent(promoterId)}/promotion-links`,
      params,
    );
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

  setPromoterCpcPolicy(promoterId: string, payload: {
    fixedPayoutPerClick: number;
    endsAt: string;
    reason: string;
  }): Observable<{ success: boolean; message?: string; data?: { policy: PpcPromoterPayoutPolicy } }> {
    return this.apiService.post(
      `${this.apiUrl}/promoters/${encodeURIComponent(promoterId)}/cpc-policy`,
      payload,
    );
  }

  clearPromoterCpcPolicy(promoterId: string, reason = 'Policy cleared by admin'): Observable<{
    success: boolean;
    message?: string;
    data?: { policy: PpcPromoterPayoutPolicy | null };
  }> {
    const params = new HttpParams().set('reason', reason);
    return this.apiService.delete(`${this.apiUrl}/promoters/${encodeURIComponent(promoterId)}/cpc-policy`, params);
  }
}

