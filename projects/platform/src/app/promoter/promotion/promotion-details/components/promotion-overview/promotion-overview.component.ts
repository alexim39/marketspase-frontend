import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PromotionInterface } from '../../../../../../../../shared-services/src/public-api';
import { PromotionMediaComponent } from '../promotion-media/promotion-media.component';
import { PromotionInfoComponent } from '../promotion-info/promotion-info.component';

@Component({
  selector: 'app-promotion-overview',
  standalone: true,
  imports: [
    CommonModule,
    MatChipsModule,
    MatIconModule,
    MatTooltipModule,
    PromotionMediaComponent,
    PromotionInfoComponent
  ],
  template: `
    <div class="overview-card">
      <div class="overview-header">
        <div class="promotion-status">
          <span class="status-badge" [class]="'status-' + promotion.status">
            <mat-icon>{{ getStatusIcon(promotion.status) }}</mat-icon>
            {{promotion.status | titlecase}}
          </span>
          <span class="promotion-id">Promotion ID: {{promotion.upi || 'N/A'}}</span>
        </div>
        <div class="promotion-meta">
          <span class="created-date">
            <mat-icon>event</mat-icon>
            Created: {{promotion.createdAt | date:'mediumDate'}}
          </span>
          <!-- <div class="header-actions">
            <button mat-fab class="icon-btn" (click)="download.emit()" matTooltip="Download promotion">
              <mat-icon>download_for_offline</mat-icon>
            </button>
            <button mat-fab class="icon-btn" (click)="share.emit()" matTooltip="Share to WhatsApp">
              <mat-icon>share</mat-icon>
            </button>
          </div> -->
        </div>
      </div>

      <div class="overview-content">
        <app-promotion-media 
          [promotion]="promotion" 
          [apiUrl]="apiUrl"
          (share)="share.emit()"
          (download)="download.emit()"
        />
        
        <app-promotion-info 
          [promotion]="promotion" 
          [countdown]="countdown"
          [isNearingExpiration]="isNearingExpiration"
        />
      </div>
    </div>
  `,
  styleUrls: ['./promotion-overview.component.scss']
})
export class PromotionOverviewComponent {
  @Input() promotion!: PromotionInterface;
  @Input() countdown!: string;
  @Input() isNearingExpiration!: boolean;
  @Input() apiUrl!: string;
  @Output() share = new EventEmitter<void>();
  @Output() download = new EventEmitter<void>();

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
}