// quick-stats.component.ts
import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CurrencyUtilsPipe, UserInterface } from '../../../../../../../shared-services/src/public-api';

export interface CampaignSummary {
  active: number;
  completed: number;
  totalBudget: number;
  spentBudget: number;
  totalPromoters: number;
}

export interface PromotionSummary {
  total: number;
  accepted: number;
  submitted: number;
  validated: number;
  paid: number;
  totalEarnings: number;
  pendingEarnings: number;
  availableEarnings: number;
}

export interface CommunityStats {
  connections: number;
  likes: number;
  posts: number;
  comments: number;
}

@Component({
  selector: 'quick-stats',
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatProgressBarModule,
    MatTooltipModule,
    CurrencyUtilsPipe
  ],
  templateUrl: './quick-stats.component.html',
  styleUrls: ['./quick-stats.component.scss']
})
export class QuickStatsComponent {
  user = input<UserInterface | null>();
  campaignSummary = input<CampaignSummary>();
  promotionSummary = input<PromotionSummary>();
  communityStats = input<CommunityStats>();

  withdrawWallet = output<void>();
  viewWallet = output<void>();
}