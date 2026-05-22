import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services';

export type FraudCaseStatus =
  | 'open'
  | 'warning_sent'
  | 'final_warning_sent'
  | 'suspended'
  | 'resolved'
  | 'dismissed'
  | 'all'
  | string;

export type FraudRiskLevel = 'low' | 'medium' | 'high' | 'critical' | 'all' | string;

export interface PromoterFraudProfile {
  trustScore?: number;
  riskLevel?: FraudRiskLevel;
  warningCount?: number;
  strikeCount?: number;
  activeCaseCount?: number;
  lastFlaggedAt?: string | null;
  lastWarningAt?: string | null;
  lastFinalWarningAt?: string | null;
  suspendedUntil?: string | null;
  suspensionReason?: string;
  notes?: string;
  suspensionHistory?: Array<{
    startedAt: string;
    endsAt: string;
    reason?: string;
    caseId?: string | null;
  }>;
}

export interface PromoterFraudSummaryResponse {
  success: boolean;
  data: {
    promoter: {
      _id: string;
      displayName?: string;
      username?: string;
      email?: string;
      isActive?: boolean;
    };
    fraudProfile: PromoterFraudProfile | null;
    summary: {
      totalCases: number;
      activeCases: number;
      suspendedCases: number;
      blockedPromotions: number;
      statusCounts: Record<string, number>;
    };
  };
  generatedAt?: string;
  message?: string;
}

export interface PromotionFraudCase {
  _id: string;
  status: FraudCaseStatus;
  riskLevel: FraudRiskLevel;
  riskScore: number;
  detectionTypes: string[];
  reasons: Array<{ code?: string; label?: string; score?: number; details?: string }>;
  promotion: {
    _id: string;
    upi?: string;
    status?: string;
    isActive?: boolean;
    fraudStatus?: any;
    clickStats?: any;
    promotionUrl?: string;
  } | null;
  campaign: {
    _id: string;
    title?: string;
    status?: string;
    category?: string;
  } | null;
  warningSentAt?: string | null;
  finalWarningSentAt?: string | null;
  suspendedAt?: string | null;
  suspendedUntil?: string | null;
  reviewedAt?: string | null;
  resolutionNotes?: string;
  actionLog?: Array<{ action?: string; details?: string; timestamp?: string }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface PromoterFraudCasesResponse {
  success: boolean;
  data: {
    cases: PromotionFraudCase[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  generatedAt?: string;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class PromotionComplianceService {
  private readonly api = inject(ApiService);
  private readonly base = 'api/v1/promotion/fraud/promoter';

  getSummary(promoterId: string): Observable<PromoterFraudSummaryResponse> {
    return this.api.get<PromoterFraudSummaryResponse>(`${this.base}/${encodeURIComponent(promoterId)}/summary`, undefined, undefined, true);
  }

  getCases(
    promoterId: string,
    filters?: {
      status?: FraudCaseStatus;
      riskLevel?: FraudRiskLevel;
      page?: number;
      limit?: number;
    }
  ): Observable<PromoterFraudCasesResponse> {
    let params = new HttpParams();
    if (filters?.status) params = params.set('status', String(filters.status));
    if (filters?.riskLevel) params = params.set('riskLevel', String(filters.riskLevel));
    if (filters?.page) params = params.set('page', String(filters.page));
    if (filters?.limit) params = params.set('limit', String(filters.limit));

    return this.api.get<PromoterFraudCasesResponse>(
      `${this.base}/${encodeURIComponent(promoterId)}/cases`,
      params,
      undefined,
      true
    );
  }
}

