import { Component, computed, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DeviceService, PromotionInterface } from '../../../../../../../../shared-services/src/public-api';

@Component({
  selector: 'app-promotion-info',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="promotion-info">
      @if (deviceType() === 'desktop') {
        <h2 class="promotion-title">{{promotion.campaign.title}}</h2>
      }
      @if (deviceType() === 'mobile') {
        <h5 class="promotion-title">{{promotion.campaign.title}}</h5>
      }
      <p class="promotion-description">{{promotion.campaign.caption}}</p>
      
      <div class="info-grid">
        <div class="info-item">
          <mat-icon>category</mat-icon>
          <div class="info-content">
            <span class="info-label">Category</span>
            <span class="info-value">
              <mat-icon>{{ getCategoryIcon(promotion.campaign.category) }}</mat-icon>
              {{promotion.campaign.category | titlecase}}
            </span>
          </div>
        </div>
        
        <div class="info-item">
          <mat-icon>trending_up</mat-icon>
          <div class="info-content">
            <span class="info-label">Difficulty</span>
            <span class="info-value">{{promotion.campaign.difficulty | titlecase}}</span>
          </div>
        </div>
        
        <div class="info-item">
          <mat-icon>schedule</mat-icon>
          <div class="info-content">
            <span class="info-label">Duration</span>
            <span class="info-value">24 hours</span>
          </div>
        </div>
        
        <div class="info-item">
          <mat-icon>visibility</mat-icon>
          <div class="info-content">
            <span class="info-label">Minimum Views</span>
            <span class="info-value">{{promotion.campaign.minViewsPerPromotion}}</span>
          </div>
        </div>

        <div class="info-item">
          <mat-icon>timer</mat-icon>
          <div class="info-content">
            <span class="info-label">Expires In</span>
            <span class="info-value" [class.nearing-expiration]="isNearingExpiration">
              {{countdown}}
            </span>
          </div>
        </div>

        <div class="info-item">
          <mat-icon>event</mat-icon>
          <div class="info-content">
            <span class="info-label">Created</span>
            <span class="info-value">{{promotion.createdAt | date:'medium'}}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./promotion-info.component.scss']
})
export class PromotionInfoComponent {
  @Input() promotion!: PromotionInterface;
  @Input() countdown!: string;
  @Input() isNearingExpiration!: boolean;

    private deviceService = inject(DeviceService);
  deviceType = computed(() => this.deviceService.type());

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
}