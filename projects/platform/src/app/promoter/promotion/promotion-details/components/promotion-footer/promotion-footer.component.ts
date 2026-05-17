import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PromotionInterface } from '@shared/services';

@Component({
  selector: 'app-promotion-footer',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="footer-section">
      @if (promotion.status === 'rejected' && promotion.rejectionReason) {
        <div class="alert alert-info">
          <mat-icon>info</mat-icon>
          <span><strong>Rejection Reason:</strong> {{ promotion.rejectionReason }}</span>
        </div>
      } @else if (isLinkRestricted) {
        <div class="alert alert-warning">
          <mat-icon>shield</mat-icon>
          <span>Sharing is paused on this promotion while MarketSpase reviews suspicious traffic on it.</span>
        </div>
      } @else {
        <div class="alert alert-warning">
          <mat-icon>link</mat-icon>
          <span>Share only your generated MarketSpase link so clicks can be tracked and credited.</span>
        </div>
      }
      
      <div class="footer-actions">
        @if (promotion.status !== 'rejected' && !isLinkRestricted) {
          <button mat-flat-button class="btn btn-primary" (click)="copyLink.emit()">
            <mat-icon>link</mat-icon>
            Copy Link
          </button>
          <button mat-flat-button class="btn btn-outline" (click)="share.emit()">
            <mat-icon>ios_share</mat-icon>
            Share
          </button>
        }
        @if (promotion.status === 'rejected') {
          <button mat-flat-button class="btn btn-outline" (click)="contactSupport.emit()">
            <mat-icon>support_agent</mat-icon>
            Contact Support
          </button>
        }
      </div>
    </div>
  `,
  styleUrls: ['./promotion-footer.component.scss']
})
export class PromotionFooterComponent {
  @Input() promotion!: PromotionInterface;
  @Input() isSubmissionExpired!: boolean;
  @Input() isNearingExpiration!: boolean;
  @Input() isLinkRestricted = false;
  @Output() copyLink = new EventEmitter<void>();
  @Output() share = new EventEmitter<void>();
  @Output() contactSupport = new EventEmitter<void>();
}
