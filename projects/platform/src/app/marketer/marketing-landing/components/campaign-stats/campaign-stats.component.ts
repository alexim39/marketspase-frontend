import { Component, computed, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DeviceService } from '../../../../../../../shared-services/src/public-api';

interface CampaignStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalSpent: number;
  totalViews: number;
  avgCTR: number;
  totalPromoters: number;
}

interface StatItem {
  label: string;
  value: string;
  icon: string;
  highlight?: boolean;
  trend?: {
    direction: 'up' | 'down';
    value: string;
  };
}

@Component({
  selector: 'app-campaign-stats',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './campaign-stats.component.html',
  styleUrls: ['./campaign-stats.component.scss']
})
export class CampaignStatsComponent implements OnChanges {
  @Input() stats!: CampaignStats;
  private deviceService = inject(DeviceService);

  statsArray: StatItem[] = [];
  deviceType = computed(() => this.deviceService.type());

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['stats'] && this.stats) {
      this.updateStatsArray();
    }
  }

  private updateStatsArray(): void {
    this.statsArray = [
      {
        label: 'Total Campaigns',
        value: this.stats.totalCampaigns.toString(),
        icon: 'campaign',
        trend: { direction: 'up', value: '+12%' }
      },
      {
        label: 'Active Campaigns',
        value: this.stats.activeCampaigns.toString(),
        icon: 'play_arrow',
        highlight: true
      },
      {
        label: 'Total Spent',
        value: this.formatCurrency(this.stats.totalSpent),
        icon: 'payments',
        trend: { direction: 'down', value: '-5%' }
      },
      {
        label: 'Total Views',
        value: this.stats.totalViews.toString() + (this.stats.totalViews >= 1000 ? '' : ''),
        icon: 'visibility',
        trend: { direction: 'up', value: '+23%' }
      },
      {
        label: 'Avg CTR',
        value: this.stats.avgCTR + '%',
        icon: 'trending_up',
        trend: { direction: 'up', value: '+8%' }
      },
      {
        label: 'Total Promoters',
        value: this.stats.totalPromoters.toString(),
        icon: 'groups'
      }
    ];
  }

  private formatCurrency(amount: number): string {
    if (!amount || isNaN(amount)) return '₦0';
    return `₦${amount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
  }
}