// components/store-dashboard/store-dashboard.component.ts
import { Component, inject, signal, computed, OnInit } from '@angular/core';
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

import { StoreService } from '../../services/store.service';
import { UserService } from '../../../common/services/user.service';
import { DeviceService } from '../../../../../../shared-services/src/public-api';
import { Product } from '../../models/store.model';
import { ProductManagementComponent } from '../product-management/product-management.component';
import { StoreAnalyticsComponent } from '../store-analytics/store-analytics.component';
import { StorePromotionsComponent } from '../store-promotions/store-promotions.component';

interface StoreStat {
  icon: string;
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down';
  color: string;
  subtitle?: string;
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
    ProductManagementComponent,
    StoreAnalyticsComponent,
    StorePromotionsComponent
  ],
  templateUrl: './store-dashboard.component.html',
  styleUrls: ['./store-dashboard.component.scss']
})
export class StoreDashboardComponent implements OnInit {
  protected storeService = inject(StoreService);
  private userService = inject(UserService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private deviceService = inject(DeviceService);

  // Signals
  public user = this.userService.user;
  public stores = this.storeService.storesState;
  public currentStore = this.storeService.currentStoreState;
  public products = this.storeService.productsState;
  public loading = this.storeService.loadingState;

  public isMobile = computed(() => this.deviceService.deviceState().isMobile);
  public activeTab = signal<'overview' | 'products' | 'analytics' | 'promotions'>('overview');
  tabs = ['overview', 'products', 'analytics', 'promotions'] as const;

  

  // Computed dashboard stats
  public dashboardStats = computed((): StoreStat[] => {
    const store = this.currentStore();
    if (!store) return [];

    return [
      {
        icon: 'storefront',
        label: 'Store Views',
        value: store.analytics.totalViews.toLocaleString(),
        change: '+12',
        trend: 'up',
        color: '#667eea',
        subtitle: `${store.analytics.promoterTraffic} from promoters`
      },
      {
        icon: 'shopping_cart',
        label: 'Total Sales',
        value: store.analytics.totalSales.toString(),
        change: '+8',
        trend: 'up',
        color: '#4caf50',
        subtitle: `₦${store.analytics.salesData.totalRevenue.toLocaleString()} revenue`
      },
      {
        icon: 'trending_up',
        label: 'Conversion Rate',
        value: `${store.analytics.conversionRate}%`,
        change: '+2.5',
        trend: 'up',
        color: '#ff9800',
        subtitle: 'Overall performance'
      },
      {
        icon: 'inventory_2',
        label: 'Active Products',
        value: this.products().filter(p => p.isActive).length.toString(),
        color: '#2196f3',
        subtitle: `${this.products().length} total products`
      }
    ];
  });

  // Low stock alert
  public lowStockProducts = computed(() => 
    this.products().filter(product => 
      product.quantity <= product.lowStockAlert && product.isActive
    )
  );

  ngOnInit(): void {
    this.loadStores();
  }

  loadStores(): void {
    this.storeService.getStores().subscribe({
      error: (error) => {
        this.snackBar.open('Failed to load stores', 'OK', { duration: 3000 });
      }
    });
  }

  createStore(): void {
    this.router.navigate(['/dashboard/stores/create']);
  }

  manageStore(storeId: string): void {
    this.storeService.getStoreById(storeId).subscribe();
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
          this.snackBar.open('Store verification submitted!', 'OK', { duration: 3000 });
        },
        error: () => {
          this.snackBar.open('Verification failed', 'OK', { duration: 3000 });
        }
      });
    }
  }

  trackByProductId(index: number, product: Product): string {
    return product._id!;
  }

  trackByStatId(index: number, stat: StoreStat): string {
    return stat.label;
  }
}