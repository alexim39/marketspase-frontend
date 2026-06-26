import { CommonModule } from '@angular/common';
import { Component, computed, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { DeviceService } from '@shared/services/device';
import { CurrencyUtilsPipe, UserInterface } from '@shared/services';

interface CampaignStats {
  totalCampaigns: number;
  activeCampaigns: number;
  draftCampaigns: number;
  completedCampaigns: number;
  pendingCampaigns: number;
  exhaustedCampaigns: number;
  totalSpent: number;
  totalBudget: number;
  remainingBudget: number;
  budgetUtilization: number;
  totalClicks: number;
  billableClicks: number;
  invalidClicks: number;
  totalPromoters: number;
  totalPromotions: number;
  activePromotions: number;
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
  category: 'overview' | 'financial' | 'performance' | 'engagement';
  highlight?: boolean;
  description?: string;
}

@Component({
  selector: 'app-campaign-stats-mobile',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTabsModule, CurrencyUtilsPipe],
  templateUrl: './campaign-stats-mobile.component.html',
  styleUrls: ['./campaign-stats-mobile.component.scss']
})
export class CampaignStatsMobileComponent implements OnChanges {
  @Input() stats!: CampaignStats;
  @Input() user!: UserInterface | null;

  private readonly deviceService = inject(DeviceService);

  readonly deviceType = computed(() => this.deviceService.type());

  statsArray: StatItem[] = [];
  filteredStats: StatItem[] = [];
  activeTab = 0;

  readonly categories = [
    { key: 'overview', label: 'Overview', icon: 'dashboard' },
    { key: 'financial', label: 'Financial', icon: 'payments' },
    { key: 'performance', label: 'Performance', icon: 'trending_up' },
    { key: 'engagement', label: 'Engagement', icon: 'engagement' }
  ] as const;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['stats'] && this.stats) {
      this.updateStatsArray();
      this.filterStatsByCategory(0);
    }
  }

  private updateStatsArray(): void {
    this.statsArray = [
      {
        label: 'Total Campaigns',
        value: this.stats.totalCampaigns.toString(),
        icon: 'campaign',
        category: 'overview',
        description: `${this.stats.activeCampaigns} live • ${this.stats.draftCampaigns} drafts`
      },
      {
        label: 'Live Campaigns',
        value: this.stats.activeCampaigns.toString(),
        icon: 'play_arrow',
        category: 'overview',
        highlight: true,
        description: `${this.stats.campaignsWithPromotions} with promoter activity`
      },
      {
        label: 'Need Attention',
        value: this.stats.campaignsNeedingAttention.toString(),
        icon: 'warning',
        category: 'overview',
        description: 'Live campaigns without active promoters'
      },
      {
        label: 'Total Spent',
        value: this.formatCurrency(this.stats.totalSpent),
        icon: 'savings',
        category: 'financial',
        description: `of ${this.formatCurrency(this.stats.totalBudget)} budget`
      },
      {
        label: 'Budget Used',
        value: `${this.stats.budgetUtilization}%`,
        icon: 'pie_chart',
        category: 'financial',
        description: 'Budget utilization rate'
      },
      {
        label: 'Remaining Budget',
        value: this.formatCurrency(this.stats.remainingBudget),
        icon: 'account_balance_wallet',
        category: 'financial',
        description: `${this.formatNumber(this.stats.estimatedRemainingClicks)} estimated clicks left`
      },
      {
        label: 'Total Clicks',
        value: this.formatNumber(this.stats.totalClicks),
        icon: 'ads_click',
        category: 'performance',
        description: 'Across all promotions'
      },
      {
        label: 'Unique Promoters',
        value: this.stats.totalPromoters.toString(),
        icon: 'groups',
        category: 'performance',
        description: 'Active promoters'
      },
      {
        label: 'Promotion Links',
        value: this.stats.totalPromotions.toString(),
        icon: 'link',
        category: 'performance',
        description: `${this.stats.activePromotions} currently active`
      },
      {
        label: 'Click Quality',
        value: `${this.stats.clickQualityRate}%`,
        icon: 'verified',
        category: 'engagement',
        description: `${this.formatNumber(this.stats.invalidClicks)} invalid or duplicate clicks`
      },
      {
        label: 'Promoter Activation',
        value: `${this.stats.promoterActivationRate}%`,
        icon: 'trending_up',
        category: 'engagement',
        description: 'Live campaigns with promoter participation'
      },
      {
        label: 'Average CPC',
        value: this.formatCurrency(this.stats.avgCostPerClick),
        icon: 'payments',
        category: 'engagement',
        description: `${this.stats.exhaustedCampaigns} campaigns exhausted`
      }
    ];
  }

  filterStatsByCategory(tabIndex: number): void {
    this.activeTab = tabIndex;
    const category = this.categories[tabIndex].key;
    this.filteredStats = this.statsArray.filter((stat) => stat.category === category);
  }

  formatCurrency(amount: number): string {
    if (!amount || Number.isNaN(amount)) return 'NGN 0';
    if (amount >= 1000000) {
      return `NGN ${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `NGN ${(amount / 1000).toFixed(1)}k`;
    }
    return `NGN ${amount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
  }

  formatNumber(num: number): string {
    if (!num || Number.isNaN(num)) return '0';
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  }
}
