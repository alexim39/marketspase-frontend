import { Component, OnInit, inject, signal, computed, Input, Signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Components
import { CampaignStatsComponent } from './components/campaign-stats/campaign-stats.component';
import { CampaignFiltersComponent } from './components/campaign-filters/campaign-filters.component';
import { CampaignListComponent } from './components/campaign-list/campaign-list.component';

// Services & Types
import { CampaignInterface, DeviceService, UserInterface } from '@shared/services';
import { MarketerService, PaginatedResponse, PaginationParams, FilterParams } from '../marketer.service';
import { HttpErrorResponse } from '@angular/common/http';
import { CampaignHeaderComponent } from './components/compaign-head/campaign-header.component';
import { CampaignStatsMobileComponent } from './components/campaign-stats/mobile/campaign-stats-mobile.component';
import { CampaignFiltersMobileComponent } from './components/campaign-filters/mobile/campaign-filters-mobile.component';
import { CampaignDetailsService } from '../../campaign/campaign-details/campaign-details.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  getCampaignBillableClicks,
  getCampaignCostPerClick,
  getCampaignEstimatedClicks,
  getCampaignInvalidClicks,
  getCampaignRemainingBudget,
  getCampaignTotalClicks,
  getCampaignUniquePromoterCount,
  isCampaignBudgetExhausted,
  isCampaignExpired,
} from '../../common/utils/campaign-performance.util';

interface FilterOptions {
  status: string;
  category: string;
  campaignType: string;
  dateRange: { start: Date | null; end: Date | null };
  budgetRange: { min: number; max: number };
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface StatusOption {
  value: string;
  label: string;
  icon: string;
}

interface CampaignDashboardStats {
  totalCampaigns: number;
  activeCampaigns: number;
  draftCampaigns: number;
  completedCampaigns: number;
  pendingCampaigns: number;
  exhaustedCampaigns: number;
  totalSpent: number;
  totalBudget: number;
  remainingBudget: number;
  budgetUtilization: number;
  totalClicks: number;
  billableClicks: number;
  invalidClicks: number;
  totalPromoters: number;
  totalPromotions: number;
  activePromotions: number;
  clickQualityRate: number;
  promoterActivationRate: number;
  avgCostPerClick: number;
  estimatedRemainingClicks: number;
  campaignsWithPromotions: number;
  campaignsNeedingAttention: number;
}

@Component({
  selector: 'marketer-landing',
  standalone: true,
  providers: [MarketerService, CampaignDetailsService],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    CampaignStatsComponent,
    CampaignFiltersComponent,
    CampaignListComponent,
    CampaignHeaderComponent,
    CampaignStatsMobileComponent,
    CampaignFiltersMobileComponent,
  ],
  templateUrl: './marketer-landing.component.html',
  styleUrls: ['./marketer-landing.component.scss']
})
export class MarketerLandingComponent implements OnInit {
  private router = inject(Router);
  private deviceService = inject(DeviceService);
  deviceType = computed(() => this.deviceService.type());
  private destroyRef = inject(DestroyRef);
  private marketerService = inject(MarketerService);
  private campaignDetailsService = inject(CampaignDetailsService);
  private snackBar = inject(MatSnackBar);
  
  public apiBaseUrl = this.marketerService.api;

  @Input({ required: true }) user!: Signal<UserInterface | null>;
  
  // Signals
  campaigns = signal<CampaignInterface[]>([]);
  isLoading = signal(false);
  currentView = signal<'grid' | 'list'>('grid');
  
  // Pagination properties
  currentPage = signal(1);
  itemsPerPage = signal(10);
  totalPages = signal(0);
  totalCampaigns = signal(0);
  hasNextPage = signal(false);
  hasPrevPage = signal(false);

  // Filters
  currentFilters = signal<FilterOptions>({
    status: 'all',
    category: '',
    campaignType: '',
    dateRange: { start: null, end: null },
    budgetRange: { min: 0, max: 1000000 },
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  searchControl = new FormControl('');

  // Computed properties
  campaignStats = computed<CampaignDashboardStats>(() => this.calculateStats());
  
  campaignCounts = computed(() => {
    const counts: Record<string, number> = { all: this.totalCampaigns() };
    this.statusOptions.forEach(option => {
      if (option.value !== 'all') {
        // Note: For accurate counts across all pages with filters, you'd need backend support
        // This is a frontend approximation based on current page data
        counts[option.value] = this.campaigns().filter(c => c.status === option.value).length;
      }
    });
    return counts;
  });

  hasActiveFilters = computed(() => {
    const filters = this.currentFilters();
    return (
      filters.status !== 'all' ||
      filters.category !== '' ||
      filters.campaignType !== '' ||
      filters.dateRange.start !== null ||
      filters.dateRange.end !== null ||
      !!this.searchControl.value
    );
  });

  statusOptions: StatusOption[] = [
    { value: 'all', label: 'All', icon: 'list' },
    { value: 'active', label: 'Active', icon: 'play_circle' },
    { value: 'draft', label: 'Draft', icon: 'edit' },
    { value: 'paused', label: 'Paused', icon: 'pause_circle' },
    { value: 'completed', label: 'Completed', icon: 'check_circle' },
    { value: 'expired', label: 'Expired', icon: 'schedule' },
    { value: 'pending', label: 'Pending', icon: 'hourglass_empty' },
    { value: 'exhausted', label: 'Exhausted', icon: 'assignment_late' }
  ];

  ngOnInit(): void {
    this.loadCampaigns();
    this.setupSearch();
  }

  private setupSearch(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        // Reset to first page when searching and reload with search filter
        this.currentPage.set(1);
        this.loadCampaigns();
      });
  }

  private loadCampaigns(): void {
    if (this.user() && this.user()?._id) {
      this.isLoading.set(true);
      
      const paginationParams: PaginationParams = { 
        page: this.currentPage(), 
        limit: this.itemsPerPage() 
      };
      
      const filterParams: FilterParams = this.buildFilterParams();
      
      this.marketerService.getMarketerCampaign(this.user()!._id!, paginationParams, filterParams)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response: PaginatedResponse<CampaignInterface>) => {
            this.campaigns.set(response.data);
            //console.log('returned campaign ',response.data)
            this.currentPage.set(response.pagination.currentPage);
            this.totalPages.set(response.pagination.totalPages);
            this.totalCampaigns.set(response.pagination.totalCampaigns);
            this.hasNextPage.set(response.pagination.hasNext);
            this.hasPrevPage.set(response.pagination.hasPrev);
            this.itemsPerPage.set(response.pagination.limit);
            this.isLoading.set(false);
          },
          error: (error: HttpErrorResponse) => {
            this.isLoading.set(false);
            console.error('Failed to load campaigns:', error);
            this.campaigns.set([]);
            this.totalCampaigns.set(0);
            this.totalPages.set(0);
            this.hasNextPage.set(false);
            this.hasPrevPage.set(false);
          }
        });
    }
  }

  private buildFilterParams(): FilterParams {
    const filters = this.currentFilters();
    const params: FilterParams = {};

    // Status filter
    if (filters.status && filters.status !== 'all') {
      params.status = filters.status;
    }

    // Search filter
    if (this.searchControl.value) {
      params.search = this.searchControl.value;
    }

    // Category filter
    if (filters.category) {
      params.category = filters.category;
    }

    // Campaign type filter
    if (filters.campaignType) {
      params.campaignType = filters.campaignType;
    }

    // Sort parameters
    if (filters.sortBy) {
      params.sortBy = filters.sortBy;
    }
    if (filters.sortOrder) {
      params.sortOrder = filters.sortOrder;
    }

    return params;
  }

  // Pagination methods
  onNextPage(): void {
    if (this.hasNextPage()) {
      this.currentPage.set(this.currentPage() + 1);
      this.loadCampaigns();
    }
  }

  onPrevPage(): void {
    if (this.hasPrevPage()) {
      this.currentPage.set(this.currentPage() - 1);
      this.loadCampaigns();
    }
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadCampaigns();
    }
  }

  onItemsPerPageChange(limit: number): void {
    this.itemsPerPage.set(limit);
    this.currentPage.set(1); // Reset to first page when changing items per page
    this.loadCampaigns();
  }

  // Refresh campaigns (useful after creating/editing/deleting campaigns)
  refreshCampaigns(): void {
    this.loadCampaigns();
  }

  private calculateStats(): CampaignDashboardStats {
    const campaigns = this.campaigns();
    const allPromotions = campaigns.flatMap(campaign => campaign.promotions || []);

    const totalSpent = campaigns.reduce((sum, campaign) => sum + Number(campaign.spentBudget || 0), 0);
    const totalBudget = campaigns.reduce((sum, campaign) => sum + Number(campaign.budget || 0), 0);
    const remainingBudget = campaigns.reduce((sum, campaign) => sum + getCampaignRemainingBudget(campaign), 0);

    const totalClicks = campaigns.reduce((sum, campaign) => sum + getCampaignTotalClicks(campaign), 0);
    const billableClicks = campaigns.reduce((sum, campaign) => sum + getCampaignBillableClicks(campaign), 0);
    const invalidClicks = campaigns.reduce((sum, campaign) => sum + getCampaignInvalidClicks(campaign), 0);

    const uniquePromoters = getCampaignUniquePromoterCount(allPromotions);
    const campaignsWithPromotions = campaigns.filter(campaign => (campaign.totalPromotions || campaign.currentPromoters || 0) > 0).length;
    const activePromotions = allPromotions.filter(promotion =>
      ['accepted', 'downloaded', 'submitted', 'validated'].includes(promotion.status)
    ).length;

    const activeCampaigns = campaigns.filter(campaign =>
      campaign.status === 'active' && !isCampaignBudgetExhausted(campaign) && !isCampaignExpired(campaign)
    );
    const draftCampaigns = campaigns.filter(campaign => campaign.status === 'draft');
    const completedCampaigns = campaigns.filter(campaign =>
      ['completed', 'expired', 'ended'].includes(String(campaign.status)) || isCampaignExpired(campaign)
    );
    const pendingCampaigns = campaigns.filter(campaign => campaign.status === 'pending');
    const exhaustedCampaigns = campaigns.filter(campaign =>
      campaign.status === 'exhausted' || isCampaignBudgetExhausted(campaign)
    );

    const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const clickQualityRate = totalClicks > 0 ? (billableClicks / totalClicks) * 100 : 0;
    const promoterActivationRate = activeCampaigns.length > 0 ? (campaignsWithPromotions / activeCampaigns.length) * 100 : 0;
    const avgCostPerClick = billableClicks > 0
      ? totalSpent / billableClicks
      : (campaigns.length > 0
          ? campaigns.reduce((sum, campaign) => sum + getCampaignCostPerClick(campaign), 0) / campaigns.length
          : 0);
    const estimatedRemainingClicks = campaigns.reduce((sum, campaign) => sum + getCampaignEstimatedClicks(campaign), 0);

    return {
      totalCampaigns: this.totalCampaigns(),
      activeCampaigns: activeCampaigns.length,
      draftCampaigns: draftCampaigns.length,
      completedCampaigns: completedCampaigns.length,
      pendingCampaigns: pendingCampaigns.length,
      exhaustedCampaigns: exhaustedCampaigns.length,
      totalSpent,
      totalBudget,
      remainingBudget,
      budgetUtilization: Math.round(budgetUtilization),
      totalClicks,
      billableClicks,
      invalidClicks,
      totalPromoters: uniquePromoters,
      totalPromotions: campaigns.reduce((sum, campaign) => sum + Number(campaign.totalPromotions || 0), 0),
      activePromotions,
      clickQualityRate: Math.round(clickQualityRate),
      promoterActivationRate: Math.round(promoterActivationRate),
      avgCostPerClick,
      estimatedRemainingClicks,
      campaignsWithPromotions,
      campaignsNeedingAttention: campaigns.filter(campaign =>
        campaign.status === 'active' &&
        !isCampaignBudgetExhausted(campaign) &&
        !isCampaignExpired(campaign) &&
        Number(campaign.currentPromoters || 0) === 0
      ).length
    };
  }

  // Public methods
  updateFilters(updates: Partial<FilterOptions>): void {
    this.currentFilters.set({ ...this.currentFilters(), ...updates });
    this.currentPage.set(1); // Reset to first page when filters change
    this.loadCampaigns();
  }

  clearAllFilters(): void {
    this.currentFilters.set({
      status: 'all',
      category: '',
      campaignType: '',
      dateRange: { start: null, end: null },
      budgetRange: { min: 0, max: 1000000 },
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    this.searchControl.setValue('');
    this.currentPage.set(1);
    this.loadCampaigns();
  }

  setView(view: 'grid' | 'list'): void {
    this.currentView.set(view);
  }

  createCampaign(): void {
    this.router.navigate(['/dashboard/campaigns/create']);
  }

  viewCampaignDetails(campaignId: string): void {
    this.router.navigate(['/dashboard/campaigns', campaignId]);
  }

  editCampaign(campaignId: string): void {
    this.router.navigate(['/dashboard/campaigns/edit', campaignId,]);
  }

  // Campaign actions
  pauseCampaign(campaignId: string): void {
    console.log('Pausing campaign:', campaignId);
  }

  activateCampaign(campaignId: string): void {
    this.isLoading.set(true);
    //console.log('activate campaign ',campaign)
      this.campaignDetailsService.updateCampaignStatus(campaignId, 'pending', this.user()?._id || '')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            //console.log(response)
            this.snackBar.open(response.message + '. Awaiting approval', 'Close', { duration: 3000 });
            this.refreshCampaigns();
            this.isLoading.set(false);
          }
        },
        error: (error) => {
          this.snackBar.open(error.error.message, 'Close', { duration: 3000 });
          this.isLoading.set(false);
        }
      })
  }

  resumeCampaign(campaignId: string): void {
    console.log('Resuming campaign:', campaignId);
  }

  deleteCampaign(campaignId: string): void {
    console.log('Deleting campaign:', campaignId);
  }

  // Utility methods
  formatCurrency(amount: number): string {
    if (!amount || isNaN(amount)) return '₦0';
    return `₦${amount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
  }

  // Helper method for pagination UI
  getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages() <= maxVisiblePages) {
      // Show all pages if total pages are less than max visible
      for (let i = 1; i <= this.totalPages(); i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate start and end of visible pages
      let start = Math.max(2, this.currentPage() - 1);
      let end = Math.min(this.totalPages() - 1, this.currentPage() + 1);
      
      // Adjust if we're at the beginning
      if (this.currentPage() <= 3) {
        end = 4;
      }
      
      // Adjust if we're at the end
      if (this.currentPage() >= this.totalPages() - 2) {
        start = this.totalPages() - 3;
      }
      
      // Add ellipsis after first page if needed
      if (start > 2) {
        pages.push('...');
      }
      
      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (end < this.totalPages() - 1) {
        pages.push('...');
      }
      
      // Always show last page
      pages.push(this.totalPages());
    }
    
    return pages;
  }
}
