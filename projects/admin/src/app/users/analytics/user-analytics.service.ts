import { inject, Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../../shared-services/src/public-api';

export interface UserAnalyticsFilters {
  role: 'all' | 'marketer' | 'promoter' | 'admin';
  windowDays: number;
  top: number;
  months: number;
}

export interface AnalyticsDistributionItem {
  key: string;
  label: string;
  count: number;
  share: number;
}

export interface GeographicDistributionItem extends AnalyticsDistributionItem {
  activeCount: number;
  verifiedCount: number;
  recentCount: number;
  averageProfileCompletion?: number;
  countryKey?: string;
  countryLabel?: string;
  roleBreakdown: {
    marketer: number;
    promoter: number;
    admin: number;
  };
}

export interface MonthlySignupItem {
  key: string;
  label: string;
  count: number;
  share: number;
  roleBreakdown: {
    marketer: number;
    promoter: number;
    admin: number;
  };
}

export interface ReferralRegionItem {
  key: string;
  label: string;
  referralCount: number;
  count: number;
  referralsPerUser: number;
}

export interface InsightCard {
  title: string;
  tone: 'info' | 'accent' | 'success' | 'warning' | string;
  message: string;
}

export interface UserAnalyticsData {
  filters: UserAnalyticsFilters;
  summary: {
    totalUsers: number;
    activeUsers: number;
    verifiedUsers: number;
    newUsersInWindow: number;
    usersSeenInWindow: number;
    usersWithCompleteProfiles: number;
    usersWithSocialProfiles: number;
    activeStreakUsers: number;
    highLevelUsers: number;
    totalBalance: number;
    averageBalance: number;
    averageProfileCompletion: number;
    averageAge: number;
    totalXp: number;
    averageXp: number;
    totalBadges: number;
    totalPointsEarned: number;
    totalReferrals: number;
    activeShare: number;
    verifiedShare: number;
    completeProfileShare: number;
    windowSeenShare: number;
  };
  distributions: {
    roles: AnalyticsDistributionItem[];
    countries: GeographicDistributionItem[];
    states: GeographicDistributionItem[];
    genders: AnalyticsDistributionItem[];
    ages: AnalyticsDistributionItem[];
    activity: AnalyticsDistributionItem[];
    profileCompletion: AnalyticsDistributionItem[];
    streaks: AnalyticsDistributionItem[];
    levels: AnalyticsDistributionItem[];
    monthlySignups: MonthlySignupItem[];
    referralRegions: ReferralRegionItem[];
  };
  insights: InsightCard[];
  generatedAt: string;
}

export interface UserAnalyticsResponse {
  success: boolean;
  message: string;
  data: UserAnalyticsData;
}

@Injectable()
export class UserAnalyticsService {
  private readonly apiService = inject(ApiService);
  private readonly endpoint = 'api/v1/user/admin/users/analytics';

  getAnalytics(filters: Partial<UserAnalyticsFilters>): Observable<UserAnalyticsResponse> {
    const params = new HttpParams({
      fromObject: {
        role: filters.role || 'all',
        windowDays: String(filters.windowDays ?? 90),
        top: String(filters.top ?? 10),
        months: String(filters.months ?? 12),
      },
    });

    return this.apiService.get<UserAnalyticsResponse>(this.endpoint, params);
  }
}
