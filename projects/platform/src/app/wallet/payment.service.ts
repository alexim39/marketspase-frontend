import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../shared-services/src/public-api';

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
}

@Injectable()
export class PaymentService {
  
  constructor(private apiService: ApiService) {}
  
   /**
   * Submits the  form data to the backend.
   * @param formObject The form data.
   * @returns An observable of the submitted form data.
   */
   getTransactions(userId: string): Observable<any> {
    return this.apiService.get<any>(`wallet/${userId}`);
  }
  
  /**
   * Submits the form data to the backend.
   * @param formObject The form data.
   * @returns An observable of the submitted form data.
   */
  withdrawRequest(formObject: WithdrawalRequestData): Observable<any> {
    console.log('withdrawRequest', formObject);
    return this.apiService.post<any>('wallet/withdraw-request', formObject);
  }

  
   /**
   * Submits the form data to the backend.
   * @param formObject The form data.
   * @returns An observable of the submitted form data.
   */
   removeSavedAccount( accountId: string, userId: string,): Observable<any> {
    return this.apiService.delete<any>(`wallet/saved-accounts/${userId}/${accountId}`);
  }


   /**
   * Get data to the backend.
   * @param formObject The form data.
   * @returns An observable of the submitted form data.
   */
   getBalance( userId: string,): Observable<any> {
    return this.apiService.get<any>(`wallet/saved-accounts/${userId}`);
  }
}
