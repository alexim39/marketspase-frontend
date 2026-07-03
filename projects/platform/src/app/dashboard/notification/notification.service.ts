import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, of, timer } from 'rxjs';
import { catchError, finalize, switchMap, tap } from 'rxjs/operators';
import { ApiService } from '@shared/services/api';
import { NotificationRealtimeService } from './notification-realtime.service';
import { HttpParams } from '@angular/common/http';

export interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  status: 'unread' | 'read';
  priority?: 'low' | 'medium' | 'high' | string;
  createdAt: string;
  readAt?: string;
}

export interface NotificationPageInfo {
  hasNextPage: boolean;
  nextCursor: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly apiService = inject(ApiService);
  private readonly notificationRealtime = inject(NotificationRealtimeService);

  private readonly notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private readonly unreadCountSubject = new BehaviorSubject<number>(0);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private readonly loadedOnceSubject = new BehaviorSubject<boolean>(false);
  private eventSource: EventSource | null = null;
  private pollingSubscription: Subscription | null = null;
  private realtimeSubscription: Subscription | null = null;
  private realtimeUserId: string | null = null;

  public readonly notifications$ = this.notificationsSubject.asObservable();
  public readonly unreadCount$ = this.unreadCountSubject.asObservable();
  public readonly loading$ = this.loadingSubject.asObservable();
  public readonly loadedOnce$ = this.loadedOnceSubject.asObservable();

  startPolling(intervalMs: number = 30000): void {
    if (this.pollingSubscription) {
      return;
    }

    this.pollingSubscription = timer(0, intervalMs).pipe(
      switchMap(() => this.getNotifications()),
      catchError((error) => {
        console.error('Notification polling error:', error);
        return of({ success: false, data: [] });
      })
    ).subscribe({
      next: (response: any) => {
        if (!response?.success) {
          return;
        }

        this.notificationsSubject.next(response.data || []);
        this.updateUnreadCount();
      }
    });
  }

  startUnreadCountPolling(intervalMs: number = 30000): void {
    if (this.pollingSubscription) {
      return;
    }

    this.pollingSubscription = timer(0, intervalMs).pipe(
      switchMap(() => this.getUnreadCount()),
      catchError((error) => {
        console.error('Unread count polling error:', error);
        return of({ success: false, data: { count: 0 } });
      })
    ).subscribe({
      next: (response: any) => {
        this.unreadCountSubject.next(response?.data?.count || 0);
      }
    });
  }

  connectRealtime(userId: string): void {
    if (!userId) return;

    if (this.realtimeUserId === userId && this.realtimeSubscription) {
      return;
    }

    this.realtimeUserId = userId;
    this.notificationRealtime.connect(userId);

    this.realtimeSubscription?.unsubscribe();
    this.realtimeSubscription = this.notificationRealtime.events$.subscribe((evt) => {
      if (evt.kind === 'new') {
        const current = this.notificationsSubject.value;
        const exists = current.some((n) => n._id === evt.notification._id);
        if (!exists) {
          this.notificationsSubject.next([evt.notification, ...current].slice(0, 50));
        }

        if (typeof evt.unreadCount === 'number') {
          this.unreadCountSubject.next(evt.unreadCount);
        } else if (evt.notification.status === 'unread') {
          this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
        }
        return;
      }

      if (evt.kind === 'updated') {
        const updated = this.notificationsSubject.value.map((n) => {
          if (n._id !== evt.notificationId) return n;
          return { ...n, status: evt.status ?? n.status } as Notification;
        });
        this.notificationsSubject.next(updated);

        if (typeof evt.unreadCount === 'number') {
          this.unreadCountSubject.next(evt.unreadCount);
        } else {
          this.updateUnreadCount();
        }
        return;
      }

      if (evt.kind === 'bulkUpdated') {
        if (evt.action === 'markAllAsRead') {
          const updated = this.notificationsSubject.value.map((n) => ({ ...n, status: 'read' as const }));
          this.notificationsSubject.next(updated);
        }

        if (typeof evt.unreadCount === 'number') {
          this.unreadCountSubject.next(evt.unreadCount);
        } else {
          this.updateUnreadCount();
        }
        return;
      }

      if (evt.kind === 'deleted') {
        const notificationId = String(evt.notificationId || '');
        if (!notificationId) return;

        const next = this.notificationsSubject.value.filter((n) => n._id !== notificationId);
        this.notificationsSubject.next(next);

        if (typeof evt.unreadCount === 'number') {
          this.unreadCountSubject.next(evt.unreadCount);
        } else {
          // Fallback: ask server for the authoritative count.
          this.loadUnreadCount();
        }

        return;
      }

      if (evt.kind === 'bulkDeleted') {
        const ids = Array.isArray(evt.notificationIds) ? evt.notificationIds.map((x) => String(x)).filter(Boolean) : [];
        const idSet = new Set(ids);
        if (idSet.size === 0) return;

        const next = this.notificationsSubject.value.filter((n) => !idSet.has(n._id));
        this.notificationsSubject.next(next);

        if (typeof evt.unreadCount === 'number') {
          this.unreadCountSubject.next(evt.unreadCount);
        } else {
          this.loadUnreadCount();
        }
        return;
      }
    });
  }

  loadNotifications(): void {
    this.loadingSubject.next(true);

    this.getNotifications().pipe(
      finalize(() => this.loadingSubject.next(false))
    ).subscribe({
      next: (response: any) => {
        if (response?.success) {
          this.notificationsSubject.next(response.data || []);
          this.updateUnreadCount();
          this.loadedOnceSubject.next(true);
          return;
        }

        // If we failed to fetch, keep the last known list to avoid a "flash" of empty state.
        // We still mark that we tried to load so the UI can show a "retry" affordance if desired.
        this.loadedOnceSubject.next(true);
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        // Keep last known notifications on transport errors as well.
        this.loadedOnceSubject.next(true);
      }
    });
  }

  loadUnreadCount(): void {
    this.getUnreadCount().subscribe({
      next: (response: any) => {
        this.unreadCountSubject.next(response?.data?.count || 0);
      },
      error: (error) => {
        console.error('Error loading unread notification count:', error);
        this.unreadCountSubject.next(0);
      }
    });
  }

  getNotifications(): Observable<any> {
    return this.apiService.get<any>('api/v1/notifications', undefined, undefined, true).pipe(
      catchError((error) => {
        console.error('HTTP error fetching notifications:', error);
        return of({ success: false, data: [] });
      })
    );
  }

  getNotificationsPage(options: {
    cursor?: string | null;
    limit?: number;
    status?: 'unread' | 'read' | 'dismissed' | null;
    type?: string | null;
    priority?: string | null;
  }): Observable<{ success: boolean; data: Notification[]; pageInfo?: NotificationPageInfo }> {
    let params = new HttpParams();
    // Cursor pagination: send `cursor` even for the first page (as an empty string)
    // so the backend can consistently return `pageInfo` for infinite scroll.
    if (options && options.cursor !== undefined) params = params.set('cursor', options.cursor ?? '');
    if (options?.limit) params = params.set('limit', String(options.limit));
    if (options?.status) params = params.set('status', String(options.status));
    if (options?.type) params = params.set('type', String(options.type));
    if (options?.priority) params = params.set('priority', String(options.priority));

    return this.apiService.get<any>('api/v1/notifications', params, undefined, true).pipe(
      catchError((error) => {
        console.error('HTTP error fetching notifications page:', error);
        return of({ success: false, data: [], pageInfo: { hasNextPage: false, nextCursor: null } });
      })
    );
  }

  markAsRead(notificationId: string): Observable<any> {
    return this.apiService.patch<any>(`api/v1/notifications/${notificationId}/read`, {}, undefined, true).pipe(
      catchError((error) => {
        console.error('Error marking notification as read:', error);
        return of({ success: true });
      })
    );
  }

  markAllAsRead(): Observable<any> {
    return this.apiService.patch<any>('api/v1/notifications/mark-all-read', {}, undefined, true).pipe(
      catchError((error) => {
        console.error('Error marking all notifications as read:', error);
        return of({ success: true });
      })
    );
  }

  getUnreadCount(): Observable<any> {
    return this.apiService.get<any>('api/v1/notifications/unread-count', undefined, undefined, true).pipe(
      catchError((error) => {
        console.error('Error getting unread count:', error);
        return of({ success: false, data: { count: 0 } });
      })
    );
  }

  private updateUnreadCount(): void {
    const unreadCount = this.notificationsSubject.value.filter((notification) => notification.status === 'unread').length;
    this.unreadCountSubject.next(unreadCount);
  }

  deleteNotification(notificationId: string): Observable<any> {
    if (!notificationId) return of({ success: false });

    return this.apiService.delete<any>(`api/v1/notifications/${notificationId}`, undefined, undefined, true).pipe(
      tap((res: any) => {
        if (!res?.success) return;

        const next = this.notificationsSubject.value.filter((n) => n._id !== notificationId);
        this.notificationsSubject.next(next);

        if (typeof res?.data?.unreadCount === 'number') {
          this.unreadCountSubject.next(res.data.unreadCount);
        }
      }),
      catchError((error) => {
        console.error('Error deleting notification:', error);
        return of({ success: false });
      })
    );
  }

  bulkDeleteNotifications(notificationIds: string[]): Observable<any> {
    const ids = Array.isArray(notificationIds) ? notificationIds.map((x) => String(x)).filter(Boolean) : [];
    if (ids.length === 0) return of({ success: false });

    return this.apiService.post<any>('api/v1/notifications/bulk-delete', { ids }, undefined, true).pipe(
      tap((res: any) => {
        if (!res?.success) return;

        const idSet = new Set(ids);
        const next = this.notificationsSubject.value.filter((n) => !idSet.has(n._id));
        this.notificationsSubject.next(next);

        if (typeof res?.data?.unreadCount === 'number') {
          this.unreadCountSubject.next(res.data.unreadCount);
        }
      }),
      catchError((error) => {
        console.error('Error bulk deleting notifications:', error);
        return of({ success: false });
      })
    );
  }

  disconnect(): void {
    this.pollingSubscription?.unsubscribe();
    this.pollingSubscription = null;
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.realtimeSubscription?.unsubscribe();
    this.realtimeSubscription = null;
    this.realtimeUserId = null;
    this.notificationRealtime.disconnect();
  }
}
