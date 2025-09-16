// promotion-detail.component.ts
import { Component, inject, OnInit, signal, DestroyRef, computed, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PromotionInterface, UserInterface } from '../../../../../../shared-services/src/public-api';
import { CategoryPlaceholderPipe } from '../../../common/pipes/category-placeholder.pipe';
import { PromoterService } from '../../promoter.service';
import { interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../../common/services/user.service';

@Component({
  selector: 'app-promotion-detail',
  standalone: true,
  providers: [PromoterService],
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
    MatProgressBarModule,
    CategoryPlaceholderPipe,
    MatProgressSpinnerModule,
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
    if (!promotionValue || !promotionValue.campaign.minViewsPerPromotion) return 0;
    
    const views = promotionValue.proofViews || 0;
    const minViews = promotionValue.campaign.minViewsPerPromotion;
    return Math.min((views / minViews) * 100, 100);
  });

  public readonly api = this.promoterService.api;

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
            console.log('response ',response)
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

    const creationTime = new Date(promotion.createdAt).getTime();
    const expirationTime = creationTime + (24 * 60 * 60 * 1000);
    const currentTime = new Date().getTime();
    this.timeDifferenceInMilliseconds.set(expirationTime - currentTime);

    if (this.timeDifferenceInMilliseconds() <= 0) {
      this.countdownSignal.set('Expired');
      return;
    }

    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.updateCountdown();
      });

    this.updateCountdown();
  }

  private updateCountdown(): void {
    const promotion = this.promotion();
    if (!promotion) return;

    const creationTime = new Date(promotion.createdAt).getTime();
    const expirationTime = creationTime + (24 * 60 * 60 * 1000);
    const currentTime = new Date().getTime();
    const timeDifference = expirationTime - currentTime;
    
    this.timeDifferenceInMilliseconds.set(timeDifference);

    if (timeDifference <= 0) {
      this.countdownSignal.set('Expired');
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

    const createdAtUtc = new Date(promotion.createdAt);
    const expiryTimeUtc = createdAtUtc.getTime() + (24 * 60 * 60 * 1000);
    const nowUtc = new Date().getTime();

    return nowUtc > expiryTimeUtc;
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

  getCategoryIcon(category: string): string {
    const categoryIcons: {[key: string]: string} = {
      'fashion': 'checkroom',
      'food': 'restaurant',
      'tech': 'smartphone',
      'entertainment': 'music_note',
      'health': 'fitness_center',
      'beauty': 'spa',
      'travel': 'flight',
      'business': 'business_center',
      'other': 'category'
    };
    
    return categoryIcons[category] || 'category';
  }

  downloadPromotion(): void {
    const promotion = this.promotion();
    if (!promotion) return;

    const campaignId = promotion.campaign._id;
    const promoterId = promotion.promoter._id;

    this.promoterService.downloadPromotion(campaignId, promoterId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Handle download logic here
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

    const text = `Check out this promotion: ${promotion.campaign.title}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  viewProofMedia(mediaUrl: string): void {
    window.open(`${this.api}${mediaUrl}`, '_blank');
  }

  goBack(): void {
    this.router.navigate(['/dashboard/campaigns/promotions']);
  }

  getProgressColor(percentage: number): string {
    if (percentage < 50) return 'success';
    if (percentage < 80) return 'warning';
    return 'danger';
  }

   formatCurrency(amount: number | undefined): string {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      //currency: 'USD'
      currency: 'NGN'
    }).format(amount);
  }
}