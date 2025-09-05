import { Component, OnInit, inject, signal, computed, Input, Signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
import { CampaignService } from '../campaign.service';
import { CampaignStats, formatRemainingDays, isDatePast } from '../../common/utils/time.util';
import { HttpErrorResponse } from '@angular/common/http';
import { ShortNumberPipe } from '../../common/pipes/short-number.pipe';
import { CategoryPlaceholderPipe } from '../../common/pipes/category-placeholder.pipe';
import { CampaignInterface, DeviceService, PromotionInterface, UserInterface } from '../../../../../shared-services/src/public-api';

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

@Component({
  selector: 'advertiser-campaign-landing',
  standalone: true,
  providers: [CampaignService],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatMenuModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatInputModule,
    MatFormFieldModule,
    ShortNumberPipe,
    CategoryPlaceholderPipe
  ],
  templateUrl: './advertiser-landing.component.html',
  styleUrls: ['./advertiser-landing.component.scss']
})
export class AdvertiserCampaignLandingComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private deviceService = inject(DeviceService);

  // Required input that expects a signal of type UserInterface or undefined
  @Input({ required: true }) user!: Signal<UserInterface | null>;
  private destroy$ = new Subject<void>();
  private campaignService = inject(CampaignService);
  campaignStats = computed(() => this.calculateStats());
  public readonly api = this.campaignService.api;
  
  // Form controls
  searchControl = new FormControl('');

  // Signals for reactive state management
  campaigns = signal<CampaignInterface[]>([]);
  filteredCampaigns = signal<CampaignInterface[]>([]);
  selectedCampaigns = signal<string[]>([]);
  currentFilters = signal<FilterOptions>({
    status: 'all',
    category: '',
    campaignType: '',
    dateRange: { start: null, end: null },
    budgetRange: { min: 0, max: 1000000 },
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  
  currentView = signal<'grid' | 'list'>('grid');
  isLoading = signal(false);

  // Computed properties
  deviceType = computed(() => this.deviceService.type());
  
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
    { value: 'pending', label: 'Pending', icon: 'hourglass_empty' }
  ];

  ngOnInit(): void {
    this.loadCampaigns();
    this.setupSearch();
  }

  
 ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  private setupSearch(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.applyFilters();
      });
  }

  private loadCampaigns(): void {
    this.isLoading.set(true);
    
    //Simulate API call with mock data
    // setTimeout(() => {
    //   const mockCampaigns: any[] = [
    //     {
    //       _id: '1',
    //       title: 'Summer Fashion Sale 2024',
    //       description: 'Promote our latest summer collection with exclusive 30% discounts for WhatsApp Status viewers',
    //       status: 'active',
    //       budget: 50000,
    //       spent: 32000,
    //       payoutPerPromotion: 200,
    //       maxPromoters: 250,
    //       currentPromoters: 160,
    //       views: 8500,
    //       estimatedReach: 12500,
    //       startDate: new Date('2024-08-15'),
    //       endDate: new Date('2024-08-30'),
    //       createdAt: new Date('2024-08-14'),
    //       mediaUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
    //       category: 'fashion',
    //       progress: 64,
    //       remainingDays: 6,
    //       campaignType: 'premium',
    //       targetAudience: 'Women 18-35',
    //       minViews: 25,
    //       isApproved: true,
    //       priority: 'high'
    //     },
    //     {
    //       id: '2',
    //       title: 'Tech Product Launch - Smartphone X1',
    //       description: 'Introduce our revolutionary new smartphone with AI-powered features to tech enthusiasts',
    //       status: 'active',
    //       budget: 100000,
    //       spent: 45000,
    //       payoutPerPromotion: 200,
    //       maxPromoters: 500,
    //       currentPromoters: 225,
    //       views: 15200,
    //       estimatedReach: 25000,
    //       startDate: new Date('2024-08-10'),
    //       endDate: new Date('2024-09-10'),
    //       createdAt: new Date('2024-08-09'),
    //       mediaUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop',
    //       category: 'tech',
    //       progress: 45,
    //       remainingDays: 12,
    //       campaignType: 'standard',
    //       targetAudience: 'Tech enthusiasts 25-45',
    //       minViews: 25,
    //       isApproved: true,
    //       priority: 'medium'
    //     }
    //   ];

    //   this.campaigns.set(mockCampaigns);
    //   this.filteredCampaigns.set(mockCampaigns);
    //   this.isLoading.set(false);
    // }, 1000);

     if (this.user() && this.user()?._id) {
      this.isLoading.set(true);
        this.campaignService.getAdvertiserCampaign(this.user()!._id!)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            //console.log('Campaigns without metrics:', response.data);
            const campaignsWithMetrics = this.calculateCampaignMetrics(response.data);
            console.log('Campaigns with metrics:', campaignsWithMetrics);
            this.campaigns.set(campaignsWithMetrics);
            this.isLoading.set(false);
            
            // --- FIX 1: Trigger the filtering after data is successfully loaded ---
            this.filteredCampaigns.set(campaignsWithMetrics);
          },
          error: (error: HttpErrorResponse) => {
            // const errorMessage = error.error?.message || 'Failed to load campaign. Please try again.';
            // this.snackBar.open(errorMessage, 'Close', {
            //   duration: 3000,
            // });
            this.isLoading.set(false);
          }
        })
    }
  }

  private calculateStats(): CampaignStats {
    const campaigns = this.campaigns();
    const activeCampaigns = campaigns.filter(c => c.status === 'active');

    return {
      totalCampaigns: campaigns.length,
      activeCampaigns: activeCampaigns.length,
      totalSpent: campaigns.reduce((sum, c) => sum + (c.spentBudget || 0), 0),
      totalViews: campaigns.reduce((sum, c) => sum + (c.views || 0), 0),
      avgCTR: 3.2, // Mock value
      totalPromoters: campaigns.reduce((sum, c) => sum + (c.totalPromotions || 0), 0)
    };
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

  private applyFilters(): void {
    let filtered = [...this.campaigns()];
    const filters = this.currentFilters();
    const searchTerm = this.searchControl.value?.toLowerCase() || '';

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(campaign =>
        campaign.title.toLowerCase().includes(searchTerm) ||
        campaign.caption.toLowerCase().includes(searchTerm) ||
        campaign._id.toLowerCase().includes(searchTerm) ||
        campaign.category.toLowerCase().includes(searchTerm)
      );
    }

    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(campaign => campaign.status === filters.status);
    }

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(campaign => campaign.category === filters.category);
    }

    // Apply campaign type filter
    if (filters.campaignType) {
      filtered = filtered.filter(campaign => campaign.campaignType === filters.campaignType);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[filters.sortBy as keyof CampaignInterface];
      let bValue = b[filters.sortBy as keyof CampaignInterface];

      if (aValue instanceof Date && bValue instanceof Date) {
        aValue = aValue.getTime();
        bValue = bValue.getTime();
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;
      //if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
      //if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredCampaigns.set(filtered);
  }

  // Filter management methods
  updateFilter(key: string, value: any): void {
    const currentFilters = { ...this.currentFilters() };
    (currentFilters as any)[key] = value;
    this.currentFilters.set(currentFilters);
    this.applyFilters();
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
    this.applyFilters();
  }

  // View management
  setView(view: 'grid' | 'list'): void {
    this.currentView.set(view);
  }

  // Selection management
  toggleSelection(campaignId: string, event: any): void {
    const selected = [...this.selectedCampaigns()];
    if (event.target.checked) {
      selected.push(campaignId);
    } else {
      const index = selected.indexOf(campaignId);
      if (index > -1) {
        selected.splice(index, 1);
      }
    }
    this.selectedCampaigns.set(selected);
  }

  isSelected(campaignId: string): boolean {
    return this.selectedCampaigns().includes(campaignId);
  }

  // Navigation methods
  createCampaign(): void {
    this.router.navigate(['/dashboard/campaigns/create']);
  }

  viewCampaignDetails(campaignId: string): void {
    this.router.navigate(['/dashboard/campaigns', campaignId]);
  }

  editCampaign(campaignId: string): void {
    this.router.navigate(['/dashboard/campaigns', campaignId, 'edit']);
  }

  // Campaign actions
  pauseCampaign(campaignId: string): void {
    console.log('Pausing campaign:', campaignId);
    // Implement pause logic
  }

  resumeCampaign(campaignId: string): void {
    console.log('Resuming campaign:', campaignId);
    // Implement resume logic
  }

  deleteCampaign(campaignId: string): void {
    console.log('Deleting campaign:', campaignId);
    // Implement delete logic
  }

  duplicateCampaign(campaignId: string): void {
    console.log('Duplicating campaign:', campaignId);
    // Implement duplication logic
  }

  exportCampaigns(): void {
    console.log('Exporting campaigns');
    // Implement export logic
  }

  // Utility methods
  getCampaignCountByStatus(status: string): number {
    if (status === 'all') return this.campaigns().length;
    return this.campaigns().filter(c => c.status === status).length;
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'active': 'play_circle',
      'paused': 'pause_circle',
      'rejected': 'block',
      'draft': 'edit',
      'completed': 'check_circle',
      'expired': 'schedule',
      'pending': 'hourglass_empty'
    };
    return icons[status] || 'help';
  }

  getStatusLabel(status: string): string {
    return this.statusOptions.find(option => option.value === status)?.label || status;
  }

  getProgressColor(progress: number): string {
    if (progress >= 80) return 'success';
    if (progress >= 50) return 'warning';
    return 'danger';
  }

  formatCurrency(amount: number): string {
    if (!amount || isNaN(amount)) return '₦0';
    return `₦${amount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
  }

  getViewCount(promotion: PromotionInterface[]): number {
    let totalViews = 0;
    promotion.forEach(promotion => {
      totalViews += promotion.proofViews || 0;
    });
    return totalViews;
  }
}