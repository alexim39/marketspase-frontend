// components/store-dashboard/store-dashboard.component.ts
import { Component, inject, signal, computed, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil, interval } from 'rxjs';

import { StoreService } from '../../services/store.service';
import { UserService } from '../../../common/services/user.service';
import { DeviceService } from '../../../../../../shared-services/src/public-api';
import { Store, StoreAnalytics } from '../../models/store.model';
import { ProductManagementComponent } from '../product-management/product-management.component';
import { StoreAnalyticsComponent } from '../store-analytics/store-analytics.component';
import { StorePromotionsComponent } from '../store-promotions/store-promotions.component';
import { RealTimeStatsComponent } from '../real-time-stats/real-time-stats.component';
import { QuickActionBarComponent } from '../quick-action-bar/quick-action-bar.component';
import { StoreHeaderComponent } from '../store-header/store-header.component';
import { Product } from '../../models';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';

interface StoreStat {
  icon: string;
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  color: string;
  subtitle?: string;
  progress?: number;
  format?: 'number' | 'currency' | 'percentage';
}

interface PerformanceMetric {
  label: string;
  current: number;
  previous: number;
  trend: 'up' | 'down' | 'neutral';
  changePercent: number;
}

@Component({
  selector: 'app-store-dashboard',
  standalone: true,
  providers: [StoreService],
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatProgressBarModule,
    MatMenuModule,
    MatBadgeModule,
    MatTooltipModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    ProductManagementComponent,
    StoreAnalyticsComponent,
    StorePromotionsComponent,
    RealTimeStatsComponent,
    QuickActionBarComponent,
    StoreHeaderComponent,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    StoreAnalyticsComponent
  ],
  templateUrl: './store-dashboard.component.html',
  styleUrls: ['./store-dashboard.component.scss']
})
export class StoreDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  protected storeService = inject(StoreService);
  private userService = inject(UserService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private deviceService = inject(DeviceService);

  // Enhanced Signals
  public user = this.userService.user;
  public stores = this.storeService.storesState;
  public currentStore = this.storeService.currentStoreState;
  public products = this.storeService.productsState;
  public loading = this.storeService.loadingState;

  public isMobile = computed(() => this.deviceService.deviceState().isMobile);
  public activeTab = signal<'overview' | 'products' | 'analytics' | 'promotions' | 'settings'>('overview');
  public tabs = ['overview', 'products', 'analytics', 'promotions', 'settings'] as const;
  
  // New feature signals
  public realTimeUpdates = signal<boolean>(true);
  public autoRefresh = signal<boolean>(false);
  public viewMode = signal<'grid' | 'list'>('grid');
  public searchQuery = signal<string>('');
  public selectedCategory = signal<string>('all');

  // Performance metrics
  public performanceMetrics = computed((): PerformanceMetric[] => {
    const store = this.currentStore();
    if (!store) return [];

    return [
      {
        label: 'Sales Conversion',
        current: store.analytics.conversionRate,
        previous: Math.max(0, store.analytics.conversionRate - 2.5),
        trend: store.analytics.conversionRate > 5 ? 'up' : 'down',
        changePercent: 2.5
      },
      {
        label: 'Customer Engagement',
        current: store.analytics.promoterTraffic,
        previous: Math.max(0, store.analytics.promoterTraffic - 150),
        trend: 'up',
        changePercent: 12
      },
      {
        label: 'Revenue Growth',
        current: store.analytics.salesData.totalRevenue,
        previous: Math.max(0, store.analytics.salesData.totalRevenue - 5000),
        trend: 'up',
        changePercent: 8
      }
    ];
  });

  // Enhanced dashboard stats with real-time data
  public dashboardStats = computed((): StoreStat[] => {
    const store = this.currentStore();
    if (!store) return [];

    const totalProducts = this.products().length;
    const activeProducts = this.products().filter(p => p.isActive).length;
    const outOfStockProducts = this.products().filter(p => p.quantity === 0).length;

    return [
      {
        icon: 'storefront',
        label: 'Store Views',
        value: store.analytics.totalViews.toLocaleString(),
        change: '+12',
        trend: 'up',
        color: '#667eea',
        subtitle: `${store.analytics.promoterTraffic} from promoters`,
        progress: 75,
        format: 'number'
      },
      {
        icon: 'shopping_cart',
        label: 'Total Sales',
        value: store.analytics.totalSales.toString(),
        change: '+8',
        trend: 'up',
        color: '#4caf50',
        subtitle: `₦${store.analytics.salesData.totalRevenue.toLocaleString()} revenue`,
        progress: 60,
        format: 'number'
      },
      {
        icon: 'trending_up',
        label: 'Conversion Rate',
        value: `${store.analytics.conversionRate}%`,
        change: '+2.5',
        trend: 'up',
        color: '#ff9800',
        subtitle: 'Overall performance',
        progress: store.analytics.conversionRate,
        format: 'percentage'
      },
      {
        icon: 'inventory_2',
        label: 'Product Health',
        value: `${activeProducts}/${totalProducts}`,
        trend: outOfStockProducts > 0 ? 'down' : 'neutral',
        color: outOfStockProducts > 0 ? '#f44336' : '#2196f3',
        subtitle: `${outOfStockProducts} out of stock`,
        progress: (activeProducts / totalProducts) * 100,
        format: 'number'
      }
    ];
  });

  // Enhanced low stock alert with severity levels
  public lowStockProducts = computed(() => {
    const products = this.products().filter(product => 
      product.quantity <= product.lowStockAlert && product.isActive
    );
    
    return products.map(product => ({
      ...product,
      severity: product.quantity === 0 ? 'critical' : 
                product.quantity <= 2 ? 'high' : 'medium'
    }));
  });

  // Filtered products based on search and category
  public filteredProducts = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const category = this.selectedCategory();
    
    return this.products().filter(product => {
      const matchesSearch = !query || 
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query);
      
      const matchesCategory = category === 'all' || product.category === category;
      
      return matchesSearch && matchesCategory;
    });
  });

  // Quick actions with permissions
  public quickActions = computed(() => {
    const store = this.currentStore();
    const canPromote = store && store.isVerified;
    
    return [
      {
        icon: 'add_circle',
        label: 'Add Product',
        description: 'Add new items to your store',
        action: () => this.addProduct(),
        color: 'primary',
        disabled: false
      },
      {
        icon: 'campaign',
        label: 'Create Promotion',
        description: 'Launch a promoter campaign',
        action: () => this.activeTab.set('promotions'),
        color: 'accent',
        disabled: !canPromote
      },
      {
        icon: 'analytics',
        label: 'View Analytics',
        description: 'Check store performance',
        action: () => this.activeTab.set('analytics'),
        color: 'primary',
        disabled: false
      },
      {
        icon: 'settings',
        label: 'Store Settings',
        description: 'Configure store preferences',
        action: () => this.activeTab.set('settings'),
        color: 'primary',
        disabled: false
      }
    ];
  });

  // Auto-refresh effect
  private autoRefreshEffect = effect(() => {
    if (this.autoRefresh() && this.currentStore()) {
      const refreshSubscription = interval(30000) // 30 seconds
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.refreshStoreData();
        });
    }
  });

  ngOnInit(): void {
    this.loadStores();
    this.setupRealTimeUpdates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStores(): void {
    this.storeService.getStores().subscribe({
      error: (error) => {
        this.showError('Failed to load stores');
      }
    });
  }

  refreshStoreData(): void {
    const store = this.currentStore();
    if (store) {
      this.storeService.getStoreById(store._id!).subscribe({
        error: (error) => {
          console.error('Failed to refresh store data:', error);
        }
      });
    }
  }

  setupRealTimeUpdates(): void {
    // Simulate real-time updates
    if (this.realTimeUpdates()) {
      interval(10000) // 10 seconds
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          // Update analytics with simulated real-time data
          const store = this.currentStore();
          if (store) {
            const updatedAnalytics: StoreAnalytics = {
              ...store.analytics,
              totalViews: store.analytics.totalViews + Math.floor(Math.random() * 10),
              promoterTraffic: store.analytics.promoterTraffic + Math.floor(Math.random() * 5)
            };
            
            // This would typically come from a WebSocket or SSE
            this.storeService.currentStore.update(current => 
              current ? { ...current, analytics: updatedAnalytics } : null
            );
          }
        });
    }
  }

  createStore(): void {
    this.router.navigate(['/dashboard/stores/create']);
  }

  manageStore(storeId: string): void {
    this.storeService.getStoreById(storeId).subscribe();
    this.storeService.getStoreProducts(storeId).subscribe();
    this.router.navigate(['/dashboard/stores', storeId]);
  }

  addProduct(): void {
    const store = this.currentStore();
    if (store) {
      this.router.navigate(['/dashboard/stores', store._id, 'products', 'create']);
    }
  }

  verifyStore(): void {
    const store = this.currentStore();
    if (store) {
      this.storeService.verifyStore(store._id!, 'premium').subscribe({
        next: () => {
          this.showSuccess('Store verification submitted!');
        },
        error: () => {
          this.showError('Verification failed');
        }
      });
    }
  }

  toggleRealTimeUpdates(): void {
    this.realTimeUpdates.update(value => !value);
  }

  toggleAutoRefresh(): void {
    this.autoRefresh.update(value => !value);
  }

  switchViewMode(mode: 'grid' | 'list'): void {
    this.viewMode.set(mode);
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
  }

  onCategoryChange(category: string): void {
    this.selectedCategory.set(category);
  }

  exportStoreData(): void {
    // Implement export functionality
    this.showSuccess('Export started...');
  }

  duplicateStore(): void {
    const store = this.currentStore();
    if (store) {
      // Implement duplicate store logic
      this.showSuccess('Store duplication in progress...');
    }
  }

  archiveStore(): void {
    const store = this.currentStore();
    if (store) {
      // Implement archive logic with confirmation
      if (confirm('Are you sure you want to archive this store?')) {
        this.showSuccess('Store archived successfully');
      }
    }
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'OK', { 
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'OK', { 
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  trackByProductId(index: number, product: Product): string {
    return product._id!;
  }

  trackByStatId(index: number, stat: StoreStat): string {
    return stat.label;
  }

  trackByMetricId(index: number, metric: PerformanceMetric): string {
    return metric.label;
  }

  trackByActionId(index: number, action: any): string {
    return action.label;
  }



  // Helper methods for the component
getTabIcon(tab: string): string {
  const icons: { [key: string]: string } = {
    overview: 'dashboard',
    products: 'inventory_2',
    analytics: 'analytics',
    promotions: 'campaign',
    settings: 'settings'
  };
  return icons[tab] || 'circle';
}

getTrendIcon(trend: 'up' | 'down' | 'neutral'): string {
  return trend === 'up' ? 'arrow_upward' : 
         trend === 'down' ? 'arrow_downward' : 'remove';
}

getProgressColor(stat: StoreStat): string {
  if (stat.progress! >= 80) return 'primary';
  if (stat.progress! >= 60) return 'accent';
  return 'warn';
}

formatStatValue(stat: StoreStat): string {
  if (stat.format === 'currency') {
    return stat.value.replace('₦', '');
  } else if (stat.format === 'percentage') {
    return stat.value.replace('%', '');
  }
  return stat.value;
}

getUniqueCategories(): string[] {
  const categories = new Set(this.products().map(p => p.category));
  return Array.from(categories);
}
}