// src/app/features/ai-assistant/services/ai-assistant-api.service.ts
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { WhatsAppConnection, SubscriptionPlan, NotificationPreferences } from '../models/settings.model';
import { ApiService, ApiResponse } from '@shared/services';

@Injectable()
export class AiAssistantSettingsAPiService {
  private baseUrl = 'api/v1/ai-assistant/settings';  
  private apiService: ApiService = inject(ApiService);

  getWhatsAppConnections(userId: string): Observable<WhatsAppConnection[]> {
    return this.apiService.get<ApiResponse<WhatsAppConnection[]>>(`${this.baseUrl}/whatsapp/${userId}`)
      .pipe(map(res => res.data));
  }

  addWhatsAppConnection(userId: string, phoneNumber: string): Observable<WhatsAppConnection> {
    return this.apiService.post<ApiResponse<WhatsAppConnection>>(`${this.baseUrl}/whatsapp`, { userId, phoneNumber })
      .pipe(map(res => res.data));
  }

  removeWhatsAppConnection(userId: string, phoneNumber: string): Observable<void> {
    return this.apiService.delete<ApiResponse<void>>(`${this.baseUrl}/whatsapp/${userId}/${phoneNumber}`)
      .pipe(map(() => void 0));
  }

  toggleAIForConnection(userId: string, phoneNumber: string, aiEnabled: boolean): Observable<WhatsAppConnection> {
    return this.apiService.put<ApiResponse<WhatsAppConnection>>(`${this.baseUrl}/whatsapp/toggle-ai`, { userId, phoneNumber, aiEnabled })
      .pipe(map(res => res.data));
  }

  reconnectConnection(userId: string, phoneNumber: string): Observable<WhatsAppConnection> {
    return this.apiService.post<ApiResponse<WhatsAppConnection>>(`${this.baseUrl}/whatsapp/reconnect`, { userId, phoneNumber })
      .pipe(map(res => res.data));
  }

  getBusinessInfo(userId: string): Observable<{ businessId: string; businessName: string; availableStores: any[] }> {
    return this.apiService.get<ApiResponse<any>>(`${this.baseUrl}/business/${userId}`)
      .pipe(map(res => res.data));
  }

  updateBusinessInfo(userId: string, businessId: string): Observable<any> {
    return this.apiService.put<ApiResponse<any>>(`${this.baseUrl}/business`, { userId, businessId })
      .pipe(map(res => res.data));
  }

  getNotificationPreferences(userId: string): Observable<NotificationPreferences> {
    return this.apiService.get<ApiResponse<NotificationPreferences>>(`${this.baseUrl}/notification-preferences/${userId}`)
      .pipe(map(res => res.data));
  }

  updateNotificationPreferences(userId: string, prefs: NotificationPreferences): Observable<void> {
    return this.apiService.put<ApiResponse<void>>(`${this.baseUrl}/notification-preferences`, { userId, ...prefs })
      .pipe(map(() => void 0));
  }

  getSubscriptionPlans(userId: string): Observable<SubscriptionPlan[]> {
    return this.apiService.get<ApiResponse<SubscriptionPlan[]>>(`${this.baseUrl}/subscription/plans`)
      .pipe(map(res => res.data));
  }

  getCurrentPlan(userId: string): Observable<{ planId: string }> {
    return this.apiService.get<ApiResponse<any>>(`${this.baseUrl}/subscription/${userId}`)
      .pipe(map(res => ({ planId: res.data.planId })));
  }

  updateSubscriptionPlan(userId: string, planId: string): Observable<void> {
    return this.apiService.put<ApiResponse<void>>(`${this.baseUrl}/subscription`, { userId, planId })
      .pipe(map(() => void 0));
  }

}