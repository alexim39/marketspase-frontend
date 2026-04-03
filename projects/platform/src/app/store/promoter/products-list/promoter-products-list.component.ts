// promoter-products-list.component.ts
import { Component, OnInit, inject, signal, computed, OnDestroy, Signal, Input, effect } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

import { PromoterProductService } from '../../services/promoter-product.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DeviceService, UserInterface } from '../../../../../../shared-services/src/public-api';

// Child Components
import { ProductsHeaderComponent } from './components/products-header/products-header.component';
import { ProductsFilterSidebarComponent } from './components/products-filter-sidebar/products-filter-sidebar.component';
import { ProductsContentViewComponent } from './components/products-content-view/products-content-view.component';
import { FilterState, ViewMode, SortBy, SortDirection, PaginatedResponse } from './models/filter-state.model';
import { Product } from '../../models';

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

  private deviceService = inject(DeviceService);
  deviceType = computed(() => this.deviceService.type())

  // Signals
  products = signal<Product[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  
  // Pagination signals
  totalProducts = signal<number>(0);
  totalPages = signal<number>(0);
  currentPage = signal<number>(1);
  pageSize = signal<number>(12);

  // Filter signals
  categories = signal<Array<{ name: string; count: number }>>([]);
  priceRange = signal<[number, number]>([0, 10000]);
  commissionRange = signal<[number, number]>([0, 50]);

  // Current filter state
  private currentFilters = signal<Partial<FilterState>>({});

  // Statistics
  stats = computed(() => {
    const products = this.products();
    
    const totalCommissions = products.reduce((sum, p) => sum + p.promotion.commissionRate, 0);
    const avgCommission = products.length > 0 ? totalCommissions / products.length : 0;
    
    return {
      total: this.totalProducts(),
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
      const filters = this.currentFilters();
      const response = await this.productService.getPromoterStoreProducts({
        ...filters,
        page: this.currentPage(),
        limit: this.pageSize()
      }).toPromise();

      if (!response || !response.data) {
        this.error.set('No products found.');
        this.snackBar.open('No products available', 'Close', { duration: 5000 });
        this.products.set([]);
        this.totalProducts.set(0);
        this.totalPages.set(0);
        return;
      }

      console.log('produt lists response ',response)

      this.products.set(response.data);
      this.totalProducts.set(response.total);
      this.totalPages.set(response.totalPages);
      
      this.extractFilterOptions(response.filters);
    } catch (err) {
      this.error.set('Failed to load products. Please try again later.');
      this.snackBar.open('Failed to load products', 'Close', { duration: 5000 });
      console.error('Error loading products:', err);
    } finally {
      this.loading.set(false);
    }
  }

  private extractFilterOptions(filters: any): void {
    if (filters?.categories) {
      this.categories.set(filters.categories);
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
    // Reset to first page when filters change
    this.currentPage.set(1);
    
    // Store the filters
    this.currentFilters.set({
      searchQuery: filterState.searchQuery,
      selectedCategories: filterState.selectedCategories,
      selectedPriceRange: filterState.selectedPriceRange,
      selectedCommissionRange: filterState.selectedCommissionRange,
      sortBy: filterState.sortBy,
      sortDirection: filterState.sortDirection
    });
    
    // Reload products with new filters
    this.loadProducts();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadProducts();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1); // Reset to first page when changing page size
    this.loadProducts();
  }

  // Product actions
  viewProductDetails(product: Product): void {
    this.router.navigate(['dashboard/stores/product', product._id]);
  }

  generateWhatsAppMessage(product: Product): void {
    const message = `*${product.name}*

    Looking for something worth your money? Check this out

     *Price:* $${product.price}
     *Earn:* ${product.promotion.commissionRate}% commission

    🛒 *Order now:*
    ${window.location.origin}/promote/${product.promotion.trackingCode}

     *Store:* ${product.store.name}

    Don’t miss out — grab yours now or share with someone who needs this!`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

  getPerformanceColor(rate: number): string {
    if (rate >= 30) return 'success';
    if (rate >= 15) return 'warning';
    return 'primary';
  }

  getConversionRate(product: Product): number {
    const { viewCount, clickCount, conversions } = product.promotion;
    if (clickCount === 0) return 0;
    return (conversions / clickCount) * 100;
  }

  getStoreBadgeClass(tier: string): string {
    return tier === 'premium' ? 'premium-badge' : 'basic-badge';
  }

  retryLoading(): void {
    this.loadProducts();
  }
}