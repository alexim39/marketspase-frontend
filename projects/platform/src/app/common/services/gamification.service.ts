import { Injectable, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ApiService } from '@shared/services';

export interface GamificationProfileSummary {
  totalExperiencePoints: number;
  currentLevel: number;
  currentLevelTitle: string;
  currentLevelMinExperiencePoints: number;
  nextLevel: number | null;
  nextLevelTitle: string | null;
  nextLevelMinExperiencePoints: number | null;
  experiencePointsToNextLevel: number;
  progressPercent: number;
  totalEvents: number;
  milestonesUnlocked: number;
  badgesUnlocked: number;
  lastActionKey: string | null;
  lastExperiencePointsAwarded: number;
  lastEventAt: string | null;
  recentLevelUpAt: string | null;
  highestLevelReachedAt: string | null;
  lastMilestoneKey: string | null;
  lastMilestoneUnlockedAt: string | null;
  lastCalculatedAt: string | null;
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
  experiencePointsRemaining: number;
  progressPercent: number;
}

export interface GamificationMilestone {
  id: string;
  milestoneKey: string;
  title: string;
  description: string;
  rewardLabel: string;
  linkedBadgeKey: string | null;
  featureKey: string | null;
  icon: string;
  accentColor: string;
  minLevel: number;
  sourceLevel: number;
  unlockedAt: string | null;
  notifiedAt?: string | null;
}

export interface GamificationActionBreakdown {
  actionKey: string;
  label: string;
  description: string;
  category: string;
  icon: string;
  accentColor: string;
  totalCount: number;
  totalExperiencePoints: number;
  lastAwardedAt: string | null;
}

export interface GamificationEventEntry {
  id: string;
  actionKey: string;
  category: string;
  label: string;
  description: string;
  sourceKey: string;
  sourceType: string;
  sourceId: string | null;
  experiencePointsAwarded: number;
  awardedAt: string | null;
  occurredAt: string | null;
  metadata: Record<string, unknown>;
}

export interface GamificationCelebration {
  type: 'level_up' | 'milestone' | 'badge';
  key: string;
  title: string;
  description: string;
  icon: string;
  accentColor: string;
  happenedAt: string | null;
  rewardLabel?: string;
  level?: number;
  badgeKey?: string;
}

export interface GamificationDashboardPayload {
  enabled: boolean;
  refreshIntervalMinutes: number;
  celebrationWindowHours: number;
  user: {
    _id: string;
    displayName: string;
    avatar?: string;
    role: string;
  };
  gamificationProfile: GamificationProfileSummary;
  streakSummary: {
    currentStreak: number;
    longestStreak: number;
    totalPointsEarned: number;
    withdrawablePoints: number;
  };
  badgeSummary: {
    badgesEarned: number;
    lastBadgeKey: string | null;
    lastBadgeUnlockedAt: string | null;
  };
  levelThresholds: GamificationLevelThreshold[];
  upcomingMilestones: GamificationLevelThreshold[];
  unlockedMilestones: GamificationMilestone[];
  actionBreakdown: GamificationActionBreakdown[];
  recentEvents: GamificationEventEntry[];
  recentCelebrations: GamificationCelebration[];
  recentBadges: Array<{
    key: string;
    title: string;
    description: string;
    icon: string;
    accentColor: string;
    unlockedAt: string | null;
    rewardLabel: string;
  }>;
}

export interface GamificationFeedPayload {
  enabled: boolean;
  refreshIntervalMinutes: number;
  celebrationWindowHours: number;
  gamificationProfile: GamificationProfileSummary;
  streakSummary: {
    currentStreak: number;
    longestStreak: number;
    totalPointsEarned: number;
    withdrawablePoints: number;
  };
  badgeSummary: {
    badgesEarned: number;
    lastBadgeKey: string | null;
    lastBadgeUnlockedAt: string | null;
  };
  upcomingMilestones: GamificationLevelThreshold[];
  recentCelebrations: GamificationCelebration[];
}

interface GamificationApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class GamificationService {
  private readonly apiService = inject(ApiService);
  private readonly feedRefreshRequests = new Subject<void>();

  readonly refreshRequests$ = this.feedRefreshRequests.asObservable();

  loadDashboard(): Observable<GamificationApiResponse<GamificationDashboardPayload>> {
    return this.apiService.get<GamificationApiResponse<GamificationDashboardPayload>>(
      'api/v1/gamification/me/dashboard',
      undefined,
      undefined,
      true,
    );
  }

  loadFeed(): Observable<GamificationApiResponse<GamificationFeedPayload>> {
    return this.apiService.get<GamificationApiResponse<GamificationFeedPayload>>(
      'api/v1/gamification/me/feed',
      undefined,
      undefined,
      true,
    );
  }

  requestFeedRefresh(): void {
    this.feedRefreshRequests.next();
  }
}
