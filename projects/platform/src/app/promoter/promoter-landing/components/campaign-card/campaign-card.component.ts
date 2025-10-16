import { Component, Input, Output, EventEmitter, computed, Signal } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { CampaignInterface, PromotionInterface } from '../../../../../../../shared-services/src/public-api';
import { CategoryPlaceholderPipe } from '../../../../common/pipes/category-placeholder.pipe';
import { MatIconModule } from '@angular/material/icon';
import { TruncatePipe } from '../../../../common/pipes/truncate.pipe';

export type ViewMode = 'grid' | 'list';

@Component({
  selector: 'campaign-card',
  standalone: true,
  imports: [
    CommonModule,
    TitleCasePipe,
    CategoryPlaceholderPipe,
    MatIconModule,
    TruncatePipe
  ],
  templateUrl: './campaign-card.component.html',
  styleUrls: ['./campaign-card.component.scss']
})
export class CampaignCardComponent {
  @Input({ required: true }) campaign!: CampaignInterface;
  @Input({ required: true }) promotions!: PromotionInterface[];
  @Input({ required: true }) api!: string;
  @Input() isApplying: boolean = false;
  @Input() viewMode: ViewMode = 'grid';
  
  @Output() applyForCampaign = new EventEmitter<CampaignInterface>();

  // Computed signal to check if the user has already accepted the campaign
  hasUserPromotion = computed(() => {
    return (campaign: CampaignInterface) =>
      this.promotions.some(
        (promotion: PromotionInterface) => promotion.campaign._id === campaign._id
      );
  });

  getStatusBadgeClass(campaign: CampaignInterface): string {
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
    if (this.hasUserPromotion()(campaign)) {
      return 'Already Accepted';
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
}