// promoter-products-list.component.ts
import { Component, OnInit, inject, signal, computed, OnDestroy, Signal, Input, effect } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

import { PromoterProductService } from '../../services/promoter-product.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DeviceService, UserInterface } from '../../../../../../shared-services/src/public-api';
import { PromotionService } from '../services/promotion.service';

// Child Components
import { ProductsHeaderComponent } from './components/products-header/products-header.component';
import { ProductsFilterSidebarComponent } from './components/products-filter-sidebar/products-filter-sidebar.component';
import { ProductsContentViewComponent } from './components/products-content-view/products-content-view.component';
import { FilterState, ViewMode, SortBy, SortDirection, PaginatedResponse } from './models/filter-state.model';
import { Product } from '../../models';
import { UserService } from '../../../common/services/user.service';

@Component({
  selector: 'app-promoter-products-list',
  standalone: true,
  providers: [PromoterProductService, PromotionService],
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
  private promotionService = inject(PromotionService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  private userService = inject(UserService);
  public user: Signal<UserInterface | null> = this.userService.user;

 // @Input({ required: true }) user!: Signal<UserInterface | null>;

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

  // Track active promotions per product
  activePromotions = signal<Map<string, any>>(new Map());

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

      console.log('product lists response ',response)

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

  // Promotion methods moved from child component
  async createPromotion(product: Product): Promise<{ trackingCode: string; uniqueId: string } | null> {
    try {
      const promoterId = this.user()?._id;
      if (!promoterId) {
        this.snackBar.open('You must be logged in to promote products', 'Close', { duration: 5000 });
        return null;
      }

      const snackBarRef = this.snackBar.open('Creating promotion link...', 'Close', { duration: 3000 });

      const existingPromotion = this.activePromotions().get(product._id ?? '');
      
      let trackingCode: string;
      let uniqueId: string;

      if (existingPromotion) {
        trackingCode = existingPromotion.uniqueCode;
        uniqueId = existingPromotion.uniqueId;
        snackBarRef.dismiss();
      } else {
        const response = await this.promotionService.createPromotion({
          productId: product._id ?? '',
          promoterId: promoterId,
          storeId: product.store._id,
          commissionRate: product.promotion.commissionRate,
          commissionType: product.promotion.commissionType,
          fixedCommission: product.promotion.fixedCommission
        }).toPromise();

        trackingCode = response.data.uniqueCode;
        uniqueId = response.data.uniqueId;

        this.activePromotions.update(map => {
          map.set(product._id ?? '', {
            uniqueCode: trackingCode,
            uniqueId: uniqueId,
            ...response.data
          });
          return new Map(map);
        });

        snackBarRef.dismiss();
        this.snackBar.open('Promotion link created successfully!', 'Close', { duration: 3000 });
      }

      return { trackingCode, uniqueId };
    } catch (error) {
      console.error('Error creating promotion:', error);
      this.snackBar.open('Failed to create promotion link. Please try again.', 'Close', { duration: 5000 });
      return null;
    }
  }

  async onPromote(product: Product): Promise<void> {
    const promotion = await this.createPromotion(product);
    if (promotion) {
      const trackingLink = this.promotionService.getTrackingLink(promotion.trackingCode, product._id ?? '');
      await navigator.clipboard.writeText(trackingLink);
      this.shareOnWhatsApp(product, promotion.trackingCode);
    }
  }

  async copyProductUrl(product: Product): Promise<void> {
    try {
      const existingPromotion = this.activePromotions().get(product._id ?? '');

      if (!existingPromotion) {
        // Create promotion first if it doesn't exist
        const promotion = await this.createPromotion(product);
        if (!promotion) return;
        
        const trackingLink = this.promotionService.getTrackingLink(promotion.trackingCode, product._id ?? '');
        await navigator.clipboard.writeText(trackingLink);
        this.snackBar.open('Link copied to clipboard!', 'Close', { duration: 2000 });
      } else {
        const trackingLink = this.promotionService.getTrackingLink(
          existingPromotion.uniqueCode, 
          product._id ?? ''
        );
        await navigator.clipboard.writeText(trackingLink);
        this.snackBar.open('Link copied to clipboard!', 'Close', { duration: 2000 });
      }
    } catch (error) {
      console.error('Copy failed', error);
      this.snackBar.open('Failed to copy link.', 'Close', { duration: 3000 });
    }
  }

  shareOnWhatsApp(product: Product, trackingCode: string): void {
    const message = this.promotionService.generateWhatsAppMessage(
      product,
      trackingCode,
      product.promotion.commissionRate,
      product.price
    );
    
    window.open(`https://wa.me/?text=${message}`, '_blank');
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