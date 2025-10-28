// promotion-detail-modal.component.ts
import { Component, Inject, Input } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CampaignInterface, PromotionInterface } from '../../../../../../../../shared-services/src/public-api';
import { CategoryPlaceholderPipe } from '../../../../../common/pipes/category-placeholder.pipe';
import { TruncatePipe } from '../../../../../common/pipes/truncate.pipe';

export interface PromotionDetailModalData {
  campaign: CampaignInterface;
  promotions: PromotionInterface[];
  api: string;
  hasUserPromotion: boolean;
  canAcceptCampaign: boolean;
}

@Component({
  selector: 'app-promotion-detail-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    TitleCasePipe,
    CategoryPlaceholderPipe,
    TruncatePipe
  ],
  templateUrl: './promotion-detail-modal.component.html',
  styleUrls: ['./promotion-detail-modal.component.scss']
})
export class PromotionDetailModalComponent {
  campaign: CampaignInterface;
  promotions: PromotionInterface[];
  api: string;
  hasUserPromotion: boolean;
  canAcceptCampaign: boolean;

  constructor(
    public dialogRef: MatDialogRef<PromotionDetailModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PromotionDetailModalData
  ) {
    this.campaign = data.campaign;
    this.promotions = data.promotions;
    this.api = data.api;
    this.hasUserPromotion = data.hasUserPromotion;
    this.canAcceptCampaign = data.canAcceptCampaign;
  }

  getStatusBadgeClass(): string {
    if (this.campaign.remainingDays === 'Expired' || this.campaign.remainingDays === 'Budget Exhausted') {
      return 'status-completed';
    }
    
    const slotsFilled = this.campaign.totalPromotions || 0;
    const maxSlots = this.campaign.maxPromoters || 0;
    
    if (slotsFilled >= maxSlots) {
      return 'status-paused';
    }
    
    return 'status-active';
  }

  getStatusBadgeText(): string {
    if (this.campaign.remainingDays === 'Expired' || this.campaign.remainingDays === 'Budget Exhausted') {
      return 'Completed';
    }
    
    const slotsFilled = this.campaign.totalPromotions || 0;
    const maxSlots = this.campaign.maxPromoters || 0;
    
    if (slotsFilled >= maxSlots) {
      return 'Full';
    }
    
    if (slotsFilled === 0) {
      return 'New';
    }
    
    if (slotsFilled / maxSlots > 0.7) {
      return 'Popular';
    }
    
    return 'Active';
  }

  getDifficultyLevel(): string {
    const minViews = this.campaign.minViewsPerPromotion || 0;
    
    if (minViews <= 25) return 'Easy';
    if (minViews <= 35) return 'Medium';
    return 'Hard';
  }

  getDifficultyDots(): number {
    const minViews = this.campaign.minViewsPerPromotion || 0;
    
    if (minViews <= 25) return 1;
    if (minViews <= 35) return 2;
    return 3;
  }

  getCategoryIcon(category: string): string {
    const categoryIcons: {[key: string]: string} = {
      'fashion': 'checkroom',
      'food': 'restaurant',
      'tech': 'devices',
      'entertainment': 'theater_comedy',
      'health': 'fitness_center',
      'beauty': 'spa',
      'travel': 'flight_takeoff',
      'business': 'business_center',
      'other': 'category'
    };
    
    return categoryIcons[category] || 'category';
  }

  getAcceptButtonText(): string {
    if (this.hasUserPromotion) {
      return 'Already Accepted';
    }
    
    if (!this.canAcceptCampaign) {
      if (this.campaign.status !== 'active') return 'Not Available';
      if (this.campaign.remainingDays === 'Expired') return 'Expired';
      if (this.campaign.remainingDays === 'Budget Exhausted') return 'Budget Full';
      const slotsFilled = this.campaign.totalPromotions || 0;
      if (slotsFilled >= this.campaign.maxPromoters) return 'Full';
      return 'Cannot Accept';
    }
    return 'Accept Campaign';
  }

  onAccept(): void {
    this.dialogRef.close('accept');
  }

  onClose(): void {
    this.dialogRef.close();
  }
}