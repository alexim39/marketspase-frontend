import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../../shared-services/src/public-api';

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
export class WithdrawalService {

 public readonly PAYSTACK_SECRET_KEY = 'sk_live_31139039a3e109121ff97248e06ee567563cede4';
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
  withdrawRequest(payload: WithdrawalRequestData): Observable<any> {
    //console.log('withdrawRequest', payload);
    return this.apiService.post<any>('wallet/withdraw-request', payload, undefined, true);
  }


  test(): Observable<any> {
  //   const p = {
  //     "saveAccount": true,
  //     "bank": "044",
  //     "accountNumber": "0040342205",
  //     "accountName": "IMENWO  ALEX  CHINAGO",
  //     "amount": 1000,
  //     "userId": "68bde6eb95bec192938fadff",
  //     "bankName": "Access Bank",
  //     "bankCode": "044",
  //     "withdrawalFee": 100,
  //     "totalDeduction": 100,
  //     "finalAmount": 1000
  // }
    const p = {
      "saveAccount": true,
      "bank": "50211",
      "accountNumber": "1100900300",
      "accountName": "anunobi, nwankwo kelechi",
      "amount": 10000,
      "userId": "68d1ab06953ebc12c3226f1b",
      "bankName": "Kuda Bank",
      "bankCode": "044",
      "withdrawalFee": 100,
      "totalDeduction": 100,
      "finalAmount": 1000
  }

    return this.apiService.post<any>('wallet/withdraw-request', p, undefined, true);
  }

  
  /**
 * Submits the form data to the backend.
 * @param formObject The form data.
 * @returns An observable of the submitted form data.
 */
  removeSavedAccount( accountNumber: string, userId: string,): Observable<any> {
    return this.apiService.delete<any>(`wallet/saved-accounts/${userId}/${accountNumber}`, undefined, undefined, true);
  }


  /**
 * Get data to the backend.
 * @param formObject The form data.
 * @returns An observable of the submitted form data.
 */
  getBalance( userId: string,): Observable<any> {
    return this.apiService.get<any>(`wallet/saved-accounts/${userId}`, undefined, undefined, true);
  }
}
