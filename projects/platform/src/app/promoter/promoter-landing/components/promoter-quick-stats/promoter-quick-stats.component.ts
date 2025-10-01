import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CampaignMetrics {
  pendingEarnings: number;
  activePromotions: number;
  expiringSoon: number;
  successRate: number;
  totalViews: number;
}

@Component({
  selector: 'promoter-quick-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './promoter-quick-stats.component.html',
  styleUrls: ['./promoter-quick-stats.component.scss']
})
export class PromoterQuickStatsComponent {
  @Input({ required: true }) metrics!: CampaignMetrics;
}