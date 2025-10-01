import { Component, computed, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { DeviceService } from '../../../../../../../../shared-services/src/public-api';

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
  category: 'overview' | 'financial' | 'performance' | 'engagement';
  highlight?: boolean;
  description?: string;
}

@Component({
  selector: 'app-campaign-stats-mobile',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTabsModule],
  templateUrl: './campaign-stats-mobile.component.html',
  styleUrls: ['./campaign-stats-mobile.component.scss']
})
export class CampaignStatsMobileComponent implements OnChanges {
  @Input() stats!: CampaignStats;
  private deviceService = inject(DeviceService);

  statsArray: StatItem[] = [];
  filteredStats: StatItem[] = [];
  activeTab = 0;
  
  categories = [
    { key: 'overview', label: 'Overview', icon: 'dashboard' },
    { key: 'financial', label: 'Financial', icon: 'payments' },
    { key: 'performance', label: 'Performance', icon: 'trending_up' },
    { key: 'engagement', label: 'Engagement', icon: 'engagement' }
  ];

  deviceType = computed(() => this.deviceService.type());

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['stats'] && this.stats) {
      this.updateStatsArray();
      this.filterStatsByCategory(0);
    }
  }

  private updateStatsArray(): void {
    this.statsArray = [
      // Overview Section
      {
        label: 'Total Campaigns',
        value: this.stats.totalCampaigns.toString(),
        icon: 'campaign',
        category: 'overview',
        description: `${this.stats.activeCampaigns} active • ${this.stats.draftCampaigns} drafts`
      },
      {
        label: 'Active Campaigns',
        value: this.stats.activeCampaigns.toString(),
        icon: 'play_arrow',
        category: 'overview',
        highlight: true,
        description: `${this.stats.campaignsWithPromotions} with promotions`
      },
      {
        label: 'Need Attention',
        value: this.stats.campaignsNeedingAttention.toString(),
        icon: 'warning',
        category: 'overview',
        description: 'Active campaigns without promoters'
      },

      // Financial Section
      {
        label: 'Total Spent',
        value: this.formatCurrency(this.stats.totalSpent),
        icon: 'savings',
        category: 'financial',
        description: `of ${this.formatCurrency(this.stats.totalBudget)} budget`
      },
      {
        label: 'Budget Used',
        value: this.stats.budgetUtilization + '%',
        icon: 'pie_chart',
        category: 'financial',
        description: 'Budget utilization rate'
      },
      {
        label: 'Pending Payout',
        value: this.formatCurrency(this.stats.pendingPayout),
        icon: 'pending_actions',
        category: 'financial',
        description: 'Awaiting validation/payment'
      },

      // Performance Section
      {
        label: 'Total Views',
        value: this.formatNumber(this.stats.totalViews),
        icon: 'visibility',
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
        label: 'Total Promotions',
        value: this.stats.totalPromotions.toString(),
        icon: 'assignment',
        category: 'performance',
        description: `${this.stats.successfulPromotions} successful`
      },

      // Engagement Section
      {
        label: 'Success Rate',
        value: this.stats.successRate + '%',
        icon: 'verified',
        category: 'engagement',
        description: 'Promotions completed'
      },
      {
        label: 'Engagement Rate',
        value: this.stats.engagementRate + '%',
        icon: 'trending_up',
        category: 'engagement',
        description: 'Views vs expected'
      },
      {
        label: 'Avg Time',
        value: this.stats.avgCompletionTime + 'h',
        icon: 'schedule',
        category: 'engagement',
        description: 'Submission to payment'
      }
    ];
  }

  filterStatsByCategory(tabIndex: number): void {
    this.activeTab = tabIndex;
    const category = this.categories[tabIndex].key;
    this.filteredStats = this.statsArray.filter(stat => stat.category === category);
  }

  formatCurrency(amount: number): string {
    if (!amount || isNaN(amount)) return '₦0';
    if (amount >= 1000000) {
      return `₦${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `₦${(amount / 1000).toFixed(1)}k`;
    }
    return `₦${amount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
  }

  private formatNumber(num: number): string {
    if (!num || isNaN(num)) return '0';
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  }
}