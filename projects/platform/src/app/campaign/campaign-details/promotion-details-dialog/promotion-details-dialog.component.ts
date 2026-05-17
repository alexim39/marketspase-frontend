import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { PromotionInterface } from '@shared/services';
import { MaskEmailPipe } from './mask-email.pipe';

@Component({
  selector: 'app-promotion-details-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, DatePipe, MaskEmailPipe],
  template: `
  <div class="promotion-details-dialog">
    <h2 mat-dialog-title>Promotion Details</h2>
    <mat-dialog-content>
      <div class="dialog-section">
        <div class="promoter-info-large">
          <div class="avatar-large">{{getInitials(data.promotion.promoter.displayName)}}</div>
          <div class="promoter-details-large">
            <span class="promoter-name">{{data.promotion.promoter.displayName || 'Unknown'}}</span>
            @if (data.promotion.promoter.email) {
              <span class="promoter-contact" >
                <mat-icon>email</mat-icon>
                {{data.promotion.promoter.email | maskEmail}}
              </span>
            }
            @if (data.promotion.promoter.rating) { 
              <span class="promoter-rating">
                <mat-icon>star</mat-icon>
                Reputation: {{data.promotion.promoter.rating | number:'1.1-1'}}
              </span>
            }
            
          </div>
        </div>
      </div>
      
      <div class="dialog-section">
        <h3>Promotion Status</h3>
        <div class="status-timeline">
          <div class="status-step" [class.active]="true">
            <div class="step-icon">
              <mat-icon>assignment</mat-icon>
            </div>
            <div class="step-content">
              <span class="step-title">Accepted</span>
              <br>
              <span class="step-time">{{(data.promotion.acceptedAt || data.promotion.createdAt) | date:'medium'}}</span>
            </div>
          </div>
          
          <div class="status-step" [class.active]="true">
            <div class="step-icon">
              <mat-icon>link</mat-icon>
            </div>
            <div class="step-content">
              <span class="step-title">Link Active</span>
              <br>
               @if (data.promotion.acceptedAt || data.promotion.createdAt) { 
                 <span class="step-time">
                  {{(data.promotion.acceptedAt || data.promotion.createdAt) | date:'medium'}}
                </span>
               }
             
            </div>
          </div>
          
          <div class="status-step" [class.active]="!!data.promotion.clickStats?.lastClickAt">
            <div class="step-icon">
              <mat-icon>ads_click</mat-icon>
            </div>
            <div class="step-content">
              <span class="step-title">Last Click</span>
              <br>
               @if (data.promotion.clickStats?.lastClickAt) { 
                <span class="step-time">
                  {{data.promotion.clickStats?.lastClickAt | date:'medium'}}
                </span>
               }
              
            </div>
          </div>
          
          <div class="status-step" [class.active]="true">
            <div class="step-icon">
              <mat-icon>{{ getCurrentStateIcon() }}</mat-icon>
            </div>
            <div class="step-content">
              <span class="step-title">{{ getCurrentStateLabel() }}</span>
              <br>
               @if (getCurrentStateTimestamp()) {
                <span class="step-time" >
                  {{getCurrentStateTimestamp() | date:'medium'}}
                </span>
              }
            </div>
          </div>
        </div>
      </div>

      <div class="dialog-section">
        <h3>Tracking Performance</h3>
        <div class="metrics-grid">
          <div class="metric-tile">
            <span class="metric-label">Tracked Clicks</span>
            <strong>{{getTrackedClicks() | number:'1.0-0'}}</strong>
          </div>
          <div class="metric-tile">
            <span class="metric-label">Billable Clicks</span>
            <strong>{{getBillableClicks() | number:'1.0-0'}}</strong>
          </div>
          <div class="metric-tile">
            <span class="metric-label">Invalid Clicks</span>
            <strong>{{getInvalidClicks() | number:'1.0-0'}}</strong>
          </div>
          <div class="metric-tile">
            <span class="metric-label">Spend / Earnings</span>
            <strong>{{formatCurrency(getTrackedSpend())}}</strong>
          </div>
        </div>

        <div class="meta-list">
          <div class="meta-row">
            <span class="meta-label">UPI</span>
            <span class="meta-value">{{data.promotion.upi || 'N/A'}}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Tracking Link</span>
            <span class="meta-value meta-link">{{data.promotion.promotionUrl || 'Not generated'}}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Cost per Click</span>
            <span class="meta-value">{{formatCurrency(data.promotion.costPerClick || 0)}}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Last Click</span>
            <span class="meta-value">{{data.promotion.clickStats?.lastClickAt ? (data.promotion.clickStats?.lastClickAt | date:'medium') : 'No click activity yet'}}</span>
          </div>
        </div>
      </div>

       @if (data.promotion.rejectionReason) { 
        <div class="dialog-section">
          <h3>Rejection Reason</h3>
          <p class="rejection-reason">{{data.promotion.rejectionReason}}</p>
        </div>
       }
      
      
       @if (data.promotion.notes) {
        <div class="dialog-section">
          <h3>Notes</h3>
          <p class="promotion-notes">{{data.promotion.notes}}</p>
        </div>
       }
      
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  </div>
  `,
  styleUrls: ['./promotion-details-dialog.component.scss']
})
export class PromotionDetailsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<PromotionDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { promotion: PromotionInterface; campaignCurrency?: string }
  ) {}
  
  getInitials(name: string | undefined): string {
    //console.log('promotion ', this.data.promotion)
    if (!name) return '?';
    return name.split(' ').map(part => part[0]).join('').toUpperCase().substring(0, 2);
  }

  getTrackedClicks(): number {
    return Number(this.data.promotion.clickStats?.totalClicks ?? 0);
  }

  getBillableClicks(): number {
    return Number(this.data.promotion.clickStats?.billableClicks ?? 0);
  }

  getInvalidClicks(): number {
    const invalidClicks = Number(this.data.promotion.clickStats?.invalidClicks ?? 0);
    const duplicateClicks = Number(this.data.promotion.clickStats?.duplicateClicks ?? 0);
    return invalidClicks + duplicateClicks;
  }

  getTrackedSpend(): number {
    const earnedAmount = Number(this.data.promotion.clickStats?.earnedAmount ?? 0);
    if (earnedAmount > 0) {
      return earnedAmount;
    }

    return Number(this.data.promotion.payoutAmount ?? 0);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.data.campaignCurrency || 'NGN',
    }).format(Number.isFinite(amount) ? amount : 0);
  }

  getCurrentStateLabel(): string {
    if (this.data.promotion.fraudStatus?.isFlagged) {
      return 'Under Review';
    }

    if (this.data.promotion.status === 'rejected') {
      return 'Rejected';
    }

    if (this.data.promotion.isActive === false) {
      return 'Inactive';
    }

    if (this.data.promotion.status === 'paid') {
      return 'Legacy Paid';
    }

    return 'Running';
  }

  getCurrentStateIcon(): string {
    if (this.data.promotion.fraudStatus?.isFlagged) {
      return 'gpp_maybe';
    }

    if (this.data.promotion.status === 'rejected') {
      return 'warning';
    }

    if (this.data.promotion.isActive === false) {
      return 'pause_circle';
    }

    if (this.data.promotion.status === 'paid') {
      return 'paid';
    }

    return 'check_circle';
  }

  getCurrentStateTimestamp(): Date | string | undefined {
    return this.data.promotion.rejectedAt
      || this.data.promotion.paidAt
      || this.data.promotion.updatedAt
      || this.data.promotion.acceptedAt
      || this.data.promotion.createdAt;
  }
}
