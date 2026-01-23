import { Component, Input, Output, EventEmitter, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UserInterface } from '../../../../../../../shared-services/src/public-api';

@Component({
  selector: 'app-quick-actions',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    @if (user()!.role === 'marketer') {
      <div class="quick-actions">
        <h4 class="section-title">Quick Actions</h4>
        <button mat-stroked-button class="action-btn" (click)="createCampaign.emit(); mobileAction.emit()">
          <mat-icon>add_circle_outline</mat-icon>
          Create Campaign
        </button>
        <button mat-stroked-button class="action-btn" (click)="fundWallet.emit(); mobileAction.emit()">
          <mat-icon>account_balance_wallet</mat-icon>
          Fund Wallet
        </button>
      </div>
    }
    @if (user()!.role === 'promoter') {
      <div class="quick-actions">
        <h4 class="section-title">Quick Actions</h4>
        <button mat-stroked-button class="action-btn" (click)="viewPromotion.emit(); mobileAction.emit()">
          <mat-icon>campaign</mat-icon>
          View Promotion
        </button>
        <button mat-stroked-button class="action-btn" (click)="viewMyPromotion.emit(); mobileAction.emit()">
          <mat-icon>loyalty</mat-icon>
          My Promotion
        </button>
      </div>
    }
    <div class="quick-actions">
      @if (user()!.role === 'promoter') {
        <button mat-stroked-button class="action-btn switch-btn big" (click)="switchUser.emit(user()!.role || 'marketer'); mobileAction.emit()">
          <mat-icon>swap_horiz</mat-icon>
          Switch to Marketer
        </button>
      }
      @if (user()!.role === 'marketer') {
        <button mat-stroked-button class="action-btn big" (click)="switchUser.emit(user()!.role || 'promoter'); mobileAction.emit()">
          <mat-icon>swap_horiz</mat-icon>
          Switch to Promoter
        </button>
      }
      <button mat-stroked-button class="action-btn" (click)="logout.emit()">
        <mat-icon>exit_to_app</mat-icon>
        Logout
      </button>
    </div>
  `,
  styleUrls: ['./quick-actions.component.scss']
})
export class QuickActionsComponent {
  @Input({ required: true }) user!: Signal<UserInterface | null>;
  @Output() createCampaign = new EventEmitter<void>();
  @Output() fundWallet = new EventEmitter<void>();
  @Output() switchUser = new EventEmitter<string>();
  @Output() viewPromotion = new EventEmitter<void>();
  @Output() viewMyPromotion = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();
  @Output() mobileAction = new EventEmitter<void>();
}