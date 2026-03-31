// promoted-products/promoted-products.component.ts
import { Component, OnInit, OnDestroy, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormsModule } from '@angular/forms';

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

// Services & Stores
import { UserService } from '../../../common/services/user.service';
import { PromotedProductsStore } from './stores/promoted-products.store';
import { PromotedProductsService } from './services/promoted-products.service';
import { ProductFilterService } from './services/product-filter.service';
import { ChartDataService } from './services/chart-data.service';
import { Formatters } from './utils/formatters';
import { MatButtonModule } from '@angular/material/button';
import { OverviewChartDataPoint } from './models/promoted-product.models';
import { PromotionTrackingService } from '../services/promotion-tracking.service';
import { PerformanceCalculator } from './utils/performance-calculator';
import { ProductTransformer } from './utils/product-transformer';

// Models
export * from './models/promoted-product.models';

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
  providers: [
    PromotedProductsStore,
    PromotedProductsService,
    ProductFilterService,
    ChartDataService,
    Formatters,
    PromotionTrackingService,
    PerformanceCalculator,
    ProductTransformer
  ],
  templateUrl: './promoted-products.component.html',
  styleUrls: ['./promoted-products.component.scss']
})
export class PromotedProductsComponent implements OnInit, OnDestroy {
  private store = inject(PromotedProductsStore);
  private promotedProductsService = inject(PromotedProductsService);
  private filterService = inject(ProductFilterService);
  private chartDataService = inject(ChartDataService);
  private formatters = inject(Formatters);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private userService = inject(UserService);
  private destroy$ = new Subject<void>();

  // Expose store signals to template
  readonly user = this.userService.user;
  readonly products = this.store.products;
  readonly filteredProducts = this.store.filteredProducts;
  readonly loading = this.store.loading;
  readonly refreshing = this.store.refreshing;
  readonly error = this.store.error;
  readonly viewMode = this.store.viewMode;
  readonly searchQuery = this.store.searchQuery;
  readonly selectedDateRange = this.store.selectedDateRange;
  readonly selectedPerformanceFilter = this.store.selectedPerformanceFilter;
  readonly selectedProductForChart = this.store.selectedProductForChart;
  readonly showChart = this.store.showChart;
  readonly selectedChartType = this.store.selectedChartType;
  readonly chartTimeRange = this.store.chartTimeRange;
  readonly chartMetrics = this.store.chartMetrics;
  readonly totalStats = this.store.totalStats;
  readonly performanceBreakdown = this.store.performanceBreakdown;
  readonly topPerformers = this.store.topPerformers;
  readonly hasActiveFilters = this.store.hasActiveFilters;

  // Computed chart data
  readonly chartData = () => {
    if (this.selectedChartType() === 'overview') {
      return this.chartDataService.generateOverviewChartData(
        this.products(),
        this.chartTimeRange()
      );
    } else {
      return this.chartDataService.generateTrendsChartData(
        this.products(),
        this.chartTimeRange()
      );
    }
  };

  constructor() {
    // Auto-refresh effect
    effect(() => {
      if (!this.loading()) {
        const interval = setInterval(() => {
          this.refreshStats();
        }, 30000);
        
        // Return cleanup for the active interval
        return () => clearInterval(interval);
      }

      // Fallback: Return an empty cleanup function for the "loading" state
      return () => {}; 
    });

    // Filter effect
    effect(() => {
      const filtered = this.filterService.filterProducts(
        this.products(),
        this.searchQuery(),
        this.selectedPerformanceFilter(),
        this.selectedDateRange()
      );
      this.store.setFilteredProducts(filtered);
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
    const userId = this.user()?._id;
    if (userId) {
      await this.promotedProductsService.loadPromotedProducts(userId);
    }
  }

  async refreshStats(): Promise<void> {
    const userId = this.user()?._id;
    if (userId) {
      await this.promotedProductsService.refreshStats(userId);
    }
  }

  // UI Actions
  setViewMode(mode: any): void {
    this.store.setViewMode(mode);
  }

  setSearchQuery(query: string): void {
    this.store.setSearchQuery(query);
  }

  setPerformanceFilter(filter: string): void {
    this.store.setSelectedPerformanceFilter(filter);
  }

  setDateRange(range: any): void {
    this.store.setSelectedDateRange(range);
  }

  clearFilters(): void {
    this.store.clearFilters();
  }

  setChartTimeRange(range: any): void {
    this.store.setChartTimeRange(range);
  }

  setChartType(type: any): void {
    this.store.setSelectedChartType(type);
  }

  toggleChartMetric(metric: string): void {
    this.store.toggleChartMetric(metric);
  }

  retryLoading(): void {
    this.loadPromotedProducts();
  }

  // Product Actions
  viewProductDetails(product: any): void {
    this.router.navigate(['dashboard/stores/product', product.productId]);
  }

  viewProductStats(product: any): void {
    this.store.setSelectedProductForChart(product);
  }

  closeChart(): void {
    this.store.setSelectedProductForChart(null);
  }

  sharePromotion(product: any): void {
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

  editPromotion(product: any): void {
    this.router.navigate(['dashboard/promotions/edit', product.trackingId]);
  }

  async deactivatePromotion(product: any): Promise<void> {
    await this.promotedProductsService.deactivatePromotion(product);
  }

  copyShareLink(product: any): void {
    if (!product.link) return;
    navigator.clipboard.writeText(product.link).then(() => {
      this.formatters.formatCurrency(0); // Just to trigger snackbar
    });
  }

  exportChartData(format: 'png' | 'svg' | 'csv'): void {
    if (format === 'csv') {
      const data = this.chartData();
      const csv = this.chartDataService.convertToCSV(data as OverviewChartDataPoint[]);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `promotion-stats-${new Date().toISOString()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      // Image export logic
    }
  }

  // Formatter methods (delegated)
  formatCurrency = this.formatters.formatCurrency.bind(this.formatters);
  formatNumber = this.formatters.formatNumber.bind(this.formatters);
}