import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services';

export interface LoginStreakRewardRow {
  day: number;
  points: number;
}

export interface LoginStreakLeaderboardConfig {
  enabled: boolean;
  defaultMetric: 'streak' | 'points' | 'blended';
  enabledMetrics: Array<'streak' | 'points' | 'blended'>;
  defaultTimeframe: 'daily' | 'weekly' | 'monthly';
  refreshIntervalMinutes: number;
  topSize: number;
}

export interface LoginStreakAdminConfig {
  enabled: boolean;
  timezone: string;
  minimumSessionMinutes: number;
  cycleLengthDays: number;
  pointValueNaira: number;
  dailyRewards: LoginStreakRewardRow[];
  leaderboard: LoginStreakLeaderboardConfig;
  updatedAt?: string;
  updatedBy?: string;
}

interface LoginStreakConfigResponse {
  success: boolean;
  message?: string;
  data: LoginStreakAdminConfig;
}

@Injectable({ providedIn: 'root' })
export class LoginStreakSettingsService {
  private readonly apiService = inject(ApiService);

  getConfig(): Observable<LoginStreakConfigResponse> {
    return this.apiService.get<LoginStreakConfigResponse>('api/v1/streaks/admin/config', undefined, undefined, true);
  }

  updateConfig(payload: LoginStreakAdminConfig): Observable<LoginStreakConfigResponse> {
    return this.apiService.put<LoginStreakConfigResponse>('api/v1/streaks/admin/config', payload, undefined, true);
  }
}
