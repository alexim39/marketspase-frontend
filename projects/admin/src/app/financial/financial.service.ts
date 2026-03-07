/* financial.service.ts */
import { Injectable, inject } from '@angular/core';
import { Observable, map, interval, switchMap } from 'rxjs';
import { ApiService } from '../../../../shared-services/src/public-api';
import { HttpParams } from '@angular/common/http';

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  userRole: 'marketer' | 'promoter';
  type: 'credit' | 'debit';
  category: 'withdrawal' | 'campaign' | 'promotion' | 'deposit' | 'bonus' | 'fee' | 'refund' | 'transfer' | 'commission';
  amount: number;
  amountPayable?: number;
  fee?: number;
  description: string;
  // Updated status types to match backend
  status: 'pending' | 'processing' | 'successful' | 'failed' | 'reversed' | 'cancelled' | 'approved' | 'rejected';
  createdAt: Date;
  processedAt?: Date;
  reference: string;
  providerReference?: string;
  transferCode?: string;
  failureReason?: string;
  bankDetails?: {
    bank: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
  };
  relatedCampaign?: string;
  relatedPromotion?: string;
}

export interface WithdrawalRequest {
  id: string;
  withdrawalId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: 'promoter' | 'marketer';
  amount: number;
  amountPayable?: number; // Amount after fees
  fee?: number; // Service fee
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  // Updated status to match actual flow
  status: 'processing' | 'successful' | 'failed' | 'reversed' | 'pending_approval';
  reference: string;
  providerReference?: string;
  transferCode?: string;
  failureReason?: string;
  createdAt: Date;
  processedAt?: Date;
  processedBy?: string;
  notes?: string;
  walletType: 'promoter' | 'marketer';
  meta: any;
  timeline: any;
}

export interface FinancialStats {
  totalRevenue: number;
  platformEarnings: number;
  totalWithdrawals: number;
  successfulWithdrawals: number; // Added
  failedWithdrawals: number; // Added
  pendingWithdrawals: number; // processing + pending_approval
  processingWithdrawals: number; // currently processing
  marketerSpend: number;
  promoterEarnings: number;
  activeBalance: number;
  reservedBalance: number;
  totalTransactions: number;
  successfulTransactions: number;
}

export interface WithdrawalResponse {
  success: boolean;
  message: string;
  data?: WithdrawalRequest;
}

export interface FinancialOverview {
  stats: FinancialStats;
  recentTransactions: Transaction[];
  pendingWithdrawals: WithdrawalRequest[]; // For admin review if needed
  processingWithdrawals: WithdrawalRequest[];
  successfulWithdrawals: WithdrawalRequest[];
  failedWithdrawals: WithdrawalRequest[];
}

@Injectable()
export class FinancialService {
  private apiService: ApiService = inject(ApiService);
  private baseUrl = 'financial';

  getFinancialOverview(): Observable<FinancialOverview> {
    return this.apiService.get<{success: boolean, data: FinancialOverview}>(`${this.baseUrl}/overview`)
      .pipe(map(response => response.data));
  }

  getFinancialStats(): Observable<FinancialStats> {
    return this.apiService.get<{success: boolean, data: FinancialStats}>(`${this.baseUrl}/stats`)
      .pipe(map(response => response.data));
  }

  // Real-time updates - poll every 30 seconds for status changes
  pollWithdrawalUpdates(params?: {
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Observable<{requests: WithdrawalRequest[], total: number, page: number, limit: number}> {
    return interval(30000).pipe(
      switchMap(() => this.getWithdrawalRequests(params))
    );
  }

// In financial.service.ts, update the getWithdrawalRequests method
getWithdrawalRequests(params?: {
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
  fromDate?: string;
  toDate?: string;
}): Observable<{requests: WithdrawalRequest[], total: number, page: number, limit: number}> {
  let httpParams = new HttpParams();
  
  if (params) {
    Object.keys(params).forEach(key => {
      const value = params[key as keyof typeof params];
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });
  }

  console.log('Fetching withdrawals with params:', params); // Debug log

  return this.apiService
    .get<{ success: boolean; data: { requests: WithdrawalRequest[]; total: number; page: number; limit: number } }>(
      `${this.baseUrl}/withdrawals`,
      httpParams
    )
    .pipe(
      map(response => {
        //console.log('Received withdrawals:', response.data); // Debug log
        return response.data;
      })
    );
}

  getWithdrawalById(withdrawalId: string): Observable<WithdrawalRequest> {
    return this.apiService.get<{success: boolean, data: WithdrawalRequest}>(`${this.baseUrl}/withdrawals/${withdrawalId}`)
      .pipe(map(response => response.data));
  }

  getTransactions(params?: {
    type?: string;
    category?: string;
    status?: string;
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Observable<{transactions: Transaction[], total: number, page: number, limit: number}> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.apiService.get<{success: boolean, data: any}>(`${this.baseUrl}/transactions`, httpParams)
      .pipe(map(response => response.data));
  }

  // Admin actions
  approveWithdrawal(withdrawalId: string, notes?: string): Observable<WithdrawalResponse> {
    return this.apiService.patch<WithdrawalResponse>(`${this.baseUrl}/withdrawals/${withdrawalId}/approve`, { notes })
      .pipe(map(response => response));
  }

  rejectWithdrawal(withdrawalId: string, notes: string): Observable<WithdrawalResponse> {
    return this.apiService.patch<WithdrawalResponse>(`${this.baseUrl}/withdrawals/${withdrawalId}/reject`, { notes })
      .pipe(map(response => response));
  }

  // Mark as processing (when admin initiates payout)
  processWithdrawal(withdrawalId: string): Observable<WithdrawalResponse> {
    return this.apiService.patch<WithdrawalResponse>(`${this.baseUrl}/withdrawals/${withdrawalId}/process`, {})
      .pipe(map(response => response));
  }

  // Retry failed withdrawal
  retryWithdrawal(withdrawalId: string): Observable<WithdrawalResponse> {
    return this.apiService.post<WithdrawalResponse>(`${this.baseUrl}/withdrawals/${withdrawalId}/retry`, {})
      .pipe(map(response => response));
  }

  exportTransactions(params: {
    format: 'csv' | 'excel' | 'pdf';
    startDate?: string;
    endDate?: string;
    type?: string;
  }): Observable<{success: boolean, data: {url: string}}> {
    return this.apiService.post<{success: boolean, data: {url: string}}>(`${this.baseUrl}/export/transactions`, params)
      .pipe(map(response => response));
  }

  exportWithdrawals(params: {
    format: 'csv' | 'excel' | 'pdf';
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Observable<{success: boolean, data: {url: string}}> {
    return this.apiService.post<{success: boolean, data: {url: string}}>(`${this.baseUrl}/export/withdrawals`, params)
      .pipe(map(response => response));
  }

  // Manual transaction management
  createManualTransaction(transactionData: {
    userId: string;
    type: 'credit' | 'debit';
    category: string;
    amount: number;
    description: string;
    reference?: string;
  }): Observable<{success: boolean, data: Transaction}> {
    return this.apiService.post<{success: boolean, data: Transaction}>(`${this.baseUrl}/transactions/manual`, transactionData)
      .pipe(map(response => response));
  }

  reverseTransaction(transactionId: string, reason: string): Observable<{success: boolean, message: string}> {
    return this.apiService.post<{success: boolean, message: string}>(`${this.baseUrl}/transactions/${transactionId}/reverse`, { reason })
      .pipe(map(response => response));
  }

  // Get webhook delivery status for debugging
  getWebhookStatus(withdrawalId: string): Observable<any> {
    return this.apiService.get(`${this.baseUrl}/withdrawals/${withdrawalId}/webhook-status`)
      .pipe(map(response => response));
  }
}