import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { PromotionInterface } from '@shared/services';

@Component({
  selector: 'app-promotion-metrics',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="metrics-section">
      <h3 class="section-title">Click Performance</h3>
      
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon">
            <mat-icon>touch_app</mat-icon>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{getTotalClicks()}}</div>
            <div class="metric-label">Total Clicks</div>
            <div class="metric-progress">
              <div class="progress-bar">
                <div class="progress-fill" [class]="'progress-' + getProgressColor(progressPercentage)" 
                     [style.width]="progressPercentage + '%'"></div>
              </div>
              <span class="progress-percentage">{{progressPercentage | number:'1.0-0'}}% billable</span>
            </div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">
            <mat-icon>check_circle</mat-icon>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{getBillableClicks()}}</div>
            <div class="metric-label">Billable Clicks</div>
            <div class="metric-subtext">Valid tracked clicks</div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">
            <mat-icon>payments</mat-icon>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{formatCurrency(getEarnedAmount())}}</div>
            <div class="metric-label">Earned</div>
            <div class="metric-subtext">Reserved for payout</div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">
            <mat-icon>paid</mat-icon>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{formatCurrency(getCostPerClick())}}</div>
            <div class="metric-label">Per Click</div>
            <div class="metric-subtext">Campaign click value</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./promotion-metrics.component.scss']
})
export class PromotionMetricsComponent {
  @Input() promotion!: PromotionInterface;
  @Input() progressPercentage!: number;

  getTotalClicks(): number {
    return this.promotion.clickStats?.totalClicks || 0;
  }

  getBillableClicks(): number {
    return this.promotion.clickStats?.billableClicks || 0;
  }

  getEarnedAmount(): number {
    return this.promotion.clickStats?.earnedAmount ?? this.promotion.payoutAmount ?? 0;
  }

  getCostPerClick(): number {
    return this.promotion.costPerClick || this.promotion.campaign.costPerClick || 80;
  }

  getProgressColor(percentage: number): string {
    if (percentage < 50) return 'warning';
    if (percentage < 80) return 'success';
    return 'success';
  }

  formatCurrency(amount: number | undefined): string {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0
    }).format(amount);
  }
}
