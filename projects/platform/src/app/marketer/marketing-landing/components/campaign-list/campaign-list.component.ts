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
import { TruncatePipe } from '../../../../common/pipes/truncate.pipe';
import { CampaignCardMobileComponent } from '../campaign-card/mobile/campaign-card-mobile.component';

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

  @Output() viewDetails = new EventEmitter<string>();
  @Output() editCampaign = new EventEmitter<string>();
  @Output() pauseCampaign = new EventEmitter<string>();
  @Output() resumeCampaign = new EventEmitter<string>();
  @Output() deleteCampaign = new EventEmitter<string>();
  @Output() createCampaign = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();

  private deviceService = inject(DeviceService);
  deviceType = computed(() => this.deviceService.type());

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
}