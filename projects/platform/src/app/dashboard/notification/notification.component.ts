// notification-bell.component.ts
import { Component, OnInit, OnDestroy, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { NotificationService, Notification } from './notification.service';
import { UserInterface } from '../../../../../shared-services/src/public-api';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatBadgeModule, MatMenuModule, MatButtonModule],
  template: `
    <div class="notification-container">
      <button 
        mat-icon-button 
        [matMenuTriggerFor]="notificationMenu"
        class="notification-button"
        aria-label="Notifications"
        [attr.aria-describedby]="unreadCount > 0 ? 'unread-notifications' : null">
        
        <mat-icon 
          [matBadge]="unreadCount" 
          [matBadgeColor]="unreadCount > 0 ? 'warn' : 'primary'"
          matBadgePosition="above after"
          aria-hidden="false">
          notifications
        </mat-icon>
        
        @if (unreadCount > 0) {
          <span class="visually-hidden" id="unread-notifications">
            {{ unreadCount }} unread notifications
          </span>
        }
      </button>

      <mat-menu #notificationMenu="matMenu" class="notification-menu">
        <div class="notification-header">
          <h3>Notifications</h3>
          @if (unreadCount > 0) {
            <button 
              mat-button 
              color="primary" 
              (click)="markAllAsRead()"
              class="mark-all-read">
              Mark all as read
            </button>
          }
        </div>

        <div class="notification-list">
          @if (notifications.length === 0) {
            <div class="no-notifications">
              <mat-icon>notifications_off</mat-icon>
              <p>No notifications</p>
            </div>
          } @else {
            @for (notification of notifications; track notification._id) {
              <div 
                class="notification-item" 
                [class.unread]="notification.status === 'unread'"
                (click)="handleNotificationClick(notification)">
                
                <div class="notification-content">
                  <h4 class="notification-title">{{ notification.title }}</h4>
                  <p class="notification-message">{{ notification.message }}</p>
                  <small class="notification-time">
                    {{ notification.createdAt | date:'short' }}
                  </small>
                </div>
                
                @if (notification.status === 'unread') {
                  <div class="unread-indicator"></div>
                }
              </div>
            }
          }
        </div>

        <!-- <div class="notification-footer">
          <button mat-button color="primary" (click)="viewAllNotifications()">
            View All Notifications
          </button>
        </div> -->
      </mat-menu>
    </div>
  `,
  styles: [`
    .notification-container {
      position: relative;
    }

    .notification-button {
      position: relative;
    }

    .notification-menu {
      min-width: 350px;
      max-width: 400px;
      max-height: 500px;
    }

    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid #e0e0e0;
    }

    .notification-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }

    .mark-all-read {
      font-size: 12px;
    }

    .notification-list {
      max-height: 300px;
      overflow-y: auto;
    }

    .no-notifications {
      text-align: center;
      padding: 32px 16px;
      color: #666;
    }

    .no-notifications mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 8px;
      color: #ccc;
    }

    .notification-item {
      display: flex;
      align-items: flex-start;
      padding: 12px 16px;
      border-bottom: 1px solid #f5f5f5;
      cursor: pointer;
      transition: background-color 0.2s;
      position: relative;
    }

    .notification-item:hover {
      background-color: #f8f9fa;
    }

    .notification-item.unread {
      background-color: #f0f7ff;
    }

    .notification-content {
      flex: 1;
      min-width: 0;
    }

    .notification-title {
      margin: 0 0 4px 0;
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }

    .notification-message {
      margin: 0 0 4px 0;
      font-size: 13px;
      color: #666;
      line-height: 1.4;
    }

    .notification-time {
      font-size: 11px;
      color: #999;
    }

    .unread-indicator {
      width: 8px;
      height: 8px;
      background-color: #1976d2;
      border-radius: 50%;
      margin-left: 8px;
      margin-top: 8px;
    }

    .notification-footer {
      padding: 12px 16px;
      border-top: 1px solid #e0e0e0;
      text-align: center;
    }

    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `]
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);

  notifications: Notification[] = [];
  unreadCount = 0;
  showDropdown = false;

  @Input({ required: true }) user!: () => UserInterface | null;

  ngOnInit() {
    const userId = this.user()?._id;
    
    if (userId) {
      // Use polling instead of SSE for now (more reliable)
      this.loadNotifications();
      
      // Set up polling every 30 seconds
      const pollInterval = setInterval(() => {
        this.loadNotifications();
      }, 30000);
      
      // Store interval ID for cleanup
      (this as any).pollInterval = pollInterval;
    }

    // Subscribe to updates
    this.notificationService.notifications$.subscribe(notifications => {
      this.notifications = notifications;
    });
    
    this.notificationService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });
  }

  loadNotifications() {
    const userId = this.user()?._id;
    if (userId) {
      this.notificationService.loadNotifications({ userId });
    }
  }

  handleNotificationClick(notification: Notification) {
    if (notification.status === 'unread') {
      this.markAsRead(notification._id);
    }
    
    // Handle navigation based on notification data
    this.handleNotificationAction(notification);
  }

  markAsRead(notificationId: string) {
    this.notificationService.markAsRead(notificationId).subscribe({
      next: () => {
        // Notification marked as read
        this.loadNotifications();
      },
      error: (error) => {
        console.error('Error marking notification as read:', error);
      }
    });
  }

  markAllAsRead() {
    const userId = this.user()?._id;
    this.notificationService.markAllAsRead(userId).subscribe({
      next: () => {
        this.loadNotifications();
      },
      error: (error) => {
        console.error('Error marking all notifications as read:', error);
      }
    });
  }

  viewAllNotifications() {
    // Navigate to notifications page
    console.log('Navigate to all notifications page');
    // this.router.navigate(['/notifications']);
  }

  handleNotificationAction(notification: Notification) {
    // Handle different notification types
    switch (notification.type) {
      case 'promotion_assigned':
        // Navigate to promotion details
        // this.router.navigate(['/promotions', notification.data.promotionId]);
        break;
      case 'payment_processed':
        // Navigate to wallet
        // this.router.navigate(['/wallet']);
        break;
      case 'campaign_approved':
        // Navigate to campaign details
        // this.router.navigate(['/campaigns', notification.data.campaignId]);
        break;
      default:
        // Default action
        console.log('Notification action:', notification);
    }
  }

  ngOnDestroy() {
    const pollInterval = (this as any).pollInterval;
    if (pollInterval) {
      clearInterval(pollInterval);
    }
    this.notificationService.disconnect();
  }
}