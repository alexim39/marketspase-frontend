import { Component, OnInit, inject, signal, computed, Signal, Input, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Imported child components
import { PromoterHeaderComponent } from './components/promoter-header/promoter-header.component';
import { PromoterQuickStatsComponent } from './components/promoter-quick-stats/promoter-quick-stats.component';
import { CampaignFiltersComponent } from './components/campaign-filters/campaign-filters.component';
import { CampaignCardComponent } from './components/campaign-card/campaign-card.component';
import { EmptyStateComponent } from './components/empty-state/empty-state.component';
import { LoadingStateComponent } from './components/loading-state/loading-state.component';

// Imported types and services
import { CampaignInterface, DeviceService, PromotionInterface, UserInterface } from '../../../../../shared-services/src/public-api';
import { formatRemainingDays, isDatePast } from '../../common/utils/time.util';
import { PromoterLandingService } from './promoter-landing.service';

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
  providers: [PromoterLandingService],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    // Child components
    PromoterHeaderComponent,
    PromoterQuickStatsComponent,
    CampaignFiltersComponent,
    CampaignCardComponent,
    EmptyStateComponent,
    LoadingStateComponent,
  ],
  templateUrl: './promoter-landing.component.html',
  styleUrls: ['./promoter-landing.component.scss']
})
export class PromoterLandingComponent implements OnInit {
  private router = inject(Router);
  private deviceService = inject(DeviceService);
  private promoterLandingService = inject(PromoterLandingService);
  private snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  
  public readonly api = this.promoterLandingService.api;

  // Signals for reactive state management
  isLoading = signal(false);
  isApplying = signal(false);
  campaigns = signal<CampaignInterface[]>([]);
  searchTerm = signal('');

  @Input({ required: true }) user!: Signal<UserInterface | null>;

  promotions = signal<PromotionInterface[]>([]);

  filteredCampaigns = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.campaigns();
    return this.campaigns().filter(c =>
      c.title?.toLowerCase().includes(term) ||
      c.caption?.toLowerCase().includes(term) ||
      c.category?.toLowerCase().includes(term)
    );
  });

  metrics = computed<CampaignMetrics>(() => {
    const campaigns = this.campaigns();
    const totalEarnings = campaigns.reduce((sum, campaign) => sum + (campaign.paidPromotions || 0) * campaign.payoutPerPromotion, 0);
    //const pendingEarnings = campaigns.reduce((sum, campaign) => sum + ((campaign.validatedPromotions || 0) - (campaign.paidPromotions || 0)) * campaign.payoutPerPromotion, 0);
    const activePromotions = this.promotions().filter((promotion: PromotionInterface) => promotion.status === 'pending' || promotion.status === 'submitted').length;    
    const completedPromotions = campaigns.reduce((sum, campaign) => sum + (campaign.paidPromotions || 0), 0);
    const totalViews = campaigns.reduce((sum, campaign) => sum + (campaign.totalPromotions || 0) * (campaign.minViewsPerPromotion || 0), 0);
    const totalPromotions = campaigns.reduce((sum, campaign) => sum + (campaign.totalPromotions || 0), 0);
    //const validatedPromotions = campaigns.reduce((sum, campaign) => sum + (campaign.validatedPromotions || 0), 0);
    //const successRate = totalPromotions > 0 ? (validatedPromotions / totalPromotions) * 100 : 0;
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
      rating: 4.8,
      completedPromotions,
      pendingEarnings: 5,
      activePromotions,
      successRate: 9,
      totalViews,
      expiringSoon
    };
  });

  ngOnInit(): void {
    this.loadCampaigns();
    this.loadUserPromotions();
  }

   loadUserPromotions(): void {
    this.isLoading.set(true);

    const userId = this.user()?._id;

    // Check if the user ID exists before making the API call
    if (!userId) {
      this.snackBar.open('User not logged in or ID not available.', 'Dismiss', { duration: 3000 });
      this.isLoading.set(false);
      return;
    }

    this.promoterLandingService.getUserPromotions(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          // Add a defensive check for the response data
          if (response && response.data) {
            console.log('returned promotions',response)
            this.promotions.set(response.data);
            //this.stats.set(this.calculateStats(response.data));
          } else {
            // Handle case where response is not as expected
            this.promotions.set([]);
            //this.stats.set(this.calculateStats([]));
          }
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to load promotions:', error);
          //this.snackBar.open('Failed to load promotions. Please try again.', 'Dismiss', { duration: 3000 });
          this.isLoading.set(false);
        }
      });
  }

  private loadCampaigns(): void {
    if (this.user() && this.user()?._id) {
      this.isLoading.set(true);
      this.promoterLandingService.getCampaignsByStatus('active')
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            const campaignsWithMetrics = this.calculateCampaignMetrics(response.data);
            this.campaigns.set(campaignsWithMetrics);
            this.isLoading.set(false);
          },
          error: (error: HttpErrorResponse) => {
            console.error('Failed to load campaigns:', error);
            this.isLoading.set(false);
          }
        });
    }
  }

  private calculateCampaignMetrics(campaigns: CampaignInterface[]): CampaignInterface[] {
    return campaigns.map(campaign => {
      const updatedCampaign = { ...campaign };
      updatedCampaign.progress = campaign.budget > 0 ? ( (campaign.payoutPerPromotion * campaign.currentPromoters ) / campaign.budget) * 100 : 0;
      if (campaign.endDate) {
        const endDate = new Date(campaign.endDate);
        if (isDatePast(endDate)) {
          updatedCampaign.remainingDays = 'Expired';
        } else {
          updatedCampaign.remainingDays = formatRemainingDays(endDate);
        }
      } else {
        const budgetRemaining = updatedCampaign.budget - (updatedCampaign.payoutPerPromotion * updatedCampaign.currentPromoters );
        // const budgetRemaining = updatedCampaign.budget - updatedCampaign.spentBudget;
        if (budgetRemaining <= 0) {
          updatedCampaign.remainingDays = 'Budget Exhausted';
        } else {
          updatedCampaign.remainingDays = 'Ongoing';
        }
      }
      return updatedCampaign;
    });
  }

  getHighPayoutCount(): number {
    return this.campaigns().filter(campaign => campaign.payoutPerPromotion >= 500).length;
  }

  getQuickTasksCount(): number {
    return this.campaigns().filter(campaign => campaign.minViewsPerPromotion <= 25).length;
  }

  applyForCampaign(campaign: CampaignInterface): void {
    if (!this.user() || !this.user()?._id) {
      this.snackBar.open('Please log in to apply for campaigns', 'OK', { 
          duration: 3000,
      });
      return;
    }
    
    this.isApplying.set(true);
      this.promoterLandingService.acceptCampaign(campaign._id, this.user()!._id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const updatedCampaigns = this.campaigns().map(c => {
            if (c._id === campaign._id) {
              return {
                ...c,
                totalPromotions: (c.totalPromotions || 0) + 1,
                spentBudget: ( (c.payoutPerPromotion * c.currentPromoters ) || 0) + c.payoutPerPromotion
                // spentBudget: (c.spentBudget || 0) + c.payoutPerPromotion
              };
            }
            return c;
          });
          
          this.campaigns.set(updatedCampaigns);
          this.isApplying.set(false);
          this.snackBar.open(response.message, 'OK', { 
              duration: 9000,
          });
        },
        error: (error: HttpErrorResponse) => {
          this.isApplying.set(false);
           this.snackBar.open((error.error?.message || 'Unknown error'), 'OK', { 
              duration: 3000,
          });
        }
      });
  }

  viewPromotions() {
    this.router.navigate(['/dashboard/campaigns/promotions']);
  }
}