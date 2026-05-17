// quick-stats.component.ts
import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CurrencyUtilsPipe, UserInterface } from '@shared/services';

export interface CampaignSummary {
  active: number;
  completed: number;
  totalBudget: number;
  spentBudget: number;
  engagedPromoters: number;
}

export interface PromotionSummary {
  total: number;
  activeLinks: number;
  paid: number;
  rejected: number;
  totalClicks: number;
  billableClicks: number;
  totalEarnings: number;
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
