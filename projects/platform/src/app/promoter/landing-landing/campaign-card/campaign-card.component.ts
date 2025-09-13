import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { CampaignInterface } from '../../../../../../shared-services/src/public-api';
import { CategoryPlaceholderPipe } from '../../../common/pipes/category-placeholder.pipe';

@Component({
  selector: 'campaign-card',
  standalone: true,
  imports: [
    CommonModule,
    TitleCasePipe,
    CategoryPlaceholderPipe
  ],
  templateUrl: './campaign-card.component.html',
  styleUrls: ['./campaign-card.component.scss']
})
export class CampaignCardComponent {
  @Input({ required: true }) campaign!: CampaignInterface;
  @Input({ required: true }) api!: string;
  @Input() isApplying: boolean = false;
  
  @Output() applyForCampaign = new EventEmitter<CampaignInterface>();

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
    const slotsFilled = campaign.totalPromotions || 0;
    if (slotsFilled >= campaign.maxPromoters) return false;
    const remainingBudget = campaign.budget - ( (campaign.payoutPerPromotion * campaign.currentPromoters )|| 0);
    if (remainingBudget < campaign.payoutPerPromotion) return false;
    return true;
  }
  
  getAcceptButtonText(campaign: CampaignInterface): string {
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