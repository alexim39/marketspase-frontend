import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { getMessaging, getToken, onMessage } from '@angular/fire/messaging';
import { ApiService } from '@shared/services';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private api = inject(ApiService);
  private http = inject(HttpClient);
  readonly permissionGranted = signal(false);
  readonly currentToken = signal<string | null>(null);

  async requestPermission(): Promise<boolean> {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return false;
      const messaging = getMessaging();
      const token = await getToken(messaging, { vapidKey: 'BBEZLgKtIHTeAFOtQo3wU1CAgzuqSiLDXqPEMwyo-jThZZwBi-AwB6b865c_Dv6uNJkMGPJP73Q-Vj_lt-DWGkE' });
      if (token) {
        await firstValueFrom(this.api.post('api/v1/user/fcm-token', { token }, undefined, true));
        this.currentToken.set(token);
        this.permissionGranted.set(true);
      }
      onMessage(messaging, (payload) => {
        if (Notification.permission === 'granted') {
          new Notification(payload.notification?.title || 'Marketspase', {
            body: payload.notification?.body || '',
            icon: '/assets/icons/icon-192x192.png',
          });
        }
      });
      return true;
    } catch (e) {
      console.warn('FCM permission denied or unsupported:', e);
      return false;
    }
  }

  async unregister(): Promise<void> {
    const token = this.currentToken();
    if (token) {
      await firstValueFrom(this.http.delete(`${this.api.getBaseUrl()}/api/v1/user/fcm-token`, { body: { token } }));
      this.currentToken.set(null);
      this.permissionGranted.set(false);
    }
  }
}
