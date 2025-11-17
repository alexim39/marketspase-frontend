// promo-banner.component.ts
import { Component, Input, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { UserInterface } from '../../../../../../../shared-services/src/public-api';
import { NotificationBannerService, PromoData } from '../notfication-banner.service';

@Component({
  selector: 'promo-banner',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  providers: [NotificationBannerService],
  template: `
    <!-- Promotional Banner for Marketers -->
    @if (showPromoBanner() && user()?.role === 'marketer' && promoData()) {
      <div class="promo-banner" [class.closing]="isClosing()" [style.background]="promoData()?.notificationSettings?.bannerColor || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'">
        <div class="promo-content">
          <div class="promo-icon">
            <mat-icon>celebration</mat-icon>
          </div>
          <div class="promo-text">
            <h3>🎉 {{promoData()?.notificationSettings?.bannerMessage || promoData()?.name}}</h3>
            <p>{{promoData()?.description}}</p>
          </div>
          <div class="promo-actions">
            <button 
              mat-raised-button 
              color="accent" 
              (click)="claimOffer()" 
              class="claim-btn"
              [disabled]="isClaiming()">
              {{isClaiming() ? 'Processing...' : 'Claim Now'}}
              <mat-icon>arrow_forward</mat-icon>
            </button>
            <button mat-icon-button (click)="closeBanner()" class="close-btn">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        </div>
        <div class="promo-progress">
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="promoData()?.remainingSlotsPercentage || 0"></div>
          </div>
          <span class="progress-text">{{promoData()?.remainingSlots || 0}} slots remaining</span>
        </div>
      </div>
    }

    <!-- Existing Profile Banner -->
    <div class="profile-banner">
      <!-- Your existing profile banner content -->
    </div>
  `,
  styleUrls: ['./promo-banner.component.scss']
})
export class PromoBannerComponent implements OnInit {
  @Input({ required: true }) user!: () => UserInterface | null;
  
  private router = inject(Router);
  private promoBannerService = inject(NotificationBannerService);
  private snackBar = inject(MatSnackBar);
  
  showPromoBanner = signal(true);
  isClosing = signal(false);
  isClaiming = signal(false);
  promoData = signal<PromoData | null>(null);

  ngOnInit() {
    // Check if user has already dismissed the banner
    const isDismissed = localStorage.getItem('promo_banner_dismissed');
    if (isDismissed === 'true') {
      this.showPromoBanner.set(false);
    }

    this.fetchActivePromo();
  }

  private fetchActivePromo() {
    this.promoBannerService.getActivePromo().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          //console.log('promo ',response.data)
          this.promoData.set(response.data);
          this.showPromoBanner.set(response.data.notificationSettings.showBanner);
        } 
        // else {
        //   this.showPromoBanner.set(response.data.notificationSettings.showBanner);
        // }
      },
      error: (error) => {
        console.error('Failed to fetch promo data:', error);
        this.showPromoBanner.set(false);
      }
    });
  }

  async claimOffer() {
    if (!this.promoData()) return;

    this.isClaiming.set(true);

    try {
      // First check eligibility
      const eligibilityResponse = await this.promoBannerService.checkEligibility(this.promoData()!._id, this.user()!._id).toPromise();
      
      if (!eligibilityResponse?.success || !eligibilityResponse.data.eligible) {
        this.snackBar.open(eligibilityResponse?.data.reason || 'Not eligible for this offer', 'OK', { duration: 5000 });
        return;
      }

      // Claim the promo
      const claimResponse = await this.promoBannerService.claimPromoCredit(this.promoData()!._id, this.user()!._id).toPromise();
      
      if (claimResponse?.success) {
        this.snackBar.open('🎉 Promotional credit claimed successfully!', 'OK', { duration: 5000 });
        this.closeBanner();
        
        // Refresh user data or navigate to wallet
        setTimeout(() => {
          window.location.reload(); // Or use your user service to refresh data
        }, 2000);
      } else {
        this.snackBar.open(claimResponse?.message || 'Failed to claim promotional credit', 'OK', { duration: 5000 });
      }
    } catch (error) {
      console.error('Claim offer error:', error);
      this.snackBar.open('Failed to claim promotional credit', 'OK', { duration: 5000 });
    } finally {
      this.isClaiming.set(false);
    }
  }

  closeBanner() {
    this.isClosing.set(true);
    setTimeout(() => {
      this.showPromoBanner.set(false);
      // Store dismissal in local storage
      localStorage.setItem('promo_banner_dismissed', 'true');
    }, 300);
  }
}