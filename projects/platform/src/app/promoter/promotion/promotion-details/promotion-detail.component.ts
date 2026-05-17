import { Component, inject, OnInit, signal, DestroyRef, computed, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PromotionInterface, UserInterface } from '@shared/services';
import { PromoterService } from '../../promoter.service';
import { interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserService } from '../../../common/services/user.service';

// Import sub-components
import { PromotionHeaderComponent } from './components/promotion-header/promotion-header.component';
import { PromotionOverviewComponent } from './components/promotion-overview/promotion-overview.component';
import { PromotionMetricsComponent } from './components/promotion-metrics/promotion-metrics.component';
import { PromotionProofComponent } from './components/promotion-proof/promotion-proof.component';
import { PromotionActivityComponent } from './components/promotion-activity/promotion-activity.component';
import { PromotionFooterComponent } from './components/promotion-footer/promotion-footer.component';
import { MatIconModule } from '@angular/material/icon';
import { getCampaignCostPerClick, getCampaignRemainingBudget } from '../../utils/campaign-availability.util';

@Component({
  selector: 'app-promotion-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    PromotionHeaderComponent,
    PromotionOverviewComponent,
    PromotionMetricsComponent,
    PromotionProofComponent,
    PromotionActivityComponent,
    PromotionFooterComponent,
    MatIconModule
  ],
  templateUrl: './promotion-detail.component.html',
  styleUrls: ['./promotion-detail.component.scss']
})
export class PromotionDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private promoterService = inject(PromoterService);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  public promotion = signal<PromotionInterface | null>(null);
  public loading = signal(true);
  public error = signal('');

  private userService: UserService = inject(UserService);
  public user: Signal<UserInterface | null> = this.userService.user;

  public countdownSignal = signal<string>('');
  public timeDifferenceInMilliseconds = signal(0);
  public progressPercentage = computed(() => {
    const promotionValue = this.promotion();
    if (!promotionValue) return 0;
    
    const totalClicks = promotionValue.clickStats?.totalClicks || 0;
    const billableClicks = promotionValue.clickStats?.billableClicks || 0;
    if (!totalClicks) return 0;
    return Math.min((billableClicks / totalClicks) * 100, 100);
  });

  public readonly api = this.promoterService.api;
  public readonly isLinkRestricted = computed(() => {
    const promotion = this.promotion();
    const reviewStatus = promotion?.fraudStatus?.reviewStatus;
    return Boolean(
      promotion?.fraudStatus?.isFlagged &&
      reviewStatus &&
      ['warning', 'final_warning', 'blocked'].includes(reviewStatus)
    ) || promotion?.isActive === false && Boolean(promotion?.fraudStatus?.isFlagged);
  });

  ngOnInit(): void {
    const promotionId = this.route.snapshot.paramMap.get('id');
    
    if (promotionId) {
      this.loadPromotion(promotionId);
    } else {
      this.error.set('Invalid promotion ID');
      this.loading.set(false);
    }
  }

  private loadPromotion(id: string): void {
    this.promoterService.getPromotionById(id, this.user()!._id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.promotion.set(response.promotion);
            this.startCountdownTimer();
          } else {
            this.error.set(response.message || 'Failed to load promotion');
          }
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading promotion:', error);
          this.error.set(error.error?.message || 'An error occurred while loading the promotion');
          this.loading.set(false);
        }
      });
  }

  private startCountdownTimer(): void {
    const promotion = this.promotion();
    if (!promotion) return;

    if (!promotion.campaign?.endDate) {
      const remainingBudget = getCampaignRemainingBudget(promotion.campaign);
      this.countdownSignal.set(
        remainingBudget < getCampaignCostPerClick(promotion.campaign)
          ? 'Budget Exhausted'
          : 'Budget Based'
      );
      this.timeDifferenceInMilliseconds.set(0);
      return;
    }

    this.updateCountdown();

    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.updateCountdown();
      });
  }

  private updateCountdown(): void {
    const promotion = this.promotion();
    if (!promotion?.campaign?.endDate) return;

    const endDate = new Date(promotion.campaign.endDate).getTime();
    const currentTime = new Date().getTime();
    const timeDifference = endDate - currentTime;
    
    this.timeDifferenceInMilliseconds.set(timeDifference);

    if (timeDifference <= 0) {
      this.countdownSignal.set('Campaign Ended');
      return;
    }

    const totalSeconds = Math.floor(timeDifference / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');

    this.countdownSignal.set(`${formattedHours}:${formattedMinutes}:${formattedSeconds}`);
  }

  isNearingExpiration(): boolean {
    const thirtyMinutesInMs = 30 * 60 * 1000;
    return this.timeDifferenceInMilliseconds() > 0 && this.timeDifferenceInMilliseconds() <= thirtyMinutesInMs;
  }

  isSubmissionExpired(): boolean {
    const promotion = this.promotion();
    if (!promotion) return true;

    if (!promotion.campaign?.endDate) {
      return getCampaignRemainingBudget(promotion.campaign) < getCampaignCostPerClick(promotion.campaign);
    }

    return Date.now() > new Date(promotion.campaign.endDate).getTime();
  }

  downloadPromotion(promotionId: string): void {
    const promotion = this.promotion();
    if (!promotion) return;

    const campaignId = promotion.campaign._id;
    const promoterId = promotion.promoter._id;

    this.promoterService.downloadPromotion(campaignId, promoterId, promotionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Promotion downloaded successfully', 'OK', { duration: 3000 });
          } else {
            this.snackBar.open(response.message, 'OK', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error downloading promotion:', error);
          this.snackBar.open(error.error?.message || 'Failed to download promotion', 'OK', { duration: 3000 });
        }
      });
  }

  shareToWhatsApp(): void {
    const promotion = this.promotion();
    if (!promotion) return;
    if (this.isLinkRestricted()) {
      this.snackBar.open('This promotion link is paused while suspicious traffic is being reviewed.', 'OK', { duration: 3500 });
      return;
    }

    const text = `Ad - ${promotion.upi}\nVisit ${this.getPromotionUrl(promotion)} for more.\n${promotion.campaign.caption}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  copyPromotionLink(): void {
    const promotion = this.promotion();
    if (!promotion) return;
    if (this.isLinkRestricted()) {
      this.snackBar.open('This promotion link is paused and cannot be copied right now.', 'OK', { duration: 3500 });
      return;
    }

    navigator.clipboard.writeText(this.getPromotionUrl(promotion)).then(() => {
      this.snackBar.open('Promotion link copied', 'OK', { duration: 3000 });
    });
  }

  getPromotionUrl(promotion: PromotionInterface): string {
    if (promotion.promotionUrl) return promotion.promotionUrl;
    return `${this.api.replace(/\/$/, '')}/api/v1/campaign/track/${promotion.upi}`;
  }

  viewProofMedia(mediaUrl: string): void {
    window.open(`${this.api}${mediaUrl}`, '_blank');
  }

  goBack(): void {
    this.router.navigate(['/dashboard/campaigns/promotions']);
  }

  contactSupport(): void {
    // Implement contact support logic
    this.snackBar.open('Contact support functionality will be implemented soon', 'OK', { duration: 3000 });
  }

  getFraudNotice(): string {
    return this.promotion()?.fraudStatus?.reasonSummary
      || 'This promotion is paused while MarketSpase reviews suspicious traffic linked to it.';
  }
}
