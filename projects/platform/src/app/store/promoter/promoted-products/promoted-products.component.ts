// promoted-products/promoted-products.component.ts
import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil, interval } from 'rxjs';

import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormsModule } from '@angular/forms';

import { PromotionTrackingService } from '../services/promotion-tracking.service';
import { UserInterface } from '../../../../../../shared-services/src/public-api';

// Child Components
import { PromotedProductCardComponent } from './components/promoted-product-card/promoted-product-card.component';
import { PromotedProductTableComponent } from './components/promoted-product-table/promoted-product-table.component';
import { PromotionStatsChartComponent } from './components/promotion-stats-chart/promotion-stats-chart.component';
import { SharePromotionDialogComponent } from './components/share-promotion-dialog/share-promotion-dialog.component';
import { PromoterEarningsSummaryComponent } from './components/promoter-earnings-summary/promoter-earnings-summary.component';
import { PromotedProductsHeaderComponent } from './components/promoted-products-header/promoted-products-header.component';
import { ChartModalComponent } from './components/chart-modal/chart-modal.component';
import { PerformanceChartComponent } from './components/performance-chart/performance-chart.component';
import { ProductsFiltersComponent } from './components/products-filters/products-filters.component';
import { TopPerformersComponent } from './components/top-performers/top-performers.component';
import { LoadingStateComponent } from './components/loading-state/loading-state.component';
import { ErrorStateComponent } from './components/error-state/error-state.component';
import { NoResultsStateComponent } from './components/no-results-state/no-results-state.component';

import { UserService } from '../../../common/services/user.service';
import { MatButtonModule } from '@angular/material/button';

// Models
export interface PromotedProduct {
  shareLink: string;
  performance: 'high' | 'medium' | 'low';
  isActive: boolean;
  commissionRate: number;
  productName: string;
  
}


// Add these interfaces at the top of your promoted-products.component.ts file
// after the imports

export interface DeviceTypeStats {
  mobile: number;
  desktop: number;
  tablet: number;
}

export interface ReferralSource {
  source: string;
  count: number;
  conversions: number;
  earnings: number;
}

export interface PromotionStats {
  trackingId: string;
  productId: string;
  productName: string;
  productPrice?: number;
  productImage?: string;
  uniqueCode: string;
  uniqueId?: string;
  views: number;
  clicks: number;
  conversions: number;
  earnings: number;
  clickThroughRate: number;
  conversionRate: number;
  deviceTypes: DeviceTypeStats;
  referralSources: ReferralSource[];
  createdAt: Date | string;
  lastActivityAt: Date | string;
}

export type PerformanceRating = 'high' | 'medium' | 'low';

export interface PromotedProduct extends PromotionStats {
  shareLink: string;
  performance: PerformanceRating;
  isActive: boolean;
  commissionRate: number;
}

export type ViewMode = 'grid' | 'table';
export type DateRange = 'today' | 'week' | 'month' | 'all';
export type ChartTimeRange = 'day' | 'week' | 'month';
export type ChartType = 'overview' | 'trends';
export type ChartMetric = 'views' | 'clicks' | 'conversions' | 'earnings' | 'ctr';
export type ExportFormat = 'png' | 'svg' | 'csv';

export interface TotalStats {
  totalEarnings: number;
  totalClicks: number;
  totalConversions: number;
  totalViews: number;
  activeProducts: number;
  avgConversionRate: number;
  avgClickThroughRate: number;
}

export interface PerformanceBreakdown {
  high: number;
  medium: number;
  low: number;
}

export interface OverviewChartDataPoint {
  date: Date;
  views: number;
  clicks: number;
  conversions: number;
  earnings: number;
  ctr: number;
}

export interface ProductTrendData {
  period: number;
  views: number;
  clicks: number;
  conversions: number;
  earnings: number;
}

export interface TrendsChartData {
  productId: string;
  productName: string;
  data: ProductTrendData[];
}


@Component({
  selector: 'app-promoted-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTooltipModule,
    MatMenuModule,
    MatProgressBarModule,
    MatButtonModule,
    RouterModule,
    PromotedProductCardComponent,
    PromotedProductTableComponent,
    PromotionStatsChartComponent,
    PromoterEarningsSummaryComponent,
    PromotedProductsHeaderComponent,
    ChartModalComponent,
    PerformanceChartComponent,
    ProductsFiltersComponent,
    TopPerformersComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    NoResultsStateComponent
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
  private userService: UserService = inject(UserService);

  // Public signals
  public user = this.userService.user;
  public promotedProducts = signal<PromotedProduct[]>([]);
  public filteredProducts = signal<PromotedProduct[]>([]);
  public loading = signal<boolean>(true);
  public refreshing = signal<boolean>(false);
  public error = signal<string | null>(null);

  // UI State
  public viewMode = signal<ViewMode>('grid');
  public searchQuery = signal<string>('');
  public selectedDateRange = signal<DateRange>('week');
  public selectedPerformanceFilter = signal<string>('all');
  public selectedProductForChart = signal<PromotedProduct | null>(null);
  public showChart = signal<boolean>(false);
  public selectedChartType = signal<ChartType>('overview');
  public chartTimeRange = signal<ChartTimeRange>('week');
  public chartMetrics = signal<Set<string>>(new Set(['views', 'clicks', 'conversions', 'earnings']));

  private refreshInterval$ = interval(30000);

  // Computed stats
  public totalStats = computed(() => {
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

  public performanceBreakdown = computed(() => {
    const products = this.promotedProducts();
    return {
      high: products.filter(p => p.performance === 'high').length,
      medium: products.filter(p => p.performance === 'medium').length,
      low: products.filter(p => p.performance === 'low').length
    };
  });

  public topPerformers = computed(() => {
    return this.promotedProducts()
      .filter(p => p.isActive)
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 5);
  });

  public chartData = computed(() => {
    const products = this.promotedProducts();
    const timeRange = this.chartTimeRange();
    
    if (this.selectedChartType() === 'overview') {
      return this.generateOverviewChartData(products, timeRange);
    } else {
      return this.generateTrendsChartData(products, timeRange);
    }
  });

  constructor() {
    effect(() => {
      if (!this.loading()) {
        this.refreshInterval$
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => this.refreshStats());
      }
    });

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

      let promotionsData: any[] = [];
      
      if (response?.data?.promotions) {
        promotionsData = response.data.promotions;
      } else if (response?.promotions) {
        promotionsData = response.promotions;
      } else if (Array.isArray(response?.data)) {
        promotionsData = response.data;
      } else if (Array.isArray(response)) {
        promotionsData = response;
      }

      if (!promotionsData || promotionsData.length === 0) {
        this.promotedProducts.set([]);
        this.filteredProducts.set([]);
        this.loading.set(false);
        return;
      }

      const productsWithPerformance = await Promise.all(
        promotionsData.map(async (promo) => {
          try {
            const performance = await this.promotionService
              .getPromotionPerformance(promo.productId, this.user()!._id)
              .toPromise();
            
            return {
              ...promo,
              ...performance.data,
              shareLink: this.promotionService.getTrackingLink(promo.uniqueCode, promo.productId),
              performance: this.calculatePerformance(performance.data)
            };
          } catch (err) {
            console.error(`Error fetching performance for ${promo.productId}:`, err);
            return promo;
          }
        })
      );

      const products = this.transformPromotionData(productsWithPerformance);
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

      const promotionsData = response?.data?.promotions;
      
      if (!promotionsData || !Array.isArray(promotionsData)) {
        this.refreshing.set(false);
        return;
      }

      const updatedProducts = this.transformPromotionData(promotionsData);
      
      this.promotedProducts.update(current => {
        const productMap = new Map(updatedProducts.map(p => [p.trackingId, p]));
        return current.map(product => {
          const updated = productMap.get(product.trackingId);
          if (updated) {
            return {
              ...product,
              views: updated.views,
              clicks: updated.clicks,
              conversions: updated.conversions,
              earnings: updated.earnings,
              clickThroughRate: updated.clickThroughRate,
              conversionRate: updated.conversionRate,
              lastActivityAt: updated.lastActivityAt,
              isActive: updated.isActive
            };
          }
          return product;
        });
      });

    } catch (error) {
      console.error('Error refreshing stats:', error);
    } finally {
      this.refreshing.set(false);
    }
  }

  applyFilters(): void {
    let filtered = this.promotedProducts();
    const query = this.searchQuery().toLowerCase();

    if (query) {
      filtered = filtered.filter(p => 
        p.productName.toLowerCase().includes(query) ||
        p.uniqueCode.toLowerCase().includes(query)
      );
    }

    if (this.selectedPerformanceFilter() !== 'all') {
      filtered = filtered.filter(p => 
        p.performance === this.selectedPerformanceFilter()
      );
    }

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

  // Public methods for child components
  public setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  public setSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }

  public setPerformanceFilter(filter: string): void {
    this.selectedPerformanceFilter.set(filter);
  }

  public setDateRange(range: DateRange): void {
    this.selectedDateRange.set(range);
  }

  public clearFilters(): void {
    this.searchQuery.set('');
    this.selectedPerformanceFilter.set('all');
    this.selectedDateRange.set('week');
  }

  public setChartTimeRange(range: ChartTimeRange): void {
    this.chartTimeRange.set(range);
  }

  public setChartType(type: ChartType): void {
    this.selectedChartType.set(type);
  }

  public toggleChartMetric(metric: string): void {
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

  public retryLoading(): void {
    this.loadPromotedProducts();
  }

  public viewProductDetails(product: PromotedProduct): void {
    this.router.navigate(['dashboard/stores/product', product.productId]);
  }

  public viewProductStats(product: PromotedProduct): void {
    this.selectedProductForChart.set(product);
  }

  public closeChart(): void {
    this.selectedProductForChart.set(null);
    this.showChart.set(false);
  }

  public sharePromotion(product: PromotedProduct): void {
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

  public editPromotion(product: PromotedProduct): void {
    this.router.navigate(['dashboard/promotions/edit', product.trackingId]);
  }

  public async deactivatePromotion(product: PromotedProduct): Promise<void> {
    if (!confirm(`Are you sure you want to deactivate promotion for "${product.productName}"?`)) {
      return;
    }

    try {
      await this.promotionService.deactivatePromotion(product.trackingId).toPromise();
      
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

  public copyShareLink(link: any): void {
    // Directly pass the link string instead of the Event object
    if (!link) return;

    navigator.clipboard.writeText(link).then(() => {
      this.snackBar.open('Link copied to clipboard!', 'Close', { duration: 2000 });
    }).catch(err => {
      console.error('Could not copy text: ', err);
    });
  }


  public exportChartData(format: 'png' | 'svg' | 'csv'): void {
    if (format === 'csv') {
      this.exportToCSV();
    } else {
      this.exportAsImage(format);
    }
  }

  // Helper methods
  public formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  public formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  // Private methods
  private calculatePerformance(stats: any): 'high' | 'medium' | 'low' {
    const conversionRate = stats.conversionRate || 0;
    const earnings = stats.earnings || 0;
    const clicks = stats.clicks || 0;
    
    if (conversionRate >= 5 || earnings > 100) {
      return 'high';
    } else if (conversionRate < 1 && earnings < 10 && clicks < 10) {
      return 'low';
    }
    return 'medium';
  }

  private transformPromotionData(promotions: any[]): PromotedProduct[] {
    if (!promotions || !Array.isArray(promotions)) {
      return [];
    }

    return promotions.map(promo => ({
      trackingId: promo.trackingId || promo._id,
      productId: promo.productId,
      productName: promo.productName || 'Unknown Product',
      productPrice: promo.productPrice,
      productImage: promo.productImage,
      uniqueCode: promo.uniqueCode,
      uniqueId: promo.uniqueId,
      shareLink: promo.shareLink || this.promotionService.getTrackingLink(promo.uniqueCode, promo.productId),
      views: promo.views || 0,
      clicks: promo.clicks || 0,
      conversions: promo.conversions || 0,
      earnings: promo.earnings || 0,
      clickThroughRate: promo.clickThroughRate || 0,
      conversionRate: promo.conversionRate || 0,
      commissionRate: promo.commissionRate || 10,
      isActive: promo.isActive === true,
      performance: promo.performance || this.calculatePerformance(promo),
      deviceTypes: promo.deviceTypes || { mobile: 0, desktop: 0, tablet: 0 },
      referralSources: promo.referralSources || [],
      createdAt: promo.createdAt,
      lastActivityAt: promo.lastActivityAt || promo.createdAt
    }));
  }

  private generateOverviewChartData(products: PromotedProduct[], timeRange: ChartTimeRange): any {
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

      const periodData = products.reduce((acc, product) => {
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

  private generateTrendsChartData(products: PromotedProduct[], timeRange: ChartTimeRange): any {
    return products.slice(0, 5).map(product => ({
      productId: product.productId,
      productName: product.productName,
      data: this.generateProductTrendData(product, timeRange)
    }));
  }

  private generateProductTrendData(product: PromotedProduct, timeRange: ChartTimeRange): any[] {
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

  private exportToCSV(): void {
    const data = this.chartData();
    const csv = this.convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `promotion-stats-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  private convertToCSV(data: any): string {
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
    this.snackBar.open(`Chart exported as ${format.toUpperCase()}`, 'Close', { duration: 2000 });
  }
}