import { Component, Input, Output, EventEmitter, Signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu'; // Keep this import, but it won't be used in the template
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: Date;
  read: boolean;
}

@Component({
  selector: 'app-notifications-menu',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatDividerModule,
    MatButtonModule,
    DatePipe
  ],
  template: `
    <div class="notification-header">
      <h4>Notifications</h4>
      <button mat-icon-button (click)="markAllAsRead.emit()">
        <mat-icon>done_all</mat-icon>
      </button>
    </div>
    <mat-divider/>
    @if (notifications().length > 0) {
      <div class="notification-list">
        @for (notification of notifications().slice(0, 5); track notification) {
          <button mat-menu-item
                  class="notification-item"
                  [class.unread]="!notification.read"
                  (click)="markAsRead.emit(notification.id)">
            <div class="notification-content">
              <div class="notification-title">{{notification.title}}</div>
              <div class="notification-message">{{notification.message}}</div>
              <div class="notification-time">{{notification.timestamp | date:'short'}}</div>
            </div>
          </button>
        }
      </div>
    } @else {
      <div class="no-notifications">
        <mat-icon>notifications_none</mat-icon>
        <p>No new notifications</p>
      </div>
    }
    @if (notifications().length > 5) {
      <mat-divider/>
    }
    @if (notifications().length > 5) {
      <button mat-menu-item (click)="viewAllNotifications.emit()">
        View all notifications
      </button>
    }
  `,
  styleUrls: ['./notifications-menu.component.scss']
})
export class NotificationsMenuComponent {
  @Input({ required: true }) notifications!: Signal<NotificationItem[]>;
  @Output() markAsRead = new EventEmitter<string>();
  @Output() markAllAsRead = new EventEmitter<void>();
  @Output() viewAllNotifications = new EventEmitter<void>();
}