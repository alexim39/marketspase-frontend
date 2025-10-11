// notification-bell.component.ts
import { Component, OnInit, OnDestroy, Input, Signal } from '@angular/core';
import { NotificationService, Notification } from './notification.service';
import { CommonModule } from '@angular/common';
import { UserInterface } from '../../../../../shared-services/src/public-api';

@Component({
  selector: 'app-notification-bell',
  imports: [CommonModule],
  template: `
    <div class="notification-bell" (click)="toggleDropdown()">
      <i class="bell-icon"></i>
      <span class="badge" *ngIf="unreadCount > 0">{{ unreadCount }}</span>
      
      <div class="dropdown" *ngIf="showDropdown">
        <div class="notification-item" 
             *ngFor="let notification of notifications"
             [class.unread]="notification.status === 'unread'"
             (click)="markAsRead(notification._id)">
          <h4>{{ notification.title }}</h4>
          <p>{{ notification.message }}</p>
          <small>{{ notification.createdAt | date:'short' }}</small>
        </div>
      </div>
    </div>
  `
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount = 0;
  showDropdown = false;

  @Input({ required: true }) user!: Signal<UserInterface | null>;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    // Initialize real-time notifications
    const userId = this.user()?._id || '';// 'current-user-id'; // Get from auth service
    this.notificationService.initializeSSE(userId);
    
    // Or use polling
    // this.notificationService.startPolling(userId, 30000);
    
    // Subscribe to updates
    this.notificationService.notifications$.subscribe(notifications => {
      this.notifications = notifications;
    });
    
    this.notificationService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });
    
    // Load initial notifications
    this.notificationService.loadNotifications();
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  markAsRead(notificationId: string) {
    this.notificationService.markAsRead(notificationId).subscribe();
  }

  ngOnDestroy() {
    this.notificationService.disconnect();
  }
}