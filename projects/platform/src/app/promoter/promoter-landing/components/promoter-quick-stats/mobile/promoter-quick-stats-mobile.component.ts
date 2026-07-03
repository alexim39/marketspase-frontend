import { Component, Input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DeviceService } from '@shared/services/device';

interface CampaignMetrics {
  pendingEarnings: number;
  activePromotions: number;
  expiringSoon: number;
  successRate: number;
  totalClicks: number;
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
  imports: [CommonModule, MatIconModule, MatTabsModule, MatSlideToggleModule],
  templateUrl: './promoter-quick-stats-mobile.component.html',
  styleUrls: ['./promoter-quick-stats-mobile.component.scss']
})
export class PromoterQuickStatsMobileComponent {
  @Input({ required: true }) metrics!: CampaignMetrics;
  private deviceService = inject(DeviceService);

  activeTab = 0;
  statCards: StatCard[] = [];
  filteredCards: StatCard[] = [];
  showDashboard = false; // Default to showing dashboard

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

  toggleDashboard(): void {
    this.showDashboard = !this.showDashboard;
  }

  private updateStatCards(): void {
    this.statCards = [
      // Earnings Category
      {
        label: 'Pending Earnings',
        value: this.formatCurrency(this.metrics.pendingEarnings),
        icon: 'pending_actions',
        category: 'earnings',
        description: 'From tracked clicks',
        trend: {
          value: 'live',
          positive: true,
          label: 'Accruing'
        },
        highlight: true
      },
      {
        label: 'Avg. per Campaign',
        value: this.formatCurrency(this.metrics.avgEarnings || 0),
        icon: 'payments',
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
        label: 'Active Promotions',
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
        value: `${this.getCompletionRate()}%`,
        icon: 'task_alt',
        category: 'performance',
        description: 'Promotions completed'
      },

      // Engagement Category
      {
        label: 'Total Clicks',
        value: this.formatNumber(this.metrics.totalClicks),
        icon: 'touch_app',
        category: 'engagement',
        description: 'Lifetime tracked clicks'
      },
      {
        label: 'Engagement Score',
        value: `${Math.min(100, Math.round(this.metrics.successRate * 0.7 + (this.metrics.totalClicks / 1000)))}%`,
        icon: 'insights',
        category: 'engagement',
        description: 'Overall performance'
      },
      {
        label: 'Active Rate',
        value: `${this.getActiveRate()}%`,
        icon: 'work',
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

  private getCompletionRate(): number {
    if (!this.metrics.activePromotions) {
      return 0;
    }

    return Math.min(100, Math.round(((this.metrics.completedPromotions || 0) / this.metrics.activePromotions) * 100));
  }

  private getActiveRate(): number {
    if (!(this.metrics.completedPromotions || 0)) {
      return this.metrics.activePromotions > 0 ? 100 : 0;
    }

    return Math.min(100, Math.round((this.metrics.activePromotions / (this.metrics.completedPromotions || 1)) * 100));
  }
}
