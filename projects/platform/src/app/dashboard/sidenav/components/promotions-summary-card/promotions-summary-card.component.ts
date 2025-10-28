import { Component, Input, Signal, Output, EventEmitter } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { UserInterface } from '../../../../../../../shared-services/src/public-api';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-promotions-summary-card',
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
    @if(user()?.promotion && user()!.promotion!.length > 0) {
      <div class="campaigns-summary-card">
        <div class="summary-header">
          <div class="summary-title-section">
            <mat-icon class="summary-icon">campaign</mat-icon>
            <h3 class="summary-title">Overview</h3>
          </div>
          <button mat-flat-button color="primary" class="view-all-btn" (click)="viewAllPromotions.emit()">
            View All
          </button>
        </div>
        <div class="summary-header">
          <button class="withdrawal" [disabled]="true" mat-stroked-button color="primary" (click)="viewWithdrawal.emit()">
            Withdraw Fund
          </button>
        </div>

        <mat-divider class="summary-divider"/>

        <div class="summary-metrics-grid">
          <div class="metric-summary active-campaigns">
            <div class="metric-icon-wrapper">
              <mat-icon class="metric-icon">playlist_play</mat-icon>
            </div>
            <div class="metric-info">
              <span class="metric-value">{{ user()!.promotion!.length }}</span>
              <span class="metric-label">All Promotions</span>
            </div>
          </div>

          <div class="metric-summary total-promotions">
            <div class="metric-icon-wrapper">
              <mat-icon class="metric-icon">trending_up</mat-icon>
            </div>
            <div class="metric-info">
              <span class="metric-value">{{ getValidatedPromotionCount() }}</span>
              <span class="metric-label">Validated Promotions</span>
            </div>
          </div>

          <div class="metric-summary total-spending">
            <div class="metric-icon-wrapper">
              <mat-icon class="metric-icon">trending_down</mat-icon>
            </div>
            <div class="metric-info">
              <span class="metric-value">{{ getRejectedPromotionCount() }}</span>
              <span class="metric-label">Rejected Promotion</span>
            </div>
          </div>

          <div class="metric-summary budget-remaining">
            <div class="metric-icon-wrapper">
              <mat-icon class="metric-icon">account_balance_wallet</mat-icon>
            </div>
            <div class="metric-info">
              <span class="metric-value">{{ user()?.wallets?.promoter?.reserved || 0 | currency: '₦':'symbol':'1.2-2'}}</span>
              <span class="metric-label">Reserved Amount</span>
            </div>
          </div>
        </div>
      </div>
    } @else {
       <div class="empty-cart-message">
        <div class="empty-cart-icon">
          <mat-icon>campaign</mat-icon>
        </div>
        <h4>No active promotion</h4>
        <p>You have no active campaign yet</p>
        <a
          mat-flat-button
          color="primary"
          class="shop-btn"
          routerLink="/dashboard/campaigns"
          (click)="startPromotion.emit()">
          Start a Promotion
        </a>
      </div>
    }
  `,
  styleUrls: ['./promotions-summary-card.component.scss']
})
export class PromotionsSummaryCardComponent {
  @Input({ required: true }) user!: Signal<UserInterface | null>;
  @Output() viewAllPromotions = new EventEmitter<void>();
  @Output() viewWithdrawal = new EventEmitter<void>();
  @Output() startPromotion = new EventEmitter<void>();

  getRejectedPromotionCount(): number {
    return this.user()?.promotion?.filter(p => p.status === 'rejected')?.length || 0;
  }

  getValidatedPromotionCount(): number {
    return this.user()?.promotion?.filter(p => p.status === 'validated')?.length || 0;
  }
}