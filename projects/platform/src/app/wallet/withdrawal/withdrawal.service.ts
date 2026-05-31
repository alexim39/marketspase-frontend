import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services';

export interface TransactionInterface {
  message: string;
  data: Array<{
    amount: number;
    reference: string;
    status: string;
    paymentStatus?: boolean;
    date: Date;
  }>;
}

// saved-account.model.ts
export interface SavedAccountInterface {
  _id: string;
  bank: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

export interface WithdrawalRequestData {
  bank: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  userId: string;
  saveAccount: boolean;
  role?: string;
  payableAmount?: number;
  totalDeduction?: number;
  feeAmount?: number;
  feeRate?: number;
  finalAmount?: number;
  currency?: string;
  quote?: any;
}

// Transaction Summary Interfaces
export interface TransactionSummaryPeriod {
  type: 'all' | 'today' | 'week' | 'month';
  startDate: string;
  endDate: string;
}

export interface TransactionSummaryOverview {
  totalEarnings: number;
  totalWithdrawn: number;
  pendingWithdrawals: number;
  availableBalance: number;
  serviceFeesPaid: number;
  totalDeposits: number;
  totalSpent: number;
  activeCampaignBudget: number;
}

export interface RecentTransaction {
  _id: string;
  reference: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  category: string;
  status: string;
  createdAt: string;
  amountPayable?: number;
}

export interface TransactionMetrics {
  averageTransactionValue: number;
  largestTransaction: number;
  transactionCount: number;
  successRate: number;
}

export interface TransactionSummaryData {
  period: TransactionSummaryPeriod;
  overview: TransactionSummaryOverview;
  recentTransactions: RecentTransaction[];
  metrics: TransactionMetrics;
}

export interface TransactionSummaryResponse {
  success: boolean;
  data: TransactionSummaryData;
  message?: string;
}

export interface TransactionSummaryParams {
  userId: string;
  role: string;
  period: 'all' | 'today' | 'week' | 'month';
}

@Injectable()
export class WithdrawalService {
  constructor(private apiService: ApiService) {}
  
  /**
   * Submits the form data to the backend.
   * @param formObject The form data.
   * @returns An observable of the submitted form data.
   */
  getTransactions(userId: string): Observable<any> {
    return this.apiService.get<any>(`api/v1/wallet/${userId}`);
  }
  
  /**
   * Submits the form data to the backend.
   * @param formObject The form data.
   * @returns An observable of the submitted form data.
   */
  withdrawRequest(payload: WithdrawalRequestData): Observable<any> {
    return this.apiService.post<any>('api/v1/wallet/withdraw-request', payload, undefined, true);
  }

  resolveAccount(accountNumber: string, bankCode: string) {
    return this.apiService.get<any>(`api/v1/wallet/resolve-account?accountNumber=${accountNumber}&bankCode=${bankCode}`, undefined, undefined, true);
  }
  
  /**
   * Submits the form data to the backend.
   * @param formObject The form data.
   * @returns An observable of the submitted form data.
   */
  removeSavedAccount(accountNumber: string, userId: string): Observable<any> {
    return this.apiService.delete<any>(`api/v1/wallet/saved-accounts/${userId}/${accountNumber}`, undefined, undefined, true);
  }

  /**
   * Get data to the backend.
   * @param formObject The form data.
   * @returns An observable of the submitted form data.
   */
  getBalance(userId: string): Observable<any> {
    return this.apiService.get<any>(`api/v1/wallet/saved-accounts/${userId}`, undefined, undefined, true);
  }

  /**
   * Get transaction summary with period filtering
   * @param params Parameters for transaction summary
   * @returns Observable of transaction summary data
   */
  getTransactionSummary(params: TransactionSummaryParams): Observable<TransactionSummaryResponse> {
    const { userId, role, period } = params;
    return this.apiService.get<TransactionSummaryResponse>(`api/v1/wallet/transactions/summary?userId=${userId}&role=${role}&period=${period}`, undefined, undefined, true);
  }
}
