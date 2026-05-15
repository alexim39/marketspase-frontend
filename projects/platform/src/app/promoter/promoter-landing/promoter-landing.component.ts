import { Component, OnInit, inject, signal, computed, Signal, Input, DestroyRef, Injector, runInInjectionContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';

// Imported child components
import { PromoterHeaderComponent } from './components/promoter-header/promoter-header.component';
import { PromoterQuickStatsComponent } from './components/promoter-quick-stats/promoter-quick-stats.component';
import { CampaignFiltersComponent } from './components/campaign-filters/campaign-filters.component';
import { CampaignCardComponent } from './components/campaign-card/campaign-card.component';
import { EmptyStateComponent } from './components/empty-state/empty-state.component';
import { LoadingStateComponent } from './components/loading-state/loading-state.component';

// Imported types and services
import { CampaignInterface, DeviceService, PromotionInterface, UserInterface } from '@shared/services';
import { formatRemainingDays, isDatePast } from '../../common/utils/time.util';
import { PromoterLandingService } from './promoter-landing.service';
import { CampaignCardMobileComponent } from './components/campaign-card/mobile/campaign-card-mobile.component';
import { PromoterQuickStatsMobileComponent } from './components/promoter-quick-stats/mobile/promoter-quick-stats-mobile.component';
import { CampaignFiltersMobileComponent, FilterType } from './components/campaign-filters/mobile/campaign-filters-mobile.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoadingStateMobileComponent } from './components/loading-state/mobile/loading-state-mobile.component';
import {
  canCampaignBeAccepted,
  getCampaignCostPerClick,
  getCampaignRemainingBudget,
  hasCampaignOpenPromoterSlots,
  isCampaignBudgetExhausted,
  isCampaignExpired,
} from '../utils/campaign-availability.util';
import { distinctUntilChanged, filter } from 'rxjs';

interface CampaignMetrics {
  totalEarnings: number;
  rating: number;
  completedPromotions: number;
  pendingEarnings: number;
  activePromotions: number;
  successRate: number;
  totalClicks: number;
  expiringSoon: number;
  avgEarnings: number;
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
  private readonly injector = inject(Injector);
  
  public readonly api = this.promoterLandingService.api;

  // Signals for reactive state management
  isCampaignsLoading = signal(false);
  isPromotionsLoading = signal(false);
  isLoading = computed(() => this.isCampaignsLoading() || this.isPromotionsLoading());
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
    if (this.hasMoreCampaigns() && !this.isCampaignsLoading()) {
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
        filtered = filtered.filter(campaign => (campaign.costPerClick || campaign.payoutPerPromotion || 0) >= 100);
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
        filtered = filtered.filter(campaign => (campaign.costPerClick || campaign.payoutPerPromotion || 0) <= 100);
        break;
      case 'active':
        filtered = filtered.filter(campaign => {
          return canCampaignBeAccepted(campaign);
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
    const userRating = Number(this.user()?.rating || 0);

    // Calculate earnings based on actual promotion status
    const totalEarnings = promotions
      .filter(promotion => promotion.status === 'paid')
      .reduce((sum, promotion) => {
        const earnedAmount = promotion.clickStats?.earnedAmount ?? promotion.payoutAmount ?? 0;
        return sum + earnedAmount;
      }, 0);

    const pendingEarnings = promotions
      .filter(promotion => !['paid', 'rejected'].includes(promotion.status))
      .reduce((sum, promotion) => {
        const earnedAmount = promotion.clickStats?.earnedAmount ?? promotion.payoutAmount ?? 0;
        return sum + earnedAmount;
      }, 0);

    const activePromotions = promotions.filter(promotion => 
      ['accepted', 'downloaded', 'submitted', 'validated'].includes(promotion.status) &&
      promotion.isActive !== false
    ).length;

    const completedPromotions = promotions.filter(promotion => 
      promotion.status === 'paid'
    ).length;

    const totalClicks = promotions.reduce((sum, promotion) => 
      sum + (promotion.clickStats?.totalClicks || 0), 0
    );

    // Calculate success rate based on promotion outcomes
    const totalAcceptedPromotions = promotions.filter(p => p.status !== 'rejected').length;
    
    const successfulPromotions = promotions.filter(p => p.status === 'paid').length;
    const successRate = totalAcceptedPromotions > 0 ? 
      (successfulPromotions / totalAcceptedPromotions) * 100 : 0;
    const avgEarnings = successfulPromotions > 0 ? totalEarnings / successfulPromotions : 0;

    // Expiring soon - promotions where campaign is ending in 3 days
    const expiringSoon = promotions.filter(promotion => {
      if (!promotion.campaign?.endDate) return false;
      const endDate = new Date(promotion.campaign.endDate);
      const today = new Date();
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 3 && diffDays > 0 && 
            ['accepted', 'downloaded', 'submitted', 'validated'].includes(promotion.status);
    }).length;

    return {
      totalEarnings,
      rating: userRating,
      completedPromotions,
      pendingEarnings,
      activePromotions,
      successRate,
      totalClicks,
      expiringSoon,
      avgEarnings
    };
  });

  ngOnInit(): void {
    runInInjectionContext(this.injector, () => toObservable(this.user))
      .pipe(
        filter((user): user is UserInterface => !!user?._id),
        distinctUntilChanged((previous, current) => previous._id === current._id),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((user) => {
        this.resetLandingState();
        this.promoterLandingService.clearCache();
        this.loadCampaigns(false, user._id);
        this.loadUserPromotions(user._id);
      });
  }

  loadUserPromotions(userId?: string): void {
    const resolvedUserId = userId || this.user()?._id;

    if (!resolvedUserId) {
      return;
    }

    this.isPromotionsLoading.set(true);

    this.promoterLandingService.getUserPromotions(resolvedUserId)
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
          this.isPromotionsLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to load promotions:', error);
          //this.snackBar.open('Failed to load promotions. Please try again.', 'Dismiss', { duration: 3000 });
          this.isPromotionsLoading.set(false);
        }
      });
  }

  private loadCampaigns(loadMore: boolean = false, userId?: string): void {
    const resolvedUserId = userId || this.user()?._id;

    if (!resolvedUserId) {
      return;
    }

    const nextPage = loadMore ? this.currentPage() + 1 : 1;
    this.isCampaignsLoading.set(true);

    this.promoterLandingService.getCampaignsByStatus('active', resolvedUserId, {
      page: nextPage,
      limit: this.pageSize()
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const campaignsWithMetrics = this.calculateCampaignMetrics(response.data || []);

          if (loadMore) {
            this.campaigns.set([...this.campaigns(), ...campaignsWithMetrics]);
            this.currentPage.set(nextPage);
          } else {
            this.campaigns.set(campaignsWithMetrics);
            this.currentPage.set(1);
          }

          this.paginationMetadata.set(response.metadata?.pagination);
          this.isCampaignsLoading.set(false);
          this.hasMoreCampaigns.set(response.metadata?.pagination?.hasNextPage || false);
          this.hasLoaded.set(true);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to load campaigns:', error);
          if (!loadMore) {
            this.campaigns.set([]);
          }
          this.isCampaignsLoading.set(false);
          this.hasLoaded.set(true);
          this.hasMoreCampaigns.set(false);
        }
      });
  }

  private calculateCampaignMetrics(campaigns: CampaignInterface[]): CampaignInterface[] {
    return campaigns.map(campaign => {
      const updatedCampaign = { ...campaign };

      const remainingBudget = getCampaignRemainingBudget(updatedCampaign);
      const costPerClick = getCampaignCostPerClick(updatedCampaign);
      updatedCampaign.remainingBudget = remainingBudget;
      updatedCampaign.costPerClick = costPerClick;
      updatedCampaign.progress = updatedCampaign.budget > 0
        ? Math.min(((updatedCampaign.spentBudget || 0) / updatedCampaign.budget) * 100, 100)
        : 0;

      if (isCampaignExpired(updatedCampaign)) {
        updatedCampaign.remainingDays = 'Expired';
      } else if (isCampaignBudgetExhausted(updatedCampaign)) {
        updatedCampaign.remainingDays = 'Budget Exhausted';
      } else if (campaign.endDate) {
        const endDate = new Date(campaign.endDate);
        updatedCampaign.remainingDays = isDatePast(endDate) ? 'Expired' : formatRemainingDays(endDate);
      } else {
        updatedCampaign.remainingDays = 'Ongoing';
      }

      updatedCampaign.canAcceptPromoters = hasCampaignOpenPromoterSlots(updatedCampaign) && remainingBudget >= costPerClick;

      return updatedCampaign;
    });
  }

  getHighPayoutCount(): number {
    return this.campaigns().filter(campaign => (campaign.costPerClick || campaign.payoutPerPromotion || 0) >= 100).length;
  }

  getQuickTasksCount(): number {
    return this.campaigns().filter(campaign => (campaign.costPerClick || campaign.payoutPerPromotion || 0) <= 100).length;
  }

applyForCampaign(campaign: CampaignInterface): void {
  if (!this.user() || !this.user()?._id) {
    this.snackBar.open('Please log in to accept campaigns', 'OK', { 
        duration: 3000,
    });
    return;
  }
  
  if (!this.user()?.personalInfo?.phone || !this.user()?.personalInfo?.address) {
  // if (this.user()?.personalInfo?.phone == null || this.user()?.personalInfo?.address == null) {
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
        const promotionUrl = response?.promotionUrl || response?.promotion?.promotionUrl;
        const createdPromotion = response?.promotion;
        const updatedCampaigns = this.campaigns().map(c => {
          if (c._id === campaign._id) {
            return {
              ...c,
              currentPromoters: (c.currentPromoters || 0) + 1,
              totalPromotions: (c.totalPromotions || 0) + 1
            };
          }
          return c;
        });
        
        this.campaigns.set(updatedCampaigns);
        if (createdPromotion) {
          this.promotions.update(promotions => [createdPromotion, ...promotions]);
        }
        this.isApplying.set(false);
        this.applyingCampaignId.set(null); // Reset using signal        
        // this.snackBar.open(response.message, 'OK', { 
        //     duration: 9000,
        // });

        this.snackBar.open(
          response.message || 'Promotion link generated',
          promotionUrl ? 'Copy Link' : 'Go to Promotions',
          {
            duration: 9000,
            panelClass: 'snackbar-link'
          }
        ).onAction().subscribe(() => {
          if (promotionUrl) {
            navigator.clipboard.writeText(promotionUrl);
          } else {
            this.router.navigate(['/dashboard/campaigns/promotions']);
          }
        });


        
        this.loadUserPromotions(this.user()!._id);
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

  private resetLandingState(): void {
    this.campaigns.set([]);
    this.promotions.set([]);
    this.currentPage.set(1);
    this.hasMoreCampaigns.set(false);
    this.paginationMetadata.set(null);
    this.hasLoaded.set(false);
  }
}
