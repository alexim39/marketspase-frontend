import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '@shared/services';

// --- Type Interfaces ---

export interface UserWalletSummary {
  balance: number;
  reserved: number;
  available: number;
  currency: string;
  recentTransactions: Array<{
    _id: string;
    amount: number;
    type: string;
    category: string;
    description: string;
    status: string;
    createdAt: string;
    reference?: string;
  }>;
}

export interface UserForRecovery {
  _id: string;
  username: string;
  email: string;
  displayName?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface RecoveryUserResponse {
  success: boolean;
  data: {
    user: UserForRecovery;
    wallets: {
      promoter?: UserWalletSummary;
      marketer?: UserWalletSummary;
    };
    fraudProfile?: any;
    recoveryHistory: {
      totalRecovered: number;
      completedCount: number;
      pendingDrafts: number;
      recentRecoveries: any[];
    };
  };
}

export interface SearchUserResult {
  _id: string;
  username: string;
  email: string;
  displayName?: string;
  role: string;
  wallets: {
    promoter?: { balance: number; reserved: number; available: number; currency: string };
    marketer?: { balance: number; reserved: number; available: number; currency: string };
  };
  isActive: boolean;
  createdAt: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  data?: {
    user: {
      _id: string;
      username: string;
      email: string;
      displayName?: string;
      role: string;
    };
    wallet: {
      type: string;
      balance: number;
      reserved: number;
      available: number;
      newBalance: number;
      currency: string;
    };
    validation: {
      amount: number;
      maximumAllowed: number;
      isValidAmount: boolean;
    };
  };
}

export interface DraftResponse {
  success: boolean;
  message: string;
  data: {
    auditId: string;
    status: string;
    targetUser: { _id: string; username: string; email: string };
    wallet: {
      type: string;
      currentBalance: number;
      availableBalance: number;
      newBalanceAfterRecovery: number;
    };
    recovery: { amount: number; reason: string; requestedAt: string };
  };
}

export interface ConfirmResponse {
  success: boolean;
  message: string;
  data: {
    auditId: string;
    transactionId: string;
    reference: string;
    amount: number;
    walletType: string;
    reason: string;
    previousBalance: number;
    newBalance: number;
    confirmedBy: string;
    confirmedAt: string;
    status: string;
  };
}

export interface RecoveryHistoryRecord {
  _id: string;
  targetUser: { _id: string; username: string; email: string };
  targetUserUsername: string;
  targetUserEmail: string;
  targetUserRole: string;
  walletType: string;
  amount: number;
  reason: string;
  previousBalance: number;
  newBalance: number;
  status: 'draft' | 'confirmed' | 'completed' | 'cancelled';
  requestedBy: string;
  requestedByUsername: string;
  confirmedBy?: string;
  confirmedByUsername?: string;
  requestedAt: string;
  confirmedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  transactionId?: string;
  transactionReference?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecoveryHistoryResponse {
  success: boolean;
  data: {
    records: RecoveryHistoryRecord[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface CancellationResponse {
  success: boolean;
  message: string;
  data: {
    auditId: string;
    status: string;
    cancelledAt: string;
  };
}

export interface AuditDetailResponse {
  success: boolean;
  data: RecoveryHistoryRecord;
}

@Injectable()
export class RecoveryService {
  private apiService: ApiService = inject(ApiService);
  private readonly apiBase = 'api/v1/financial/recovery';

  /**
   * Search users for recovery
   */
  searchUsers(query: string): Observable<{ success: boolean; data: SearchUserResult[] }> {
    const params = new HttpParams().set('query', query);
    return this.apiService.get<{ success: boolean; data: SearchUserResult[] }>(
      `${this.apiBase}/search`,
      params,
      undefined,
      true
    );
  }

  /**
   * Get full user details including wallets, transactions, flags
   */
  getUserDetails(identifier: string): Observable<RecoveryUserResponse> {
    return this.apiService.get<RecoveryUserResponse>(
      `${this.apiBase}/user/${encodeURIComponent(identifier)}`,
      undefined,
      undefined,
      true
    );
  }

  /**
   * Validate a recovery request before creating draft
   */
  validateRecovery(targetUserId: string, amount: number, walletType: string): Observable<{ success: boolean; data: ValidationResult }> {
    return this.apiService.post<{ success: boolean; data: ValidationResult }>(
      `${this.apiBase}/validate`,
      { targetUserId, amount, walletType },
      undefined,
      true
    );
  }

  /**
   * Step 1: Create draft recovery request
   */
  createDraft(data: {
    targetUserId: string;
    amount: number;
    reason: string;
    walletType: string;
    metadata?: any;
  }): Observable<DraftResponse> {
    return this.apiService.post<DraftResponse>(
      `${this.apiBase}/draft`,
      data,
      undefined,
      true
    );
  }

  /**
   * Step 2: Confirm a draft and execute deduction
   */
  confirmRecovery(auditId: string): Observable<ConfirmResponse> {
    return this.apiService.post<ConfirmResponse>(
      `${this.apiBase}/confirm`,
      { auditId },
      undefined,
      true
    );
  }

  /**
   * Cancel a draft recovery
   */
  cancelRecovery(auditId: string, reason?: string): Observable<CancellationResponse> {
    return this.apiService.post<CancellationResponse>(
      `${this.apiBase}/cancel`,
      { auditId, reason },
      undefined,
      true
    );
  }

  /**
   * Get recovery history with filters
   */
  getHistory(params?: {
    page?: number;
    limit?: number;
    status?: string;
    targetUserId?: string;
    startDate?: string;
    endDate?: string;
  }): Observable<RecoveryHistoryResponse> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page) httpParams = httpParams.set('page', String(params.page));
      if (params.limit) httpParams = httpParams.set('limit', String(params.limit));
      if (params.status) httpParams = httpParams.set('status', params.status);
      if (params.targetUserId) httpParams = httpParams.set('targetUserId', params.targetUserId);
      if (params.startDate) httpParams = httpParams.set('startDate', params.startDate);
      if (params.endDate) httpParams = httpParams.set('endDate', params.endDate);
    }
    return this.apiService.get<RecoveryHistoryResponse>(
      `${this.apiBase}/history`,
      httpParams,
      undefined,
      true
    );
  }

  /**
   * Get a single audit record by ID
   */
  getAuditDetail(auditId: string): Observable<AuditDetailResponse> {
    return this.apiService.get<AuditDetailResponse>(
      `${this.apiBase}/audit/${auditId}`,
      undefined,
      undefined,
      true
    );
  }
}
