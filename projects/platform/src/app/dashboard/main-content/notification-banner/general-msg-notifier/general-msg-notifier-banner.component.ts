// general-msg-notifier-banner.component.ts
import { Component, inject, Input, OnInit, signal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { NotificationBannerService } from '../notfication-banner.service';
import { UserInterface } from '../../../../../../../shared-services/src/public-api';

@Component({
  selector: 'general-msg-notifier-banner',
  imports: [CommonModule, MatIconModule, RouterModule],
  providers: [NotificationBannerService],
  template: `
    <!-- Withdrawal Service Notification Banner -->
    @if(showWithdrawalNotification()) {
      <div class="notification-banner">
        <mat-icon class="notification-icon">warning</mat-icon>
        <div class="notification-content">
          <div class="notification-title">Temporary Withdrawal Service Pause</div>
          <p class="notification-message">
            Please be advised that withdrawal requests are currently temporarily paused due to technical maintenance. 
            Our team is actively working to resolve these issues. Withdrawal services will resume on 
            <strong>the 20th of November, 2025</strong>. We apologize for any inconvenience this may cause and appreciate your patience.
          </p>
        </div>
        <mat-icon class="close-icon" (click)="closeWithdrawalNotification()" title="Dismiss notification">close</mat-icon>
      </div>
    }

    <!-- Original Profile Completion Banner (kept for reference) -->
    @if(!this.isProfiled()) {
      <div class="info-alert">
        <mat-icon class="info-icon">info</mat-icon>
        <span>
          To enjoy a better experience on the platform, please complete your profile setup.
          <a routerLink="settings/account" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" (click)="scrollToTop()" title="New Ad">Go to the profile settings to finish setting up your account.</a>
        </span>
        <mat-icon class="close-icon" (click)="close()">close</mat-icon>
      </div>
    }
  `,
  styleUrls: ['./general-msg-notifier-banner.component.scss']
})
export class GeneralMsgNotifierBannerComponent implements OnInit {

  @Input({ required: true }) user!: Signal<UserInterface | null>;

  private notificationBannerService = inject(NotificationBannerService);

  isProfiled = signal(false);
  showWithdrawalNotification = signal(true);

  ngOnInit(): void {
    if (this.user()?.personalInfo?.address) {
      this.isProfiled.set(true);
    }
    
    // Check if user has already dismissed the withdrawal notification
    // const dismissed = localStorage.getItem('withdrawal-notification-dismissed');
    // if (dismissed === 'true') {
    //   this.showWithdrawalNotification.set(false);
    // }
  }

  close() {
    this.isProfiled.set(true);
  }

  closeWithdrawalNotification() {
    this.showWithdrawalNotification.set(false);
    // Store dismissal in localStorage to persist across page refreshes
    //localStorage.setItem('withdrawal-notification-dismissed', 'true');
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}