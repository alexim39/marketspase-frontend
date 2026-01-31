// shared/components/rating/rating.component.ts
import { Component, Input, Output, EventEmitter, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-rating',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './rating.component.html',
  styleUrls: ['./rating.component.scss']
})
export class RatingComponent implements OnInit {
  @Input() rating: number = 0;
  @Input() maxRating: number = 5;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() showValue: boolean = false;
  @Input() showCount: boolean = false;
  @Input() count: number = 0;
  @Input() interactive: boolean = false;
  @Input() readOnly: boolean = false;
  
  @Output() ratingChange = new EventEmitter<number>();
  
  // Signals
  hoverRating = signal<number>(0);
  tempRating = signal<number>(0);
  
  // Computed values
  stars = computed(() => {
    const rating = this.tempRating() || this.rating;
    return Array.from({ length: this.maxRating }, (_, i) => {
      const starValue = i + 1;
      return {
        value: starValue,
        filled: starValue <= Math.floor(rating),
        half: starValue - 0.5 <= rating && rating < starValue
      };
    });
  });
  
  sizeClass = computed(() => {
    return `rating-${this.size}`;
  });
  
  formattedRating = computed(() => {
    return this.rating.toFixed(1);
  });
  
  formattedCount = computed(() => {
    if (this.count >= 1000) {
      return `${(this.count / 1000).toFixed(1)}k`;
    }
    return this.count.toString();
  });

  ngOnInit(): void {
    this.tempRating.set(this.rating);
  }

  // Rating actions
  setRating(value: number): void {
    if (!this.interactive || this.readOnly) return;
    
    this.tempRating.set(value);
    this.ratingChange.emit(value);
  }

  onStarHover(value: number): void {
    if (!this.interactive || this.readOnly) return;
    
    this.hoverRating.set(value);
  }

  onStarLeave(): void {
    if (!this.interactive || this.readOnly) return;
    
    this.hoverRating.set(0);
  }

  // Size-based icon size
  getIconSize(): string {
    switch (this.size) {
      case 'small': return '16px';
      case 'large': return '24px';
      default: return '20px';
    }
  }

  // Get star icon
  getStarIcon(star: any): string {
    if (star.half) {
      return 'star_half';
    }
    return star.filled ? 'star' : 'star_border';
  }

  // Get star color
  getStarColor(star: any): string {
    if (!star.filled && !star.half) {
      return 'var(--text-tertiary)';
    }
    
    // Color based on rating
    const rating = this.tempRating() || this.rating;
    if (rating >= 4) return '#10b981'; // Success green
    if (rating >= 3) return '#f59e0b'; // Warning orange
    if (rating >= 2) return '#f97316'; // Orange
    return '#ef4444'; // Error red
  }
}