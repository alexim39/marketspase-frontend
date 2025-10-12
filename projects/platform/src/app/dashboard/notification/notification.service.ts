// notification.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, timer } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { ApiService } from '../../../../../shared-services/src/public-api';

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
  private http = inject(HttpClient);
  private apiService = inject(ApiService);

  private apiUrl = `${this.apiService.getBaseUrl()}/notifications`;
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private eventSource: EventSource | null = null;

  public notifications$ = this.notificationsSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();

  // Initialize polling for notifications
  startPolling(userId: string, intervalMs: number = 30000): void {
    timer(0, intervalMs).pipe(
      switchMap(() => this.getNotifications({ userId })),
      catchError(error => {
        console.error('Polling error:', error);
        return of({ success: false, data: [] });
      })
    ).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.notificationsSubject.next(response.data);
          this.updateUnreadCount();
        }
      }
    });
  }

  // Load notifications with error handling
  loadNotifications(params?: any): void {
    this.getNotifications(params).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.notificationsSubject.next(response.data);
          this.updateUnreadCount();
        }
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        // Fallback to empty array
        this.notificationsSubject.next([]);
        this.updateUnreadCount();
      }
    });
  }

  getNotifications(params?: any): Observable<any> {
    return this.http.get(this.apiUrl, { params }).pipe(
      catchError(error => {
        console.error('HTTP error fetching notifications:', error);
        // Return empty data instead of throwing error
        return of({ success: false, data: [] });
      })
    );
  }

  markAsRead(notificationId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${notificationId}/read`, {}).pipe(
      catchError(error => {
        console.error('Error marking notification as read:', error);
        // Return success even if error to maintain UI state
        return of({ success: true });
      })
    );
  }

  markAllAsRead(userId: string | undefined): Observable<any> {
    return this.http.patch(`${this.apiUrl}/mark-all-read`, {userId}).pipe(
      catchError(error => {
        console.error('Error marking all as read:', error);
        return of({ success: true });
      })
    );
  }

  getUnreadCount(): Observable<any> {
    return this.http.get(`${this.apiUrl}/unread-count`).pipe(
      catchError(error => {
        console.error('Error getting unread count:', error);
        return of({ success: false, data: { count: 0 } });
      })
    );
  }

  private updateUnreadCount(): void {
    const unreadCount = this.notificationsSubject.value
      .filter(n => n.status === 'unread').length;
    this.unreadCountSubject.next(unreadCount);
  }

  // Mock data for development (remove when backend is ready)
  private getMockNotifications(): Notification[] {
    return [
      {
        _id: '1',
        type: 'promotion_assigned',
        title: 'New Promotion Assigned',
        message: 'You have been assigned to promote "Summer Sale Campaign"',
        data: { campaignId: '123', promotionId: '456' },
        status: 'unread',
        createdAt: new Date().toISOString()
      },
      {
        _id: '2',
        type: 'payment_processed',
        title: 'Payment Received',
        message: 'Your payment of ₦2,500 has been processed successfully',
        data: { amount: 2500 },
        status: 'read',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      }
    ];
  }

  // Development mode - return mock data
  private useMockData(): boolean {
    return !this.apiService.getBaseUrl() || this.apiService.getBaseUrl().includes('localhost:8080');
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}