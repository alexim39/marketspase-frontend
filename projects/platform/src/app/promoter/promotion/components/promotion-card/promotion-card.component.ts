import { Component, Input, Output, EventEmitter, inject, OnChanges, SimpleChanges, OnDestroy, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { PromotionInterface } from '../../../../../../../shared-services/src/public-api';
import { CategoryPlaceholderPipe } from '../../../../common/pipes/category-placeholder.pipe';
import { PromoterService } from '../../../promoter.service';
import { interval, Subscription } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

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
    MatProgressSpinnerModule
  ],
  templateUrl: './promotion-card.component.html',
  styleUrls: ['./promotion-card.component.scss']
})
export class PromotionCardComponent implements OnInit, OnChanges, OnDestroy {
  @Input({ required: true }) promotion!: PromotionInterface;
  @Output() openSubmitDialog = new EventEmitter<PromotionInterface>();

  public isLoading = signal<boolean>(false);

  private promoterService = inject(PromoterService);
  public readonly api = this.promoterService.api;

  public countdownSignal = signal<string>('');
  private countdownSubscription: Subscription | null = null;
  private readonly destroyRef = inject(DestroyRef);
  private timeDifferenceInMilliseconds = 0; // New property to store the time difference
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  // Inject HttpClient
  private http = inject(HttpClient);

  ngOnInit(): void {
    // Initial call on component creation
    this.startCountdownTimer();
    //console.log('promotion ',this.promotion)
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

      // Validate createdAt and calculate expiration time
      const creationTime = new Date(this.promotion.createdAt).getTime();
      if (isNaN(creationTime)) {
        console.error('Invalid createdAt value:', this.promotion.createdAt);
        this.countdownSignal.set('Invalid Date');
        return;
      }

      const expirationTime = creationTime + 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      const currentTime = new Date().getTime();
      this.timeDifferenceInMilliseconds = expirationTime - currentTime;

      // Check if already expired
      if (this.timeDifferenceInMilliseconds <= 0) {
        this.countdownSignal.set('Expired');
        return;
      }

      // Start the countdown timer
      this.countdownSubscription = interval(1000)
        .pipe(
          takeWhile(() => {
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

  /* private updateCountdown(): void {
    const createdAt = this.promotion.createdAt;
    const creationTime = new Date(createdAt).getTime();
    const expirationTime = creationTime + (24 * 60 * 60 * 1000);
    const currentTime = new Date().getTime();
    this.timeDifferenceInMilliseconds = expirationTime - currentTime; // Update the new property

    if (this.timeDifferenceInMilliseconds <= 0) {
      this.countdownSignal.set('Expired');
      return;
    }

    const totalSeconds = Math.floor(this.timeDifferenceInMilliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');

    this.countdownSignal.set(`${formattedHours}:${formattedMinutes}:${formattedSeconds}`);
  } */

  private updateCountdown(): void {
    const creationTime = new Date(this.promotion.createdAt).getTime();
    if (isNaN(creationTime)) {
      console.error('Invalid createdAt value:', this.promotion.createdAt);
      this.countdownSignal.set('Invalid Date');
      return;
    }

    const expirationTime = creationTime + 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const currentTime = new Date().getTime();
    this.timeDifferenceInMilliseconds = expirationTime - currentTime;

    // Check if already expired
    if (this.timeDifferenceInMilliseconds <= 0) {
      this.countdownSignal.set('Expired');
      return;
    }

    // Calculate hours, minutes, and seconds
    const totalSeconds = Math.floor(this.timeDifferenceInMilliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Format the countdown string
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
  
  isSubmissionExpired(promotion: PromotionInterface): boolean {
    // Always use a universal time for calculations.
    // promotion.createdAt is already in ISO 8601 format with a UTC offset, so `new Date()` will correctly parse it as a UTC date.
    const createdAtUtc = new Date(promotion.createdAt);

    // The expiration time is exactly 24 hours after the createdAt date, in UTC.
    const expiryTimeUtc = createdAtUtc.getTime() + (24 * 60 * 60 * 1000);

    // Compare the expiration time to the current time, also in UTC.
    const nowUtc = new Date().getTime();

    return nowUtc > expiryTimeUtc;
  }
  
  // New method to check if the countdown is nearing expiration (30 minutes)
  // isNearingExpiration(): boolean {
  //   const thirtyMinutesInMs = 30 * 60 * 1000;
  //   return this.timeDifferenceInMilliseconds > 0 && this.timeDifferenceInMilliseconds <= thirtyMinutesInMs;
  // }

  // Updated method to check if the countdown is nearing expiration (1 hour)
  isNearingExpiration(): boolean {
    const oneHourInMs = 60 * 60 * 1000; // 1 hour in milliseconds
    return this.timeDifferenceInMilliseconds > 0 && this.timeDifferenceInMilliseconds <= oneHourInMs;
  }

  downloadPromotion(): void {
    this.isLoading.set(true); // Set loading state to true

    const campaignId = this.promotion.campaign._id;
    const promoterId = this.promotion.promoter._id;

    this.promoterService.downloadPromotion(campaignId, promoterId)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
    next: (response) => {
      if (response.success) {
        const mediaUrl = response.campaign.mediaUrl;
        const mediaType = response.campaign.mediaType;
        const fileExtension = mediaType === 'image' ? 'jpg' : 'mp4';
        const fileName = `campaign_post_${campaignId}.${fileExtension}`;

        // Fetch the media file as a Blob
        this.http.get(mediaUrl, { responseType: 'blob' }).subscribe({
          next: (blob) => {
            // Create a temporary URL for the Blob
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');

            // Set the href to the Blob URL and the download attribute
            link.href = url;
            link.download = fileName;
            link.style.display = 'none';

            document.body.appendChild(link);
            link.click();

            // Clean up the temporary link and Blob URL
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            // set promotion.isDownloaded to true
            this.promotion.isDownloaded = true;
            this.isLoading.set(false); 
          }, 
          error: (error) => {
            console.error('Error fetching media file for download:', error);
            this.snackBar.open(error.error.message, 'OK', { duration: 3000 });
            this.isLoading.set(false); 
          }
        });
      } else {
        console.error('Failed to download promotion:', response.message);
        this.snackBar.open(response.message, 'OK', { duration: 3000 });
      }
    },
      error: (error) => {
      console.error('Error calling downloadPromotion API:', error);
      this.snackBar.open(error.error.message, 'OK', { duration: 3000 });
      this.isLoading.set(false); 
    }
    });
  }

  getCategoryIcon(category: string): string {
    const categoryIcons: {[key: string]: string} = {
      'fashion': 'category',
      'food': 'restaurant',
      'tech': 'smartphone',
      'entertainment': 'music_note',
      'health': 'fitness_center',
      'beauty': 'face',
      'travel': 'flight',
      'business': 'business',
      'other': 'category'
    };
    
    return categoryIcons[category] || 'category';
  }


  viewDetails() {
    console.log('clicked')
    const promotion = this.promotion;
    if (promotion) {
      this.router.navigate(['/dashboard/campaigns/promotions', promotion._id]);
    }
  }

  copyCaption(caption: string): void {
    const textToCopy = `${this.promotion.upi}\n${caption}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy).then(
        () => {
          this.snackBar.open('Caption copied to clipboard', 'OK', { duration: 3000 });
        },
        (err) => {
          console.error('Failed to copy caption: ', err);
        }
      );
    } else {
      // Fallback for older browsers – you can implement a fallback method here
      console.warn('Clipboard API not supported');
    }
  }

}