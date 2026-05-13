// notification-bell.component.ts
import { Component, ChangeDetectorRef, DestroyRef, OnInit, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { NotificationService, Notification } from './notification.service';
import { UserInterface } from '@shared/services';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatBadgeModule, MatMenuModule, MatButtonModule],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationBellComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private cdRef = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  notifications: Notification[] = [];
  unreadCount = 0;
  showDropdown = false;

  readonly user = input<UserInterface | null>(null);

  ngOnInit() {
    if (this.user()?._id) {
      this.loadNotifications();
    }

    this.notificationService.notifications$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((notifications) => {
        this.notifications = notifications;
        this.cdRef.markForCheck();
      });

    this.notificationService.unreadCount$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((count) => {
        this.unreadCount = count;
        this.cdRef.markForCheck();
      });
  }

  loadNotifications() {
    if (this.user()?._id) {
      this.notificationService.loadNotifications();
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
    this.notificationService.markAllAsRead().subscribe({
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
}
