import { Injectable, inject } from '@angular/core';
import { Observable, throwError, timer } from 'rxjs';
import { retry, catchError, timeout, map } from 'rxjs/operators';
import { ApiService } from '../../../../shared-services/src/public-api';

export interface RecordPaymentPayload {
  userId: string;
  amount: number;
  paystackResult: any;
}

export interface RecordPaymentResponse {
  success: boolean;
  message: string;
  newBalance?: number;
  transactionId?: string;
  alreadyExists?: boolean;
  isFirstCampaignFunding?: boolean;
}

@Injectable()
export class WalletService {
  private apiService: ApiService = inject(ApiService);
  private readonly maxRetries = 3;
  private readonly timeoutMs = 30000; // 30 seconds

  /**
   * Records a successful payment transaction to the backend.
   * Includes retry logic and timeout.
   */
  recordPayment(payload: RecordPaymentPayload): Observable<RecordPaymentResponse> {
    return this.apiService.post<RecordPaymentResponse>(
      `wallet/verify-and-record`, 
      payload, 
      undefined, 
      true
    ).pipe(
      timeout(this.timeoutMs),
      retry({
        count: this.maxRetries,
        delay: (error, retryCount) => {
          // Don't retry if it's a client error (4xx)
          if (error.status >= 400 && error.status < 500) {
            return throwError(() => error);
          }
          // Exponential backoff: 1s, 2s, 4s
          const delayMs = Math.pow(2, retryCount - 1) * 1000;
          return timer(delayMs);
        }
      }),
      map(response => {
        if (!response.success && !response.alreadyExists) {
          throw new Error(response.message || 'Failed to record payment');
        }
        return response;
      }),
      catchError(error => {
        console.error('Record payment error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Verify if payment has been recorded by webhook
   */
  verifyPayment(reference: string): Observable<{ recorded: boolean; payment?: any }> {
    return this.apiService.get(`wallet/verify-payment/${reference}`);
  }

}