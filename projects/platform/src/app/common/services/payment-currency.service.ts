import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services';

export interface SupportedPaymentCurrency {
  code: string;
  name: string;
  symbol: string;
  capabilities: {
    display: boolean;
    deposit: boolean;
    checkout: boolean;
    withdrawal: boolean;
  };
  paystackChargeSupported: boolean;
  paystackTransferSupported: boolean;
}

export interface PaymentCurrencyConfig {
  baseCurrency: string;
  ratesSource: 'manual' | 'exchangerate_host' | string;
  refreshIntervalMinutes: number;
  quoteLockMinutes: number;
  supportedCurrencies: SupportedPaymentCurrency[];
  rates: Record<string, number>;
  lastFetchedAt?: string | Date | null;
  updatedAt?: string | Date;
}

export interface CurrencyQuote {
  purpose: string;
  baseCurrency: string;
  sourceCurrency: string;
  sourceAmount: number;
  targetCurrency: string;
  targetAmount: number;
  baseAmount: number;
  exchangeRate: number;
  quotedAt: string;
  expiresAt: string;
  ratesSource: string;
  signature: string;
}

export interface WalletOverviewResponse {
  success: boolean;
  data: {
    role: 'marketer' | 'promoter';
    baseCurrency: string;
    displayCurrency: string;
    available: {
      baseAmount: number;
      displayAmount: number;
    };
    reserved: {
      baseAmount: number;
      displayAmount: number;
    };
    balancesByCurrency: Record<string, number>;
    reservedByCurrency: Record<string, number>;
    supportedDisplayCurrencies: Array<{
      code: string;
      name: string;
      symbol: string;
    }>;
    supportedWithdrawalCurrencies: Array<{
      code: string;
      name: string;
      symbol: string;
    }>;
    lastRateRefreshAt?: string | Date | null;
  };
}

@Injectable({ providedIn: 'root' })
export class PaymentCurrencyService {
  private readonly apiService = inject(ApiService);

  getConfig(): Observable<{ success: boolean; data: PaymentCurrencyConfig }> {
    return this.apiService.get<{ success: boolean; data: PaymentCurrencyConfig }>('api/v1/wallet/currencies/config');
  }

  getQuote(params: {
    amount: number;
    fromCurrency: string;
    toCurrency: string;
    purpose: string;
  }): Observable<{ success: boolean; data: CurrencyQuote }> {
    const query = new HttpParams({
      fromObject: {
        amount: String(params.amount),
        from: params.fromCurrency,
        to: params.toCurrency,
        purpose: params.purpose,
      },
    });
    return this.apiService.get<{ success: boolean; data: CurrencyQuote }>('api/v1/wallet/currencies/quote', query);
  }

  getWalletOverview(role: 'marketer' | 'promoter', displayCurrency?: string): Observable<WalletOverviewResponse> {
    let query = new HttpParams().set('role', role);
    if (displayCurrency) {
      query = query.set('displayCurrency', displayCurrency);
    }
    return this.apiService.get<WalletOverviewResponse>('api/v1/wallet/wallet-overview', query, undefined, true);
  }

  updateDisplayCurrency(displayCurrency: string): Observable<{ success: boolean; data: { displayCurrency: string } }> {
    return this.apiService.put<{ success: boolean; data: { displayCurrency: string } }>(
      'api/v1/wallet/display-currency',
      { displayCurrency },
      undefined,
      true,
    );
  }
}
