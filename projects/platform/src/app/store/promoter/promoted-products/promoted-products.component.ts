// promoted-products/promoted-products.component.ts
import { Component, OnInit, OnDestroy, inject, signal, computed, effect, Input, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil, interval, switchMap } from 'rxjs';

import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormsModule } from '@angular/forms';

import { PromotionTrackingService, PromotionStats } from '../services/promotion-tracking.service';
import { UserInterface } from '../../../../../../shared-services/src/public-api';

// Components
import { PromotedProductCardComponent } from './components/promoted-product-card/promoted-product-card.component';
import { PromotedProductTableComponent } from './components/promoted-product-table/promoted-product-table.component';
import { PromotionStatsChartComponent } from './components/promotion-stats-chart/promotion-stats-chart.component';
import { SharePromotionDialogComponent } from './components/share-promotion-dialog/share-promotion-dialog.component';
import { PromoterEarningsSummaryComponent } from './components/promoter-earnings-summary/promoter-earnings-summary.component';
import { UserService } from '../../../common/services/user.service';

// Models
export interface PromotedProduct extends PromotionStats {
  shareLink: string;
  performance: 'high' | 'medium' | 'low';
  isActive: boolean;
  commissionRate: number;
}

export type ViewMode = 'grid' | 'table';
export type DateRange = 'today' | 'week' | 'month' | 'all';

@Component({
  selector: 'app-promoted-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTooltipModule,
    MatMenuModule,
    MatProgressBarModule,
    PromotedProductCardComponent,
    PromotedProductTableComponent,
    PromotionStatsChartComponent,
    //SharePromotionDialogComponent,
    PromoterEarningsSummaryComponent,

  ],
  providers: [PromotionTrackingService],
  templateUrl: './promoted-products.component.html',
  styleUrls: ['./promoted-products.component.scss']
})
export class PromotedProductsComponent implements OnInit, OnDestroy {
  private promotionService = inject(PromotionTrackingService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private destroy$ = new Subject<void>();

  // User input - this would come from parent component
  //@Input({ required: true }) user!: UserInterface;

  private userService: UserService = inject(UserService);
  public user: Signal<UserInterface | null> = this.userService.user;

  // Signals for state management
  promotedProducts = signal<PromotedProduct[]>([]);
  filteredProducts = signal<PromotedProduct[]>([]);
  loading = signal<boolean>(true);
  refreshing = signal<boolean>(false);
  error = signal<string | null>(null);

  // UI State
  viewMode = signal<ViewMode>('grid');
  searchQuery = signal<string>('');
  selectedDateRange = signal<DateRange>('week');
  selectedPerformanceFilter = signal<string>('all');

  // Auto-refresh every 30 seconds for real-time stats
  private refreshInterval$ = interval(30000);

  selectedProductForChart = signal<PromotedProduct | null>(null);
  showChart = signal<boolean>(false);

  selectedChartType = signal<'overview' | 'trends'>('overview');
  chartTimeRange = signal<'day' | 'week' | 'month'>('week');
chartMetrics = signal<Set<string>>(new Set(['views', 'clicks', 'conversions', 'earnings']));






// Add this computed value for chart data
chartData = computed(() => {
  const products = this.promotedProducts();
  const timeRange = this.chartTimeRange();
  
  if (this.selectedChartType() === 'overview') {
    return this.generateOverviewChartData(products, timeRange);
  } else {
    return this.generateTrendsChartData(products, timeRange);
  }
});

// Method to generate overview chart data
private generateOverviewChartData(products: PromotedProduct[], timeRange: string): any {
  const now = new Date();
  const dataPoints = timeRange === 'day' ? 24 : timeRange === 'week' ? 7 : 30;
  const data = [];

  for (let i = 0; i < dataPoints; i++) {
    const date = new Date(now);
    if (timeRange === 'day') {
      date.setHours(date.getHours() - (dataPoints - i - 1));
    } else {
      date.setDate(date.getDate() - (dataPoints - i - 1));
    }

    // Aggregate data for this time period
    const periodData = products.reduce((acc, product) => {
      // You would normally filter by date here based on actual timestamps
      // This is simplified mock data for demonstration
      acc.views += Math.floor(product.views / dataPoints);
      acc.clicks += Math.floor(product.clicks / dataPoints);
      acc.conversions += Math.floor(product.conversions / dataPoints);
      acc.earnings += product.earnings / dataPoints;
      return acc;
    }, { views: 0, clicks: 0, conversions: 0, earnings: 0 });

    data.push({
      date,
      ...periodData,
      ctr: periodData.clicks > 0 ? (periodData.conversions / periodData.clicks) * 100 : 0
    });
  }

  return data;
}

// Method to generate trends chart data (comparison between products)
private generateTrendsChartData(products: PromotedProduct[], timeRange: string): any {
  return products.slice(0, 5).map(product => ({
    productId: product.productId,
    productName: product.productName,
    data: this.generateProductTrendData(product, timeRange)
  }));
}

private generateProductTrendData(product: PromotedProduct, timeRange: string): any[] {
  const dataPoints = timeRange === 'day' ? 24 : timeRange === 'week' ? 7 : 30;
  const data = [];

  for (let i = 0; i < dataPoints; i++) {
    data.push({
      period: i,
      views: Math.floor(product.views / dataPoints),
      clicks: Math.floor(product.clicks / dataPoints),
      conversions: Math.floor(product.conversions / dataPoints),
      earnings: product.earnings / dataPoints
    });
  }

  return data;
}

// Method to toggle chart metrics
toggleChartMetric(metric: string): void {
  this.chartMetrics.update(metrics => {
    const newMetrics = new Set(metrics);
    if (newMetrics.has(metric)) {
      newMetrics.delete(metric);
    } else {
      newMetrics.add(metric);
    }
    return newMetrics;
  });
}

// Method to set chart time range
setChartTimeRange(range: 'day' | 'week' | 'month'): void {
  this.chartTimeRange.set(range);
}

// Add these methods for chart interaction
exportChartData(format: 'png' | 'svg' | 'csv'): void {
  // Implementation for exporting chart data
  if (format === 'csv') {
    this.exportToCSV();
  } else {
    this.exportAsImage(format);
  }
}

private exportToCSV(): void {
  const data = this.chartData();
  const csv = this.convertToCSV(data);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `promotion-stats-${new Date().toISOString()}.csv`;
  a.click();
}

private convertToCSV(data: any): string {
  // Simplified CSV conversion
  const headers = ['Date', 'Views', 'Clicks', 'Conversions', 'Earnings'];
  const rows = data.map((item: any) => [
    item.date.toLocaleDateString(),
    item.views,
    item.clicks,
    item.conversions,
    item.earnings
  ]);
  
  return [headers.join(','), ...rows.map((row: any) => row.join(','))].join('\n');
}

private exportAsImage(format: 'png' | 'svg'): void {
  // You would implement actual chart export logic here
  this.snackBar.open(`Chart exported as ${format.toUpperCase()}`, 'Close', { duration: 2000 });
}



  // Computed stats
  totalStats = computed(() => {
    const products = this.promotedProducts();
    
    return {
      totalEarnings: products.reduce((sum, p) => sum + p.earnings, 0),
      totalClicks: products.reduce((sum, p) => sum + p.clicks, 0),
      totalConversions: products.reduce((sum, p) => sum + p.conversions, 0),
      totalViews: products.reduce((sum, p) => sum + p.views, 0),
      activeProducts: products.filter(p => p.isActive).length,
      avgConversionRate: products.length > 0 
        ? products.reduce((sum, p) => sum + p.conversionRate, 0) / products.length 
        : 0,
      avgClickThroughRate: products.length > 0
        ? products.reduce((sum, p) => sum + p.clickThroughRate, 0) / products.length
        : 0
    };
  });

  // Performance breakdown
  performanceBreakdown = computed(() => {
    const products = this.promotedProducts();
    
    return {
      high: products.filter(p => p.performance === 'high').length,
      medium: products.filter(p => p.performance === 'medium').length,
      low: products.filter(p => p.performance === 'low').length
    };
  });

  // Top performing products
  topPerformers = computed(() => {
    return this.promotedProducts()
      .filter(p => p.isActive)
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 5);
  });

  constructor() {
    // Auto-refresh effect
    effect(() => {
      if (!this.loading()) {
        const subscription = this.refreshInterval$
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => this.refreshStats());
      }
    });

    // Filter effect
    effect(() => {
      this.applyFilters();
    });

     effect(() => {
      if (this.selectedProductForChart()) {
        this.showChart.set(true);
      }
    });
  }

  ngOnInit(): void {
    this.loadPromotedProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadPromotedProducts(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await this.promotionService
        .getPromotionDashboard(this.user()!._id)
        .toPromise();

        console.log('response ',response)

      const products = this.transformPromotionData(response!.data!.promotions);
      this.promotedProducts.set(products);
      this.applyFilters();

    } catch (error) {
      console.error('Error loading promoted products:', error);
      this.error.set('Failed to load promoted products. Please try again.');
      this.snackBar.open('Error loading products', 'Close', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }

  async refreshStats(): Promise<void> {
    if (this.refreshing()) return;

    this.refreshing.set(true);
    try {
      const response = await this.promotionService
        .getPromotionDashboard(this.user()!._id)
        .toPromise();

      const updatedProducts = this.transformPromotionData(response!.promotions);
      
      // Update existing products with new stats while preserving UI state
      this.promotedProducts.update(current => {
        const productMap = new Map(updatedProducts.map(p => [p.trackingId, p]));
        return current.map(product => {
          const updated = productMap.get(product.trackingId);
          return updated ? { ...product, ...updated } : product;
        });
      });

    } catch (error) {
      console.error('Error refreshing stats:', error);
    } finally {
      this.refreshing.set(false);
    }
  }

  private transformPromotionData(promotions: any[]): any[] {
//   private transformPromotionData(promotions: any[]): PromotedProduct[] {
    return promotions.map(promo => {
      // Calculate performance based on conversion rate and earnings
      let performance: 'high' | 'medium' | 'low' = 'medium';
      
      if (promo.conversionRate >= 5 || promo.earnings > 100) {
        performance = 'high';
      } else if (promo.conversionRate < 1 && promo.earnings < 10) {
        performance = 'low';
      }

      return {
        ...promo,
        shareLink: this.promotionService.getTrackingLink(promo.uniqueCode),
        performance
      };
    });
  }

  applyFilters(): void {
    let filtered = this.promotedProducts();
    const query = this.searchQuery().toLowerCase();

    // Apply search filter
    if (query) {
      filtered = filtered.filter(p => 
        p.productName.toLowerCase().includes(query) ||
        p.uniqueCode.toLowerCase().includes(query)
      );
    }

    // Apply performance filter
    if (this.selectedPerformanceFilter() !== 'all') {
      filtered = filtered.filter(p => 
        p.performance === this.selectedPerformanceFilter()
      );
    }

    // Apply date range filter (implement based on your needs)
    if (this.selectedDateRange() !== 'all') {
      const now = new Date();
      const rangeMap = {
        today: 1,
        week: 7,
        month: 30,
        all: null
      };
      
      const daysAgo = rangeMap[this.selectedDateRange()];
      if (daysAgo) {
        const cutoff = new Date(now.setDate(now.getDate() - daysAgo));
        filtered = filtered.filter(p => 
          new Date(p.lastActivityAt) >= cutoff
        );
      }
    }

    this.filteredProducts.set(filtered);
  }

  // Product actions
  viewProductDetails(product: PromotedProduct): void {
    this.router.navigate(['dashboard/stores/product', product.productId]);
  }

  sharePromotion(product: PromotedProduct): void {
    this.dialog.open(SharePromotionDialogComponent, {
      width: '500px',
      data: {
        productName: product.productName,
        shareLink: product.shareLink,
        commissionRate: product.commissionRate,
        trackingCode: product.uniqueCode
      }
    });
  }

  editPromotion(product: PromotedProduct): void {
    // Navigate to promotion settings
    this.router.navigate(['dashboard/promotions/edit', product.trackingId]);
  }

  async deactivatePromotion(product: PromotedProduct): Promise<void> {
    if (!confirm(`Are you sure you want to deactivate promotion for "${product.productName}"?`)) {
      return;
    }

    try {
      await this.promotionService.deactivatePromotion(product.trackingId).toPromise();
      
      // Update local state
      this.promotedProducts.update(products =>
        products.map(p => 
          p.trackingId === product.trackingId 
            ? { ...p, isActive: false }
            : p
        )
      );

      this.snackBar.open('Promotion deactivated successfully', 'Close', { duration: 3000 });
      
    } catch (error) {
      console.error('Error deactivating promotion:', error);
      this.snackBar.open('Failed to deactivate promotion', 'Close', { duration: 5000 });
    }
  }

  copyShareLink(link: string): void {
    navigator.clipboard.writeText(link).then(() => {
      this.snackBar.open('Link copied to clipboard!', 'Close', { duration: 2000 });
    });
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedPerformanceFilter.set('all');
    this.selectedDateRange.set('week');
  }

  retryLoading(): void {
    this.loadPromotedProducts();
  }

  // Helper methods
  getPerformanceColor(performance: string): string {
    const colors = {
      high: 'var(--success-color)',
      medium: 'var(--warning-color)',
      low: 'var(--error-color)'
    };
    return colors[performance as keyof typeof colors] || 'var(--text-secondary)';
  }

   viewProductStats(product: PromotedProduct): void {
    this.selectedProductForChart.set(product);
  }

  closeChart(): void {
    this.selectedProductForChart.set(null);
    this.showChart.set(false);
  }

  // Update sharePromotion method to use the dialog
//   sharePromotion(product: PromotedProduct): void {
//     const dialogRef = this.dialog.open(SharePromotionDialogComponent, {
//       width: '500px',
//       data: {
//         productName: product.productName,
//         shareLink: product.shareLink,
//         commissionRate: product.commissionRate,
//         trackingCode: product.uniqueCode
//       }
//     });
//   }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }
}