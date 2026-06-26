import { inject, Injectable } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, throwError } from 'rxjs';
import { filter, map, switchMap, take, timeout } from 'rxjs/operators';
import { WhatsAppConnection, SubscriptionPlan, NotificationPreferences, BusinessInfo } from '../pages/settings/models/settings.model';
import { ApiService } from '@shared/services/api';
import { ApiResponse } from '@shared/services';
import { UserService } from '../../common/services/user.service';

@Injectable()
export class AiAssistantSettingsAPiService {
  private baseUrl = 'api/v1/ai-assistant/settings';  
  private apiService: ApiService = inject(ApiService);
  private userService: UserService = inject(UserService);
  private user$ = toObservable(this.userService.user);

  private withUser<T>(request: (userId: string) => Observable<T>): Observable<T> {
    const currentUserId = this.userService.user()?._id;
    if (currentUserId) {
      return request(currentUserId);
    }

    return this.user$.pipe(
      map(user => user?._id || ''),
      filter((userId): userId is string => !!userId),
      take(1),
      timeout({
        first: 15000,
        with: () => throwError(() => new Error('User session is not ready')),
      }),
      switchMap(request)
    );
  }

  private withUserId(url: string, userId: string): string {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}userId=${encodeURIComponent(userId)}`;
  }

  getWhatsAppConnections(): Observable<WhatsAppConnection[]> {
    return this.withUser(userId =>
      this.apiService.get<ApiResponse<WhatsAppConnection[]>>(this.withUserId(`${this.baseUrl}/whatsapp`, userId))
    ).pipe(map(res => res.data));
  }

  addWhatsAppConnection(phoneNumber: string, userId: string): Observable<WhatsAppConnection> {
    if (userId) {
      return this.apiService.post<ApiResponse<WhatsAppConnection>>(`${this.baseUrl}/whatsapp`, { phoneNumber, userId })
        .pipe(map(res => res.data));
    }

    return this.withUser(resolvedUserId =>
      this.apiService.post<ApiResponse<WhatsAppConnection>>(`${this.baseUrl}/whatsapp`, { phoneNumber, userId: resolvedUserId })
    ).pipe(map(res => res.data));
  }

  removeWhatsAppConnection(phoneNumber: string): Observable<void> {
    return this.withUser(userId =>
      this.apiService.delete<ApiResponse<void>>(
        this.withUserId(`${this.baseUrl}/whatsapp?phoneNumber=${encodeURIComponent(phoneNumber)}`, userId)
      )
    ).pipe(map(() => void 0));
  }

  toggleAIForConnection(phoneNumber: string, aiEnabled: boolean): Observable<WhatsAppConnection> {
    return this.withUser(userId =>
      this.apiService.put<ApiResponse<WhatsAppConnection>>(`${this.baseUrl}/whatsapp/toggle-ai`, { phoneNumber, aiEnabled, userId })
    ).pipe(map(res => res.data));
  }

  reconnectConnection(phoneNumber: string): Observable<WhatsAppConnection> {
    return this.withUser(userId =>
      this.apiService.post<ApiResponse<WhatsAppConnection>>(`${this.baseUrl}/whatsapp/reconnect`, { phoneNumber, userId })
    ).pipe(map(res => res.data));
  }

  saveWhatsAppConfig(data: { phoneNumber: string; accountSid: string; authToken: string; phoneNumberSid?: string }): Observable<WhatsAppConnection> {
    return this.withUser(userId =>
      this.apiService.post<ApiResponse<WhatsAppConnection>>(`${this.baseUrl}/whatsapp/config`, { ...data, userId })
    ).pipe(map(res => res.data));
  }

  getBusinessInfo(): Observable<BusinessInfo> {
    return this.withUser(userId =>
      this.apiService.get<ApiResponse<any>>(this.withUserId(`${this.baseUrl}/business`, userId))
    ).pipe(map(res => res.data));
  }

  updateBusinessInfo(businessId: string): Observable<any> {
    return this.withUser(userId =>
      this.apiService.put<ApiResponse<any>>(`${this.baseUrl}/business`, { businessId, userId })
    ).pipe(map(res => res.data));
  }

  getNotificationPreferences(): Observable<NotificationPreferences> {
    return this.withUser(userId =>
      this.apiService.get<ApiResponse<NotificationPreferences>>(this.withUserId(`${this.baseUrl}/notification-preferences`, userId))
    ).pipe(map(res => res.data));
  }

  updateNotificationPreferences(prefs: NotificationPreferences): Observable<void> {
    return this.withUser(userId =>
      this.apiService.put<ApiResponse<void>>(`${this.baseUrl}/notification-preferences`, { ...prefs, userId })
    ).pipe(map(() => void 0));
  }

  getSubscriptionPlans(): Observable<SubscriptionPlan[]> {
    return this.apiService.get<ApiResponse<SubscriptionPlan[]>>(`${this.baseUrl}/subscription/plans`)
      .pipe(map(res => res.data));
  }

  getCurrentPlan(): Observable<{ planId: string; plans: SubscriptionPlan[] }> {
    return this.withUser(userId =>
      this.apiService.get<ApiResponse<any>>(this.withUserId(`${this.baseUrl}/subscription`, userId))
    ).pipe(map(res => res.data));
  }

  updateSubscriptionPlan(planId: string): Observable<void> {
    return this.withUser(userId =>
      this.apiService.put<ApiResponse<void>>(`${this.baseUrl}/subscription`, { planId, userId })
    ).pipe(map(() => void 0));
  }
}
