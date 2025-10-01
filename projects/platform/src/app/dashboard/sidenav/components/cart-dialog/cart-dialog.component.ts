import { Component, Input, Output, EventEmitter, Signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatRippleModule } from '@angular/material/core';
import { UserInterface } from '../../../../../../../shared-services/src/public-api';
import { CampaignsSummaryCardComponent } from '../campaigns-summary-card/campaigns-summary-card.component';
import { PromotionsSummaryCardComponent } from '../promotions-summary-card/promotions-summary-card.component';

@Component({
  selector: 'app-cart-dialog',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatRippleModule,
    CurrencyPipe,
    CampaignsSummaryCardComponent,
    PromotionsSummaryCardComponent
  ],
  template: `
    <mat-card class="cart-dialog-card">
      <div class="cart-header">
        <div class="cart-title">
          <mat-icon class="cart-icon">shopping_bag</mat-icon>
          @if(user()!.role === 'marketer') {
            <h3>Your Campaigns</h3>
          }
          @if(user()!.role === 'promoter') {
            <h3>Your Promotions</h3>
          }
          <button mat-icon-button class="close-btn" (click)="closeDialog.emit()">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <div class="cart-summary">
          @if(user()!.role === 'marketer') {
            <span class="items-count">You have {{ pendingCampaignsCount }} pending campaign(s)</span>
            <span class="total-price">{{user()?.wallets?.marketer?.balance || 0 | currency: '₦':'symbol':'1.2-2'}}</span>
          }
          @if(user()!.role === 'promoter') {
            <span class="items-count">You have {{ pendingPromotionsCount }} pending promotion</span>
            <span class="total-price">{{user()?.wallets?.promoter?.balance || 0 | currency: '₦':'symbol':'1.2-2'}}</span>
          }
        </div>
      </div>

      <div class="cart-tabs">
        <button
          class="tab-btn"
          [class.active]="activeTab === 'cart'"
          (click)="setActiveTab.emit('cart')">
          <mat-icon>campaign</mat-icon>
          @if(user()!.role === 'marketer') { Campaigns }
          @if(user()!.role === 'promoter') { Promotions }
          <span class="badge">
          @if(user()!.role === 'marketer') { {{activeCampaignsCount}} }
          @if(user()!.role === 'promoter') { {{pendingPromotionsCount}}  }
          </span>
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab === 'quick-actions'"
          (click)="setActiveTab.emit('quick-actions')">
          <mat-icon>menu</mat-icon>
          Quick Actions
        </button>
      </div>

      <!-- <mat-divider/> -->

      @if (activeTab === 'cart') {
        <div class="cart-content">
          <div class="cart-items-section">
            @if(user()!.role === 'marketer') {
              <app-campaigns-summary-card
                [user]="user"
                (viewAllCampaigns)="viewAllCampaigns.emit()"
                (startCampaign)="closeDialog.emit()"
              />
            }
            @if(user()!.role === 'promoter') {
              <app-promotions-summary-card
                [user]="user"
                (viewAllPromotions)="viewAllPromotions.emit()"
                (viewWithdrawal)="viewWithdrawal.emit()"
                (startPromotion)="closeDialog.emit()"
              />
            }
          </div>
          <div class="checkout-section">
            <mat-divider/>
            <div class="checkout-total">
              <span>Reserved Balance</span>
              <span class="amount">
                @if (user()?.role === 'promoter') {
                  {{user()?.wallets?.promoter?.reserved || 0 | currency: '₦':'symbol':'1.2-2'}} 
                }
                @if (user()?.role === 'marketer') {
                  {{user()?.wallets?.marketer?.reserved || 0 | currency: '₦':'symbol':'1.2-2'}} 
                }
              </span>
            </div>
            <div class="secure-checkout">
              <mat-icon>lock</mat-icon>
              <span>Funds secured in escrow</span>
            </div>
          </div>
        </div>
      }

      @if (activeTab === 'quick-actions') {
        <div class="quick-actions-content">
          <div class="quick-actions-grid">
            <button matRipple class="quick-action" (click)="closeDialog.emit(); switchUser.emit('promoter')" [disabled]="user()!.role === 'promoter'">
              <mat-icon>attach_money</mat-icon>
              <span>
                Switch to Promoter
                <small>Earn by posting ads on your WhatsApp status</small>
              </span>
            </button>

            <button matRipple class="quick-action" (click)="closeDialog.emit(); switchUser.emit('marketer')" [disabled]="user()!.role === 'marketer'">
              <mat-icon>campaign</mat-icon>
              <span>
                Switch to Marketer
                <small>Pay promoters to post your ads on their WhatsApp status</small>
              </span>
            </button>
          </div>

          <div class="account-section">
            <mat-divider/>
            <button matRipple class="account-action" routerLink="./settings" (click)="closeDialog.emit()">
              <mat-icon>person</mat-icon>
              <span>Profile & Settings</span>
            </button>
          </div>
        </div>
      }
    </mat-card>
  `,
  styleUrls: ['./cart-dialog.component.scss']
})
export class CartDialogComponent {
  @Input({ required: true }) user!: Signal<UserInterface | null>;
  @Input({ required: true }) activeTab!: 'cart' | 'quick-actions';
  @Input({ required: true }) pendingCampaignsCount!: number | undefined;
  @Input({ required: true }) pendingPromotionsCount!: number | undefined;
  @Input({ required: true }) activeCampaignsCount!: number | undefined;

  @Output() setActiveTab = new EventEmitter<'cart' | 'quick-actions'>();
  @Output() closeDialog = new EventEmitter<void>();
  @Output() viewAllCampaigns = new EventEmitter<void>();
  @Output() viewAllPromotions = new EventEmitter<void>();
  @Output() viewWithdrawal = new EventEmitter<void>();
  @Output() switchUser = new EventEmitter<string>();
}