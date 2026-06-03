import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services';

export interface PpcPricingConfig {
  key?: string;
  enabled: boolean;
  currency: string;
  defaultCostPerClick: number;
  minCostPerClick: number;
  maxCostPerClick: number;
  allowMarketerOverride: boolean;
  changeReason?: string;
  updatedAt?: string | Date | null;
  createdAt?: string | Date | null;
}

interface PpcPricingConfigResponse {
  success: boolean;
  message?: string;
  data: PpcPricingConfig;
}

@Injectable({ providedIn: 'root' })
export class PpcPricingSettingsService {
  private readonly apiService = inject(ApiService);

  getConfig(): Observable<PpcPricingConfigResponse> {
    return this.apiService.get<PpcPricingConfigResponse>(
      'api/v1/campaign/admin/ppc/pricing-config',
      undefined,
      undefined,
      true,
    );
  }

  updateConfig(payload: PpcPricingConfig): Observable<PpcPricingConfigResponse> {
    return this.apiService.put<PpcPricingConfigResponse>(
      'api/v1/campaign/admin/ppc/pricing-config',
      payload,
      undefined,
      true,
    );
  }
}
