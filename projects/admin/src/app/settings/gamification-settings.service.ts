import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services';

export interface GamificationActionRule {
  actionKey: string;
  label: string;
  description: string;
  category: string;
  roles: string[];
  icon: string;
  accentColor: string;
  experiencePoints: number;
  useMetadataExperiencePoints: boolean;
  metadataExperiencePointsField: string | null;
  multiplier: number;
  maxExperiencePointsPerEvent: number | null;
  isActive: boolean;
  sortOrder: number;
}

export interface GamificationLevelThreshold {
  level: number;
  title: string;
  minExperiencePoints: number;
  description: string;
  rewardLabel: string;
  linkedBadgeKey: string | null;
  featureKey: string | null;
  icon: string;
  accentColor: string;
}

export interface GamificationActionCatalogEntry {
  actionKey: string;
  label: string;
  description: string;
  category: string;
  roles: string[];
  icon: string;
  accentColor: string;
  defaultExperiencePoints: number;
  useMetadataExperiencePoints: boolean;
  metadataExperiencePointsField: string | null;
  multiplier: number;
}

export interface GamificationAdminConfig {
  enabled: boolean;
  refreshIntervalMinutes: number;
  celebrationWindowHours: number;
  actionRules: GamificationActionRule[];
  levelThresholds: GamificationLevelThreshold[];
  updatedAt?: string | null;
  updatedBy?: string | null;
}

export interface GamificationAdminPayload {
  config: GamificationAdminConfig;
  actionCatalog: GamificationActionCatalogEntry[];
  categories: string[];
  roles: string[];
}

interface GamificationApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class GamificationSettingsService {
  private readonly apiService = inject(ApiService);

  getConfig(): Observable<GamificationApiResponse<GamificationAdminPayload>> {
    return this.apiService.get<GamificationApiResponse<GamificationAdminPayload>>(
      'api/v1/gamification/admin/config',
      undefined,
      undefined,
      true,
    );
  }

  updateConfig(payload: GamificationAdminConfig): Observable<GamificationApiResponse<GamificationAdminPayload>> {
    return this.apiService.put<GamificationApiResponse<GamificationAdminPayload>>(
      'api/v1/gamification/admin/config',
      payload,
      undefined,
      true,
    );
  }
}
