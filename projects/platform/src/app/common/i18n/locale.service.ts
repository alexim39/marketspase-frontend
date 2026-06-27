import { Injectable, inject, signal, computed } from '@angular/core';
import { ApiService } from '@shared/services/api';
import { firstValueFrom } from 'rxjs';
import { TRANSLATIONS } from './translations';

export type LocaleCode = 'en' | 'fr' | 'ha' | 'yo';

@Injectable({ providedIn: 'root' })
export class LocaleService {
  private api = inject(ApiService);
  readonly currentLocale = signal<LocaleCode>('en');
  readonly isRTL = computed(() => false);

  translate(key: string): string {
    const locale = this.currentLocale();
    if (locale === 'en') return key;
    return TRANSLATIONS[locale]?.[key] || key;
  }

  async setLocale(code: LocaleCode): Promise<void> {
    this.currentLocale.set(code);
    document.documentElement.lang = code;
    try {
      await firstValueFrom(this.api.patch('api/v1/user/regional-settings', { preferredLocale: code }, undefined, true));
    } catch {}
  }
}
