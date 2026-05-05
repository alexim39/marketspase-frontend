import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { WhatsAppConnection, SubscriptionPlan, NotificationPreferences, BusinessInfo } from '../pages/settings/models/settings.model';
import { ApiService, ApiResponse } from '@shared/services';

@Injectable()
export class AiAssistantSettingsAPiService {
  private baseUrl = 'api/v1/ai-assistant/settings';  
  private apiService: ApiService = inject(ApiService);

  getWhatsAppConnections(): Observable<WhatsAppConnection[]> {
    return this.apiService.get<ApiResponse<WhatsAppConnection[]>>(`${this.baseUrl}/whatsapp`)
      .pipe(map(res => res.data));
  }

  addWhatsAppConnection(phoneNumber: string): Observable<WhatsAppConnection> {
    return this.apiService.post<ApiResponse<WhatsAppConnection>>(`${this.baseUrl}/whatsapp`, { phoneNumber })
      .pipe(map(res => res.data));
  }

  // FIXED: Backend expects body, not query params
  removeWhatsAppConnection(phoneNumber: string): Observable<void> {
    return this.apiService.delete<ApiResponse<void>>(
      `${this.baseUrl}/whatsapp`,
      { body: { phoneNumber } } as any
    ).pipe(map(() => void 0));
  }

  toggleAIForConnection(phoneNumber: string, aiEnabled: boolean): Observable<WhatsAppConnection> {
    return this.apiService.put<ApiResponse<WhatsAppConnection>>(`${this.baseUrl}/whatsapp/toggle-ai`, { phoneNumber, aiEnabled })
      .pipe(map(res => res.data));
  }

  reconnectConnection(phoneNumber: string): Observable<WhatsAppConnection> {
    return this.apiService.post<ApiResponse<WhatsAppConnection>>(`${this.baseUrl}/whatsapp/reconnect`, { phoneNumber })
      .pipe(map(res => res.data));
  }

  getBusinessInfo(): Observable<BusinessInfo> {
    return this.apiService.get<ApiResponse<any>>(`${this.baseUrl}/business`)
      .pipe(map(res => res.data));
  }

  updateBusinessInfo(businessId: string): Observable<any> {
    return this.apiService.put<ApiResponse<any>>(`${this.baseUrl}/business`, { businessId })
      .pipe(map(res => res.data));
  }

  getNotificationPreferences(): Observable<NotificationPreferences> {
    return this.apiService.get<ApiResponse<NotificationPreferences>>(`${this.baseUrl}/notification-preferences`)
      .pipe(map(res => res.data));
  }

  updateNotificationPreferences(prefs: NotificationPreferences): Observable<void> {
    return this.apiService.put<ApiResponse<void>>(`${this.baseUrl}/notification-preferences`, prefs)
      .pipe(map(() => void 0));
  }

  getSubscriptionPlans(): Observable<SubscriptionPlan[]> {
    return this.apiService.get<ApiResponse<SubscriptionPlan[]>>(`${this.baseUrl}/subscription/plans`)
      .pipe(map(res => res.data));
  }

  getCurrentPlan(): Observable<{ planId: string; plans: SubscriptionPlan[] }> {
    return this.apiService.get<ApiResponse<any>>(`${this.baseUrl}/subscription`)
      .pipe(map(res => res.data));
  }

  updateSubscriptionPlan(planId: string): Observable<void> {
    return this.apiService.put<ApiResponse<void>>(`${this.baseUrl}/subscription`, { planId })
      .pipe(map(() => void 0));
  }
}