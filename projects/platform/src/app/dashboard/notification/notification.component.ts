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
import { Router } from '@angular/router';

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
  private readonly router = inject(Router);

  notifications: Notification[] = [];
  unreadCount = 0;
  isLoading = false;
  hasLoadedOnce = false;
  showDropdown = false;

  readonly user = input<UserInterface | null>(null);

  ngOnInit() {
    if (this.user()?._id) {
      this.notificationService.connectRealtime(this.user()!._id);
      this.notificationService.loadUnreadCount();
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

    this.notificationService.loading$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((loading) => {
        this.isLoading = loading;
        this.cdRef.markForCheck();
      });

    this.notificationService.loadedOnce$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((loadedOnce) => {
        this.hasLoadedOnce = loadedOnce;
        this.cdRef.markForCheck();
      });
  }

  loadNotifications() {
    if (this.user()?._id) {
      this.notificationService.loadNotifications();
    }
  }

  handleMenuOpened() {
    this.loadNotifications();
  }

  badgeText(): string {
    if (this.unreadCount <= 0) return '';
    return this.unreadCount > 99 ? '99+' : String(this.unreadCount);
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
    this.router.navigateByUrl('/dashboard/notifications');
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
