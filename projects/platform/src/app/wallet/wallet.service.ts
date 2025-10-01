// src/app/common/services/transaction.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../shared-services/src/public-api';

export interface RecordPaymentPayload {
  userId: string;
  amount: number;
  paystackResult: any;
}

@Injectable()
export class WalletService {
  private apiService: ApiService = inject(ApiService);

  /**
   * Records a successful payment transaction to the backend.
   * The backend will verify the transaction with Paystack before saving.
   * @param payload The transaction data to record.
   */
  recordPayment(payload: RecordPaymentPayload): Observable<any> {
    return this.apiService.post<any>(`wallet/verify-and-record`, payload, undefined, true);
  }
}