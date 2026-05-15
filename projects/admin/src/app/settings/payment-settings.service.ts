import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services';

export interface AdminSupportedPaymentCurrency {
  code: string;
  name: string;
  symbol: string;
  sortOrder: number;
  paystackChargeSupported: boolean;
  paystackTransferSupported: boolean;
  capabilities: {
    display: boolean;
    deposit: boolean;
    checkout: boolean;
    withdrawal: boolean;
  };
}

export interface AdminPaymentCurrencyConfig {
  baseCurrency: string;
  ratesSource: 'manual' | 'exchangerate_host' | string;
  refreshIntervalMinutes: number;
  quoteLockMinutes: number;
  supportedCurrencies: AdminSupportedPaymentCurrency[];
  rates: Record<string, number>;
  lastFetchedAt?: string | Date | null;
  updatedAt?: string | Date | null;
}

interface PaymentSettingsResponse {
  success: boolean;
  message?: string;
  data: AdminPaymentCurrencyConfig;
}

@Injectable({ providedIn: 'root' })
export class PaymentSettingsService {
  private readonly apiService = inject(ApiService);

  getConfig(): Observable<PaymentSettingsResponse> {
    return this.apiService.get<PaymentSettingsResponse>('api/v1/wallet/admin/payment-config', undefined, undefined, true);
  }

  updateConfig(payload: AdminPaymentCurrencyConfig): Observable<PaymentSettingsResponse> {
    return this.apiService.put<PaymentSettingsResponse>('api/v1/wallet/admin/payment-config', payload, undefined, true);
  }
}
