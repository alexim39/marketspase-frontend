import { Component, computed, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DeviceService } from '../../../../../../../shared-services/src/public-api';

interface CampaignStats {
  // Campaign counts
  totalCampaigns: number;
  activeCampaigns: number;
  draftCampaigns: number;
  completedCampaigns: number;
  pendingCampaigns: number;
  
  // Financial metrics
  totalSpent: number;
  totalBudget: number;
  budgetUtilization: number;
  
  // Performance metrics
  totalViews: number;
  totalPromoters: number;
  totalPromotions: number;
  successfulPromotions: number;
  
  // Engagement metrics
  engagementRate: number;
  successRate: number;
  avgCompletionTime: string;
  
  // Additional metrics
  avgPayout: number;
  pendingPayout: number;
  campaignsWithPromotions: number;
  campaignsNeedingAttention: number;
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
  description?: string;
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
      // Campaign Overview Section
      {
        label: 'Total Campaigns',
        value: this.stats.totalCampaigns.toString(),
        icon: 'campaign',
        description: `${this.stats.activeCampaigns} active, ${this.stats.draftCampaigns} drafts`
      },
      {
        label: 'Active Campaigns',
        value: this.stats.activeCampaigns.toString(),
        icon: 'play_arrow',
        highlight: true,
        description: `${this.stats.campaignsWithPromotions} with promotions`
      },
      {
        label: 'Campaigns Needing Attention',
        value: this.stats.campaignsNeedingAttention.toString(),
        icon: 'warning',
        description: 'Active campaigns without promoters'
      },

      // Financial Section
      {
        label: 'Total Spent',
        value: this.formatCurrency(this.stats.totalSpent),
        icon: 'payments',
        description: `of ${this.formatCurrency(this.stats.totalBudget)} budget`
      },
      {
        label: 'Budget Utilization',
        value: this.stats.budgetUtilization + '%',
        icon: 'savings',
        description: 'of total budget used'
      },
      {
        label: 'Pending Payout',
        value: this.formatCurrency(this.stats.pendingPayout),
        icon: 'pending_actions',
        description: 'Awaiting validation/payment'
      },

      // Performance Section
      {
        label: 'Total Views',
        value: this.formatNumber(this.stats.totalViews),
        icon: 'visibility',
        description: 'Across all promotions'
      },
      {
        label: 'Unique Promoters',
        value: this.stats.totalPromoters.toString(),
        icon: 'groups',
        description: 'Active promoters'
      },
      {
        label: 'Total Promotions',
        value: this.stats.totalPromotions.toString(),
        icon: 'assignment',
        description: `${this.stats.successfulPromotions} successful`
      },

      // Engagement Section
      {
        label: 'Success Rate',
        value: this.stats.successRate + '%',
        icon: 'verified',
        description: 'Promotions completed successfully'
      },
      {
        label: 'Engagement Rate',
        value: this.stats.engagementRate + '%',
        icon: 'trending_up',
        description: 'Views vs expected'
      },
      {
        label: 'Avg Completion Time',
        value: this.stats.avgCompletionTime + 'h',
        icon: 'schedule',
        description: 'From submission to payment'
      }
    ];
  }

  private formatCurrency(amount: number): string {
    if (!amount || isNaN(amount)) return '₦0';
    if (amount >= 1000) {
      return `₦${(amount / 1000).toFixed(1)}k`;
    }
    return `₦${amount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
  }

  private formatNumber(num: number): string {
    if (!num || isNaN(num)) return '0';
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  }
}