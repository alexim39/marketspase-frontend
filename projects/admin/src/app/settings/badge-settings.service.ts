import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services';

export interface BadgeLevelThreshold {
  level: number;
  title: string;
  minExperiencePoints: number;
}

export interface BadgeReward {
  experiencePoints: number;
  label: string;
}

export interface BadgeCriteria {
  metric: string;
  comparison: string;
  targetValue: number;
  metricLabel: string;
  metricUnit: string;
}

export interface BadgeDefinition {
  id: string;
  key: string;
  title: string;
  description: string;
  shortDescription: string;
  icon: string;
  accentColor: string;
  category: string;
  roles: string[];
  criteria: BadgeCriteria;
  reward: BadgeReward;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BadgeMetricCatalogEntry {
  value: string;
  label: string;
  unit: string;
  category: string;
}

export interface BadgeAdminConfig {
  enabled: boolean;
  feedRefreshMinutes: number;
  evaluationCooldownMinutes: number;
  celebrationWindowHours: number;
  levelThresholds: BadgeLevelThreshold[];
  updatedAt?: string | null;
  updatedBy?: string | null;
}

export interface BadgeAdminPayload {
  config: BadgeAdminConfig;
  definitions: BadgeDefinition[];
  metricCatalog: BadgeMetricCatalogEntry[];
  categories: string[];
  roles: string[];
}

interface BadgeApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface BadgeDefinitionMutationPayload {
  key: string;
  title: string;
  description: string;
  shortDescription?: string;
  icon?: string;
  accentColor?: string;
  category: string;
  roles: string[];
  criteria: {
    metric: string;
    targetValue: number;
  };
  reward: BadgeReward;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
}

@Injectable({ providedIn: 'root' })
export class BadgeSettingsService {
  private readonly apiService = inject(ApiService);

  getConfig(): Observable<BadgeApiResponse<BadgeAdminPayload>> {
    return this.apiService.get<BadgeApiResponse<BadgeAdminPayload>>('api/v1/badges/admin/config', undefined, undefined, true);
  }

  updateConfig(payload: BadgeAdminConfig): Observable<BadgeApiResponse<BadgeAdminPayload>> {
    return this.apiService.put<BadgeApiResponse<BadgeAdminPayload>>('api/v1/badges/admin/config', payload, undefined, true);
  }

  createDefinition(payload: BadgeDefinitionMutationPayload): Observable<BadgeApiResponse<BadgeDefinition>> {
    return this.apiService.post<BadgeApiResponse<BadgeDefinition>>('api/v1/badges/admin/definitions', payload, undefined, true);
  }

  updateDefinition(badgeId: string, payload: BadgeDefinitionMutationPayload): Observable<BadgeApiResponse<BadgeDefinition>> {
    return this.apiService.put<BadgeApiResponse<BadgeDefinition>>(`api/v1/badges/admin/definitions/${badgeId}`, payload, undefined, true);
  }

  deleteDefinition(badgeId: string): Observable<BadgeApiResponse<BadgeDefinition | null>> {
    return this.apiService.delete<BadgeApiResponse<BadgeDefinition | null>>(`api/v1/badges/admin/definitions/${badgeId}`, undefined, undefined, true);
  }
}
