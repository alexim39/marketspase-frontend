// transfer.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../../../shared-services/src/public-api';
import { HttpParams } from '@angular/common/http';

export interface TransferTransaction {
  transferId: string;
  reference: string;
  transferType: 'self' | 'other';
  amount: number;
  
  // Source user info
  sourceUserId: string;
  sourceUserName: string;
  sourceUserEmail: string;
  sourceUserRole: string;
  
  // Destination user info
  destinationUserId: string;
  destinationUserName: string;
  destinationUserEmail: string;
  destinationUserRole: string;
  
  destinationWalletType: 'promoter' | 'marketer';
  marketerLocked: boolean;
  lockedReason?: string;
  
  status: 'completed' | 'pending' | 'failed' | 'reversed';
  note?: string;
  createdAt: Date;
  processedAt?: Date;
  
  sourceBalanceBefore?: number;
  sourceBalanceAfter?: number;
  destinationBalanceBefore?: number;
  destinationBalanceAfter?: number;
}

export interface TransferStats {
  totalTransfers: number;
  totalAmount: number;
  selfTransfers: number;
  otherTransfers: number;
  toMarketerWallet: number;
  toPromoterWallet: number;
  lockedAmount: number;
}

@Injectable()
export class TransferService {
  private apiService: ApiService = inject(ApiService);
  private baseUrl = 'financial/transfer';

  getTransferStats(): Observable<{ success: boolean; data: TransferStats }> {
    return this.apiService.get<{ success: boolean; data: TransferStats }>(`${this.baseUrl}/stats`)
      .pipe(map(response => response));
  }

  getTransfers(params?: {
    page?: number;
    limit?: number;
    transferType?: string;
    destinationType?: string;
    search?: string;
    fromDate?: string;
    toDate?: string;
  }): Observable<{ transfers: TransferTransaction[]; total: number; page: number; limit: number }> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.apiService
      .get<{ success: boolean; data: { transfers: TransferTransaction[]; total: number; page: number; limit: number } }>(
        `${this.baseUrl}/funds`,
        httpParams
      )
      .pipe(map(response => response.data));
  }

  getTransferById(transferId: string): Observable<TransferTransaction> {
    return this.apiService.get<{ success: boolean; data: TransferTransaction }>(`${this.baseUrl}/${transferId}`)
      .pipe(map(response => response.data));
  }

  exportTransfers(params: {
    format: 'csv' | 'excel' | 'pdf';
    transferType?: string;
    destinationType?: string;
    startDate?: string;
    endDate?: string;
  }): Observable<{ success: boolean; data: { url: string } }> {
    return this.apiService.post<{ success: boolean; data: { url: string } }>(`${this.baseUrl}/export`, params)
      .pipe(map(response => response));
  }
}