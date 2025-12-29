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
import { CampaignCardMobileComponent } from './components/campaign-card/mobile/campaign-card-mobile.component';
import { PromoterQuickStatsMobileComponent } from './components/promoter-quick-stats/mobile/promoter-quick-stats-mobile.component';
import { CampaignFiltersMobileComponent, FilterType } from './components/campaign-filters/mobile/campaign-filters-mobile.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoadingStateMobileComponent } from './components/loading-state/mobile/loading-state-mobile.component';

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
    LoadingStateMobileComponent,
    CampaignCardMobileComponent,
    PromoterQuickStatsMobileComponent,
    CampaignFiltersMobileComponent,
    MatProgressSpinnerModule
  ],
  templateUrl: './promoter-landing.component.html',
  styleUrls: ['./promoter-landing.component.scss']
})
export class PromoterLandingComponent implements OnInit {
  private router = inject(Router);
  private deviceService = inject(DeviceService);
  deviceType = computed(() => this.deviceService.type());
  private promoterLandingService = inject(PromoterLandingService);
  private snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  
  public readonly api = this.promoterLandingService.api;

  // Signals for reactive state management
  isLoading = signal(false);
  isApplying = signal(false);
  campaigns = signal<CampaignInterface[]>([]);
  searchTerm = signal('');
  viewMode = signal<'grid' | 'list'>('grid');
  activeFilter = signal<FilterType>('all');

  @Input({ required: true }) user!: Signal<UserInterface | null>;

  promotions = signal<PromotionInterface[]>([]);

  //applyingCampaignId: string | null = null;

  // Change applyingCampaignId to a signal
  applyingCampaignId = signal<string | null>(null);
  hasLoaded = signal(false);

  // Add these signals to your component
  currentPage = signal(1);
  pageSize = signal(20); // Adjust as needed
  hasMoreCampaigns = signal(false);
  paginationMetadata = signal<any>(null);

  // Add a method to load more campaigns
  loadMoreCampaigns(): void {
    if (this.hasMoreCampaigns() && !this.isLoading()) {
      this.loadCampaigns(true);
    }
  }

  // Update filteredCampaigns computation
  filteredCampaigns = computed(() => {
    // If no campaigns and haven't loaded yet, return empty without processing
    if (this.campaigns().length === 0 && !this.hasLoaded()) {
      return [];
    }

    const term = this.searchTerm().toLowerCase().trim();
    const filter = this.activeFilter();
    let filtered = this.campaigns();

    // Apply search filter
    if (term) {
      filtered = filtered.filter(c =>
        c.title?.toLowerCase().includes(term) ||
        c.caption?.toLowerCase().includes(term) ||
        c.category?.toLowerCase().includes(term)
      );
    }

    // Apply active filter
    switch (filter) {
      case 'highPayout':
        filtered = filtered.filter(campaign => campaign.payoutPerPromotion >= 500);
        break;
      case 'expiringSoon':
        filtered = filtered.filter(campaign => {
          if (!campaign.endDate) return false;
          const endDate = new Date(campaign.endDate);
          const today = new Date();
          const diffTime = endDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= 3 && diffDays > 0;
        });
        break;
      case 'quickTasks':
        filtered = filtered.filter(campaign => campaign.minViewsPerPromotion <= 25);
        break;
      case 'active':
        filtered = filtered.filter(campaign => {
          // A campaign is active if it's not explicitly expired or budget exhausted
          const isInactive = campaign.remainingDays === 'Expired' || 
                            campaign.remainingDays === 'Budget Exhausted';
          return !isInactive && campaign.status === 'active';
        });
        break;
      case 'all':
      default:
        // No additional filtering needed
        break;
    }

    return filtered;
  });

  onFilterChange(filter: FilterType): void {
    this.activeFilter.set(filter);
  }

  metrics = computed<CampaignMetrics>(() => {
    const promotions = this.promotions();

    // Calculate earnings based on actual promotion status
    const totalEarnings = promotions
      .filter(promotion => promotion.status === 'paid')
      .reduce((sum, promotion) => sum + (promotion.payoutAmount || 0), 0);

    const pendingEarnings = promotions
      //.filter(promotion => promotion.status === 'submitted')
      .filter(promotion => promotion.status === 'submitted' || promotion.status === 'pending')
      .reduce((sum, promotion) => sum + (promotion.payoutAmount || 0), 0);

    const activePromotions = promotions.filter(promotion => 
      promotion.status === 'pending' || promotion.status === 'submitted'
    ).length;

    const completedPromotions = promotions.filter(promotion => 
      promotion.status === 'paid'
    ).length;

    // Calculate total views from proofViews in promotions (more accurate)
    const totalViews = promotions.reduce((sum, promotion) => 
      sum + (promotion.proofViews || 0), 0
    );

    // Calculate success rate based on promotion outcomes
    const totalAcceptedPromotions = promotions.filter(p => 
      p.status === 'submitted' || p.status === 'validated' || p.status === 'paid'
    ).length;
    
    const successfulPromotions = promotions.filter(p => p.status === 'paid').length;
    const successRate = totalAcceptedPromotions > 0 ? 
      (successfulPromotions / totalAcceptedPromotions) * 100 : 0;

    // Calculate rating based on completed promotions (you might want to get this from user data)
    const rating = this.calculateUserRating(promotions);

    // Expiring soon - promotions where campaign is ending in 3 days
    const expiringSoon = promotions.filter(promotion => {
      if (!promotion.campaign?.endDate) return false;
      const endDate = new Date(promotion.campaign.endDate);
      const today = new Date();
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 3 && diffDays > 0 && 
            (promotion.status === 'pending' || promotion.status === 'submitted');
    }).length;

    return {
      totalEarnings,
      rating,
      completedPromotions,
      pendingEarnings,
      activePromotions,
      successRate,
      totalViews,
      expiringSoon
    };
  });

  // Helper method to calculate user rating
  private calculateUserRating(promotions: PromotionInterface[]): number {
    // If you have a user rating system, use that instead
    const paidPromotions = promotions.filter(p => p.status === 'paid').length;
    
    // Simple rating calculation based on completed promotions
    // You might want to replace this with actual user rating data
    if (paidPromotions >= 10) return 4.8;
    if (paidPromotions >= 5) return 4.5;
    if (paidPromotions >= 1) return 4.0;
    return 0; // No rating for new users
  }

  ngOnInit(): void {
    this.loadCampaigns(false); // Initial load
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
            //console.log('returned promotions',response)
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

    private loadCampaigns(loadMore: boolean = false): void {
      if (this.user() && this.user()?._id) {
        // If loading more, increment page, otherwise start from page 1
        const nextPage = loadMore ? this.currentPage() + 1 : 1;
        
        this.isLoading.set(true);
        
        this.promoterLandingService.getCampaignsByStatus('active', this.user()?._id, { 
          page: nextPage, 
          limit: this.pageSize()
        })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (response) => {
              const campaignsWithMetrics = this.calculateCampaignMetrics(response.data);
              
              if (loadMore) {
                // Append new campaigns to existing ones
                const currentCampaigns = this.campaigns();
                this.campaigns.set([...currentCampaigns, ...campaignsWithMetrics]);
                this.currentPage.set(nextPage);
              } else {
                // Replace campaigns with new ones
                this.campaigns.set(campaignsWithMetrics);
                this.currentPage.set(1);
              }
              
              // Update pagination metadata
              this.paginationMetadata.set(response.metadata?.pagination);
              this.isLoading.set(false);
              this.hasMoreCampaigns.set(response.metadata?.pagination?.hasNextPage || false);
              this.hasLoaded.set(true);
            },
            error: (error: HttpErrorResponse) => {
              console.error('Failed to load campaigns:', error);
              this.isLoading.set(false);
              this.hasLoaded.set(true);
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
    this.snackBar.open('Please log in to accept campaigns', 'OK', { 
        duration: 3000,
    });
    return;
  }
  
  if (!this.user()?.personalInfo?.address) {
    // this.snackBar.open('Please complete your profile setup to accept campaign', 'OK', { 
    //     duration: 3000,
    // });

    this.snackBar.open(
      'Please complete your profile setup to accept campaign',
      'Go to Settings',
      {
        duration: 3000,
        panelClass: 'snackbar-link'
      }
    ).onAction().subscribe(() => {
      this.router.navigate(['/dashboard/settings/account']);
    });

    return;
  }
  
  // Set the applying campaign ID using signal
  this.applyingCampaignId.set(campaign._id);
  this.isApplying.set(true);
  
  this.promoterLandingService.acceptCampaign(campaign._id, this.user()!._id)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (response) => {
        const updatedCampaigns = this.campaigns().map(c => {
          if (c._id === campaign._id) {
            return {
              ...c,
              spentBudget: (c.spentBudget || 0) + c.payoutPerPromotion
            };
          }
          return c;
        });
        
        this.campaigns.set(updatedCampaigns);
        this.isApplying.set(false);
        this.applyingCampaignId.set(null); // Reset using signal        
        // this.snackBar.open(response.message, 'OK', { 
        //     duration: 9000,
        // });

        this.snackBar.open(
          response.message,
          'Go to Promotions',
          {
            duration: 9000,
            panelClass: 'snackbar-link'
          }
        ).onAction().subscribe(() => {
          this.router.navigate(['/dashboard/campaigns/promotions']);
        });


        
        this.loadUserPromotions();
      },
      error: (error: HttpErrorResponse) => {
        //console.log('error ',error.message)
        this.isApplying.set(false);
        this.applyingCampaignId.set(null); // Reset using signal
        
        this.snackBar.open((error?.message || 'Unknown error'), 'OK', { 
            duration: 9000,
        });
      }
    });
}

  viewPromotions() {
    this.router.navigate(['/dashboard/campaigns/promotions']);
  }
}