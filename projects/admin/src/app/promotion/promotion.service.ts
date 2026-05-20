import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../shared-services/src/public-api';
import { HttpParams } from '@angular/common/http';

export interface PromotionResponse {
  success: boolean;
  data: any[];
  message?: string;
}

export interface PromotionFraudSummary {
  openCases: number;
  blockedPromotions: number;
  suspendedPromoters: number;
  criticalCases: number;
  statusCounts: Record<string, number>;
}

export interface PromotionFraudCase {
  _id: string;
  status: 'open' | 'warning_sent' | 'final_warning_sent' | 'suspended' | 'resolved' | 'dismissed' | string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical' | string;
  riskScore: number;
  detectionTypes: string[];
  reasons: Array<{
    code: string;
    label: string;
    score: number;
    details?: string;
  }>;
  evidence?: {
    ipHashes?: string[];
    userAgentHashes?: string[];
    referrers?: string[];
    sources?: string[];
    firstDetectedAt?: string;
    lastDetectedAt?: string;
    lastClickAt?: string;
    totalObservedClicks?: number;
    billableObservedClicks?: number;
    duplicateObservedClicks?: number;
    invalidObservedClicks?: number;
    matchedPromoterFingerprint?: boolean;
    notes?: string;
  };
  promoter?: {
    _id: string;
    displayName?: string;
    username?: string;
    email?: string;
    avatar?: string;
    role?: string;
    isActive?: boolean;
    fraudProfile?: {
      trustScore?: number;
      riskLevel?: string;
      warningCount?: number;
      strikeCount?: number;
      activeCaseCount?: number;
      lastWarningAt?: string;
      lastFinalWarningAt?: string;
      suspendedUntil?: string | null;
      suspensionHistory?: Array<{
        startedAt?: string;
        endsAt?: string;
        reason?: string;
        caseId?: string;
      }>;
    };
  };
  campaign?: {
    _id: string;
    title?: string;
    status?: string;
    category?: string;
  };
  promotion?: {
    _id: string;
    upi?: string;
    status?: string;
    isActive?: boolean;
    promotionUrl?: string;
    clickStats?: {
      totalClicks?: number;
      billableClicks?: number;
      invalidClicks?: number;
      duplicateClicks?: number;
      earnedAmount?: number;
      lastClickAt?: string;
    };
    fraudStatus?: {
      reviewStatus?: string;
      reasonSummary?: string;
      blockedAt?: string;
      blockedUntil?: string | null;
      autoRestoredAt?: string | null;
    };
  };
  actionLog?: Array<{
    action: string;
    details?: string;
    timestamp?: string;
  }>;
  adminSummaryTitle?: string;
  resolutionNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PromotionFraudCasesResponse {
  cases: PromotionFraudCase[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class PromotionService {
  private apiService: ApiService = inject(ApiService);
  public api = this.apiService.getBaseUrl();
  private readonly apiUrl = 'api/v1/promotion';

  getAllPromotions(): Observable<PromotionResponse> {
    return this.apiService.get<PromotionResponse>(`${this.apiUrl}/admin/promotions`);
  }

  // getPromotionsByStatus(status: string): Observable<PromotionResponse> {
  //   return this.apiService.get<PromotionResponse>(`${this.apiUrl}/admin/promotions/${encodeURIComponent(status)}`);
  // }

  getPromotionsByStatus(status: string): Observable<PromotionResponse> {
    const params = new HttpParams().set('status', status);
    return this.apiService.get<PromotionResponse>(`${this.apiUrl}/admin/promotions`, params );
  }

  getFraudSummary(): Observable<{ success: boolean; data: PromotionFraudSummary; message?: string }> {
    return this.apiService.get<{ success: boolean; data: PromotionFraudSummary; message?: string }>(
      `${this.apiUrl}/admin/fraud/summary`
    );
  }

  getFraudCases(filters?: {
    status?: string;
    riskLevel?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Observable<{ success: boolean; data: PromotionFraudCasesResponse; message?: string }> {
    let params = new HttpParams();

    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.riskLevel) params = params.set('riskLevel', filters.riskLevel);
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.page) params = params.set('page', String(filters.page));
    if (filters?.limit) params = params.set('limit', String(filters.limit));

    return this.apiService.get<{ success: boolean; data: PromotionFraudCasesResponse; message?: string }>(
      `${this.apiUrl}/admin/fraud/cases`,
      params
    );
  }

  applyFraudCaseAction(caseId: string, action: string, reason = ''): Observable<any> {
    return this.apiService.post(`${this.apiUrl}/admin/fraud/cases/${caseId}/action`, {
      action,
      reason,
    });
  }

  // validatePromotion(promotionId: string): Observable<PromotionResponse> {
  //   return this.apiService.post<PromotionResponse>(`${this.apiUrl}/admin/promotions/${promotionId}/validate`, {});
  // }

  // rejectPromotion(promotionId: string, reason: string): Observable<PromotionResponse> {
  //   return this.apiService.post<PromotionResponse>(`${this.apiUrl}/admin/promotions/${promotionId}/reject`, { reason });
  // }

  // markAsPaid(promotionId: string): Observable<PromotionResponse> {
  //   return this.apiService.post<PromotionResponse>(`${this.apiUrl}/admin/promotions/${promotionId}/mark-paid`, {});
  // }

  // revertToSubmitted(promotionId: string): Observable<PromotionResponse> {
  //   return this.apiService.post<PromotionResponse>(`${this.apiUrl}/admin/promotions/${promotionId}/revert`, {});
  // }
}
