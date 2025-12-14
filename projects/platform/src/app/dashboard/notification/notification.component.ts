// notification-bell.component.ts
import { Component, OnInit, OnDestroy, Input, inject, ChangeDetectorRef } from '@angular/core';
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
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private cdRef = inject(ChangeDetectorRef);

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

    // Subscribe to updates - use detectChanges to handle async updates
    this.notificationService.notifications$.subscribe(notifications => {
      this.notifications = notifications;
      this.cdRef.detectChanges(); // Trigger change detection after update
    });
    
    this.notificationService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
      this.cdRef.detectChanges(); // Trigger change detection after update
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