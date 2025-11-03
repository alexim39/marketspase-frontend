/* // financial.service.ts */
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
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
  description: string;
  status: 'pending' | 'successful' | 'failed' | 'processing' | 'approved' | 'declined' | 'reversed' | 'cancelled';
  createdAt: Date;
  processedAt?: Date;
  reference: string;
  relatedCampaign?: string;
  relatedPromotion?: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: 'promoter' | 'marketer';
  amount: number;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing';
  createdAt: Date;
  processedAt?: Date;
  processedBy?: string;
  notes?: string;
  walletType: 'promoter' | 'marketer';
}

export interface FinancialStats {
  totalRevenue: number;
  platformEarnings: number;
  totalWithdrawals: number;
  pendingWithdrawals: number;
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
  pendingWithdrawals: WithdrawalRequest[];
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

  getWithdrawalRequests(params?: {
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Observable<{requests: WithdrawalRequest[], total: number, page: number, limit: number}> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.apiService.get<{success: boolean, data: any}>(`${this.baseUrl}/withdrawals`, httpParams)
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

  approveWithdrawal(withdrawalId: string, notes?: string): Observable<WithdrawalResponse> {
    return this.apiService.patch<WithdrawalResponse>(`${this.baseUrl}/withdrawals/${withdrawalId}/approve`, { notes })
      .pipe(map(response => response));
  }

  rejectWithdrawal(withdrawalId: string, notes: string): Observable<WithdrawalResponse> {
    return this.apiService.patch<WithdrawalResponse>(`${this.baseUrl}/withdrawals/${withdrawalId}/reject`, { notes })
      .pipe(map(response => response));
  }

  processWithdrawal(withdrawalId: string): Observable<WithdrawalResponse> {
    return this.apiService.patch<WithdrawalResponse>(`${this.baseUrl}/withdrawals/${withdrawalId}/process`, {})
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
      .pipe(map(response => response)); // Return full response object
  }

  reverseTransaction(transactionId: string, reason: string): Observable<{success: boolean, message: string}> {
    return this.apiService.post<{success: boolean, message: string}>(`${this.baseUrl}/transactions/${transactionId}/reverse`, { reason })
      .pipe(map(response => response));
  }
}