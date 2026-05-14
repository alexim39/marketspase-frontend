import { Injectable, inject } from '@angular/core';
import { Observable, interval, map, switchMap } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../../../shared-services/src/public-api';

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  userRole: 'marketer' | 'promoter';
  type: 'credit' | 'debit' | 'system_correction';
  category: string;
  amount: number;
  amountPayable?: number;
  fee?: number;
  description: string;
  status: 'pending' | 'processing' | 'successful' | 'failed' | 'reversed' | 'cancelled' | 'approved' | 'rejected' | 'completed' | 'paid';
  createdAt: Date;
  processedAt?: Date | null;
  reference: string;
  transferCode?: string | null;
  failureReason?: string | null;
  currency?: string;
  baseCurrency?: string;
  bankDetails?: {
    bank: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
  } | null;
}

export interface WithdrawalRequest {
  withdrawalId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: 'promoter' | 'marketer' | 'admin';
  amount: number;
  amountPayable?: number;
  fee?: number;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  status: 'processing' | 'successful' | 'failed' | 'reversed' | 'pending_approval' | 'approved' | 'rejected' | 'pending';
  reference: string;
  providerReference?: string | null;
  transferCode?: string | null;
  failureReason?: string | null;
  createdAt: Date;
  processedAt?: Date | null;
  processedBy?: string;
  notes?: string;
  walletType: 'promoter' | 'marketer';
  meta?: {
    processPayment?: {
      providerReference?: string;
    };
    [key: string]: unknown;
  };
  timeline?: unknown;
}

export interface FinancialStats {
  year: number;
  baseCurrency: string;
  totalCashIn: number;
  totalCashOut: number;
  netCashFlow: number;
  walletFunding: number;
  storefrontVolume: number;
  platformRevenue: number;
  campaignSpend: number;
  promoterPayouts: number;
  walletRefunds: number;
  totalTransactions: number;
  successfulTransactions: number;
  totalWithdrawalCount: number;
  totalWithdrawalAmount: number;
  successfulWithdrawalCount: number;
  successfulWithdrawals: number;
  processingWithdrawalCount: number;
  processingWithdrawals: number;
  pendingApprovalCount: number;
  pendingApprovals: number;
  failedWithdrawalCount: number;
  failedWithdrawals: number;
  activeBalance: number;
  reservedBalance: number;
  marketerAvailable: number;
  marketerReserved: number;
  promoterAvailable: number;
  promoterReserved: number;
  paidOrders: number;
  totalOrders: number;
  averageOrderValue: number;
}

export interface FinancialOverview {
  stats: FinancialStats;
  recentTransactions: Transaction[];
  pendingWithdrawals: WithdrawalRequest[];
  processingWithdrawals: WithdrawalRequest[];
  successfulWithdrawals: WithdrawalRequest[];
  failedWithdrawals: WithdrawalRequest[];
}

export interface FinanceBreakdownItem {
  key: string;
  label: string;
  amount: number;
  count: number;
  share: number;
}

export interface FinanceTrendItem {
  month?: number;
  year?: number;
  label: string;
  cashIn: number;
  cashOut: number;
  netFlow: number;
  walletFunding: number;
  paidOrderVolume: number;
  platformRevenue: number;
  campaignSpend: number;
  promoterPayouts?: number;
  refundedVolume?: number;
  paidOrders?: number;
}

export interface FinanceStatusItem {
  key: string;
  label: string;
  amount: number;
  count: number;
  share: number;
}

export interface FinanceCurrencyItem {
  key: string;
  label: string;
  amount: number;
  nativeAmount: number;
  count: number;
  share: number;
}

export interface FinanceCommerceSummary {
  totalOrders: number;
  paidOrders: number;
  guestOrders: number;
  registeredOrders: number;
  paidOrderVolume: number;
  averageOrderValue: number;
  refundedOrders: number;
  refundedVolume: number;
  totalPromoterCommission: number;
  heldEscrow: number;
  releasedEscrow: number;
  marketerReserved: number;
  promoterReserved: number;
}

export interface FinanceWalletExposure {
  totalAvailable: number;
  totalReserved: number;
  marketerAvailable: number;
  marketerReserved: number;
  promoterAvailable: number;
  promoterReserved: number;
  balancesByCurrency: Record<string, number>;
  reservedByCurrency: Record<string, number>;
}

export interface FinanceInsight {
  tone: 'info' | 'warning' | 'success' | 'accent';
  title: string;
  message: string;
}

export interface FinancialAnalyticsData {
  generatedAt: string;
  baseCurrency: string;
  availableYears: number[];
  summary: FinancialStats;
  monthlyTrend: FinanceTrendItem[];
  yearlyTrend: FinanceTrendItem[];
  incomeCategories: FinanceBreakdownItem[];
  expenseCategories: FinanceBreakdownItem[];
  withdrawalStatuses: FinanceStatusItem[];
  transactionStatuses: FinanceStatusItem[];
  currencyMix: FinanceCurrencyItem[];
  commerce: FinanceCommerceSummary;
  walletExposure: FinanceWalletExposure;
  insights: FinanceInsight[];
  notes: string[];
}

export interface WithdrawalResponse {
  success: boolean;
  message: string;
  data?: WithdrawalRequest;
}

@Injectable()
export class FinancialService {
  private readonly apiService = inject(ApiService);
  private readonly baseUrl = 'api/v1/financial';

  getFinancialOverview(): Observable<FinancialOverview> {
    return this.apiService
      .get<{ success: boolean; data: FinancialOverview }>(`${this.baseUrl}/overview`)
      .pipe(map((response) => response.data));
  }

  getFinancialStats(year?: number): Observable<FinancialStats> {
    let params = new HttpParams();
    if (year) {
      params = params.set('year', String(year));
    }

    return this.apiService
      .get<{ success: boolean; data: FinancialStats }>(`${this.baseUrl}/stats`, params)
      .pipe(map((response) => response.data));
  }

  getFinancialAnalytics(params?: {
    year?: number;
    trendYears?: number;
    top?: number;
  }): Observable<{ success: boolean; data: FinancialAnalyticsData }> {
    let httpParams = new HttpParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }

    return this.apiService.get<{ success: boolean; data: FinancialAnalyticsData }>(
      `${this.baseUrl}/analytics`,
      httpParams,
    );
  }

  pollWithdrawalUpdates(params?: {
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Observable<{ requests: WithdrawalRequest[]; total: number; page: number; limit: number }> {
    return interval(30000).pipe(
      switchMap(() => this.getWithdrawalRequests(params)),
    );
  }

  getWithdrawalRequests(params?: {
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
    fromDate?: string;
    toDate?: string;
  }): Observable<{ requests: WithdrawalRequest[]; total: number; page: number; limit: number }> {
    let httpParams = new HttpParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }

    return this.apiService
      .get<{ success: boolean; data: { requests: WithdrawalRequest[]; total: number; page: number; limit: number } }>(
        `${this.baseUrl}/withdrawals`,
        httpParams,
      )
      .pipe(map((response) => response.data));
  }

  getWithdrawalById(withdrawalId: string): Observable<WithdrawalRequest> {
    return this.apiService
      .get<{ success: boolean; data: WithdrawalRequest }>(`${this.baseUrl}/withdrawals/${withdrawalId}`)
      .pipe(map((response) => response.data));
  }

  getTransactions(params?: {
    type?: string;
    category?: string;
    status?: string;
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Observable<{ transactions: Transaction[]; total: number; page: number; limit: number }> {
    let httpParams = new HttpParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }

    return this.apiService
      .get<{ success: boolean; data: { transactions: Transaction[]; total: number; page: number; limit: number } }>(
        `${this.baseUrl}/transactions`,
        httpParams,
      )
      .pipe(map((response) => response.data));
  }

  approveWithdrawal(withdrawalId: string, notes?: string): Observable<WithdrawalResponse> {
    return this.apiService.patch<WithdrawalResponse>(
      `${this.baseUrl}/withdrawals/${withdrawalId}/approve`,
      { notes },
    );
  }

  rejectWithdrawal(withdrawalId: string, notes: string): Observable<WithdrawalResponse> {
    return this.apiService.patch<WithdrawalResponse>(
      `${this.baseUrl}/withdrawals/${withdrawalId}/reject`,
      { notes },
    );
  }

  processWithdrawal(withdrawalId: string): Observable<WithdrawalResponse> {
    return this.apiService.patch<WithdrawalResponse>(
      `${this.baseUrl}/withdrawals/${withdrawalId}/process`,
      {},
    );
  }

  retryWithdrawal(withdrawalId: string): Observable<WithdrawalResponse> {
    return this.apiService.post<WithdrawalResponse>(
      `${this.baseUrl}/withdrawals/${withdrawalId}/retry`,
      {},
    );
  }

  exportTransactions(params: {
    format: 'csv' | 'excel' | 'pdf';
    startDate?: string;
    endDate?: string;
    type?: string;
  }): Observable<{ success: boolean; data: { url: string } }> {
    return this.apiService.post<{ success: boolean; data: { url: string } }>(
      `${this.baseUrl}/export/transactions`,
      params,
    );
  }

  exportWithdrawals(params: {
    format: 'csv' | 'excel' | 'pdf';
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Observable<{ success: boolean; data: { url: string } }> {
    return this.apiService.post<{ success: boolean; data: { url: string } }>(
      `${this.baseUrl}/export/withdrawals`,
      params,
    );
  }

  createManualTransaction(transactionData: {
    userId: string;
    type: 'credit' | 'debit';
    category: string;
    amount: number;
    description: string;
    reference?: string;
  }): Observable<{ success: boolean; data: Transaction }> {
    return this.apiService.post<{ success: boolean; data: Transaction }>(
      `${this.baseUrl}/transactions/manual`,
      transactionData,
    );
  }

  reverseTransaction(transactionId: string, reason: string): Observable<{ success: boolean; message: string }> {
    return this.apiService.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/transactions/${transactionId}/reverse`,
      { reason },
    );
  }

  getWebhookStatus(withdrawalId: string): Observable<unknown> {
    return this.apiService.get(`${this.baseUrl}/withdrawals/${withdrawalId}/webhook-status`);
  }
}
