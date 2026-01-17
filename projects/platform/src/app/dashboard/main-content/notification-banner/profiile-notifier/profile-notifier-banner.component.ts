import { Component, inject, Input, OnInit, signal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterModule } from '@angular/router';
import { NotificationBannerService } from '../notfication-banner.service';
import { UserInterface } from '../../../../../../../shared-services/src/public-api';

@Component({
  selector: 'profile-notifier-banner',
  imports: [CommonModule, MatIconModule, RouterModule, MatButtonModule],
  providers: [NotificationBannerService],
  template: `
    @if(this.showBanner()) {
      <div class="profile-completion-banner" [class.hidden]="!showBanner()">
        <div class="banner-content">
          <!-- <div class="banner-left">
            <mat-icon class="banner-icon">rocket_launch</mat-icon>
            <div class="banner-text">
              <h3 class="banner-title">Complete Your Profile</h3>
              <p class="banner-description">
                To enjoy a better experience on the platform, please complete your profile setup.
                <span class="missing-info">
                  @if(!hasPhone()) {
                    <span class="missing-item">Phone number</span>
                  }
                  @if(!hasPhone() && !hasAddress()) {
                    <span> and </span>
                  }
                  @if(!hasAddress()) {
                    <span class="missing-item">Address</span>
                  }
                  <span> required.</span>
                </span>
              </p>
            </div>
          </div> -->
          



          <div class="banner-left">
            <mat-icon class="banner-icon">rocket_launch</mat-icon>
            <div class="banner-text">
              <h3 class="banner-title">Start Your Journey! 🚀</h3>
              <p class="banner-description">
                Complete your onboarding to unlock all MarketSpase features. Our step-by-step guide will help you get started quickly.
                <span class="missing-info">
                  @if(!hasPhone() || !hasAddress()) {
                    <span class="highlight">Missing info:</span>
                    @if(!hasPhone()) {
                      <span class="missing-item">Phone number</span>
                    }
                    @if(!hasPhone() && !hasAddress()) {
                      <span> and </span>
                    }
                    @if(!hasAddress()) {
                      <span class="missing-item">Address</span>
                    }
                    <span> needed.</span>
                  }
                </span>
              </p>
            </div>
          </div>

          <!-- <div class="banner-actions">
            <button 
              mat-flat-button 
              color="primary" 
              class="get-started-button"
              routerLink="/dashboard/get-started">
              <mat-icon>play_circle</mat-icon>
              Start Onboarding Guide
            </button>
            
          </div> -->

          
           <div class="banner-actions">
            <button 
              mat-stroked-button 
              class="get-started-button"
              (click)="navigateToGetStarted()"
              aria-label="Complete profile setup">
              <mat-icon>arrow_forward</mat-icon>
              Start Onboarding
            </button>
           <!-- <button 
              mat-icon-button 
              class="close-button" 
              (click)="dismiss()"
              aria-label="Dismiss notification">
              <mat-icon>close</mat-icon>
            </button>-->
          </div> 
        </div>
        
        <!-- Progress Bar -->
        <div class="progress-container" *ngIf="completionPercentage() > 0 && completionPercentage() < 100">
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="completionPercentage()"></div>
          </div>
          <div class="progress-text">{{completionPercentage()}}% complete</div>
        </div>
      </div>
    }
  `,
  styleUrls: ['./profile-notifier-banner.component.scss']
})
export class ProfileNotifierBannerComponent implements OnInit {
  @Input({ required: true }) user!: Signal<UserInterface | null>;

  private notificationBannerService = inject(NotificationBannerService);
  private router = inject(Router);

  showBanner = signal(false);
  completionPercentage = signal(0);
  hasPhone = signal(false);
  hasAddress = signal(false);
  
  private readonly BANNER_DISMISS_KEY = 'profile_completion_banner_dismissed';
  private isDismissed = false;

  ngOnInit(): void {
    // Check if user has dismissed the banner
    this.isDismissed = localStorage.getItem(this.BANNER_DISMISS_KEY) === 'true';
    
    if (!this.isDismissed && this.user()) {
      this.calculateProfileCompletion();
    }
  }

  private calculateProfileCompletion(): void {
    const user = this.user();
    if (!user) return;

    const hasPhone = !!user.personalInfo?.phone;
    const hasAddress = !!user.personalInfo?.address;
    
    this.hasPhone.set(hasPhone);
    this.hasAddress.set(hasAddress);

    // Calculate completion percentage
    let percentage = 0;
    if (hasPhone) percentage += 50;
    if (hasAddress) percentage += 50;

    this.completionPercentage.set(percentage);
    
    // Show banner only if profile is incomplete
    this.showBanner.set(percentage < 100 && (percentage > 0 || !this.isDismissed));
  }

  navigateToGetStarted(): void {
    this.router.navigate(['/dashboard/get-started'], { 
      queryParams: { 
        focus: this.getNextStep(),
        source: 'profile_banner'
      },
      state: { fromProfileBanner: true }
    });
    this.scrollToTop();
  }

  private getNextStep(): string {
    if (!this.hasPhone()) return 'phone';
    if (!this.hasAddress()) return 'address';
    return 'overview';
  }

  dismiss(): void {
    localStorage.setItem(this.BANNER_DISMISS_KEY, 'true');
    this.showBanner.set(false);
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}