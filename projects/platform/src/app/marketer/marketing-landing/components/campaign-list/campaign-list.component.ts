import { Component, Input, Output, EventEmitter, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

// Components
import { ShortNumberPipe } from '../../../../common/pipes/short-number.pipe';
import { CategoryPlaceholderPipe } from '../../../../common/pipes/category-placeholder.pipe';
import { CampaignInterface, DeviceService, PromotionInterface } from '../../../../../../../shared-services/src/public-api';
import { CampaignCardComponent } from '../campaign-card/campaign-card.component';
import { CampaignSkeletonComponent } from '../campaign-skeleton/campaign-skeleton.component';
import { CampaignCardMobileComponent } from '../campaign-card/mobile/campaign-card-mobile.component';
import { TruncatePipe } from '../../../../store/shared';

@Component({
  selector: 'app-campaign-list',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    CampaignCardComponent,
    CampaignSkeletonComponent,
    ShortNumberPipe,
    CategoryPlaceholderPipe,
    TruncatePipe,
    CampaignCardMobileComponent
  ],
  templateUrl: './campaign-list.component.html',
  styleUrls: ['./campaign-list.component.scss']
})
export class CampaignListComponent {
  @Input() campaigns: CampaignInterface[] = [];
  @Input() isLoading = false;
  @Input() currentView: 'grid' | 'list' = 'grid';
  @Input() hasActiveFilters = false;
  @Input() searchTerm: string | null = '';
  @Input() apiBaseUrl = '';
  
  // Pagination inputs
  @Input() currentPage = 1;
  @Input() totalPages = 0;
  @Input() totalCampaigns = 0;
  @Input() hasNextPage = false;
  @Input() hasPrevPage = false;
  @Input() itemsPerPage = 10;

  @Output() viewDetails = new EventEmitter<string>();
  @Output() editCampaign = new EventEmitter<string>();
  @Output() pauseCampaign = new EventEmitter<string>();
  @Output() resumeCampaign = new EventEmitter<string>();
  @Output() deleteCampaign = new EventEmitter<string>();
  @Output() createCampaign = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();
  
  // Pagination outputs - FIXED: Use only number type
  @Output() pageChange = new EventEmitter<number>();
  @Output() nextPage = new EventEmitter<void>();
  @Output() prevPage = new EventEmitter<void>();
  @Output() itemsPerPageChange = new EventEmitter<number>();

  private deviceService = inject(DeviceService);
  deviceType = computed(() => this.deviceService.type());

  // Add this getter for the end index
  get endIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalCampaigns);
  }

  onViewDetails(campaignId: string): void {
    this.viewDetails.emit(campaignId);
  }

  onEditCampaign(campaignId: string): void {
    this.editCampaign.emit(campaignId);
  }

  onPauseCampaign(campaignId: string): void {
    this.pauseCampaign.emit(campaignId);
  }

  onResumeCampaign(campaignId: string): void {
    this.resumeCampaign.emit(campaignId);
  }

  onDeleteCampaign(campaignId: string): void {
    this.deleteCampaign.emit(campaignId);
  }

  onCreateCampaign(): void {
    this.createCampaign.emit();
  }

  onClearFilters(): void {
    this.clearFilters.emit();
  }

  // Pagination methods
  onNextPage(): void {
    this.nextPage.emit();
  }

  onPrevPage(): void {
    this.prevPage.emit();
  }

  onPageChange(page: number | string): void {
    // Only emit if it's a number (not ellipsis)
    if (typeof page === 'number') {
      this.pageChange.emit(page);
    }
  }

  onItemsPerPageChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const limit = parseInt(select.value, 10);
    this.itemsPerPageChange.emit(limit);
  }

  getViewCount(promotions: PromotionInterface[]): number {
    let totalViews = 0;
    promotions?.forEach(promotion => {
      totalViews += promotion.proofViews || 0;
    });
    return totalViews;
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

  trackByCampaignId(index: number, campaign: CampaignInterface): string {
    return campaign._id;
  }

  // Helper method for pagination UI
  getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      // Show all pages if total pages are less than max visible
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate start and end of visible pages
      let start = Math.max(2, this.currentPage - 1);
      let end = Math.min(this.totalPages - 1, this.currentPage + 1);
      
      // Adjust if we're at the beginning
      if (this.currentPage <= 3) {
        end = 4;
      }
      
      // Adjust if we're at the end
      if (this.currentPage >= this.totalPages - 2) {
        start = this.totalPages - 3;
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
      if (end < this.totalPages - 1) {
        pages.push('...');
      }
      
      // Always show last page
      pages.push(this.totalPages);
    }
    
    return pages;
  }
}