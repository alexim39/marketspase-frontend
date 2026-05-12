import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { WhatsAppConnection, SubscriptionPlan, NotificationPreferences, BusinessInfo } from '../pages/settings/models/settings.model';
import { ApiService, ApiResponse } from '@shared/services';
import { UserService } from '../../common/services/user.service';

@Injectable()
export class AiAssistantSettingsAPiService {
  private baseUrl = 'api/v1/ai-assistant/settings';  
  private apiService: ApiService = inject(ApiService);
  private userService: UserService = inject(UserService);

  private get userId(): string {
    return this.userService.user()?._id || '';
  }

  private withUserId(url: string): string {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}userId=${encodeURIComponent(this.userId)}`;
  }

  getWhatsAppConnections(): Observable<WhatsAppConnection[]> {
    return this.apiService.get<ApiResponse<WhatsAppConnection[]>>(this.withUserId(`${this.baseUrl}/whatsapp`))
      .pipe(map(res => res.data));
  }

  addWhatsAppConnection(phoneNumber: string, userId: string): Observable<WhatsAppConnection> {
    return this.apiService.post<ApiResponse<WhatsAppConnection>>(`${this.baseUrl}/whatsapp`, { phoneNumber, userId: userId || this.userId })
      .pipe(map(res => res.data));
  }

  removeWhatsAppConnection(phoneNumber: string): Observable<void> {
    return this.apiService.delete<ApiResponse<void>>(
      this.withUserId(`${this.baseUrl}/whatsapp?phoneNumber=${encodeURIComponent(phoneNumber)}`)
    ).pipe(map(() => void 0));
  }

  toggleAIForConnection(phoneNumber: string, aiEnabled: boolean): Observable<WhatsAppConnection> {
    return this.apiService.put<ApiResponse<WhatsAppConnection>>(`${this.baseUrl}/whatsapp/toggle-ai`, { phoneNumber, aiEnabled, userId: this.userId })
      .pipe(map(res => res.data));
  }

  reconnectConnection(phoneNumber: string): Observable<WhatsAppConnection> {
    return this.apiService.post<ApiResponse<WhatsAppConnection>>(`${this.baseUrl}/whatsapp/reconnect`, { phoneNumber, userId: this.userId })
      .pipe(map(res => res.data));
  }

  saveWhatsAppConfig(data: { phoneNumber: string; accountSid: string; authToken: string; phoneNumberSid?: string }): Observable<WhatsAppConnection> {
    return this.apiService.post<ApiResponse<WhatsAppConnection>>(`${this.baseUrl}/whatsapp/config`, { ...data, userId: this.userId })
      .pipe(map(res => res.data));
  }

  getBusinessInfo(): Observable<BusinessInfo> {
    return this.apiService.get<ApiResponse<any>>(this.withUserId(`${this.baseUrl}/business`))
      .pipe(map(res => res.data));
  }

  updateBusinessInfo(businessId: string): Observable<any> {
    return this.apiService.put<ApiResponse<any>>(`${this.baseUrl}/business`, { businessId, userId: this.userId })
      .pipe(map(res => res.data));
  }

  getNotificationPreferences(): Observable<NotificationPreferences> {
    return this.apiService.get<ApiResponse<NotificationPreferences>>(this.withUserId(`${this.baseUrl}/notification-preferences`))
      .pipe(map(res => res.data));
  }

  updateNotificationPreferences(prefs: NotificationPreferences): Observable<void> {
    return this.apiService.put<ApiResponse<void>>(`${this.baseUrl}/notification-preferences`, { ...prefs, userId: this.userId })
      .pipe(map(() => void 0));
  }

  getSubscriptionPlans(): Observable<SubscriptionPlan[]> {
    return this.apiService.get<ApiResponse<SubscriptionPlan[]>>(`${this.baseUrl}/subscription/plans`)
      .pipe(map(res => res.data));
  }

  getCurrentPlan(): Observable<{ planId: string; plans: SubscriptionPlan[] }> {
    return this.apiService.get<ApiResponse<any>>(this.withUserId(`${this.baseUrl}/subscription`))
      .pipe(map(res => res.data));
  }

  updateSubscriptionPlan(planId: string): Observable<void> {
    return this.apiService.put<ApiResponse<void>>(`${this.baseUrl}/subscription`, { planId, userId: this.userId })
      .pipe(map(() => void 0));
  }
}
