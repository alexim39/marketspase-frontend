// campaign-card-mobile.component.ts
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { TitleCasePipe } from '@angular/common';
import { ShortNumberPipe } from '../../../../../common/pipes/short-number.pipe';
import { CampaignInterface, CurrencyUtilsPipe, TruncatePipe } from '@shared/services';
import { Router } from '@angular/router';
import {
  getCampaignBillableClicks,
  getCampaignBudgetProgress,
  getCampaignLifecycleClass,
  getCampaignLifecycleLabel,
  getCampaignRemainingBudget,
  getCampaignSlotLabel,
  getCampaignSlotValue,
  getCampaignTimingLabel,
  getCampaignTotalClicks,
} from '../../../../../common/utils/campaign-performance.util';

@Component({
  selector: 'app-campaign-card-mobile',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    ShortNumberPipe,
    TitleCasePipe,
    TruncatePipe,
    CurrencyUtilsPipe
  ],
  templateUrl: './campaign-card-mobile.component.html',
  styleUrls: ['./campaign-card-mobile.component.scss']
})
export class CampaignCardMobileComponent {
  private router = inject(Router);
  @Input({ required: true }) campaign!: CampaignInterface;
  @Input() apiBaseUrl = '';
  @Input() view: 'grid' | 'list' = 'grid';

  @Output() viewDetails = new EventEmitter<string>();
  @Output() editCampaign = new EventEmitter<string>();
  @Output() pauseCampaign = new EventEmitter<string>();
  @Output() activateCampaign = new EventEmitter<string>();
  @Output() resumeCampaign = new EventEmitter<string>();
  @Output() deleteCampaign = new EventEmitter<string>();

  getStatusClass(): string {
    return getCampaignLifecycleClass(this.campaign);
  }

  getStatusLabel(): string {
    return getCampaignLifecycleLabel(this.campaign);
  }

  getTimingLabel(): string {
    return getCampaignTimingLabel(this.campaign);
  }

  onViewDetails(): void {
    this.viewDetails.emit(this.campaign._id);
  }

  onEditCampaign(): void {
    this.editCampaign.emit(this.campaign._id);
  }

  targetAudienceByLocation() {
    const campaign = this.campaign;
    if (campaign) {
      this.router.navigate([`/dashboard/campaigns/${campaign._id}/targeting`]);
    }
  }

  onPauseCampaign(): void {
    this.pauseCampaign.emit(this.campaign._id);
  }

  onActivateCampaign(): void {
    this.activateCampaign.emit(this.campaign._id);
  }

  onResumeCampaign(): void {
    this.resumeCampaign.emit(this.campaign._id);
  }

  onDeleteCampaign(): void {
    this.deleteCampaign.emit(this.campaign._id);
  }

  getClickCount(): number {
    return getCampaignTotalClicks(this.campaign);
  }

  getBillableClicks(): number {
    return getCampaignBillableClicks(this.campaign);
  }

  getBudgetProgress(): number {
    return getCampaignBudgetProgress(this.campaign);
  }

  getRemainingBudget(): number {
    return getCampaignRemainingBudget(this.campaign);
  }

  getPromoterAccessValue(): string {
    return getCampaignSlotValue(this.campaign);
  }

  getPromoterAccessLabel(): string {
    return getCampaignSlotLabel(this.campaign);
  }

}
