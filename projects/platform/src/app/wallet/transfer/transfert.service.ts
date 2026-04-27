import { Injectable } from '@angular/core';
import { Observable, switchMap, of, throwError } from 'rxjs';
import { ApiService } from '../../../../../shared-services/src/public-api';


export interface WithdrawableBalanceResponse {
  success: boolean;
  data: {
    totalBalance: number;
    withdrawableBalance: number;
    lockedBalance: number;
    reason: string | null;
  };
}

export interface WalletBalanceResponse {
  success: boolean;
  data: {
    promoter: {
      balance: number;
      reserved: number;
      currency: string;
    };
    marketer: {
      balance: number;
      reserved: number;
      currency: string;
    };
  };
}

export interface TransferRequestData {
  transferType: 'self' | 'other';
  destinationType: 'marketer' | 'promoter';
  amount: number;
  recipientUsername: string | null;
  recipientId: string | null;
  note: string;
  sourceUserId: string;
}

export interface TransferResponse {
  success: boolean;
  message: string;
  data: {
    transferId: string;
    reference: string;
    amount: number;
    destinationWallet: string;
    marketerLocked: boolean;
    newSourceBalance: number;
    newDestinationBalance: number;
  };
}

export interface UserSearchResult {
  _id: string;
  username: string;
  displayName: string;
  avatar?: string;
  role: string;
}

export interface UserSearchResponse {
  success: boolean;
  data: UserSearchResult[];
}

@Injectable()
export class TransferService {
  constructor(private apiService: ApiService) {}

  /**
   * Get user's wallet balances (both promoter and marketer)
   * @param userId - The user's ID
   * @returns Observable with wallet balances
   */
  getWalletBalances(userId: string): Observable<WalletBalanceResponse> {
    return this.apiService.get<WalletBalanceResponse>(`wallet/transfer/balances/${userId}`);
  }
 

  /**
 * Transfer funds between wallets
  * @param payload - The transfer request data
  * @returns Observable with transfer result
  */
  transferFunds(payload: TransferRequestData): Observable<TransferResponse> {
    return this.apiService.post<TransferResponse>('wallet/transfer', payload, undefined, true);
  }

  /**
   * Search users for transfer
   * @param query - Search query string
   * @param role - Optional role filter
   * @param excludeSelf - Whether to exclude current user
   * @returns Observable with search results
   */
  searchUsers(query: string, role?: string, excludeSelf: boolean = true): Observable<UserSearchResponse> {
    let url = `wallet/transfer/users/search?q=${encodeURIComponent(query)}`;
    if (role) {
      url += `&role=${role}`;
    }
    if (excludeSelf) {
      url += `&excludeSelf=true`;
    }
    return this.apiService.get<UserSearchResponse>(url);
  }
}