// components/store-analytics/store-analytics.component.ts
import { Component, input, signal, computed, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { interval, Subject, takeUntil } from 'rxjs';
import { Store } from '../../models/store.model';
import { StoreService } from '../../services/store.service';
import { PerformanceMetric } from '../../models';

interface AnalyticsTab {
  id: string;
  label: string;
  icon: string;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
  }[];
}

@Component({
  selector: 'app-store-analytics',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatProgressBarModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './store-analytics.component.html',
  styleUrls: ['./store-analytics.component.scss']
})
export class StoreAnalyticsComponent implements OnInit, OnDestroy {
  private storeService = inject(StoreService);
  private destroy$ = new Subject<void>();

  // Inputs
  store = input.required<Store>();
  realTimeUpdates = input<boolean>(false);

  // Signals
  activeTab = signal<string>('overview');
  timeframe = signal<'7d' | '30d' | '90d' | '1y'>('30d');
  loading = signal<boolean>(false);

  // Analytics data
  performanceMetrics = this.storeService.performanceMetricsState;

  // Tabs configuration
  tabs: AnalyticsTab[] = [
    { id: 'overview', label: 'Overview', icon: 'dashboard' },
    { id: 'sales', label: 'Sales', icon: 'shopping_cart' },
    { id: 'traffic', label: 'Traffic', icon: 'trending_up' },
    { id: 'products', label: 'Products', icon: 'inventory_2' },
    { id: 'promoters', label: 'Promoters', icon: 'group' }
  ];

  // Computed properties
  salesData = computed(() => {
    const store = this.store();
    return store.analytics.salesData;
  });

  trafficData = computed(() => {
    const store = this.store();
    return store.analytics.dailyViews.slice(-30); // Last 30 days
  });

  topProducts = computed(() => {
    return this.salesData().topProducts.slice(0, 10);
  });

  promoterPerformance = computed(() => {
    const store = this.store();
    return store.analytics.promoterPerformance;
  });

  // Chart data (simplified - in real app, use a charting library)
  salesChartData = computed((): ChartData => {
    const sales = this.trafficData();
    
    return {
      labels: sales.map(day => new Date(day.date).toLocaleDateString()),
      datasets: [
        {
          label: 'Sales',
          data: sales.map(day => day.sales),
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          borderColor: '#667eea'
        },
        {
          label: 'Revenue',
          data: sales.map(day => day.revenue / 1000), // Scale down for chart
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          borderColor: '#4caf50'
        }
      ]
    };
  });

  trafficChartData = computed((): ChartData => {
    const traffic = this.trafficData();
    
    return {
      labels: traffic.map(day => new Date(day.date).toLocaleDateString()),
      datasets: [
        {
          label: 'Total Views',
          data: traffic.map(day => day.views),
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          borderColor: '#ff9800'
        },
        {
          label: 'Promoter Traffic',
          data: traffic.map(day => day.promoterTraffic),
          backgroundColor: 'rgba(156, 39, 176, 0.1)',
          borderColor: '#9c27b0'
        }
      ]
    };
  });

  ngOnInit(): void {
    if (this.realTimeUpdates()) {
      this.startRealTimeUpdates();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private startRealTimeUpdates(): void {
    interval(10000) // Update every 10 seconds
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.refreshAnalytics();
      });
  }

  refreshAnalytics(): void {
    const store = this.store();
    if (store) {
      this.storeService.getStoreAnalytics(store._id!).subscribe();
    }
  }

  onTimeframeChange(timeframe: '7d' | '30d' | '90d' | '1y'): void {
    this.timeframe.set(timeframe);
    this.refreshAnalytics();
  }

  exportAnalytics(): void {
    // Implement export functionality
    console.log('Exporting analytics data...');
  }

  getMetricIcon(metric: PerformanceMetric): string {
    return metric.icon || 'trending_up';
  }

  getMetricColor(metric: PerformanceMetric): string {
    return metric.color || '#667eea';
  }

  getProgressValue(metric: PerformanceMetric): number {
    return metric.progress || 0;
  }

  formatMetricValue(metric: PerformanceMetric): string {
    const value = metric.current;
    const unit = metric.unit || '';
    
    switch (metric.format) {
      case 'currency':
        return `₦${value.toLocaleString()}`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      default:
        return `${value.toLocaleString()}${unit}`;
    }
  }

  // New method: Handles target formatting safely
  getTargetFormatted(metric: PerformanceMetric): string {
    if (!metric.target) {
      return 'N/A';  // Or '' / '0' based on your needs
    }
    const targetMetric: PerformanceMetric = {
      ...metric,
      current: metric.target  // No ! needed; check exists first
    };
    return this.formatMetricValue(targetMetric);
  }

  trackByMetricId(index: number, metric: PerformanceMetric): string {
    return metric.label;
  }

  trackByProductId(index: number, product: any): string {
    return product.productId;
  }

  trackByPromoterId(index: number, promoter: any): string {
    return promoter.promoterId;
  }

  trackByTabId(index: number, tab: AnalyticsTab): string {
    return tab.id;
  }
}