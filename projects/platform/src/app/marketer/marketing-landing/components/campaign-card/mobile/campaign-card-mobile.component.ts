// campaign-card-mobile.component.ts
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { TitleCasePipe } from '@angular/common';
import { ShortNumberPipe } from '../../../../../common/pipes/short-number.pipe';
import { CategoryPlaceholderPipe } from '../../../../../common/pipes/category-placeholder.pipe';
import { CampaignInterface, CurrencyUtilsPipe, PromotionInterface } from '../../../../../../../../shared-services/src/public-api';
import { TruncatePipe } from '../../../../../store/shared';
import { Router } from '@angular/router';

@Component({
  selector: 'app-campaign-card-mobile',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    ShortNumberPipe,
    CategoryPlaceholderPipe,
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
  @Output() resumeCampaign = new EventEmitter<string>();
  @Output() deleteCampaign = new EventEmitter<string>();

   isNumber(value: number | string | null): string {
    //console.log('the value is', value);
    if (typeof value === 'number') {
      if (value === 0) {
        return 'Expired'; // Consistent string format for zero
      }
      return `Expires in ${value} ${value === 1 ? 'day' : 'days'}`;
    } else {
      return value === null ? 'Invalid duration' : String(value); // Explicitly handle null
    }
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

  onResumeCampaign(): void {
    this.resumeCampaign.emit(this.campaign._id);
  }

  onDeleteCampaign(): void {
    this.deleteCampaign.emit(this.campaign._id);
  }

  getViewCount(promotions: PromotionInterface[]): number {
    let totalViews = 0;
    promotions?.forEach(promotion => {
      totalViews += promotion.proofViews || 0;
    });
    return totalViews;
  }


}