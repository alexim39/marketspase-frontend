import { Injectable, inject, signal } from '@angular/core';
import { Observable, finalize } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../../../shared-services/src/public-api';

export interface LeadRow {
  _id: string;
  displayName: string;
  phone: string;
  email: string;
  campaignId: string | null;
  campaignTitle: string;
  campaignStatus: string;
  promotionUpi: string | null;
  promoterId: string | null;
  promoterName: string | null;
  marketerId: string | null;
  marketerName: string;
  marketerEmail: string;
  lifecycleStage: string;
  tags: string[];
  consent: { sms?: boolean; email?: boolean };
  createdAt: string;
}

export interface LeadStats {
  totalLeads: number;
  weekLeads: number;
  todayLeads: number;
  topCampaign: { campaignId: string; title: string; count: number } | null;
  topPromoter: { promoterId: string; name: string; count: number } | null;
}

export interface LeadsResponse {
  success: boolean;
  data: {
    leads: LeadRow[];
    stats: LeadStats;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasMore: boolean;
  };
}

@Injectable()
export class LeadService {
  private readonly apiService = inject(ApiService);
  private readonly apiBase = 'api/v1/campaign/admin/leads';

  readonly loading = signal(false);

  getLeads(page: number, limit: number, search?: string, campaignId?: string, startDate?: string, endDate?: string): Observable<LeadsResponse> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit));

    if (search) params = params.set('search', search);
    if (campaignId) params = params.set('campaignId', campaignId);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    this.loading.set(true);
    return this.apiService.get<LeadsResponse>(this.apiBase, params, undefined, true)
      .pipe(finalize(() => this.loading.set(false)));
  }

  deleteLead(id: string): Observable<{ success: boolean; data: { deleted: boolean } }> {
    return this.apiService.delete<{ success: boolean; data: { deleted: boolean } }>(
      `${this.apiBase}/${id}`,
      undefined,
      undefined,
      true,
    );
  }
}
