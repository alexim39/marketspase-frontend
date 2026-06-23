import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService, CampaignInterface, PromotionInterface } from '@shared/services';

export interface AnalyticsFilters {
  range?: string;
  startDate?: string | null;
  endDate?: string | null;
  campaignId?: string | null;
  promoterId?: string | null;
}

export interface AnalyticsSummary {
  totalCampaigns?: number;
  activeCampaigns?: number;
  activePromotions?: number;
  activePromoters?: number;
  totalPromotions?: number;
  linkedCampaigns?: number;
  trackedVisits: number;
  billableClicks: number;
  invalidClicks: number;
  duplicateClicks: number;
  spend?: number;
  earnings?: number;
  remainingBudget?: number;
  qualityRate: number;
  averageCostPerBillableClick?: number;
  averageEarningPerBillableClick?: number;
}

export interface AnalyticsTimeSeriesRow {
  date: string;
  trackedVisits: number;
  billableClicks: number;
  invalidClicks: number;
  duplicateClicks: number;
  spend?: number;
  earnings?: number;
}

export interface CampaignBreakdownRow {
  campaignId: string;
  title: string;
  status: string;
  budget?: number;
  spentBudget?: number;
  remainingBudget?: number;
  trackedVisits: number;
  billableClicks: number;
  invalidClicks: number;
  duplicateClicks: number;
  spend?: number;
  earnings?: number;
  activePromotions?: number;
  totalPromotions?: number;
  uniquePromoters?: number;
  lastClickAt?: string | Date | null;
}

export interface PromoterBreakdownRow {
  promoterId: string;
  displayName: string;
  username: string;
  avatar?: string;
  trackedVisits: number;
  billableClicks: number;
  invalidClicks: number;
  duplicateClicks: number;
  earnings: number;
}

export interface PromotionBreakdownRow {
  promotionId: string;
  campaignId?: string | null;
  title: string;
  status: string;
  isActive: boolean;
  upi: string;
  trackedVisits: number;
  billableClicks: number;
  invalidClicks: number;
  duplicateClicks: number;
  earnings: number;
  lastClickAt?: string | Date | null;
}

export interface SimpleBreakdownRow {
  deviceType?: string;
  source?: string;
  count: number;
}

export interface AnalyticsResponse {
  success: boolean;
  data: {
    summary: AnalyticsSummary;
    timeSeries: AnalyticsTimeSeriesRow[];
    campaignBreakdown?: CampaignBreakdownRow[];
    promoterBreakdown?: PromoterBreakdownRow[];
    promotionBreakdown?: PromotionBreakdownRow[];
    deviceBreakdown: SimpleBreakdownRow[];
    sourceBreakdown: SimpleBreakdownRow[];
  };
  generatedAt: string;
}

export interface LeadCampaignRow {
  campaignId: string;
  title: string;
  status: string;
  landingViews: number;
  contactMe: number;
  formViews: number;
  leads: number;
  failures: number;
  conversionRate: number;
}

export interface TopCampaign {
  campaignId: string;
  title: string;
  count: number;
}

export interface TopPromoter {
  promoterId: string;
  name: string;
  avatar?: string;
  count: number;
}

export interface LeadAnalyticsResponse {
  success: boolean;
  data: {
    campaignBreakdown: LeadCampaignRow[];
    topCampaign: TopCampaign | null;
    topPromoter: TopPromoter | null;
  };
  generatedAt: string;
}

export interface LeadPromotionRow {
  promotionId: string | null;
  upi: string;
  promoterName: string;
  promoterAvatar?: string;
  landingViews: number;
  contactMe: number;
  formViews: number;
  leads: number;
  failures: number;
}

export interface LeadDailyRow {
  date: string;
  landingViews: number;
  contactMe: number;
  formViews: number;
  leads: number;
  failures: number;
}

export interface LeadDetailResponse {
  success: boolean;
  data: {
    campaign: {
      campaignId: string;
      title: string;
      status: string;
    };
    summary: {
      totalViews: number;
      totalLeads: number;
      totalContactMe: number;
      totalFormViews: number;
      totalFailures: number;
      conversionRate: number;
    };
    promotionBreakdown: LeadPromotionRow[];
    dailySeries: LeadDailyRow[];
  };
  generatedAt: string;
}

export interface CollaborationStarterCampaign extends CampaignInterface {}

export interface CollaborationStarterPromotion extends PromotionInterface {}

export interface CollaborationParticipant {
  user: {
    _id: string;
    displayName: string;
    username: string;
    avatar?: string;
    role?: string;
    isVerified?: boolean;
  };
  role: string;
}

export interface DashboardConversation {
  _id: string;
  type: string;
  title: string;
  lastMessagePreview: string;
  lastMessageBy: { displayName: string; username: string; avatar?: string } | null;
  lastMessageAt: string | Date;
  isUnread: boolean;
  campaignId: string | null;
  promotionId: string | null;
}

export interface CollaborationConversation {
  _id: string;
  type: 'direct' | 'campaign_room' | 'promotion_room' | 'context_room';
  title: string;
  participants: CollaborationParticipant[];
  counterpart?: {
    _id: string;
    displayName: string;
    username: string;
    avatar?: string;
    role?: string;
    isVerified?: boolean;
  } | null;
  campaign?: {
    _id: string;
    title: string;
    status: string;
  } | null;
  promotion?: {
    _id: string;
    upi: string;
    status: string;
  } | null;
  metadata?: {
    entityType?: string;
    entityId?: string;
    entityLabel?: string;
  };
  lastMessageAt?: string | Date | null;
  lastMessagePreview?: string;
  lastMessageBy?: string | null;
  unreadCount: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CollaborationMessage {
  _id: string;
  conversation: string;
  sender: {
    _id: string;
    displayName: string;
    username: string;
    avatar?: string;
    role?: string;
    isVerified?: boolean;
  };
  content: string;
  messageType: 'text' | 'system';
  deliveryStatus?: 'pending' | 'sent' | 'failed';
  isOptimistic?: boolean;
  attachments?: Array<{
    kind: 'link' | 'file' | 'image';
    label?: string;
    url?: string;
  }>;
  readBy?: Array<{
    user: string;
    readAt: string | Date;
  }>;
  isPinned?: boolean;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface ConversationMessagesResponse {
  success: boolean;
  data: {
    conversation: CollaborationConversation;
    messages: CollaborationMessage[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface CollaborationReview {
  _id: string;
  reviewer?: {
    _id: string;
    displayName: string;
    username: string;
    avatar?: string;
    role?: string;
    isVerified?: boolean;
  };
  reviewee?: {
    _id: string;
    displayName: string;
    username: string;
    avatar?: string;
    role?: string;
    isVerified?: boolean;
  };
  campaign?: {
    _id: string;
    title: string;
    status?: string;
  } | null;
  promotion?: {
    _id: string;
    upi: string;
    status?: string;
  } | null;
  relationshipType: string;
  rating: number;
  title?: string;
  comment?: string;
  status: 'published' | 'flagged' | 'hidden' | 'removed';
  flagCount: number;
  moderationNotes?: string;
  adminResponse?: string;
  createdAt: string | Date;
}

export interface ReviewEligibilityResponse {
  success: boolean;
  data: {
    eligible: boolean;
    reason?: string;
    relationshipType?: string;
    campaign?: { _id: string; title: string; status?: string } | null;
    promotion?: { _id: string; upi?: string; status?: string } | null;
  };
}

export interface ReviewListResponse {
  success: boolean;
  data: CollaborationReview[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary?: {
    averageRating: number;
    totalReviews: number;
    flagged?: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class CollaborationService {
  private readonly apiService = inject(ApiService);

  getMarketerAnalytics(userId: string, filters: AnalyticsFilters = {}): Observable<AnalyticsResponse> {
    return this.apiService.get<AnalyticsResponse>(
      `api/v1/campaign/analytics/marketer/${userId}`,
      this.buildParams(filters),
      undefined,
      true
    );
  }

  getMarketerLeadAnalytics(filters: AnalyticsFilters = {}): Observable<LeadAnalyticsResponse> {
    return this.apiService.get<LeadAnalyticsResponse>(
      'api/v1/campaign/analytics/marketer/leads',
      this.buildParams(filters),
      undefined,
      true
    );
  }

  getCampaignLeadDetail(campaignId: string, filters: AnalyticsFilters = {}): Observable<LeadDetailResponse> {
    return this.apiService.get<LeadDetailResponse>(
      `api/v1/campaign/analytics/marketer/leads/${campaignId}`,
      this.buildParams(filters),
      undefined,
      true
    );
  }

  getPromoterAnalytics(userId: string, filters: AnalyticsFilters = {}): Observable<AnalyticsResponse> {
    return this.apiService.get<AnalyticsResponse>(
      `api/v1/promotion/analytics/promoter/${userId}`,
      this.buildParams(filters),
      undefined,
      true
    );
  }

  getMarketerCampaignEntries(
    userId: string,
    limit: number = 6
  ): Observable<{
    success: boolean;
    data: CollaborationStarterCampaign[];
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalCampaigns: number;
      hasNext: boolean;
      hasPrev: boolean;
      limit: number;
    };
  }> {
    const params = new HttpParams()
      .set('page', '1')
      .set('limit', String(limit))
      .set('sortBy', 'updatedAt')
      .set('sortOrder', 'desc');

    return this.apiService.get<{
      success: boolean;
      data: CollaborationStarterCampaign[];
      pagination?: {
        currentPage: number;
        totalPages: number;
        totalCampaigns: number;
        hasNext: boolean;
        hasPrev: boolean;
        limit: number;
      };
    }>(
      `api/v1/campaign/user/${userId}`,
      params,
      undefined,
      true
    );
  }

  getPromoterPromotionEntries(
    userId: string,
    limit: number = 6
  ): Observable<{
    success: boolean;
    data: CollaborationStarterPromotion[];
    totalPages?: number;
    currentPage?: number;
    total?: number;
  }> {
    const params = new HttpParams()
      .set('page', '1')
      .set('limit', String(limit))
      .set('sortBy', 'updatedAt')
      .set('sortOrder', 'desc');

    return this.apiService.get<{
      success: boolean;
      data: CollaborationStarterPromotion[];
      totalPages?: number;
      currentPage?: number;
      total?: number;
    }>(
      `api/v1/promotion/user/${userId}`,
      params,
      undefined,
      true
    );
  }

  getConversations(kind: string = 'all', search: string = ''): Observable<{ success: boolean; data: CollaborationConversation[] }> {
    let params = new HttpParams().set('kind', kind);
    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.apiService.get<{ success: boolean; data: CollaborationConversation[] }>(
      'api/v1/collaboration/conversations',
      params,
      undefined,
      true
    );
  }

  getUnreadCount(): Observable<{ success: boolean; data: { unreadCount: number } }> {
    return this.apiService.get<{ success: boolean; data: { unreadCount: number } }>(
      'api/v1/collaboration/unread-count',
      undefined,
      undefined,
      true
    );
  }

  getDashboardConversations(): Observable<{ success: boolean; data: { conversations: DashboardConversation[] } }> {
    return this.apiService.get<{ success: boolean; data: { conversations: DashboardConversation[] } }>(
      'api/v1/collaboration/dashboard',
      undefined,
      undefined,
      true
    );
  }

  openCampaignConversation(campaignId: string): Observable<{ success: boolean; data: CollaborationConversation }> {
    return this.apiService.post<{ success: boolean; data: CollaborationConversation }>(
      `api/v1/collaboration/conversations/campaign/${campaignId}`,
      {},
      undefined,
      true
    );
  }

  openPromotionConversation(promotionId: string): Observable<{ success: boolean; data: CollaborationConversation }> {
    return this.apiService.post<{ success: boolean; data: CollaborationConversation }>(
      `api/v1/collaboration/conversations/promotion/${promotionId}`,
      {},
      undefined,
      true
    );
  }

  createDirectConversation(payload: { targetUserId: string; campaignId?: string | null; promotionId?: string | null }): Observable<{ success: boolean; data: CollaborationConversation }> {
    return this.apiService.post<{ success: boolean; data: CollaborationConversation }>(
      'api/v1/collaboration/conversations/direct',
      payload,
      undefined,
      true
    );
  }

  getConversationMessages(conversationId: string, page: number = 1, limit: number = 40): Observable<ConversationMessagesResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.apiService.get<ConversationMessagesResponse>(
      `api/v1/collaboration/conversations/${conversationId}/messages`,
      params,
      undefined,
      true
    );
  }

  sendMessage(conversationId: string, content: string, attachments: Array<{ kind: string; label?: string; url?: string }> = []): Observable<{ success: boolean; data: CollaborationMessage }> {
    return this.apiService.post<{ success: boolean; data: CollaborationMessage }>(
      `api/v1/collaboration/conversations/${conversationId}/messages`,
      { content, attachments },
      undefined,
      true
    );
  }

  markConversationRead(conversationId: string): Observable<{ success: boolean; message: string }> {
    return this.apiService.patch<{ success: boolean; message: string }>(
      `api/v1/collaboration/conversations/${conversationId}/read`,
      {},
      undefined,
      true
    );
  }

  pinMessage(conversationId: string, messageId: string): Observable<{ success: boolean; data: CollaborationMessage }> {
    return this.apiService.patch<{ success: boolean; data: CollaborationMessage }>(
      `api/v1/collaboration/conversations/${conversationId}/messages/${messageId}/pin`,
      {},
      undefined,
      true
    );
  }

  unpinMessage(conversationId: string, messageId: string): Observable<{ success: boolean }> {
    return this.apiService.patch<{ success: boolean }>(
      `api/v1/collaboration/conversations/${conversationId}/messages/${messageId}/unpin`,
      {},
      undefined,
      true
    );
  }

  getReviewEligibility(targetUserId: string, promotionId?: string | null): Observable<ReviewEligibilityResponse> {
    let params = new HttpParams();
    if (promotionId) {
      params = params.set('promotionId', promotionId);
    }

    return this.apiService.get<ReviewEligibilityResponse>(
      `api/v1/collaboration/reviews/eligibility/${targetUserId}`,
      params,
      undefined,
      true
    );
  }

  getReceivedReviews(userId: string, page: number = 1, limit: number = 6): Observable<ReviewListResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.apiService.get<ReviewListResponse>(
      `api/v1/collaboration/reviews/received/${userId}`,
      params,
      undefined,
      true
    );
  }

  getGivenReviews(userId: string, page: number = 1, limit: number = 6): Observable<ReviewListResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.apiService.get<ReviewListResponse>(
      `api/v1/collaboration/reviews/given/${userId}`,
      params,
      undefined,
      true
    );
  }

  createReview(payload: { revieweeId: string; promotionId: string; rating: number; title?: string; comment?: string }): Observable<{ success: boolean; data: CollaborationReview; message: string }> {
    return this.apiService.post<{ success: boolean; data: CollaborationReview; message: string }>(
      'api/v1/collaboration/reviews',
      payload,
      undefined,
      true
    );
  }

  flagReview(reviewId: string, payload: { reason: string; details?: string }): Observable<{ success: boolean; data: CollaborationReview; message: string }> {
    return this.apiService.post<{ success: boolean; data: CollaborationReview; message: string }>(
      `api/v1/collaboration/reviews/${reviewId}/flag`,
      payload,
      undefined,
      true
    );
  }

  private buildParams(filters: AnalyticsFilters): HttpParams {
    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && String(value).trim() !== '') {
        params = params.set(key, String(value));
      }
    });

    return params;
  }
}
