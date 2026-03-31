import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RatingComponent } from '../../../../shared/rating/rating.component';
import { LazyImageDirective } from '../../../../shared/directives/lazy-image.directive';

export interface ProductReview {
  _id?: string;
  rating: number;
  title?: string;
  comment: string;
  user?: {
    displayName?: string;
    avatar?: string;
  };
  images?: string[];
  verifiedPurchase?: boolean;
  createdAt?: Date;
}

@Component({
  selector: 'app-product-reviews',
  standalone: true,
  imports: [
    CommonModule, 
    MatIconModule, 
    MatButtonModule, 
    MatProgressSpinnerModule,
    RatingComponent,
    LazyImageDirective
  ],
  templateUrl: './product-reviews.component.html',
  styleUrls: ['./product-reviews.component.scss']
})
export class ProductReviewsComponent {
  @Input() reviews: ProductReview[] = [];
  @Input() averageRating: number = 0;
  @Input() ratingCount: number = 0;
  @Input() loadingReviews: boolean = false;
  @Input() hasMoreReviews: boolean = false;
  
  @Output() loadMore = new EventEmitter<void>();
  @Output() writeReview = new EventEmitter<void>();
  
  ratingBreakdown = computed(() => {
    const breakdown = [0, 0, 0, 0, 0];
    this.reviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        breakdown[5 - review.rating]++;
      }
    });
    return breakdown;
  });
  
  formatDate(date?: string | Date): string {
    const dateToFormat = date || new Date();
    return new Date(dateToFormat).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  
  trackByReviewId(index: number, review: ProductReview): string {
    return review._id || index.toString();
  }
  
  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = 'img/avatar.png';
  }
}