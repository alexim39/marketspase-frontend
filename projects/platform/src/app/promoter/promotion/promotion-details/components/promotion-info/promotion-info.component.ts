import { Component, computed, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DeviceService } from '@shared/services/device';
import { PromotionInterface } from '@shared/services';

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
          <mat-icon>link</mat-icon>
          <div class="info-content">
            <span class="info-label">UPI</span>
            <span class="info-value">{{promotion.upi || 'N/A'}}</span>
          </div>
        </div>
        
        <div class="info-item">
          <mat-icon>payments</mat-icon>
          <div class="info-content">
            <span class="info-label">Cost Per Click</span>
            <span class="info-value">{{promotion.campaign.currency || 'NGN'}} {{getCostPerClick() | number}}</span>
          </div>
        </div>
        
        <div class="info-item">
          <mat-icon>touch_app</mat-icon>
          <div class="info-content">
            <span class="info-label">Billable Clicks</span>
            <span class="info-value">{{promotion.clickStats?.billableClicks || 0}}</span>
          </div>
        </div>

        <div class="info-item">
          <mat-icon>schedule</mat-icon>
          <div class="info-content">
            <span class="info-label">Last Click</span>
            <span class="info-value">
              {{promotion.clickStats?.lastClickAt ? (promotion.clickStats?.lastClickAt | date:'medium') : 'No clicks yet'}}
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

  getCostPerClick(): number {
    return this.promotion.costPerClick || this.promotion.campaign.costPerClick || 80;
  }

  getCategoryIcon(category: string): string {
    const categoryIcons: {[key: string]: string} = {
      fashion: 'checkroom',
      food: 'restaurant',
      tech: 'smartphone',
      entertainment: 'music_note',
      health: 'fitness_center',
      beauty: 'spa',
      travel: 'flight',
      business: 'business_center',
      other: 'category'
    };
    
    return categoryIcons[category] || 'category';
  }
}
