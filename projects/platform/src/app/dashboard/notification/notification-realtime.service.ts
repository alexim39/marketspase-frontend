import { Injectable, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { ApiService } from '@shared/services';
import type { Notification } from './notification.service';

export type NotificationRealtimeEvent =
  | { kind: 'new'; notification: Notification; unreadCount?: number }
  | { kind: 'updated'; notificationId: string; status?: Notification['status']; unreadCount?: number }
  | { kind: 'bulkUpdated'; action: string; unreadCount?: number }
  | { kind: 'deleted'; notificationId: string; unreadCount?: number }
  | { kind: 'bulkDeleted'; notificationIds: string[]; unreadCount?: number };

@Injectable({ providedIn: 'root' })
export class NotificationRealtimeService {
  private readonly apiService = inject(ApiService);
  private readonly auth = inject(Auth);

  private socket: Socket | null = null;
  private connectedUserId: string | null = null;

  private readonly eventSubject = new Subject<NotificationRealtimeEvent>();
  readonly events$ = this.eventSubject.asObservable();

  connect(userId: string): void {
    if (!userId) return;

    if (this.socket?.connected && this.connectedUserId === userId) {
      return;
    }

    this.disconnect();
    this.connectedUserId = userId;
    void this.initializeSocket();
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.connectedUserId = null;
  }

  private async initializeSocket(): Promise<void> {
    const authStateReady = (this.auth as Auth & { authStateReady?: () => Promise<void> }).authStateReady?.() ?? Promise.resolve();
    await authStateReady;

    const token = this.auth.currentUser ? await this.auth.currentUser.getIdToken() : null;
    if (!token || !this.connectedUserId) {
      this.connectedUserId = null;
      return;
    }

    // NOTE: The API currently uses polling transport in production environments.
    this.socket = io(this.apiService.getBaseUrl(), {
      auth: { token },
      transports: ['polling'],
      upgrade: false,
      reconnection: true,
      reconnectionAttempts: 8,
      timeout: 10000,
    });

    this.socket.on('notification:new', (payload: any) => {
      const notification = payload?.notification as Notification | undefined;
      if (!notification?._id) return;
      this.eventSubject.next({ kind: 'new', notification, unreadCount: payload?.unreadCount });
    });

    this.socket.on('notification:updated', (payload: any) => {
      if (!payload?.notificationId) return;
      this.eventSubject.next({
        kind: 'updated',
        notificationId: String(payload.notificationId),
        status: payload?.status,
        unreadCount: payload?.unreadCount,
      });
    });

    this.socket.on('notification:bulkUpdated', (payload: any) => {
      this.eventSubject.next({
        kind: 'bulkUpdated',
        action: String(payload?.action || ''),
        unreadCount: payload?.unreadCount,
      });
    });

    this.socket.on('notification:deleted', (payload: any) => {
      const notificationId = payload?.notificationId;
      if (!notificationId) return;
      this.eventSubject.next({
        kind: 'deleted',
        notificationId: String(notificationId),
        unreadCount: payload?.unreadCount,
      });
    });

    this.socket.on('notification:bulkDeleted', (payload: any) => {
      const notificationIdsRaw = payload?.notificationIds;
      const notificationIds = Array.isArray(notificationIdsRaw)
        ? notificationIdsRaw.map((x) => String(x)).filter(Boolean)
        : [];

      if (notificationIds.length === 0) return;

      this.eventSubject.next({
        kind: 'bulkDeleted',
        notificationIds,
        unreadCount: payload?.unreadCount,
      });
    });
  }
}
