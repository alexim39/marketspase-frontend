import { Component, Input, Output, EventEmitter, inject, OnChanges, SimpleChanges, OnDestroy, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { PromotionInterface } from '../../../../../../shared-services/src/public-api';
import { CategoryPlaceholderPipe } from '../../../common/pipes/category-placeholder.pipe';
import { PromoterService } from '../../promoter.service';
import { interval, Subscription } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-promotion-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
    CategoryPlaceholderPipe,
  ],
  templateUrl: './promotion-card.component.html',
  styleUrls: ['./promotion-card.component.scss']
})
export class PromotionCardComponent implements OnInit, OnChanges, OnDestroy {
  @Input({ required: true }) promotion!: PromotionInterface;
  @Output() openSubmitDialog = new EventEmitter<PromotionInterface>();

  private promoterService = inject(PromoterService);
  public readonly api = this.promoterService.api;

  public countdownSignal = signal<string>('');
  private countdownSubscription: Subscription | null = null;
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    // Initial call on component creation
    this.startCountdownTimer();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Re-initialize timer if the promotion data changes
    if (changes['promotion'] && changes['promotion'].currentValue) {
      this.startCountdownTimer();
    }
  }

  ngOnDestroy(): void {
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
    }
  }

  private startCountdownTimer(): void {
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
    }

    const creationTime = new Date(this.promotion.campaign.createdAt).getTime();
    const expirationTime = creationTime + (24 * 60 * 60 * 1000);
    const currentTime = new Date().getTime();
    const timeDifferenceInMilliseconds = expirationTime - currentTime;

    if (timeDifferenceInMilliseconds <= 0) {
      this.countdownSignal.set('Expired');
      return;
    }

    this.countdownSubscription = interval(1000)
      .pipe(
        takeWhile(() => {
          const creationTime = new Date(this.promotion.campaign.createdAt).getTime();
          const expirationTime = creationTime + (24 * 60 * 60 * 1000);
          const currentTime = new Date().getTime();
          return expirationTime > currentTime;
        }, true),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.updateCountdown();
      });

    this.updateCountdown();
  }

  private updateCountdown(): void {
    const createdAt = this.promotion.campaign.createdAt;
    const creationTime = new Date(createdAt).getTime();
    const expirationTime = creationTime + (24 * 60 * 60 * 1000);
    const currentTime = new Date().getTime();
    const timeDifferenceInMilliseconds = expirationTime - currentTime;

    if (timeDifferenceInMilliseconds <= 0) {
      this.countdownSignal.set('Expired');
      return;
    }

    const totalSeconds = Math.floor(timeDifferenceInMilliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');

    this.countdownSignal.set(`${formattedHours}:${formattedMinutes}:${formattedSeconds}`);
  }

  onOpenSubmitProofDialog(): void {
    this.openSubmitDialog.emit(this.promotion);
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      pending: 'warning',
      submitted: 'info',
      validated: 'success',
      paid: 'primary',
      rejected: 'error'
    };
    return colors[status] || 'default';
  }

  getStatusIcon(status: string): string {
      const icons: { [key: string]: string } = {
      pending: 'schedule',
      submitted: 'pending_actions',
      validated: 'check_circle',
      paid: 'paid',
      rejected: 'cancel'
    };
    return icons[status] || 'help';
  }

/*   isSubmissionExpired(promotion: PromotionInterface): boolean {
    if (promotion.createdAt) {
      const createdAtDate = new Date(promotion.createdAt);
      const expirationDate = new Date(createdAtDate.getTime() + 24 * 60 * 60 * 1000);
      return new Date() > expirationDate;
    }
    return false;
  } */

  isSubmissionExpired(promotion: PromotionInterface): boolean {
    // Always use a universal time for calculations.
    // promotion.campaign.createdAt is already in ISO 8601 format with a UTC offset, so `new Date()` will correctly parse it as a UTC date.
    const createdAtUtc = new Date(promotion.campaign.createdAt);

    // The expiration time is exactly 24 hours after the createdAt date, in UTC.
    const expiryTimeUtc = createdAtUtc.getTime() + (24 * 60 * 60 * 1000);

    // Compare the expiration time to the current time, also in UTC.
    const nowUtc = new Date().getTime();

    return nowUtc > expiryTimeUtc;
  }

 downloadPromotion(): void {
    const campaignId = this.promotion.campaign._id;
    const promoterId = this.promotion.promoter._id;

    this.promoterService.downloadPromotion(campaignId, promoterId)
      .subscribe({
        next: (response) => {
          if (response.success && response.campaign) {
            console.log('Campaign post downloaded successfully:', response.message);
            // Get the media URL from the response
            const mediaUrl = response.campaign.mediaUrl;
            const mediaType = response.campaign.mediaType;

            // Create a temporary link element to trigger the download
            const link = document.createElement('a');
            link.href = mediaUrl;

            // Set a download attribute with a filename
            const fileExtension = mediaType === 'image' ? 'jpg' : 'mp4';
            link.download = `campaign_post_${campaignId}.${fileExtension}`;
            link.style.display = 'none'; // Hide the link

            // Append the link to the document body and simulate a click
            document.body.appendChild(link);
            link.click();

            // Clean up the temporary link
            document.body.removeChild(link);
          } else {
            console.error('Failed to download promotion:', response.message);
            // Optionally, show an error message to the user
          }
        },
        error: (error) => {
          console.error('Error calling downloadPromotion API:', error);
          // Optionally, show a user-friendly error message
        }
      });
  }
}