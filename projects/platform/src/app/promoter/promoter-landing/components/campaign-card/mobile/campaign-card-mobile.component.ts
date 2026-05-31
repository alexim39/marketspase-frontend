// campaign-card-mobile.component.ts
import { Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { CampaignInterface, PromotionInterface, TruncatePipe } from '@shared/services';
import { MatIconModule } from '@angular/material/icon';
import { PromotionDetailModalComponent } from '../promotion-detail-modal/promotion-detail-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import {
  canCampaignBeAccepted,
  getCampaignAcceptButtonText,
  getCampaignCostPerClick,
  getCampaignEstimatedClicks,
  getCampaignLocationMatchLabel,
  getCampaignSlotLabel,
  getCampaignSlotValue,
  getCampaignStatusBadgeClass,
  getCampaignStatusBadgeText,
  getCampaignTimingLabel,
} from '../../../../utils/campaign-availability.util';

export type ViewMode = 'grid' | 'list';

@Component({
  selector: 'app-campaign-card-mobile',
  standalone: true,
  imports: [
    CommonModule,
    TitleCasePipe,
    MatIconModule,
    TruncatePipe,
    MatTooltipModule,
    MatButtonModule
  ],
  templateUrl: './campaign-card-mobile.component.html',
  styleUrls: ['./campaign-card-mobile.component.scss']
})
export class CampaignCardMobileComponent {
  @Input({ required: true }) campaign!: CampaignInterface;
  @Input({ required: true }) promotions!: PromotionInterface[];
  @Input({ required: true }) api!: string;
  @Input() applyingCampaignId: string | null = null; // Track which campaign is being applied to
  @Input() viewMode: ViewMode = 'grid';
  
  @Output() applyForCampaign = new EventEmitter<CampaignInterface>();

  constructor(private dialog: MatDialog) {}

  isApplyingCampaign(): boolean {
    return this.applyingCampaignId === this.campaign._id;
  }

  // Computed signal to check if the user has already accepted the campaign
  // hasUserPromotion = computed(() => {
  //   return (campaign: CampaignInterface) =>
  //     this.promotions.some(
  //       (promotion: PromotionInterface) => promotion.campaign._id === campaign._id
  //     );
  // });

  // Computed signal to explicitly check if there is a PENDING promotion for this campaign
  hasPendingPromotion = computed(() => {
    return (campaign: CampaignInterface) =>
      this.promotions.some( // Added () assuming promotions is a Signal
        (promotion: PromotionInterface) =>
          promotion.campaign._id === campaign._id && 
          promotion.status === 'accepted'
      );
  });


  getStatusBadgeClass(campaign: CampaignInterface): string {
    return getCampaignStatusBadgeClass(campaign);
  }

  getStatusBadgeText(campaign: CampaignInterface): string {
    return getCampaignStatusBadgeText(campaign);
  }

  getDifficultyLevel(campaign: CampaignInterface): string {
    const costPerClick = this.getCostPerClick(campaign);
    
    if (costPerClick <= 80) return 'Low CPC';
    if (costPerClick <= 150) return 'Standard';
    return 'Premium';
  }

  getDifficultyDots(campaign: CampaignInterface): number {
    const costPerClick = this.getCostPerClick(campaign);
    
    if (costPerClick <= 80) return 1;
    if (costPerClick <= 150) return 2;
    return 3;
  }

  getCostPerClick(campaign: CampaignInterface): number {
    return getCampaignCostPerClick(campaign);
  }

  getEstimatedClicks(campaign: CampaignInterface): number {
    return getCampaignEstimatedClicks(campaign);
  }

  getSlotValue(campaign: CampaignInterface): string {
    return getCampaignSlotValue(campaign);
  }

  getSlotLabel(campaign: CampaignInterface): string {
    return getCampaignSlotLabel(campaign);
  }

  getTimingLabel(campaign: CampaignInterface): string {
    return getCampaignTimingLabel(campaign);
  }

  getLocationLabel(campaign: CampaignInterface): string | null {
    return getCampaignLocationMatchLabel(campaign);
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

  canAcceptCampaign(campaign: CampaignInterface): boolean {
    return canCampaignBeAccepted(campaign);
  }
  
  getAcceptButtonText(campaign: CampaignInterface): string {
    // Check if user has already accepted this campaign
    if (this.hasPendingPromotion()(campaign)) {
      return 'Promoting';
    }
    
    return this.canAcceptCampaign(campaign)
      ? 'Accept'
      : getCampaignAcceptButtonText(campaign);
  }

  // Add method to open modal
  openPromotionDetails(): void {
    this.dialog.open(PromotionDetailModalComponent, {
      width: '100%',
      maxWidth: '900px',
      panelClass: 'promotion-modal-overlay',
      data: {
        campaign: this.campaign,
        promotions: this.promotions,
        api: this.api,
        hasUserPromotion: this.hasPendingPromotion()(this.campaign),
        canAcceptCampaign: this.canAcceptCampaign(this.campaign)
      }
    });
  }
}
