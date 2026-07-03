import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from '@shared/services/api';
import { firstValueFrom } from 'rxjs';

export type CurrencyCode = 'NGN' | 'USD' | 'GHS' | 'KES' | 'ZAR' | 'XOF';

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  NGN: '₦', USD: '$', GHS: '₵', KES: 'KSh', ZAR: 'R', XOF: 'CFA',
};

// Fallback rates (NGN = 1 base) — used when API is unavailable
const FALLBACK_RATES: Record<string, number> = {
  NGN: 1, USD: 0.00065, GHS: 0.0099, KES: 0.087, ZAR: 0.012, XOF: 0.41,
};

@Injectable({ providedIn: 'root' })
export class CurrencyService {
  private api = inject(ApiService);
  readonly preferredCurrency = signal<CurrencyCode>('NGN');
  readonly rates = signal<Record<string, number>>(FALLBACK_RATES);
  readonly loaded = signal(false);

  async load(): Promise<void> {
    try {
      const r = await firstValueFrom(this.api.get<any>('api/v1/wallet/international', undefined, undefined, true));
      if (r?.data?.currency) this.preferredCurrency.set(r.data.currency);
      if (r?.data?.rates && Object.keys(r.data.rates).length > 0) {
        this.rates.set(r.data.rates);
      }
    } catch {
      this.rates.set(FALLBACK_RATES);
    } finally {
      this.loaded.set(true);
    }
  }

  convert(amount: number, from = 'NGN'): number {
    if (!amount) return 0;
    const to = this.preferredCurrency();
    if (from === to) return amount;
    const rates = this.rates();
    const fromRate = rates[from] || FALLBACK_RATES[from] || 1;
    const toRate = rates[to] || FALLBACK_RATES[to] || 1;
    const ngn = from === 'NGN' ? amount : amount / fromRate;
    const result = to === 'NGN' ? ngn : ngn * toRate;
    return Math.round(result * 100) / 100;
  }

  format(amount: number, from = 'NGN'): string {
    const converted = this.convert(amount, from);
    const symbol = CURRENCY_SYMBOLS[this.preferredCurrency()] || '₦';
    return `${symbol}${converted.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  async setPreferredCurrency(code: CurrencyCode): Promise<void> {
    this.preferredCurrency.set(code);
    try {
      await firstValueFrom(this.api.patch('api/v1/user/regional-settings', { preferredCurrency: code }, undefined, true));
    } catch {}
  }
}
