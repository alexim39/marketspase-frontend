// general-msg-notifier-banner.component.ts
import { Component, inject, Input, OnInit, signal, Signal, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { NotificationBannerService } from '../notfication-banner.service';
import { UserInterface } from '../../../../../../../shared-services/src/public-api';
import { NotificationMessage, NotificationResponse, DismissalResponse } from './notification-message.model';
import { Subscription, take } from 'rxjs';

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
export class GeneralMsgNotifierBannerComponent implements OnDestroy {
  @Input({ required: true }) user!: Signal<UserInterface | null>;

  private notificationBannerService = inject(NotificationBannerService);
  private subscriptions: Subscription = new Subscription();

  activeNotifications = signal<NotificationMessage[]>([]);
  dismissedNotificationIds = signal<string[]>([]);

  constructor() {
    // Set up reactivity to user changes
    this.setupUserReactivity();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private setupUserReactivity(): void {
    // Use effect to watch for user changes
    const userEffect = effect(() => {
      const currentUser = this.user();
      this.loadDismissedNotifications();
    });

    // Clean up effect when component is destroyed
    this.subscriptions.add(() => userEffect.destroy());
  }

  private fetchActiveNotifications(): void {
    const fetchSub = this.notificationBannerService.getActiveNotifications()
      .pipe(take(1)) // Ensure we only take one emission
      .subscribe({
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
    
    this.subscriptions.add(fetchSub);
  }

  private loadDismissedNotifications(): void {
    const userId = this.user()?._id;
    
    if (!userId) {
      this.fetchActiveNotifications(); // If no user, fetch notifications directly
      return;
    }

    const dismissedSub = this.notificationBannerService.getDismissedNotifications(userId)
      .pipe(take(1)) // Ensure we only take one emission
      .subscribe({
        next: (response: DismissalResponse) => {
          if (response.success && response.data) {
            this.dismissedNotificationIds.set(response.data);
          }
          // Then fetch active notifications
          this.fetchActiveNotifications();
        },
        error: (error: any) => {
          console.error('Failed to fetch dismissed notifications:', error);
          this.fetchActiveNotifications(); // Still try to fetch active ones
        }
      });
    
    this.subscriptions.add(dismissedSub);
  }

  dismissNotification(notification: NotificationMessage): void {
    const userId = this.user()?._id;
    if (!userId) {
      // If no user, just remove from UI
      this.removeNotificationFromUI(notification._id);
      return;
    }

    const dismissSub = this.notificationBannerService.dismissNotification(notification._id, userId)
      .pipe(take(1))
      .subscribe({
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
    
    this.subscriptions.add(dismissSub);
  }

  private removeNotificationFromUI(notificationId: string): void {
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