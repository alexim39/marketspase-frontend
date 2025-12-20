import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PromotionInterface } from '../../../../../../../../shared-services/src/public-api';

@Component({
  selector: 'app-promotion-footer',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="footer-section">
      @if (isSubmissionExpired) {
        <div class="alert alert-error">
          <mat-icon>warning</mat-icon>
          <span>This promotion has expired</span>
        </div>
      } @else if (isNearingExpiration) {
        <div class="alert alert-warning">
          <mat-icon>schedule</mat-icon>
          <span>Your status expires soon! Make sure it stays active to reach the required views!</span>
        </div>
      }
      
      <div class="footer-actions">
        @if (promotion.status === 'pending' && !isSubmissionExpired) {
          @if (promotion.isDownloaded) {
            <!-- <button mat-flat-button class="btn btn-primary" [disabled]="!isNearingExpiration">
              <mat-icon>cloud_upload</mat-icon>
              Submit Proof
            </button>
            @if (!isNearingExpiration) {
              <p class="footer-note">Submission will be enabled 30 minutes before expiration.</p>
            } -->
          } @else {
            <!-- <button mat-flat-button class="btn btn-primary" (click)="download.emit()">
              <mat-icon>download_for_offline</mat-icon>
              Download Promotion
            </button> -->
          }            
        }
        @if (promotion.status === 'submitted' || promotion.status === 'validated') {
          <button mat-flat-button class="btn btn-outline" (click)="contactSupport.emit()">
            <mat-icon>support_agent</mat-icon>
            Contact Support
          </button>
        }
        @if (promotion.status === 'rejected' && promotion.rejectionReason) {
          <div class="alert alert-info">
            <mat-icon>info</mat-icon>
            <span><strong>Rejection Reason:</strong> {{ promotion.rejectionReason }}</span>
          </div>
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
  @Output() download = new EventEmitter<void>();
  @Output() contactSupport = new EventEmitter<void>();
}