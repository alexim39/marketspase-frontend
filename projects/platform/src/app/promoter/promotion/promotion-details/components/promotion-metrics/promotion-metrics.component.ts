import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { PromotionInterface } from '../../../../../../../../shared-services/src/public-api';

@Component({
  selector: 'app-promotion-metrics',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="metrics-section">
      <h3 class="section-title">Performance Metrics</h3>
      
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon">
            <mat-icon>visibility</mat-icon>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{promotion.proofViews || 0}}/{{promotion.campaign.minViewsPerPromotion}}</div>
            <div class="metric-label">Current Views</div>
            <div class="metric-progress">
              <div class="progress-bar">
                <div class="progress-fill" [class]="'progress-' + getProgressColor(progressPercentage)" 
                     [style.width]="progressPercentage + '%'"></div>
              </div>
              <span class="progress-percentage">{{progressPercentage | number:'1.0-0'}}%</span>
            </div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">
            <mat-icon>trending_up</mat-icon>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ (promotion.campaign.minViewsPerPromotion || 0) - (promotion.proofViews || 0) }}</div>
            <div class="metric-label">Views Needed</div>
            <div class="metric-subtext">to qualify for payment</div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">
            <mat-icon>payments</mat-icon>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{formatCurrency(promotion.payoutAmount)}}</div>
            <div class="metric-label">Potential Earnings</div>
            <div class="metric-subtext">Upon validation</div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">
            <mat-icon>badge</mat-icon>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{promotion.campaign.difficulty | titlecase}}</div>
            <div class="metric-label">Difficulty Level</div>
            <div class="metric-subtext">Campaign complexity</div>
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

  getProgressColor(percentage: number): string {
    if (percentage < 50) return 'success';
    if (percentage < 80) return 'warning';
    return 'danger';
  }

  formatCurrency(amount: number | undefined): string {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  }
}