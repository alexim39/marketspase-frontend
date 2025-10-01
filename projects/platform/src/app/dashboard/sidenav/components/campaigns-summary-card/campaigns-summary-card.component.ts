import { Component, Input, Signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { UserInterface } from '../../../../../../../shared-services/src/public-api';
import { CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-campaigns-summary-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    CurrencyPipe,
    RouterModule
  ],
  template: `
    @if(user()?.campaigns && user()?.campaigns!.length > 0) {
      <div class="campaigns-summary-card">
        <div class="summary-header">
          <div class="summary-title-section">
            <mat-icon class="summary-icon">campaign</mat-icon>
            <h3 class="summary-title">Overview</h3>
          </div>
          <button mat-flat-button color="primary" class="view-all-btn" (click)="viewAllCampaigns.emit()">
            View All
          </button>
        </div>

        <mat-divider class="summary-divider"/>

        <div class="summary-metrics-grid">
          <div class="metric-summary active-campaigns">
            <div class="metric-icon-wrapper">
              <mat-icon class="metric-icon">playlist_play</mat-icon>
            </div>
            <div class="metric-info">
              <span class="metric-value">{{ getActiveCampaignCount() }}</span>
              <span class="metric-label">Active Campaigns</span>
            </div>
          </div>

          <div class="metric-summary total-promotions">
            <div class="metric-icon-wrapper">
              <mat-icon class="metric-icon">campaign</mat-icon>
            </div>
            <div class="metric-info">
              <span class="metric-value">{{ getTotalCampaigns() }}</span>
              <span class="metric-label">Total Campaigns</span>
            </div>
          </div>

          <div class="metric-summary total-spending">
            <div class="metric-icon-wrapper">
              <mat-icon class="metric-icon">trending_up</mat-icon>
            </div>
            <div class="metric-info">
              <span class="metric-value">{{ getTotalSpent() | currency: '₦':'symbol':'1.0-0' }}</span>
              <span class="metric-label">Total Spent</span>
            </div>
          </div>

          <div class="metric-summary budget-remaining">
            <div class="metric-icon-wrapper">
              <mat-icon class="metric-icon">account_balance_wallet</mat-icon>
            </div>
            <div class="metric-info">
              <span class="metric-value">{{ getTotalRemainingBudget() | currency: '₦':'symbol':'1.0-0' }}</span>
              <span class="metric-label">Remaining Budget</span>
            </div>
          </div>
        </div>
      </div>
    } @else {
      <div class="empty-cart-message">
        <div class="empty-cart-icon">
          <mat-icon>campaign</mat-icon>
        </div>
        <h4>No active campaigns</h4>
        <p>You have no active campaign yet</p>
        <a
          mat-flat-button
          color="primary"
          class="shop-btn"
          routerLink="/dashboard/campaigns"
          (click)="startCampaign.emit()">
          Start a Campaign
        </a>
      </div>
    }
  `,
  styleUrls: ['./campaigns-summary-card.component.scss']
})
export class CampaignsSummaryCardComponent {
  @Input({ required: true }) user!: Signal<UserInterface | null>;
  @Output() viewAllCampaigns = new EventEmitter<void>();
  @Output() startCampaign = new EventEmitter<void>();

  getActiveCampaignCount(): number {
    return this.user()?.campaigns?.filter(c => c.status === 'active')?.length || 0;
  }

  getTotalCampaigns(): number {
    return this.user()?.campaigns?.length || 0;
  }

  getTotalSpent(): number {
    return 4500;
  }

  getTotalRemainingBudget(): number {
    return 3000;
  }
}