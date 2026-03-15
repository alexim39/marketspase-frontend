// promoter-products-list.component.ts
import { Component, OnInit, inject, signal, computed, OnDestroy, Signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { PromoterProduct } from '../models/promoter-product.model';
import { PromoterProductService } from '../../services/promoter-product.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserInterface } from '../../../../../../shared-services/src/public-api';

// Child Components
import { ProductsHeaderComponent } from './components/products-header/products-header.component';
import { ProductsFilterSidebarComponent } from './components/products-filter-sidebar/products-filter-sidebar.component';
import { ProductsContentViewComponent } from './components/products-content-view/products-content-view.component';
import { FilterState, ViewMode, SortBy, SortDirection } from './models/filter-state.model';

@Component({
  selector: 'app-promoter-products-list',
  standalone: true,
  providers: [PromoterProductService],
  imports: [
    CommonModule,
    ProductsHeaderComponent,
    ProductsFilterSidebarComponent,
    ProductsContentViewComponent
  ],
  templateUrl: './promoter-products-list.component.html',
  styleUrls: ['./promoter-products-list.component.scss']
})
export class PromoterProductsListComponent implements OnInit, OnDestroy {
  private productService = inject(PromoterProductService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  @Input({ required: true }) user!: Signal<UserInterface | null>;

  // Signals
  products = signal<PromoterProduct[]>([]);
  filteredProducts = signal<PromoterProduct[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Filter signals
  categories = signal<string[]>([]);
  priceRange = signal<[number, number]>([0, 10000]);
  commissionRange = signal<[number, number]>([0, 50]);

  // Statistics
  stats = computed(() => {
    const products = this.filteredProducts();
    const totalCommissions = products.reduce((sum, p) => sum + p.promotion.commissionRate, 0);
    const avgCommission = products.length > 0 ? totalCommissions / products.length : 0;
    
    return {
      total: products.length,
      avgCommission,
      stores: new Set(products.map(p => p.store._id)).size,
      highCommission: products.filter(p => p.promotion.commissionRate >= 20).length
    };
  });

  ngOnInit(): void {
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadProducts(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await this.productService.getPromoterStoreProducts().toPromise();

      if (!response || !response.data || response.data.length === 0) {
        this.error.set('No products found.');
        this.snackBar.open('No products available', 'Close', { duration: 5000 });
        this.products.set([]);
        return;
      }

      this.products.set(response.data);
      this.extractFilterOptions(response.filters);
      this.applyFilters({} as FilterState);
    } catch (err) {
      this.error.set('Failed to load products. Please try again later.');
      this.snackBar.open('Failed to load products', 'Close', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }

  private extractFilterOptions(filters: any): void {
    if (filters?.categories) {
      const categories = filters.categories.map((cat: any) => cat.name);
      this.categories.set(categories.sort());
    }

    if (filters?.priceRange) {
      const { minPrice, maxPrice } = filters.priceRange;
      this.priceRange.set([minPrice, maxPrice]);
    }

    if (filters?.commissionRange) {
      const { minCommission, maxCommission } = filters.commissionRange;
      this.commissionRange.set([minCommission, maxCommission]);
    }
  }

  applyFilters(filterState: FilterState): void {
    let filtered = [...this.products()];

    // Apply search
    if (filterState.searchQuery) {
      const query = filterState.searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.store.name.toLowerCase().includes(query) ||
        product.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        product.category.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if ((filterState.selectedCategories?.length ?? 0) > 0) {
      filtered = filtered.filter(product => 
        filterState.selectedCategories!.includes(product.category)
      );
    }


    // Apply price filter
    if (filterState.selectedPriceRange) {
      const [minPrice, maxPrice] = filterState.selectedPriceRange;
      filtered = filtered.filter(product => 
        product.price >= minPrice && product.price <= maxPrice
      );
    }

    // Apply commission filter
    if (filterState.selectedCommissionRange) {
      const [minCommission, maxCommission] = filterState.selectedCommissionRange;
      filtered = filtered.filter(product => 
        product.promotion.commissionRate >= minCommission && 
        product.promotion.commissionRate <= maxCommission
      );
    }

    // Apply sorting
    if (filterState.sortBy) {
      filtered = this.sortProducts(filtered, filterState.sortBy, filterState.sortDirection || 'desc');
    }

    this.filteredProducts.set(filtered);
  }

  private sortProducts(products: PromoterProduct[], sortBy: SortBy, direction: SortDirection): PromoterProduct[] {
    const dir = direction === 'asc' ? 1 : -1;

    return [...products].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'commission':
          aValue = a.promotion.commissionRate;
          bValue = b.promotion.commissionRate;
          break;
        case 'popularity':
          aValue = (a.purchaseCount || 0) * (a.averageRating || 0);
          bValue = (b.purchaseCount || 0) * (b.averageRating || 0);
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'newest':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        default:
          aValue = a.promotion.commissionRate;
          bValue = b.promotion.commissionRate;
      }

      return (aValue > bValue ? 1 : -1) * dir;
    });
  }

  // Product actions
  viewProductDetails(product: PromoterProduct): void {
    this.router.navigate(['dashboard/stores/product', product._id]);
  }

  copyPromotionLink(product: PromoterProduct): void {
    const link = `${window.location.origin}/promote/${product.promotion.trackingCode}`;
    navigator.clipboard.writeText(link).then(() => {
      this.snackBar.open('Promotion link copied to clipboard!', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    }).catch(() => {
      this.snackBar.open('Failed to copy link', 'Close', { duration: 3000 });
    });
  }

  generateWhatsAppMessage(product: PromoterProduct): void {
    const message = `Check out this amazing product: ${product.name}\n\n` +
                   `💰 Price: $${product.price}\n` +
                   `🎯 Commission: ${product.promotion.commissionRate}%\n\n` +
                   `Shop now: ${window.location.origin}/promote/${product.promotion.trackingCode}\n\n` +
                   `From: ${product.store.name}`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

  getPerformanceColor(rate: number): string {
    if (rate >= 30) return 'success';
    if (rate >= 15) return 'warning';
    return 'primary';
  }

  getConversionRate(product: PromoterProduct): number {
    const { views, clicks, conversions } = product.promotion;
    if (clicks === 0) return 0;
    return (conversions / clicks) * 100;
  }

  getStoreBadgeClass(tier: string): string {
    return tier === 'premium' ? 'premium-badge' : 'basic-badge';
  }

  retryLoading(): void {
    this.loadProducts();
  }
}