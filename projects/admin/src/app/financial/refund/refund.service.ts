// file: admin-refund.service.ts
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../../shared-services/src/public-api';
import { HttpParams } from '@angular/common/http';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Type interfaces for the refund service
export interface RefundRequest {
  promoterUserId: string;
  amount: number;
  reason: string;
  adminId: string;
  metadata?: any;
}

export interface RefundResponseData {
  transactionId: string;
  promoter: {
    id: string;
    username: string;
    email: string;
    previousBalance: number;
    newBalance: number;
  };
  refundDetails: {
    amount: number;
    reason: string;
    processedBy: string;
    processedAt: Date;
  };
}

export interface ValidationResponseData {
  valid: boolean;
  error?: string;
  data?: {
    promoter: {
      id: string;
      username: string;
      email: string;
      accountAge: number;
    };
    wallet: {
      currentBalance: number;
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

export interface PromoterWalletDetailsData {
  promoter: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
  wallet: {
    balance: number;
    reserved: number;
    currency: string;
    totalTransactions: number;
  };
  recentTransactions: any[];
}

export interface BulkRefundItem {
  promoterUserId: string;
  amount: number;
  reason?: string;
}

export interface BulkRefundResponseData {
  totalProcessed: number;
  successful: Array<{
    promoterUserId: string;
    amount: number;
    transactionId: string;
    message: string;
  }>;
  failed: Array<{
    promoterUserId: string;
    amount: number;
    error: string;
  }>;
}

export interface RefundHistoryData {
  promoter: {
    id: string;
    username: string;
    email: string;
  };
  refunds: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    transactions: Array<{
      _id: string;
      transactionId: string;
      promoterId: string;
      promoterUsername: string;
      promoterEmail: string;
      amount: number;
      reason: string;
      status: string;
      processedBy: string;
      processedAt: Date;
      previousBalance: number;
      newBalance: number;
      metadata?: any;
    }>;
  };
}

export interface SearchPromotersData {
  _id: string;
  username: string;
  email: string;
  displayName?: string;
  role: string;
  wallets?: {
    promoter?: {
      balance: number;
      currency: string;
    };
  };
  isActive: boolean;
  isVerified: boolean;
}

@Injectable()
export class RefundService {
  private apiService: ApiService = inject(ApiService);
  public api = this.apiService.getBaseUrl();
  private readonly apiBase = 'financial/refund';

  /**
   * Process a single refund to a promoter
   * @param refundRequest The refund request data
   * @returns An Observable that emits the API response
   */
  refundPromoterBalance(refundRequest: RefundRequest): Observable<ApiResponse<RefundResponseData>> {
    return this.apiService.post<ApiResponse<RefundResponseData>>(
      `${this.apiBase}/promoter`,
      refundRequest,
      undefined,
      true
    );
  }

  /**
   * Get promoter wallet details
   * @param promoterIdentifier Promoter ID, username, or email
   * @returns An Observable that emits the promoter wallet details
   */
  getPromoterWalletDetails(promoterIdentifier: string): Observable<ApiResponse<PromoterWalletDetailsData>> {
    return this.apiService.get<ApiResponse<PromoterWalletDetailsData>>(
      `${this.apiBase}/promoter/${promoterIdentifier}/wallet`,
      undefined,
      undefined,
      true
    );
  }

  /**
   * Validate if a refund can be processed
   * @param promoterUserId Promoter identifier
   * @param amount Amount to refund
   * @returns An Observable that emits the validation result
   */
  validateRefund(promoterUserId: string, amount: number): Observable<ApiResponse<ValidationResponseData>> {
    return this.apiService.post<ApiResponse<ValidationResponseData>>(
      `${this.apiBase}/validate`,
      { promoterUserId, amount },
      undefined,
      true
    );
  }

  /**
   * Process bulk refunds to multiple promoters
   * @param refunds Array of refund items
   * @param adminId Admin performing the bulk refund
   * @returns An Observable that emits the bulk refund results
   */
  bulkRefundPromoters(refunds: BulkRefundItem[], adminId: string): Observable<ApiResponse<BulkRefundResponseData>> {
    return this.apiService.post<ApiResponse<BulkRefundResponseData>>(
      `${this.apiBase}/bulk`,
      { refunds, adminId },
      undefined,
      true
    );
  }

  /**
   * Get refund history for a promoter or all refunds
   * @param options Optional parameters for filtering
   * @returns An Observable that emits the refund history
   */
  getRefundHistory(options?: {
    promoterIdentifier?: string;
    limit?: number;
    page?: number;
  }): Observable<ApiResponse<RefundHistoryData>> {
    let endpoint = `${this.apiBase}/history`;
    let params: any = {};
    
    if (options?.promoterIdentifier) {
      endpoint = `${this.apiBase}/promoter/${options.promoterIdentifier}/refund-history`;
    }
    
    if (options?.limit) {
      params.limit = options.limit;
    }
    
    if (options?.page) {
      params.page = options.page;
    }
    
    return this.apiService.get<ApiResponse<RefundHistoryData>>(
      endpoint,
      params,
      undefined,
      true
    );
  }

 /**
 * Search promoters by query
 * @param query Search query (username, email, or display name)
 * @returns An Observable that emits the search results
 */
searchPromoters(query: string): Observable<ApiResponse<SearchPromotersData[]>> {
  const params = new HttpParams().set('query', query);
  
  return this.apiService.get<ApiResponse<SearchPromotersData[]>>(
    `${this.apiBase}/promoters/search`,
    params,
    undefined,
    true
  );
}

  /**
   * Download refund receipt
   * @param transactionId Transaction ID
   * @returns An Observable that emits the receipt data
   */
  downloadRefundReceipt(transactionId: string): Observable<ApiResponse<any>> {
    return this.apiService.get<ApiResponse<any>>(
      `${this.apiBase}/${transactionId}/receipt`,
      undefined,
      undefined,
      true
    );
  }

  /**
   * Cancel a refund (if pending)
   * @param transactionId Transaction ID
   * @returns An Observable that emits the cancellation result
   */
  cancelRefund(transactionId: string): Observable<ApiResponse<any>> {
    return this.apiService.post<ApiResponse<any>>(
      `${this.apiBase}/${transactionId}/cancel`,
      {},
      undefined,
      true
    );
  }

  /**
   * Preview bulk refund from file
   * @param file CSV or JSON file
   * @returns An Observable that emits the preview data
   */
  previewBulkRefund(file: File): Observable<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.apiService.post<ApiResponse<any>>(
      `${this.apiBase}/bulk/preview`,
      formData,
      undefined,
      true
    );
  }

/**
 * Export refund history
 * @param options Export options
 * @returns An Observable that emits the export data
 */
exportRefundHistory(options?: {
  startDate?: string;
  endDate?: string;
  format?: 'csv' | 'excel' | 'pdf';
}): Observable<ApiResponse<any>> {
  let params = new HttpParams();
  
  if (options?.startDate) {
    params = params.set('startDate', options.startDate);
  }
  
  if (options?.endDate) {
    params = params.set('endDate', options.endDate);
  }
  
  if (options?.format) {
    params = params.set('format', options.format);
  }
  
  return this.apiService.get<ApiResponse<any>>(
    `${this.apiBase}/export`,
    params,
    undefined,
    true
  );
}

/**
 * Get refund statistics
 * @param timeframe Timeframe for statistics
 * @returns An Observable that emits the statistics data
 */
getRefundStatistics(timeframe: 'day' | 'week' | 'month' | 'year' = 'month'): Observable<ApiResponse<any>> {
  const params = new HttpParams().set('timeframe', timeframe);
  
  return this.apiService.get<ApiResponse<any>>(
    `${this.apiBase}/statistics`,
    params,
    undefined,
    true
  );
}

  /**
   * Get system limits for refunds
   * @returns An Observable that emits the system limits
   */
  getSystemLimits(): Observable<ApiResponse<any>> {
    return this.apiService.get<ApiResponse<any>>(
      `${this.apiBase}/limits`,
      undefined,
      undefined,
      true
    );
  }

  // Utility methods
  formatCurrency(amount: number, currency: string = 'NGN'): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  formatDate(date: Date | string): string {
    return new Intl.DateTimeFormat('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  calculateAccountAge(createdAt: Date | string): string {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) {
      return 'Less than a day';
    } else if (diffDays === 1) {
      return '1 day';
    } else if (diffDays < 30) {
      return `${diffDays} days`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingMonths = Math.floor((diffDays % 365) / 30);
      let result = `${years} year${years > 1 ? 's' : ''}`;
      if (remainingMonths > 0) {
        result += `, ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
      }
      return result;
    }
  }

  parseCSVToBulkRefunds(csvText: string): BulkRefundItem[] {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const refunds: BulkRefundItem[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const refund: any = {};
      
      headers.forEach((header, index) => {
        const value = values[index] || '';
        switch (header) {
          case 'promoterid':
          case 'userid':
          case 'id':
            refund.promoterUserId = value;
            break;
          case 'amount':
            refund.amount = parseFloat(value) || 0;
            break;
          case 'reason':
            refund.reason = value;
            break;
        }
      });
      
      if (refund.promoterUserId && refund.amount > 0) {
        if (!refund.reason) {
          refund.reason = 'Bulk refund adjustment';
        }
        refunds.push(refund);
      }
    }
    
    return refunds;
  }

  validateBulkRefundItems(items: BulkRefundItem[]): {
    valid: boolean;
    errors: string[];
    validatedItems: Array<BulkRefundItem & { valid: boolean; error?: string }>;
  } {
    const errors: string[] = [];
    const validatedItems: Array<BulkRefundItem & { valid: boolean; error?: string }> = [];
    let valid = true;
    
    for (const item of items) {
      const itemErrors: string[] = [];
      
      if (!item.promoterUserId || item.promoterUserId.trim().length === 0) {
        itemErrors.push('Promoter ID is required');
        valid = false;
      }
      
      if (!item.amount || item.amount <= 0) {
        itemErrors.push('Amount must be greater than 0');
        valid = false;
      } else if (item.amount > 1000000) {
        itemErrors.push('Amount cannot exceed ₦1,000,000');
        valid = false;
      }
      
      validatedItems.push({
        ...item,
        valid: itemErrors.length === 0,
        error: itemErrors.length > 0 ? itemErrors.join(', ') : undefined
      });
    }
    
    if (items.length === 0) {
      errors.push('No refund items provided');
      valid = false;
    }
    
    if (items.length > 100) {
      errors.push('Maximum 100 items per bulk operation');
      valid = false;
    }
    
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
    if (totalAmount > 5000000) {
      errors.push('Total amount cannot exceed ₦5,000,000 per bulk operation');
      valid = false;
    }
    
    return {
      valid,
      errors,
      validatedItems
    };
  }
}