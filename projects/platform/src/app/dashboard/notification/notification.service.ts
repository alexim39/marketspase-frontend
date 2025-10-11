// notification.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../../../../shared-services/src/public-api';

export interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  status: 'unread' | 'read';
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiService: ApiService = inject(ApiService);


  private apiUrl = `${this.apiService.getBaseUrl()}/notifications`;
  //private apiUrl = 'http://localhost:8080/notifications';
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private eventSource: EventSource | null = null;

  public notifications$ = this.notificationsSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Initialize SSE with better error handling
  initializeSSE(userId: string): void {
    if (this.eventSource) {
      this.eventSource.close();
    }

    const url = `${this.apiUrl}/stream?userId=${userId}`;
    this.eventSource = new EventSource(url);

    this.eventSource.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data);
        this.addNotification(notification);
        this.updateUnreadCount();
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      // Implement reconnection logic with backoff
      setTimeout(() => {
        if (userId) {
          this.initializeSSE(userId);
        }
      }, 5000);
    };

    this.eventSource.onopen = () => {
      console.log('SSE connection established');
    };
  }

  // Load notifications with error handling
  loadNotifications(params?: any): void {
    this.getNotifications(params)
      .pipe(
        catchError(error => {
          console.error('Error loading notifications:', error);
          return of({ success: false, data: [] });
        })
      )
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.notificationsSubject.next(response.data);
            this.updateUnreadCount();
          }
        }
      });
  }

  getNotifications(params?: any): Observable<any> {
    return this.http.get(this.apiUrl, { params })
      .pipe(
        catchError(error => {
          console.error('HTTP error fetching notifications:', error);
          throw error;
        })
      );
  }

  markAsRead(notificationId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${notificationId}/read`, {})
      .pipe(
        catchError(error => {
          console.error('Error marking notification as read:', error);
          throw error;
        })
      );
  }

  markAllAsRead(): Observable<any> {
    return this.http.patch(`${this.apiUrl}/mark-all-read`, {})
      .pipe(
        catchError(error => {
          console.error('Error marking all as read:', error);
          throw error;
        })
      );
  }

  getUnreadCount(): Observable<any> {
    return this.http.get(`${this.apiUrl}/unread-count`)
      .pipe(
        catchError(error => {
          console.error('Error getting unread count:', error);
          return of({ success: false, data: { count: 0 } });
        })
      );
  }

  private addNotification(notification: Notification): void {
    const current = this.notificationsSubject.value;
    this.notificationsSubject.next([notification, ...current]);
  }

  private updateUnreadCount(): void {
    const unreadCount = this.notificationsSubject.value
      .filter(n => n.status === 'unread').length;
    this.unreadCountSubject.next(unreadCount);
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}