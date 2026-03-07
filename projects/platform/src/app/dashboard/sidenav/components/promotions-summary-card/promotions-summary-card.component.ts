import { Component, Input, Signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { CurrencyUtilsPipe, UserInterface } from '../../../../../../../shared-services/src/public-api';
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
    RouterModule,
    CurrencyUtilsPipe
  ],
  templateUrl: './promotions-summary-card.component.html',
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