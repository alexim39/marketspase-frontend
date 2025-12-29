// campaign-card-mobile.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { TitleCasePipe } from '@angular/common';
import { ShortNumberPipe } from '../../../../../common/pipes/short-number.pipe';
import { CategoryPlaceholderPipe } from '../../../../../common/pipes/category-placeholder.pipe';
import { CampaignInterface, PromotionInterface } from '../../../../../../../../shared-services/src/public-api';
import { TruncatePipe } from '../../../../../store/shared';

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
    TruncatePipe
  ],
  templateUrl: './campaign-card-mobile.component.html',
  styleUrls: ['./campaign-card-mobile.component.scss']
})
export class CampaignCardMobileComponent {
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

  formatCurrency(amount: number): string {
    if (!amount || isNaN(amount)) return '₦0';
    return `₦${amount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
  }
}