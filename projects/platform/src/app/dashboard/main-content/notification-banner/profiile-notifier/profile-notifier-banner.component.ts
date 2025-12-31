import { Component, inject, Input, OnInit, signal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { NotificationBannerService } from '../notfication-banner.service';
import { UserInterface } from '../../../../../../../shared-services/src/public-api';

@Component({
  selector: 'profile-notifier-banner',
  imports: [CommonModule, MatIconModule, RouterModule],
  providers: [NotificationBannerService,],
  template: `

    <!-- If user profile is set -->
     @if(this.isProfiled()) {
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
  styleUrls: ['./profile-notifier-banner.component.scss']
})
export class ProfileNotifierBannerComponent implements OnInit {

  @Input({ required: true }) user!: Signal<UserInterface | null>;

  private notificationBannerService = inject(NotificationBannerService);

  isProfiled = signal(false)

  ngOnInit(): void {
    if (!this.user()?.personalInfo?.phone || !this.user()?.personalInfo?.address) {
    // if (this.user()?.personalInfo?.address) {
      this.isProfiled.set(true)
    }
  }

  close() {
    this.isProfiled.set(true);
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}