import { Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { CampaignInterface, PromotionInterface } from '../../../../../../../shared-services/src/public-api';
import { CategoryPlaceholderPipe } from '../../../../common/pipes/category-placeholder.pipe';
import { MatIconModule } from '@angular/material/icon';
import { TruncatePipe } from '../../../../common/pipes/truncate.pipe';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { PromotionDetailModalComponent } from './promotion-detail-modal/promotion-detail-modal.component';
import { MatDialog } from '@angular/material/dialog';

export type ViewMode = 'grid' | 'list';

@Component({
  selector: 'campaign-card',
  standalone: true,
  imports: [
    CommonModule,
    TitleCasePipe,
    CategoryPlaceholderPipe,
    MatIconModule,
    TruncatePipe,
    MatTooltipModule,
    MatButtonModule
  ],
  templateUrl: './campaign-card.component.html',
  styleUrls: ['./campaign-card.component.scss']
})
export class CampaignCardComponent {
  @Input({ required: true }) campaign!: CampaignInterface;
  @Input({ required: true }) promotions!: PromotionInterface[];
  @Input({ required: true }) api!: string;
  @Input() applyingCampaignId: string | null = null; // Track which campaign is being applied to
  @Input() viewMode: ViewMode = 'grid';
  
  @Output() applyForCampaign = new EventEmitter<CampaignInterface>();

  constructor(private dialog: MatDialog) {}

  // Computed property to check if this specific campaign is being applied to
  isApplyingCampaign(): boolean {
    return this.applyingCampaignId === this.campaign._id;
  }

  // Computed signal to explicitly check if there is a PENDING promotion for this campaign
  hasPendingPromotion = computed(() => {
    return (campaign: CampaignInterface) =>
      this.promotions.some(
        (promotion: PromotionInterface) =>
          promotion.campaign._id === campaign._id && promotion.status === 'pending'
      );
  });

  getStatusBadgeClass(campaign: CampaignInterface): string {
    //console.log('Campaign Remaining Days:', campaign);
    if (campaign.remainingDays === 'Expired' || campaign.remainingDays === 'Budget Exhausted') {
      return 'status-completed';
    }
    
    const slotsFilled = campaign.totalPromotions || 0;
    const maxSlots = campaign.maxPromoters || 0;
    
    if (slotsFilled >= maxSlots) {
      return 'status-paused';
    }
    
    return 'status-active';
  }

  getStatusBadgeText(campaign: CampaignInterface): string {
    if (campaign.remainingDays === 'Expired' || campaign.remainingDays === 'Budget Exhausted') {
      return 'Completed';
    }
    
    const slotsFilled = campaign.totalPromotions || 0;
    const maxSlots = campaign.maxPromoters || 0;
    
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

  getDifficultyLevel(campaign: CampaignInterface): string {
    const minViews = campaign.minViewsPerPromotion || 0;
    
    if (minViews <= 25) return 'Easy';
    if (minViews <= 35) return 'Medium';
    return 'Hard';
  }

  getDifficultyDots(campaign: CampaignInterface): number {
    const minViews = campaign.minViewsPerPromotion || 0;
    
    if (minViews <= 25) return 1;
    if (minViews <= 35) return 2;
    return 3;
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
    if (campaign.status !== 'active') return false;
    if (campaign.remainingDays === 'Expired' || campaign.remainingDays === 'Budget Exhausted') return false;
    if (campaign.totalPromotions >= campaign.maxPromoters) return false;
    if (campaign.remainingBudget < campaign.payoutPerPromotion) return false;
    return true;
  }
  
  getAcceptButtonText(campaign: CampaignInterface): string {
    // Check if user has already accepted this campaign
    if (this.hasPendingPromotion()(campaign)) {
      return 'Promoting';
    }
    
    if (!this.canAcceptCampaign(campaign)) {
      if (campaign.status !== 'active') return 'Not Available';
      if (campaign.remainingDays === 'Expired') return 'Expired';
      if (campaign.remainingDays === 'Budget Exhausted') return 'Budget Full';
      const slotsFilled = campaign.totalPromotions || 0;
      if (slotsFilled >= campaign.maxPromoters) return 'Full';
      return 'Cannot Accept';
    }
    return 'Accept Campaign';
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