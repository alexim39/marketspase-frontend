import { Component, computed, inject, Input, OnChanges, signal, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DeviceService } from '@shared/services/device';
import { UserInterface } from '@shared/services';

interface CampaignStats {
  // Campaign counts
  totalCampaigns: number;
  activeCampaigns: number;
  draftCampaigns: number;
  completedCampaigns: number;
  pendingCampaigns: number;
  exhaustedCampaigns: number;
  
  // Financial metrics
  totalSpent: number;
  totalBudget: number;
  remainingBudget: number;
  budgetUtilization: number;
  
  // Performance metrics
  totalClicks: number;
  billableClicks: number;
  invalidClicks: number;
  totalPromoters: number;
  totalPromotions: number;
  activePromotions: number;
  
  // Engagement metrics
  clickQualityRate: number;
  promoterActivationRate: number;
  avgCostPerClick: number;
  estimatedRemainingClicks: number;
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
   @Input() user!: UserInterface | null;
  private deviceService = inject(DeviceService);

  isCollapsed = signal(true);
  
  toggleStats(): void {
    this.isCollapsed.update(state => !state);
  }

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
        description: `${this.stats.activeCampaigns} live • ${this.stats.draftCampaigns} drafts`
      },
      {
        label: 'Live Campaigns',
        value: this.stats.activeCampaigns.toString(),
        icon: 'play_arrow',
        highlight: true,
        description: `${this.stats.campaignsWithPromotions} with promoter activity`
      },
      {
        label: 'Campaigns Needing Attention',
        value: this.stats.campaignsNeedingAttention.toString(),
        icon: 'warning',
        description: 'Live campaigns without active promoters'
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
        label: 'Remaining Budget',
        value: this.formatCurrency(this.stats.remainingBudget),
        icon: 'account_balance_wallet',
        description: `${this.formatNumber(this.stats.estimatedRemainingClicks)} estimated clicks left`
      },

      // Performance Section
      {
        label: 'Total Clicks',
        value: this.formatNumber(this.stats.totalClicks),
        icon: 'touch_app',
        description: `${this.formatNumber(this.stats.billableClicks)} billable clicks`
      },
      {
        label: 'Unique Promoters',
        value: this.stats.totalPromoters.toString(),
        icon: 'groups',
        description: 'Active promoters'
      },
      {
        label: 'Promotion Links',
        value: this.stats.totalPromotions.toString(),
        icon: 'link',
        description: `${this.stats.activePromotions} currently active`
      },

      // Engagement Section
      {
        label: 'Click Quality',
        value: this.stats.clickQualityRate + '%',
        icon: 'verified',
        description: `${this.formatNumber(this.stats.invalidClicks)} invalid or duplicate clicks`
      },
      {
        label: 'Promoter Activation',
        value: this.stats.promoterActivationRate + '%',
        icon: 'trending_up',
        description: 'Live campaigns with promoter participation'
      },
      {
        label: 'Average CPC',
        value: this.formatCurrency(this.stats.avgCostPerClick),
        icon: 'payments',
        description: `${this.stats.exhaustedCampaigns} campaigns exhausted`
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
