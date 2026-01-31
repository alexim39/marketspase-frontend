// components/store-dashboard/store-dashboard.component.ts - FIXED VERSION
import { Component, inject, signal, computed, OnInit, OnDestroy, effect, WritableSignal, Signal, Input } from '@angular/core';
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
import { Subject, takeUntil, interval, Subscription } from 'rxjs';

import { StoreService } from '../../../services/store.service';
import { DeviceService, UserInterface } from '../../../../../../../shared-services/src/public-api';
import { Store} from '../../../models/store.model';
import { ProductManagementComponent } from '../product-management/product-management.component';
import { StoreAnalyticsComponent } from '../store-analytics/store-analytics.component';
import { StorePromotionsComponent } from '../store-promotions/store-promotions.component';
import { RealTimeStatsComponent } from '../real-time-stats/real-time-stats.component';
import { QuickActionBarComponent } from '../quick-action-bar/quick-action-bar.component';
import { StoreHeaderComponent } from '../store-header/store-header.component';
import { Product } from '../../../models';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { StoreManagerComponent } from '../../store-manager/store-manager.component';
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
  selector: 'app-marketer-store-dashboard',
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
    MatInputModule,
    StoreAnalyticsComponent
  ],
  templateUrl: './store-dashboard.component.html',
  styleUrls: ['./store-dashboard.component.scss']
})
export class MarketerStoreDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  protected storeService = inject(StoreService);
  //private userService = inject(UserService);
  //public user = this.userService.user;
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private deviceService = inject(DeviceService);

  @Input({ required: true }) user!: Signal<UserInterface | null>;;

  // Enhanced Signals
  public stores = this.storeService.storesState;
  public currentStore = this.storeService.currentStoreState;
  public products = this.storeService.productsState;
  public loading = this.storeService.loadingState;

  public isMobile = computed(() => this.deviceService.deviceState().isMobile);
  public activeTab: WritableSignal<'overview' | 'products' | 'analytics' | 'promotions' | 'settings'> 
    = signal<'overview' | 'products' | 'analytics' | 'promotions' | 'settings'>('overview');
  public tabs = ['overview', 'products', 'analytics', 'promotions', 'settings'] as const;
  
  // New feature signals
  public realTimeUpdates = signal<boolean>(true);
  public autoRefresh = signal<boolean>(false);
  public viewMode = signal<'grid' | 'list'>('grid');
  public searchQuery = signal<string>('');
  public selectedCategory = signal<string>('all');

   private dialog = inject(MatDialog);

  // Performance metrics - FIXED: Added proper typing
  public performanceMetrics = computed((): PerformanceMetric[] => {
    const store = this.currentStore();
    if (!store) return [];

    const salesData = store.analytics.salesData || {
      totalRevenue: 0,
      promoterDrivenSales: 0,
      averageOrderValue: 0,
      conversionRate: 0,
      topProducts: []
    };

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
        current: salesData.totalRevenue,
        previous: Math.max(0, salesData.totalRevenue - 5000),
        trend: 'up',
        changePercent: 8
      }
    ];
  });

  // Enhanced dashboard stats with real-time data - FIXED VERSION
  public dashboardStats = computed((): StoreStat[] => {
    const store = this.currentStore();
    if (!store) return [];

    const totalProducts = this.products().length;
    const activeProducts = this.products().filter(p => p.isActive).length;
    const outOfStockProducts = this.products().filter(p => p.quantity === 0).length;
    
    const salesData = store.analytics.salesData || {
      totalRevenue: 0,
      promoterDrivenSales: 0,
      averageOrderValue: 0,
      conversionRate: 0,
      topProducts: []
    };

    return [
      {
        icon: 'storefront',
        label: 'Store Views',
        value: store.analytics.totalViews.toLocaleString(),
        change: '+12',
        trend: 'up',
        color: '#667eea',
        subtitle: `${store.analytics.promoterTraffic} from promoters`,
        progress: Math.min(100, (store.analytics.totalViews / 1000) * 100), // Scale to 1000 views max
        format: 'number'
      },
      {
        icon: 'shopping_cart',
        label: 'Total Sales',
        value: store.analytics.totalSales.toString(),
        change: '+8',
        trend: 'up',
        color: '#4caf50',
        subtitle: `₦${salesData.totalRevenue.toLocaleString()} revenue`,
        progress: Math.min(100, (store.analytics.totalSales / 100) * 100), // Scale to 100 sales max
        format: 'number'
      },
      {
        icon: 'trending_up',
        label: 'Conversion Rate',
        value: `${store.analytics.conversionRate.toFixed(1)}%`,
        change: '+2.5',
        trend: 'up',
        color: '#ff9800',
        subtitle: 'Overall performance',
        progress: Math.min(100, store.analytics.conversionRate),
        format: 'percentage'
      },
      {
        icon: 'inventory_2',
        label: 'Product Health',
        value: `${activeProducts}/${totalProducts}`,
        trend: outOfStockProducts > 0 ? 'down' : (totalProducts === 0 ? 'neutral' : 'up'),
        color: outOfStockProducts > 0 ? '#f44336' : (totalProducts === 0 ? '#9e9e9e' : '#2196f3'),
        subtitle: `${outOfStockProducts} out of stock`,
        progress: totalProducts > 0 ? (activeProducts / totalProducts) * 100 : 0,
        format: 'number'
      }
    ];
  });

  // Enhanced low stock alert with severity levels
  public lowStockProducts = computed(() => {
    if (this.products()) {
        const products = this.products().filter(product => 
          product.quantity <= product.lowStockAlert && product.isActive
        );
        
        return products.map(product => ({
          ...product,
          severity: product.quantity === 0 ? 'critical' : 
                    product.quantity <= 2 ? 'high' : 'medium'
        }));
    }
    return []
  
  });

  // Filtered products based on search and category - FIXED VERSION
  public filteredProducts = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const category = this.selectedCategory();
    
    return this.products().filter(product => {
      const matchesSearch = !query || 
        product.name.toLowerCase().includes(query) ||
        product?.description?.toLowerCase().includes(query) ||
        (product.tags?.some(tag => tag.toLowerCase().includes(query)) || false);
      
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
        color: 'primary' as const,
        disabled: false
      },
      {
        icon: 'campaign',
        label: 'Create Promotion',
        description: 'Launch a promoter campaign',
        action: () => this.activeTab.set('promotions'),
        color: 'accent' as const,
        disabled: !canPromote
      },
      {
        icon: 'analytics',
        label: 'View Analytics',
        description: 'Check store performance',
        action: () => this.activeTab.set('analytics'),
        color: 'primary' as const,
        disabled: false
      },
      {
        icon: 'settings',
        label: 'Store Settings',
        description: 'Configure store preferences',
        action: () => this.activeTab.set('settings'),
        color: 'primary' as const,
        disabled: false
      }
    ];
  });

  // Auto-refresh subscription
  private autoRefreshSubscription?: Subscription;
  private realTimeSubscription?: Subscription;

  // Auto-refresh effect
  private autoRefreshEffect = effect(() => {
    if (this.autoRefresh() && this.currentStore()) {
      // Clear existing subscription
      if (this.autoRefreshSubscription) {
        this.autoRefreshSubscription.unsubscribe();
      }
      
      // Start new auto-refresh
      this.autoRefreshSubscription = interval(30000) // 30 seconds
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.refreshStoreData();
        });
    } else if (this.autoRefreshSubscription) {
      this.autoRefreshSubscription.unsubscribe();
      this.autoRefreshSubscription = undefined;
    }
  });

  // Real-time updates effect
  // private realTimeEffect = effect(() => {
  //   if (this.realTimeUpdates() && this.currentStore()) {
  //     this.setupRealTimeUpdates();
  //   } else if (this.realTimeSubscription) {
  //     this.realTimeSubscription.unsubscribe();
  //     this.realTimeSubscription = undefined;
  //   }
  // });

  ngOnInit(): void {
    this.loadStores();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.autoRefreshSubscription) {
      this.autoRefreshSubscription.unsubscribe();
    }
    
    if (this.realTimeSubscription) {
      this.realTimeSubscription.unsubscribe();
    }
  }

  openStoreManager(): void {
    const dialogRef = this.dialog.open(StoreManagerComponent, {
      width: '600px',
      maxHeight: '80vh',
      data: {
        stores: this.stores() // Pass the current stores as data
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Refresh stores if changes were made
        this.loadStores();
      }
    });
  }

  viewStoreProducts(storeId: string) {
    this.router.navigate(['/dashboard/stores', storeId, 'products']);
  }

  loadStores(): void {
    const userId = this.user()?._id;
    if (!userId) {
      this.showError('User not found. Please log in again.');
      return;
    }

    this.storeService.getStores(userId).subscribe({
      next: (stores) => {
        
        if (stores.data.length > 0) {
          // Find the store with isDefaultStore: true
          const defaultStore = stores.data.find((store: Store) => store.isDefaultStore);
          
          // If no current store is selected OR we found a default store, select it
          if (!this.currentStore() || defaultStore) {
            const storeToSelect = defaultStore || stores.data[0];
            
            // Directly set the default or first store as current
            this.storeService.currentStore.set(storeToSelect);
            
            // Also load products for this store
            this.storeService.getStoreProducts(storeToSelect._id!).subscribe();
            
            // if (defaultStore) {
            //   console.log('Default store selected:', defaultStore.name);
            // } else {
            //   console.log('No default store found, selecting first store');
            // }
          }
        }
      },
      error: (error) => {
        console.error('Failed to load stores:', error);
        this.showError('Failed to load stores. Please try again.');
      }
    });
  }

  refreshStoreData(): void {
    const store = this.currentStore();
    if (store && store._id) {
      this.storeService.getStoreById(store._id).subscribe({
        error: (error) => {
          console.error('Failed to refresh store data:', error);
        }
      });
      
      // Also refresh products
      this.storeService.getStoreProducts(store._id).subscribe({
        error: (error) => {
          console.error('Failed to refresh products:', error);
        }
      });
    }
  }

  // setupRealTimeUpdates(): void {
  //   // Clear existing subscription
  //   if (this.realTimeSubscription) {
  //     this.realTimeSubscription.unsubscribe();
  //   }

  //   // Simulate real-time updates (in production, use WebSockets or SSE)
  //   this.realTimeSubscription = interval(10000) // 10 seconds
  //     .pipe(takeUntil(this.destroy$))
  //     .subscribe(() => {
  //       const store = this.currentStore();
  //       if (store) {
  //         // Simulate real-time data changes
  //         const updatedAnalytics: StoreAnalytics = {
  //           ...store.analytics,
  //           totalViews: store.analytics.totalViews + Math.floor(Math.random() * 5),
  //           promoterTraffic: store.analytics.promoterTraffic + Math.floor(Math.random() * 3)
  //         };
          
  //         // Update the store analytics in the service
  //         this.storeService.updateStoreAnalytics(store._id!, updatedAnalytics);
  //       }
  //     });
  // }

  createStore(): void {
    this.router.navigate(['/dashboard/stores/create']);
  }

  manageStore(storeId: string): void {
    this.storeService.getStoreById(storeId).subscribe({
      next: () => {
        this.storeService.getStoreProducts(storeId).subscribe();
        this.router.navigate(['/dashboard/stores', storeId]);
      },
      error: (error) => {
        console.error('Failed to load store:', error);
        this.showError('Failed to load store details.');
      }
    });
  }

  addProduct(): void {
    const store = this.currentStore();
    if (store && store._id) {
      this.router.navigate(['/dashboard/stores', store._id, 'products', 'create']);
    } else {
      this.showError('Please select a store first.');
    }
  }

  verifyStore(): void {
    // const store = this.currentStore();
    // if (store && store._id) {
    //   this.storeService.verifyStore(store._id, 'premium').subscribe({
    //     next: () => {
    //       this.showSuccess('Store verification submitted!');
    //     },
    //     error: (error) => {
    //       console.error('Verification failed:', error);
    //       this.showError('Verification failed. Please try again.');
    //     }
    //   });
    // }
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
    // In production, implement actual export
    this.showSuccess('Export started. You will receive an email when it\'s ready.');
  }

  duplicateStore(): void {
    const store = this.currentStore();
    if (store) {
      this.showSuccess('Store duplication in progress...');
      // Implement actual duplication logic
    }
  }

  archiveStore(): void {
    const store = this.currentStore();
    if (store) {
      // Implement archive logic with confirmation
      const confirmLeave = confirm('Are you sure you want to archive this store? Archived stores can be restored later.');
      if (confirmLeave) {
        this.showSuccess('Store archived successfully');
        // Implement actual archive logic
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

  uniqueCategories = computed(() => {
    // Use optional chaining and default to empty array immediately
    const products = this.products() || [];
    
    // Ensure we are mapping over an array
    const categories = new Set(
      products.map((p: any) => p.category).filter(Boolean)
    );
    
    return Array.from(categories);
  });

}