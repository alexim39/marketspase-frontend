import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { ApiService } from '@shared/services/api';
import type { GamificationProfileSummary } from './gamification.service';

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

export interface BadgeProgress {
  currentValue: number;
  targetValue: number;
  remainingValue: number;
  progressPercent: number;
}

export interface UserBadge {
  id: string;
  badgeId?: string | null;
  key: string;
  title: string;
  description: string;
  shortDescription: string;
  icon: string;
  accentColor: string;
  category: string;
  reward: BadgeReward;
  criteria: BadgeCriteria;
  metricValueAtUnlock: number;
  progressPercentAtUnlock: number;
  sourceEvent: string;
  unlockedAt: string | null;
  notifiedAt?: string | null;
  progress?: BadgeProgress;
}

export interface BadgeProfileSummary {
  level: number;
  levelTitle: string;
  experiencePoints: number;
  badgesEarned: number;
  lastBadgeUnlockedAt: string | null;
  lastBadgeKey: string | null;
  lastEvaluatedAt?: string | null;
  currentLevelMinExperiencePoints: number;
  nextLevel: number | null;
  nextLevelTitle: string | null;
  nextLevelMinExperiencePoints: number | null;
  experiencePointsToNextLevel: number;
  progressPercent: number;
}

export interface BadgeOverviewPayload {
  enabled: boolean;
  feedRefreshMinutes: number;
  celebrationWindowHours: number;
  user: {
    _id: string;
    displayName: string;
    avatar?: string;
    role: string;
  };
  isOwner: boolean;
  badgeProfile: BadgeProfileSummary;
  gamificationProfile?: GamificationProfileSummary | null;
  earnedBadges: UserBadge[];
  featuredBadges: UserBadge[];
  nextBadges: UserBadge[];
  recentUnlocks: UserBadge[];
  recentlyUnlocked: UserBadge[];
  metrics?: Record<string, number>;
}

export interface BadgeFeedPayload {
  enabled: boolean;
  feedRefreshMinutes: number;
  celebrationWindowHours: number;
  badgeProfile: BadgeProfileSummary;
  gamificationProfile?: GamificationProfileSummary | null;
  recentUnlocks: UserBadge[];
  nextBadges: UserBadge[];
  recentlyUnlocked: UserBadge[];
}

interface BadgeApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class BadgeService {
  private readonly apiService = inject(ApiService);
  private readonly feedRefreshRequests = new Subject<void>();

  readonly refreshRequests$ = this.feedRefreshRequests.asObservable();

  loadOverview(userId: string): Observable<BadgeApiResponse<BadgeOverviewPayload>> {
    return this.apiService.get<BadgeApiResponse<BadgeOverviewPayload>>(
      `api/v1/badges/users/${userId}/overview`,
      undefined,
      undefined,
      true,
    );
  }

  loadFeed(limit = 6): Observable<BadgeApiResponse<BadgeFeedPayload>> {
    const params = new HttpParams().set('limit', String(limit));
    return this.apiService.get<BadgeApiResponse<BadgeFeedPayload>>(
      'api/v1/badges/me/feed',
      params,
      undefined,
      true,
    );
  }

  requestFeedRefresh(): void {
    this.feedRefreshRequests.next();
  }
}
