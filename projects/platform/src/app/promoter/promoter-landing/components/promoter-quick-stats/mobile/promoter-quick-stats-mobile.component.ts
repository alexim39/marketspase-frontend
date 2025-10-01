import { Component, Input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { DeviceService } from '../../../../../../../../shared-services/src/public-api';

interface CampaignMetrics {
  pendingEarnings: number;
  activePromotions: number;
  expiringSoon: number;
  successRate: number;
  totalViews: number;
  completedPromotions?: number;
  avgEarnings?: number;
}

interface StatCard {
  label: string;
  value: string;
  icon: string;
  category: 'earnings' | 'performance' | 'engagement';
  trend?: {
    value: string;
    positive: boolean;
    label: string;
  };
  description?: string;
  highlight?: boolean;
}

@Component({
  selector: 'promoter-quick-stats-mobile',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTabsModule],
  templateUrl: './promoter-quick-stats-mobile.component.html',
  styleUrls: ['./promoter-quick-stats-mobile.component.scss']
})
export class PromoterQuickStatsMobileComponent {
  @Input({ required: true }) metrics!: CampaignMetrics;
  private deviceService = inject(DeviceService);

  activeTab = 0;
  statCards: StatCard[] = [];
  filteredCards: StatCard[] = [];

  categories = [
    { key: 'earnings', label: 'Earnings', icon: 'payments' },
    { key: 'performance', label: 'Performance', icon: 'trending_up' },
    { key: 'engagement', label: 'Engagement', icon: 'engagement' }
  ];

  deviceType = computed(() => this.deviceService.type());

  ngOnChanges(): void {
    this.updateStatCards();
    this.filterCardsByCategory(this.activeTab);
  }

  private updateStatCards(): void {
    this.statCards = [
      // Earnings Category
      {
        label: 'Pending Earnings',
        value: this.formatCurrency(this.metrics.pendingEarnings),
        icon: 'pending_actions',
        category: 'earnings',
        description: 'Awaiting verification',
        trend: {
          value: 'processing',
          positive: true,
          label: 'Under review'
        },
        highlight: true
      },
      {
        label: 'Avg. per Campaign',
        value: this.formatCurrency(this.metrics.avgEarnings || 0),
        icon: 'avg_pace',
        category: 'earnings',
        description: 'Average earnings'
      },
      {
        label: 'Completed',
        value: (this.metrics.completedPromotions || 0).toString(),
        icon: 'check_circle',
        category: 'earnings',
        description: 'Successful promotions'
      },

      // Performance Category
      {
        label: 'Active Campaigns',
        value: this.metrics.activePromotions.toString(),
        icon: 'campaign',
        category: 'performance',
        description: this.metrics.expiringSoon > 0 ? 
          `${this.metrics.expiringSoon} expiring soon` : 'All campaigns active',
        highlight: this.metrics.activePromotions > 0
      },
      {
        label: 'Success Rate',
        value: `${this.metrics.successRate}%`,
        icon: 'verified',
        category: 'performance',
        description: this.getPerformanceLabel(this.metrics.successRate),
        trend: {
          value: this.metrics.successRate >= 80 ? 'excellent' : 'good',
          positive: this.metrics.successRate >= 60,
          label: this.metrics.successRate >= 80 ? 'Excellent' : 'Good'
        }
      },
      {
        label: 'Completion Rate',
        value: `${Math.min(100, Math.round((this.metrics.completedPromotions || 0) / this.metrics.activePromotions * 100))}%`,
        icon: 'task_alt',
        category: 'performance',
        description: 'Promotions completed'
      },

      // Engagement Category
      {
        label: 'Total Views',
        value: this.formatNumber(this.metrics.totalViews),
        icon: 'visibility',
        category: 'engagement',
        description: 'Lifetime reach'
      },
      {
        label: 'Engagement Score',
        value: `${Math.min(100, Math.round(this.metrics.successRate * 0.7 + (this.metrics.totalViews / 1000)))}%`,
        icon: 'insights',
        category: 'engagement',
        description: 'Overall performance'
      },
      {
        label: 'Active Rate',
        value: `${Math.min(100, Math.round((this.metrics.activePromotions / (this.metrics.completedPromotions || 1)) * 100))}%`,
        icon: 'activity',
        category: 'engagement',
        description: 'Current activity level'
      }
    ];
  }

  filterCardsByCategory(tabIndex: number): void {
    this.activeTab = tabIndex;
    const category = this.categories[tabIndex].key;
    this.filteredCards = this.statCards.filter(card => card.category === category);
  }

  formatCurrency(amount: number): string {
    if (!amount || isNaN(amount)) return '₦0';
    if (amount >= 1000000) return `₦${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `₦${(amount / 1000).toFixed(0)}K`;
    return `₦${amount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
  }

  private formatNumber(num: number): string {
    if (!num || isNaN(num)) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num.toString();
  }

  private getPerformanceLabel(successRate: number): string {
    if (successRate >= 90) return 'Outstanding performance';
    if (successRate >= 80) return 'Excellent work';
    if (successRate >= 70) return 'Great performance';
    if (successRate >= 60) return 'Good performance';
    return 'Needs improvement';
  }
}