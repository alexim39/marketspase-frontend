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
import { UserInterface } from '../../common/services/user.service';
import { CampaignInterface } from '../../common/models/campaigns';
import { Subscription } from 'rxjs';
import { CampaingService } from '../campaign.service';
import { HttpErrorResponse } from '@angular/common/http';
import { formatRemainingDays, isDatePast } from '../../common/utils/time.util';
import { CategoryPlaceholderPipe } from '../../common/pipes/category-placeholder.pipe';
import { ShortNumberPipe } from '../../common/pipes/short-number.pipe';

interface PromoterStats {
  totalEarnings: number;
  completedCampaigns: number;
  activeCampaigns: number;
  pendingEarnings: number;
  averageRating: number;
  totalViews: number;
  thisMonthEarnings: number;
  successRate: number;
}

interface ActivePromotion {
  _id: string;
  campaignTitle: string;
  status: 'posted' | 'pending' | 'verified' | 'expired';
  postedAt: Date;
  expiresAt: Date;
  currentViews: number;
  requiredViews: number;
  payout: number;
  proofSubmitted: boolean;
  timeRemaining: string;
}

@Component({
  selector: 'promoter-landing',
  standalone: true,
  providers: [CampaingService],
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
    CategoryPlaceholderPipe,
    ShortNumberPipe
  ],
  templateUrl: './promoter-landing.component.html',
  styleUrls: ['./promoter-landing.component.scss']
})
export class PromoterLandingComponent implements OnInit {
  private router = inject(Router);
  private deviceService = inject(DeviceService);

  // Signals for reactive state management
  availableCampaigns = signal<CampaignInterface[]>([]);
  filteredCampaigns = signal<CampaignInterface[]>([]);
  activePromotions = signal<ActivePromotion[]>([]);
  minPayoutFilter = signal<number>(200);
  currentCategoryFilter = signal<string>('all');
  isLoading = signal(false);

  // Computed properties
  deviceType = computed(() => this.deviceService.type());
  promoterStats = computed(() => this.calculateStats());

  // Required input that expects a signal of type UserInterface or undefined
  @Input({ required: true }) user!: Signal<UserInterface | null>;
  // Signals for reactive state management
  campaigns = signal<CampaignInterface[]>([]);
  subscriptions: Subscription[] = [];
  private campaingService = inject(CampaingService);

  ngOnInit(): void {
    //this.loadAvailableCampaigns();
    //this.loadActivePromotions();
    this.filterCampaigns();

    this.loadCampaigns();
  }

  private loadCampaigns(): void {
    if (this.user() && this.user()?._id) {
      this.isLoading.set(true);
      this.subscriptions.push(
        this.campaingService.getCampaignsByStatus('active').subscribe({
          next: (response) => {
            const campaignsWithMetrics = this.calculateCampaignMetrics(response.data);
            this.campaigns.set(campaignsWithMetrics);
            
            // Transform backend campaigns to AvailableCampaign format
            const availableCampaigns = this.transformToAvailableCampaigns(response.data);
            this.availableCampaigns.set(availableCampaigns);
            this.filterCampaigns();
            
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

  private transformToAvailableCampaigns(campaigns: CampaignInterface[]): CampaignInterface[] {
    return campaigns.map(campaign => {
      // Determine difficulty based on payout
      let difficulty: 'easy' | 'medium' | 'hard';
      if (campaign.payoutPerPromotion <= 300) {
        difficulty = 'easy';
      } else if (campaign.payoutPerPromotion <= 600) {
        difficulty = 'medium';
      } else {
        difficulty = 'hard';
      }
      
      // Create requirements array
      const requirements = [
        `${campaign.minViewsPerPromotion}+ status views`,
        'Active for 24 hours',
        'Include provided hashtags'
      ];
      
      // Create tags from category and other attributes
      const tags = [campaign.category, 'promotion'];
      if (campaign.payoutPerPromotion > 400) {
        tags.push('high-payout');
      }
      
      // Calculate filled slots (assuming some logic here)
      const filledSlots = Math.floor(campaign.totalPromotions || 0);
      
      // Calculate estimated views (assuming 1.5x the minimum views requirement)
      const estimatedViews = Math.floor(campaign.minViewsPerPromotion * 1.5);
      
      // Create end date (assuming campaign runs for 7 days from start)
      const endDate = new Date(campaign.startDate);
      endDate.setDate(endDate.getDate() + 7);
      
       return {
        ...campaign, // copies all properties from the original campaign
        requirements,
        tags,
        difficulty,
        filledSlots,
        estimatedViews,
        isBookmarked: false // add/override as needed
      };

      // return {
      //   _id: campaign._id,
      //   title: campaign.title,
      //   caption: campaign.caption || 'Promote this campaign on your WhatsApp status',
      //   category: campaign.category,
      //   payoutPerPromotion: campaign.payoutPerPromotion,
      //   requirements,
      //   duration: '24 hours',
      //   mediaUrl: campaign.mediaUrl,
      //   advertiserName: 'Advertiser', // You might want to get this from campaign.owner
      //   advertiserRating: 4.5, // Default rating
      //   totalSlots: campaign.maxPromoters,
      //   filledSlots,
      //   estimatedViews,
      //   difficulty,
      //   tags,
      //   endDate,
      //   isBookmarked: false
      // };
    });
  }

  private calculateCampaignMetrics(campaigns: CampaignInterface[]): CampaignInterface[] {
    return campaigns.map(campaign => {
      const updatedCampaign = { ...campaign };

      updatedCampaign.progress = (campaign.spentBudget / campaign.budget) * 100;

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
          updatedCampaign.remainingDays = 'Budget-based';
        }
      }

      return updatedCampaign;
    });
  }

  // private loadActivePromotions(): void {
  //   // This would ideally come from your backend
  //   // For now, we'll keep the mock data or you can implement a service call
  //   const mockActivePromotions: ActivePromotion[] = [
  //     {
  //       _id: '1',
  //       campaignTitle: 'Fashion Summer Sale 2024',
  //       status: 'posted',
  //       postedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  //       expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000),
  //       currentViews: 18,
  //       requiredViews: 25,
  //       payout: 300,
  //       proofSubmitted: false,
  //       timeRemaining: '22h remaining'
  //     }
  //   ];

  //   this.activePromotions.set(mockActivePromotions);
  // }

  private calculateStats(): PromoterStats {
    // These values should ideally come from your backend API
    // For now, we'll calculate based on available data
    const campaigns = this.availableCampaigns();
    const totalEarnings = campaigns.reduce((sum, campaign) => sum + campaign.payoutPerPromotion, 0);
    const completedCampaigns = campaigns.filter(c => c.filledSlots >= c.totalSlots).length;
    
    return {
      totalEarnings,
      completedCampaigns,
      activeCampaigns: campaigns.length - completedCampaigns,
      pendingEarnings: totalEarnings * 0.2, // Assuming 20% is pending
      averageRating: 4.6,
      totalViews: campaigns.reduce((sum, campaign) => sum + 70, 0),
      thisMonthEarnings: totalEarnings * 0.3, // Assuming 30% earned this month
      successRate: Math.min(100, Math.floor((completedCampaigns / campaigns.length) * 100)) || 0
    };
  }

  // Navigation methods
  browseCampaigns(): void {
    this.router.navigate(['/promoter/campaigns/browse']);
  }

  viewEarnings(): void {
    this.router.navigate(['/promoter/earnings']);
  }

  viewHistory(): void {
    this.router.navigate(['/promoter/history']);
  }

  getSupport(): void {
    this.router.navigate(['/promoter/support']);
  }

  viewActivePromotions(): void {
    this.router.navigate(['/promoter/active']);
  }

  viewAllCampaigns(): void {
    this.router.navigate(['/promoter/campaigns/all']);
  }

  // Campaign actions
  applyCampaign(campaignId: string): void {
    console.log('Applying for campaign:', campaignId);
    this.router.navigate(['/promoter/campaigns', campaignId, 'apply']);
  }

  toggleBookmark(campaignId: string): void {
    const campaigns = this.availableCampaigns();
    const updatedCampaigns = campaigns.map(campaign => 
      campaign._id === campaignId 
        ? { ...campaign, isBookmarked: !campaign.isBookmarked }
        : campaign
    );
    this.availableCampaigns.set(updatedCampaigns);
    this.filterCampaigns();
  }

  previewMedia(campaignId: string): void {
    console.log('Previewing media for campaign:', campaignId);
    // Implement media preview modal
  }

  // Filter methods
  updatePayoutFilter(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.minPayoutFilter.set(parseInt(target.value));
    this.filterCampaigns();
  }

  toggleCategoryFilter(): void {
    // Implement category filter logic
    console.log('Toggle category filter');
  }

  resetFilters(): void {
    this.minPayoutFilter.set(200);
    this.currentCategoryFilter.set('all');
    this.filterCampaigns();
  }

  private filterCampaigns(): void {
    const campaigns = this.availableCampaigns();
    const minPayout = this.minPayoutFilter();
    
    const filtered = campaigns.filter(campaign => 
      campaign.payoutPerPromotion >= minPayout
    );
    
    this.filteredCampaigns.set(filtered);
  }

  // Utility methods
  // formatNumber(num: number): string {
  //   if (num >= 1000000) {
  //     return (num / 1000000).toFixed(1) + 'M';
  //   }
  //   if (num >= 1000) {
  //     return (num / 1000).toFixed(1) + 'K';
  //   }
  //   return num.toString();
  // }

  getStars(rating: number): Array<{icon: string, class: string}> {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push({ icon: 'star', class: 'star-full' });
    }

    if (hasHalfStar) {
      stars.push({ icon: 'star_half', class: 'star-half' });
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push({ icon: 'star_border', class: 'star-empty' });
    }

    return stars;
  }

  getDifficultyDots(difficulty: string): boolean[] {
    switch (difficulty) {
      case 'easy': return [true, false, false];
      case 'medium': return [true, true, false];
      case 'hard': return [true, true, true];
      default: return [false, false, false];
    }
  }

  // getTimeUntilEnd(endDate: Date): string {
  //   const now = new Date();
  //   const timeDiff = endDate.getTime() - now.getTime();
  //   const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
  //   if (days <= 0) return 'ended';
  //   if (days === 1) return 'tomorrow';
  //   if (days <= 7) return `in ${days} days`;
  //   return 'soon';
  // }
}