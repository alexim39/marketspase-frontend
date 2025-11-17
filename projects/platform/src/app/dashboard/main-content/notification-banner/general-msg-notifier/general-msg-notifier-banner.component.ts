// general-msg-notifier-banner.component.ts
import { Component, inject, Input, OnInit, signal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { NotificationBannerService } from '../notfication-banner.service';
import { UserInterface } from '../../../../../../../shared-services/src/public-api';
import { NotificationMessage, NotificationResponse, DismissalResponse } from './notification-message.model';

@Component({
  selector: 'general-msg-notifier-banner',
  imports: [CommonModule, MatIconModule, RouterModule],
  providers: [NotificationBannerService],
  template: `
    <!-- Dynamic Notification Banners -->
    @for(notification of activeNotifications(); track notification._id) {
      <div 
        class="notification-banner" 
        [style.background]="notification.bannerColor || getDefaultColor(notification.type)"
        [style.color]="notification.textColor || '#fff'"
        [style.border-left-color]="getBorderColor(notification.type)">
        
        <mat-icon class="notification-icon">{{getNotificationIcon(notification.type)}}</mat-icon>
        
        <div class="notification-content">
          <div class="notification-title" [innerHTML]="notification.title"></div>
          <p class="notification-message" [innerHTML]="notification.message"></p>
          
          @if(notification.actionLink && notification.actionText) {
            <a 
              [routerLink]="notification.actionLink" 
              class="notification-action"
              [style.color]="notification.textColor || '#fff'">
              {{notification.actionText}}
            </a>
          }
        </div>
        
        @if(notification.dismissible) {
          <mat-icon 
            class="close-icon" 
            (click)="dismissNotification(notification)" 
            title="Dismiss notification">
            close
          </mat-icon>
        }
      </div>
    }
  `,
  styleUrls: ['./general-msg-notifier-banner.component.scss']
})
export class GeneralMsgNotifierBannerComponent implements OnInit {

  @Input({ required: true }) user!: Signal<UserInterface | null>;

  private notificationBannerService = inject(NotificationBannerService);

  activeNotifications = signal<NotificationMessage[]>([]);
  dismissedNotificationIds = signal<string[]>([]);

  ngOnInit(): void {
    this.fetchActiveNotifications();
  }

  private fetchActiveNotifications() {
    this.notificationBannerService.getActiveNotifications().subscribe({
      next: (response: NotificationResponse) => {
        if (response.success && response.data) {
          // Filter out dismissed notifications
          const filteredNotifications = response.data.filter(notification => 
            !this.dismissedNotificationIds().includes(notification._id)
          );
          this.activeNotifications.set(filteredNotifications);
        }
      },
      error: (error: any) => {
        console.error('Failed to fetch notification data:', error);
      }
    });

    // Load dismissed notifications for current user
    if (this.user()?._id) {
      this.loadDismissedNotifications();
    }
  }

  private loadDismissedNotifications() {
    const userId = this.user()?._id;
    if (!userId) return;

    this.notificationBannerService.getDismissedNotifications(userId).subscribe({
      next: (response: DismissalResponse) => {
        if (response.success && response.data) {
          this.dismissedNotificationIds.set(response.data);
          // Re-fetch active notifications to filter out dismissed ones
          this.fetchActiveNotifications();
        }
      },
      error: (error: any) => {
        console.error('Failed to fetch dismissed notifications:', error);
      }
    });
  }

  dismissNotification(notification: NotificationMessage) {
    const userId = this.user()?._id;
    if (!userId) {
      // If no user, just remove from UI
      this.removeNotificationFromUI(notification._id);
      return;
    }

    this.notificationBannerService.dismissNotification(notification._id, userId).subscribe({
      next: (response: { success: boolean; message: string }) => {
        if (response.success) {
          this.removeNotificationFromUI(notification._id);
        }
      },
      error: (error: any) => {
        console.error('Failed to dismiss notification:', error);
        // Still remove from UI even if API call fails
        this.removeNotificationFromUI(notification._id);
      }
    });
  }

  private removeNotificationFromUI(notificationId: string) {
    this.activeNotifications.update(notifications => 
      notifications.filter(n => n._id !== notificationId)
    );
    this.dismissedNotificationIds.update(ids => [...ids, notificationId]);
  }

  getNotificationIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      'INFO': 'info',
      'WARNING': 'warning',
      'ERROR': 'error',
      'SUCCESS': 'check_circle',
      'MAINTENANCE': 'build'
    };
    return iconMap[type] || 'info';
  }

  getDefaultColor(type: string): string {
    const colorMap: { [key: string]: string } = {
      'INFO': '#1976d2',
      'WARNING': '#f57c00',
      'ERROR': '#d32f2f',
      'SUCCESS': '#388e3c',
      'MAINTENANCE': '#7b1fa2'
    };
    return colorMap[type] || '#1976d2';
  }

  getBorderColor(type: string): string {
    const borderColorMap: { [key: string]: string } = {
      'INFO': '#1565c0',
      'WARNING': '#ef6c00',
      'ERROR': '#c62828',
      'SUCCESS': '#2e7d32',
      'MAINTENANCE': '#6a1b9a'
    };
    return borderColorMap[type] || '#1565c0';
  }
}