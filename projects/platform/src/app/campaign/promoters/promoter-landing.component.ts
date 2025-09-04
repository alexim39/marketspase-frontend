import { Component, OnInit, inject, signal, computed, Signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatSliderModule } from '@angular/material/slider';
import { DeviceService } from '../../common/services/device.service';
import { UserInterface } from '../../../../../shared-services/src/public-api';
import { CampaignInterface } from '../../common/models/campaigns';
import { Subscription } from 'rxjs';
import { CampaignService } from '../campaign.service';
import { HttpErrorResponse } from '@angular/common/http';
import { formatRemainingDays, isDatePast } from '../../common/utils/time.util';
import { CategoryPlaceholderPipe } from '../../common/pipes/category-placeholder.pipe';
import { MatSnackBar } from '@angular/material/snack-bar';

interface CampaignMetrics {
  totalEarnings: number;
  rating: number;
  completedPromotions: number;
  pendingEarnings: number;
  activePromotions: number;
  successRate: number;
  totalViews: number;
  expiringSoon: number;
}

@Component({
  selector: 'promoter-landing',
  standalone: true,
  providers: [CampaignService],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatMenuModule,
    MatTabsModule,
    MatProgressBarModule,
    MatBadgeModule,
    MatTooltipModule,
    MatBottomSheetModule,
    MatSliderModule,
    CategoryPlaceholderPipe
  ],
  templateUrl: './promoter-landing.component.html',
  styleUrls: ['./promoter-landing.component.scss']
})
export class PromoterLandingComponent implements OnInit {
  private router = inject(Router);
  private deviceService = inject(DeviceService);

  // Signals for reactive state management
  isLoading = signal(false);
  isApplying = signal(false);
  campaigns = signal<CampaignInterface[]>([]);
  subscriptions: Subscription[] = [];
  private campaignService = inject(CampaignService);
  public readonly api = this.campaignService.api;

  // Computed properties
  deviceType = computed(() => this.deviceService.type());

  searchTerm = signal(''); 

  private snackBar = inject(MatSnackBar);

   // Computed filtered campaigns
  filteredCampaigns = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.campaigns();
    return this.campaigns().filter(c =>
      c.title?.toLowerCase().includes(term) ||
      c.caption?.toLowerCase().includes(term) ||
      c.category?.toLowerCase().includes(term)
    );
  });

  
  // Metrics computed from campaigns data
  metrics = computed<CampaignMetrics>(() => {
    const campaigns = this.campaigns();
    
    // Calculate metrics from campaigns data
    const totalEarnings = campaigns.reduce((sum, campaign) => sum + (campaign.paidPromotions || 0) * campaign.payoutPerPromotion, 0);
    const pendingEarnings = campaigns.reduce((sum, campaign) => sum + ((campaign.validatedPromotions || 0) - (campaign.paidPromotions || 0)) * campaign.payoutPerPromotion, 0);
    const activePromotions = campaigns.filter(campaign => campaign.status === 'active').length;
    const completedPromotions = campaigns.reduce((sum, campaign) => sum + (campaign.paidPromotions || 0), 0);
    const totalViews = campaigns.reduce((sum, campaign) => sum + (campaign.totalPromotions || 0) * (campaign.minViewsPerPromotion || 0), 0);
    
    // Calculate success rate (validated promotions / total promotions)
    const totalPromotions = campaigns.reduce((sum, campaign) => sum + (campaign.totalPromotions || 0), 0);
    const validatedPromotions = campaigns.reduce((sum, campaign) => sum + (campaign.validatedPromotions || 0), 0);
    const successRate = totalPromotions > 0 ? (validatedPromotions / totalPromotions) * 100 : 0;
    
    // Count campaigns expiring soon (within 3 days)
    const expiringSoon = campaigns.filter(campaign => {
      if (!campaign.endDate) return false;
      const endDate = new Date(campaign.endDate);
      const today = new Date();
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 3 && diffDays > 0;
    }).length;

    return {
      totalEarnings,
      rating: 4.8, // This would ideally come from user profile
      completedPromotions,
      pendingEarnings,
      activePromotions,
      successRate,
      totalViews,
      expiringSoon
    };
  });

  // Required input that expects a signal of type UserInterface or undefined
  @Input({ required: true }) user!: Signal<UserInterface | null>;

  ngOnInit(): void {
    this.loadCampaigns();
  }

  private loadCampaigns(): void {
    if (this.user() && this.user()?._id) {
      this.isLoading.set(true);
      this.subscriptions.push(
        this.campaignService.getCampaignsByStatus('active').subscribe({
          next: (response) => {
            const campaignsWithMetrics = this.calculateCampaignMetrics(response.data);
            this.campaigns.set(campaignsWithMetrics);
            this.isLoading.set(false);
          },
          error: (error: HttpErrorResponse) => {
            console.error('Failed to load campaigns:', error);
            this.isLoading.set(false);
          }
        })
      );
    }
  }
 
  private calculateCampaignMetrics(campaigns: CampaignInterface[]): CampaignInterface[] {
    return campaigns.map(campaign => {
      const updatedCampaign = { ...campaign };

      // Calculate progress based on spent budget
      updatedCampaign.progress = campaign.budget > 0 ? (campaign.spentBudget / campaign.budget) * 100 : 0;

      // Calculate remaining days or budget status
      if (campaign.endDate) {
        const endDate = new Date(campaign.endDate);
        if (isDatePast(endDate)) {
          updatedCampaign.remainingDays = 'Expired';
        } else {
          updatedCampaign.remainingDays = formatRemainingDays(endDate);
        }
      } else {
        const budgetRemaining = updatedCampaign.budget - updatedCampaign.spentBudget;
        if (budgetRemaining <= 0) {
          updatedCampaign.remainingDays = 'Budget Exhausted';
        } else {
          updatedCampaign.remainingDays = 'Ongoing';
        }
      }

      return updatedCampaign;
    });
  }

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

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Add these methods to the component class
  getHighPayoutCount(): number {
    return this.campaigns().filter(campaign => campaign.payoutPerPromotion >= 500).length;
  }

  getQuickTasksCount(): number {
    return this.campaigns().filter(campaign => campaign.minViewsPerPromotion <= 25).length;
  }

  // Add these methods to your PromoterLandingComponent

  applyForCampaign(campaign: CampaignInterface): void {
    if (!this.user() || !this.user()?._id) {
      //alert('Please log in to apply for campaigns');
      this.snackBar.open('Please log in to apply for campaigns', 'OK', { 
          duration: 3000,
      });
      return;
    }

    // Check if user can apply
    if (!this.canApplyForCampaign(campaign)) {
      //alert('Cannot apply for this campaign. It may be full, expired, or you may have already applied.');
      this.snackBar.open('Cannot apply for this campaign. It may be full, expired, or you may have already applied.', 'OK', { 
          duration: 3000,
      });
      return;
    }

    this.isApplying.set(true);
    
    this.subscriptions.push(
      this.campaignService.applyForCampaign(campaign._id, this.user()!._id).subscribe({
        next: (response) => {
          // Update local campaign data
          const updatedCampaigns = this.campaigns().map(c => {
            if (c._id === campaign._id) {
              return {
                ...c,
                totalPromotions: (c.totalPromotions || 0) + 1,
                spentBudget: (c.spentBudget || 0) + c.payoutPerPromotion
              };
            }
            return c;
          });
          
          this.campaigns.set(updatedCampaigns);
          this.isApplying.set(false);
          //alert('Successfully applied for the campaign!');
          this.snackBar.open(response.message, 'OK', { 
              duration: 3000,
          });
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to apply for campaign:', error);
          this.isApplying.set(false);
          //alert('Failed to apply for campaign: ' + (error.error?.message || 'Unknown error'));
           this.snackBar.open('Failed to apply for campaign: ' + (error.error?.message || 'Unknown error'), 'OK', { 
              duration: 3000,
          });
        }
      })
    );
  }

  canApplyForCampaign(campaign: CampaignInterface): boolean {
    // Check if campaign is active
    if (campaign.status !== 'active') {
      return false;
    }

    // Check if campaign has expired
    if (campaign.remainingDays === 'Expired' || campaign.remainingDays === 'Budget Exhausted') {
      return false;
    }

    // Check if there are available slots
    const slotsFilled = campaign.totalPromotions || 0;
    if (slotsFilled >= campaign.maxPromoters) {
      return false;
    }

    // Check if there's enough budget
    const remainingBudget = campaign.budget - (campaign.spentBudget || 0);
    if (remainingBudget < campaign.payoutPerPromotion) {
      return false;
    }

    // TODO: Check if user has already applied for this campaign
    // This would require checking against a separate API endpoint

    return true;
  }

  getApplyButtonText(campaign: CampaignInterface): string {
    if (!this.canApplyForCampaign(campaign)) {
      if (campaign.status !== 'active') return 'Not Available';
      if (campaign.remainingDays === 'Expired') return 'Expired';
      if (campaign.remainingDays === 'Budget Exhausted') return 'Budget Full';
      
      const slotsFilled = campaign.totalPromotions || 0;
      if (slotsFilled >= campaign.maxPromoters) return 'Full';
      
      return 'Cannot Apply';
    }
    
    return 'Accept Campaign';
  }

  isApplyButtonDisabled(campaign: CampaignInterface): boolean {
    return !this.canApplyForCampaign(campaign);
  }

}