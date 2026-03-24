// stores/promoted-products.store.ts
import { Injectable, signal, computed, inject } from '@angular/core';
import { PromotedProduct, ViewMode, DateRange, ChartType, ChartTimeRange, TotalStats, PerformanceBreakdown } from '../promoted-products.component';

export interface PromotedProductsState {
  products: PromotedProduct[];
  filteredProducts: PromotedProduct[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  viewMode: ViewMode;
  searchQuery: string;
  selectedDateRange: DateRange;
  selectedPerformanceFilter: string;
  selectedProductForChart: PromotedProduct | null;
  showChart: boolean;
  selectedChartType: ChartType;
  chartTimeRange: ChartTimeRange;
  chartMetrics: Set<string>;
}

@Injectable()
export class PromotedProductsStore {
  // State signals
  private state = signal<PromotedProductsState>({
    products: [],
    filteredProducts: [],
    loading: true,
    refreshing: false,
    error: null,
    viewMode: 'grid',
    searchQuery: '',
    selectedDateRange: 'week',
    selectedPerformanceFilter: 'all',
    selectedProductForChart: null,
    showChart: false,
    selectedChartType: 'overview',
    chartTimeRange: 'week',
    chartMetrics: new Set(['views', 'clicks', 'conversions', 'earnings'])
  });

  // Public selectors
  products = computed(() => this.state().products);
  filteredProducts = computed(() => this.state().filteredProducts);
  loading = computed(() => this.state().loading);
  refreshing = computed(() => this.state().refreshing);
  error = computed(() => this.state().error);
  viewMode = computed(() => this.state().viewMode);
  searchQuery = computed(() => this.state().searchQuery);
  selectedDateRange = computed(() => this.state().selectedDateRange);
  selectedPerformanceFilter = computed(() => this.state().selectedPerformanceFilter);
  selectedProductForChart = computed(() => this.state().selectedProductForChart);
  showChart = computed(() => this.state().showChart);
  selectedChartType = computed(() => this.state().selectedChartType);
  chartTimeRange = computed(() => this.state().chartTimeRange);
  chartMetrics = computed(() => this.state().chartMetrics);

  // Computed stats
  totalStats = computed((): TotalStats => {
    const products = this.products();
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

  performanceBreakdown = computed((): PerformanceBreakdown => {
    const products = this.products();
    return {
      high: products.filter(p => p.performance === 'high').length,
      medium: products.filter(p => p.performance === 'medium').length,
      low: products.filter(p => p.performance === 'low').length
    };
  });

  topPerformers = computed(() => {
    return this.products()
      .filter(p => p.isActive)
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 5);
  });

  hasActiveFilters = computed(() => {
    return this.searchQuery() !== '' || 
           this.selectedPerformanceFilter() !== 'all' || 
           this.selectedDateRange() !== 'week';
  });

  // Actions
  setProducts(products: PromotedProduct[]): void {
    this.state.update(state => ({ ...state, products }));
  }

  setFilteredProducts(products: PromotedProduct[]): void {
    this.state.update(state => ({ ...state, filteredProducts: products }));
  }

  setLoading(loading: boolean): void {
    this.state.update(state => ({ ...state, loading }));
  }

  setRefreshing(refreshing: boolean): void {
    this.state.update(state => ({ ...state, refreshing }));
  }

  setError(error: string | null): void {
    this.state.update(state => ({ ...state, error }));
  }

  setViewMode(mode: ViewMode): void {
    this.state.update(state => ({ ...state, viewMode: mode }));
  }

  setSearchQuery(query: string): void {
    this.state.update(state => ({ ...state, searchQuery: query }));
  }

  setSelectedDateRange(range: DateRange): void {
    this.state.update(state => ({ ...state, selectedDateRange: range }));
  }

  setSelectedPerformanceFilter(filter: string): void {
    this.state.update(state => ({ ...state, selectedPerformanceFilter: filter }));
  }

  setSelectedProductForChart(product: PromotedProduct | null): void {
    this.state.update(state => ({ 
      ...state, 
      selectedProductForChart: product,
      showChart: !!product
    }));
  }

  setShowChart(show: boolean): void {
    this.state.update(state => ({ ...state, showChart: show }));
  }

  setSelectedChartType(type: ChartType): void {
    this.state.update(state => ({ ...state, selectedChartType: type }));
  }

  setChartTimeRange(range: ChartTimeRange): void {
    this.state.update(state => ({ ...state, chartTimeRange: range }));
  }

  toggleChartMetric(metric: string): void {
    this.state.update(state => {
      const newMetrics = new Set(state.chartMetrics);
      if (newMetrics.has(metric)) {
        newMetrics.delete(metric);
      } else {
        newMetrics.add(metric);
      }
      return { ...state, chartMetrics: newMetrics };
    });
  }

  updateProduct(productId: string, updates: Partial<PromotedProduct>): void {
    this.state.update(state => ({
      ...state,
      products: state.products.map(p => 
        p.trackingId === productId ? { ...p, ...updates } : p
      )
    }));
  }

  clearFilters(): void {
    this.state.update(state => ({
      ...state,
      searchQuery: '',
      selectedPerformanceFilter: 'all',
      selectedDateRange: 'week'
    }));
  }
}