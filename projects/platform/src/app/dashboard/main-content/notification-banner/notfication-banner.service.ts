// notification-banner.service.ts
import { inject, Injectable, signal } from '@angular/core';
import { ApiService } from '../../../../../../shared-services/src/public-api';
import { Router } from '@angular/router';
import { DismissalResponse, NotificationMessage, NotificationResponse } from './general-msg-notifier/notification-message.model';
import { Observable } from 'rxjs';

export interface PromoData {
  _id: string;
  name: string;
  description: string;
  code: string;
  creditAmount: number;
  totalSlots: number;
  claimedSlots: number;
  remainingSlots: number;
  remainingSlotsPercentage: number;
  status: string;
  notificationSettings: {
    showBanner: boolean;
    bannerMessage: string;
    bannerColor: string;
  };
}

export interface EligibilityResponse {
  eligible: boolean;
  reason?: string;
}

export interface ClaimResponse {
  success: boolean;
  message: string;
  data?: {
    claimId: string;
    creditAmount: number;
    status: string;
  };
}

@Injectable()
export class NotificationBannerService {
  private apiService: ApiService = inject(ApiService);
  private readonly apiUrl = 'user/promo';
  private readonly bannerApiUrl = 'dashboard/banner-messages';

  /**
   * Get active promotional offer for current user
   */
  getActivePromo() {
    return this.apiService.get<{success: boolean; data: PromoData}>(
      `${this.apiUrl}/active`, 
      undefined, 
      undefined, 
      true
    );
  }

  /**
   * Check user eligibility for promotional offer
   */
  checkEligibility(promoId: string, userId: string) {
    return this.apiService.get<{success: boolean; data: EligibilityResponse}>(
      `${this.apiUrl}/${promoId}/eligibility/${userId}`, 
      undefined, 
      undefined, 
      true
    );
  }

  /**
   * Claim promotional credit
   */
  claimPromoCredit(promoId: string, userId: string) {
    return this.apiService.post<ClaimResponse>(
      `${this.apiUrl}/claim`, 
      { promoId, userId }, 
      undefined, 
      true
    );
  }

  /**
   * Get user's promo claims history
   */
  getPromoClaimsHistory() {
    return this.apiService.get<{success: boolean; data: any[]}>(
      `${this.apiUrl}/claims/history`, 
      undefined, 
      undefined, 
      true
    );
  }







  /**
   * Get active notification messages for current user
   */
  getActiveNotifications(): Observable<NotificationResponse> {
    return this.apiService.get<NotificationResponse>(
      `${this.bannerApiUrl}/active`,
      undefined,
      undefined,
      true
    );
  }

  /**
   * Mark notification as read/dismissed
   */
  dismissNotification(notificationId: string, userId: string): Observable<{success: boolean; message: string}> {
    return this.apiService.post<{success: boolean; message: string}>(
      `${this.bannerApiUrl}/${notificationId}/dismiss`,
      { userId },
      undefined,
      true
    );
  }

  /**
   * Get user's notification dismissal history
   */
  getDismissedNotifications(userId: string): Observable<DismissalResponse> {
    return this.apiService.get<DismissalResponse>(
      `${this.bannerApiUrl}/dismissed/${userId}`,
      undefined,
      undefined,
      true
    );
  }

}