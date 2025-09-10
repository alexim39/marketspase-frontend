import { Component, inject, Input, OnInit, signal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { NotificationBannerService } from './notfication-banner.service';
import { UserInterface } from '../../../../../../shared-services/src/public-api';

@Component({
  selector: 'notify-profile-banner',
  imports: [CommonModule, MatIconModule, RouterModule],
  providers: [NotificationBannerService,],
  template: `


    <!-- If user profile is set -->
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
  styles: [
    `
      .info-alert {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background-color:rgb(247, 232, 217);
        color:rgb(104, 39, 19);
        padding: 12px;
        border-radius: 5px;
        font-size: 14px;
        border-left: 4px solid rgb(172, 76, 46);
        position: relative;
        margin: 1em;
      }
      .info-icon {
        font-size: 20px;
        color: rgb(104, 39, 19);
        margin-right: 10px;
      }
      .close-icon {
        font-size: 20px;
        cursor: pointer;
        color: rgb(104, 39, 19);
        margin-left: auto;
      }
      .close-icon:hover {
        color: rgb(104, 39, 19);
      }

      a {
        color: rgb(104, 39, 19);
        text-decoration: underline;
        cursor: pointer;
        font-weight: bold;  
      }

      @media (max-width: 768px) {
        .info-alert {
          flex-direction: column;
          align-items: flex-start;
          padding: 8px; /* Adjust padding for small screens */
        }
        .info-icon {
          margin-bottom: 8px; /* Add margin to separate icon from text */
        }
        .close-icon {
          margin-top: 8px; /* Add margin to separate close icon from text */
          margin-left: 0; /* Reset left margin */
          align-self: flex-end; /* Align close icon to the end */
        }
      }
    `
  ]
})
export class NotifyProfileBannerComponent implements OnInit {

  @Input({ required: true }) user!: Signal<UserInterface | null>;

  private notificationBannerService = inject(NotificationBannerService);

  isProfiled = signal(false)

  ngOnInit(): void {
    if (this.user()?.personalInfo?.address) {
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