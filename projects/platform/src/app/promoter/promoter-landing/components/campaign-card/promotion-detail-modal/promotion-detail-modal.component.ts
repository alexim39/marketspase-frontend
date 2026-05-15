// promotion-detail-modal.component.ts
import { Component, Inject, Input } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CampaignInterface, PromotionInterface } from '@shared/services';
import {
  getCampaignAcceptButtonText,
  getCampaignCostPerClick,
  getCampaignEstimatedClicks,
  getCampaignSlotLabel,
  getCampaignSlotValue,
  getCampaignStatusBadgeClass,
  getCampaignStatusBadgeText,
  getCampaignTimingLabel,
} from '../../../../utils/campaign-availability.util';

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
    //CategoryPlaceholderPipe,
    //TruncatePipe
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
    return getCampaignStatusBadgeClass(this.campaign);
  }

  getStatusBadgeText(): string {
    return getCampaignStatusBadgeText(this.campaign);
  }

  getDifficultyLevel(): string {
    const costPerClick = this.getCostPerClick();
    
    if (costPerClick <= 80) return 'Low CPC';
    if (costPerClick <= 150) return 'Standard';
    return 'Premium';
  }

  getDifficultyDots(): number {
    const costPerClick = this.getCostPerClick();
    
    if (costPerClick <= 80) return 1;
    if (costPerClick <= 150) return 2;
    return 3;
  }

  getCostPerClick(): number {
    return getCampaignCostPerClick(this.campaign);
  }

  getEstimatedClicks(): number {
    return getCampaignEstimatedClicks(this.campaign);
  }

  getSlotValue(): string {
    return getCampaignSlotValue(this.campaign);
  }

  getSlotLabel(): string {
    return getCampaignSlotLabel(this.campaign);
  }

  getTimingLabel(): string {
    return getCampaignTimingLabel(this.campaign);
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
    
    return this.canAcceptCampaign
      ? 'Accept Campaign'
      : getCampaignAcceptButtonText(this.campaign);
  }

  onAccept(): void {
    this.dialogRef.close('accept');
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
