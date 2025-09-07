import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { PromotionInterface } from '../../../../../../shared-services/src/public-api';
import { CategoryPlaceholderPipe } from '../../../common/pipes/category-placeholder.pipe';
import { PromoterService } from '../../promoter.service';

@Component({
  selector: 'app-promotion-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
    CategoryPlaceholderPipe,
  ],
  templateUrl: './promotion-card.component.html',
  styleUrls: ['./promotion-card.component.scss']
})
export class PromotionCardComponent {
  @Input({ required: true }) promotion!: PromotionInterface;
  @Output() openSubmitDialog = new EventEmitter<PromotionInterface>();

  private promoterService = inject(PromoterService);
  public readonly api = this.promoterService.api;

  onOpenSubmitProofDialog(): void {
    this.openSubmitDialog.emit(this.promotion);
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      pending: 'warning',
      submitted: 'info',
      validated: 'success',
      paid: 'primary',
      rejected: 'error'
    };
    return colors[status] || 'default';
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      pending: 'schedule',
      submitted: 'pending_actions',
      validated: 'check_circle',
      paid: 'paid',
      rejected: 'cancel'
    };
    return icons[status] || 'help';
  }

  getDaysRemaining(endDate: Date | string): number {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  // This is the updated method with the correct logic
  isSubmissionExpired(promotion: PromotionInterface): boolean {
    //console.log('promotion ',promotion)
    if (promotion.createdAt) {
      const createdAtDate = new Date(promotion.createdAt);
      // Add 24 hours to the createdAt timestamp
      const expirationDate = new Date(createdAtDate.getTime() + 24 * 60 * 60 * 1000);
      return new Date() > expirationDate;
    }
    return false;
  }
}