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
import { CampaignInterface, DeviceService, UserInterface } from '../../../../../shared-services/src/public-api';
import { MarketerService } from '../marketer.service';
import { HttpErrorResponse } from '@angular/common/http';
import { CampaignHeaderComponent } from './components/compaign-head/campaign-header.component';

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
  selector: 'marketer-landing',
  standalone: true,
  providers: [MarketerService],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    CampaignStatsComponent,
    CampaignFiltersComponent,
    CampaignListComponent,
    CampaignHeaderComponent
  ],
  templateUrl: './marketer-landing.component.html',
  styleUrls: ['./marketer-landing.component.scss']
})
export class MarketerLandingComponent implements OnInit {
  private router = inject(Router);
  private deviceService = inject(DeviceService);
  private destroyRef = inject(DestroyRef);
  private marketerService = inject(MarketerService);
  
  public apiBaseUrl = this.marketerService.api;

  @Input({ required: true }) user!: Signal<UserInterface | null>;
  
  // Signals
  campaigns = signal<CampaignInterface[]>([]);
  filteredCampaigns = signal<CampaignInterface[]>([]);
  isLoading = signal(false);
  currentView = signal<'grid' | 'list'>('grid');
  
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
  deviceType = computed(() => this.deviceService.type());
  campaignStats = computed(() => this.calculateStats());
  
  campaignCounts = computed(() => {
    const counts: Record<string, number> = { all: this.campaigns().length };
    this.statusOptions.forEach(option => {
      if (option.value !== 'all') {
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
        this.applyFilters();
      });
  }

  private loadCampaigns(): void {
    if (this.user() && this.user()?._id) {
      this.isLoading.set(true);
      this.marketerService.getMarketerCampaign(this.user()!._id!)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            this.campaigns.set(response.data);
            this.filteredCampaigns.set(response.data);
            this.isLoading.set(false);
          },
          error: (error: HttpErrorResponse) => {
            this.isLoading.set(false);
            console.error('Failed to load campaigns:', error);
          }
        });
    }
  }

  private calculateStats() {
    const campaigns = this.campaigns();
    const activeCampaigns = campaigns.filter(c => c.status === 'active');

    return {
      totalCampaigns: campaigns.length,
      activeCampaigns: activeCampaigns.length,
      totalSpent: campaigns.reduce((sum, c) => sum + ((c.payoutPerPromotion * c.currentPromoters) || 0), 0),
      totalViews: 56, // Mock value
      avgCTR: 3.2, // Mock value
      totalPromoters: campaigns.reduce((sum, c) => sum + (c.totalPromotions || 0), 0)
    };
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

    // Apply other filters...
    this.filteredCampaigns.set(filtered);
  }

  // Public methods
  updateFilters(updates: Partial<FilterOptions>): void {
    this.currentFilters.set({ ...this.currentFilters(), ...updates });
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
    this.router.navigate(['/dashboard/campaigns', campaignId, 'edit']);
  }

  // Campaign actions
  pauseCampaign(campaignId: string): void {
    console.log('Pausing campaign:', campaignId);
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
}