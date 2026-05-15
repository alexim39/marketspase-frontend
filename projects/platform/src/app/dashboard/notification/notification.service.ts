import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, of, timer } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { ApiService } from '@shared/services';

export interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  status: 'unread' | 'read';
  createdAt: string;
  readAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly apiService = inject(ApiService);

  private readonly notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private readonly unreadCountSubject = new BehaviorSubject<number>(0);
  private eventSource: EventSource | null = null;
  private pollingSubscription: Subscription | null = null;

  public readonly notifications$ = this.notificationsSubject.asObservable();
  public readonly unreadCount$ = this.unreadCountSubject.asObservable();

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

  loadNotifications(): void {
    this.getNotifications().subscribe({
      next: (response: any) => {
        if (response?.success) {
          this.notificationsSubject.next(response.data || []);
          this.updateUnreadCount();
        }
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        this.notificationsSubject.next([]);
        this.updateUnreadCount();
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

  disconnect(): void {
    this.pollingSubscription?.unsubscribe();
    this.pollingSubscription = null;
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}
