import { HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { ApiService } from '@shared/services';

export type LeaderboardMetric = 'streak' | 'points' | 'blended';
export type LeaderboardTimeframe = 'daily' | 'weekly' | 'monthly';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  uid: string;
  displayName: string;
  avatar?: string | null;
  role: 'marketer' | 'promoter';
  currentStreak: number;
  longestStreak: number;
  timeframeQualifiedDays: number;
  timeframeBestStreak: number;
  timeframePoints: number;
  totalPointsEarned: number;
  score: number;
  isCurrentUser: boolean;
}

export interface LeaderboardState {
  enabled: boolean;
  timeframe: LeaderboardTimeframe;
  metric: LeaderboardMetric;
  topSize: number;
  availableMetrics: LeaderboardMetric[];
  defaultMetric: LeaderboardMetric;
  defaultTimeframe: LeaderboardTimeframe;
  refreshIntervalMinutes: number;
  pointValueNaira: number;
  periodKey: string | null;
  periodStartedAt: string | null;
  periodEndsAt: string | null;
  periodLabel: string | null;
  periodRangeLabel: string | null;
  generatedAt: string | null;
  totalEligibleUsers: number;
  entries: LeaderboardEntry[];
}

interface LeaderboardResponse {
  success: boolean;
  message?: string;
  data: LeaderboardState;
}

@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  private readonly apiService = inject(ApiService);

  readonly loading = signal(false);
  readonly state = signal<LeaderboardState | null>(null);

  loadLeaderboard(
    timeframe?: LeaderboardTimeframe,
    metric?: LeaderboardMetric,
    limit?: number,
  ): void {
    this.loading.set(true);

    let params = new HttpParams();
    if (timeframe) {
      params = params.set('timeframe', timeframe);
    }
    if (metric) {
      params = params.set('metric', metric);
    }
    if (typeof limit === 'number' && Number.isFinite(limit)) {
      params = params.set('limit', String(limit));
    }

    this.apiService.get<LeaderboardResponse>('api/v1/streaks/leaderboard', params, undefined, true)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          if (response?.success) {
            this.state.set(response.data);
          }
        },
        error: (error) => {
          console.error('Failed to load leaderboard:', error);
          this.state.set(null);
        },
      });
  }
}
