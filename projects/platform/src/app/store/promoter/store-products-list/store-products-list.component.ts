// store-products-list.component.ts
import { Component, OnInit, inject, signal, computed, OnDestroy, Input, SimpleChanges, OnChanges } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { FormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';

import { ApiService, DeviceService, UserInterface, CurrencyUtilsPipe } from '@shared/services';
import { Product } from '../../models';
import { HttpParams } from '@angular/common/http';
import { PromotionService } from '../services/promotion.service';
import { UserService } from '../../../common/services/user.service';

interface StoreInfo {
  _id: string;
  name: string;
  logo: string;
  storeLink: string;
  description?: string;
  verificationTier: string;
  isVerified: boolean;
  category?: string;
}

interface StoreProductsResponse {
  success: boolean;
  store: StoreInfo;
  data: Product[];
  total: number;
  count: number;
  totalPages: number;
  currentPage: number;
  filters: {
    categories: Array<{ name: string; count: number }>;
    priceRange: { minPrice: number; maxPrice: number; avgPrice: number };
    commissionRange: { minCommission: number; maxCommission: number; avgCommission: number };
  };
}

type SortOption = 'newest' | 'oldest' | 'price_low' | 'price_high' | 'name' | 'popularity' | 'bestselling' | 'discount';

@Component({
  selector: 'app-store-products-list',
  standalone: true,
  providers: [PromotionService],
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatBadgeModule,
    MatDividerModule,
    MatSnackBarModule,
    MatMenuModule,
    MatTableModule,
    MatCheckboxModule,
    MatSelectModule,
    CurrencyUtilsPipe,
    TitleCasePipe
  ],
  templateUrl: './store-products-list.component.html',
  styleUrls: ['./store-products-list.component.scss']
})
export class StoreProductsListComponent implements OnInit, OnDestroy, OnChanges {
  @Input({ required: true }) storeId!: string;
  @Input() user!: UserInterface | null;

  private apiService = inject(ApiService);
  private promotionService = inject(PromotionService);
  private userService = inject(UserService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private deviceService = inject(DeviceService);
  private destroy$ = new Subject<void>();

  deviceType = computed(() => this.deviceService.type());

  // Component signals
  store = signal<StoreInfo | null>(null);
  products = signal<Product[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  
  // Pagination
  totalProducts = signal<number>(0);
  totalPages = signal<number>(0);
  currentPage = signal<number>(1);
  pageSize = signal<number>(12);

  // Filter signals
  categories = signal<Array<{ name: string; count: number }>>([]);
  priceRange = signal<{ minPrice: number; maxPrice: number; avgPrice: number }>({ minPrice: 0, maxPrice: 0, avgPrice: 0 });
  commissionRange = signal<{ minCommission: number; maxCommission: number; avgCommission: number }>({ minCommission: 0, maxCommission: 0, avgCommission: 0 });

  // Current filters
  searchQuery = signal<string>('');
  selectedCategory = signal<string>('');
  selectedSort = signal<SortOption>('newest');
  inStockOnly = signal<boolean>(false);
  minPrice = signal<number | null>(null);
  maxPrice = signal<number | null>(null);
  minCommission = signal<number | null>(null);
  maxCommission = signal<number | null>(null);

  // Active promotions
  activePromotions = signal<Map<string, any>>(new Map());

  // Search debounce
  private searchSubject = new Subject<string>();

  constructor() {
    // Get user from service if not provided as input
    if (!this.user) {
      this.user = this.userService.user();
    }
  }

  ngOnInit(): void {
    // If storeId not provided as input, get from route params
    if (!this.storeId) {
      this.route.params.pipe(
        takeUntil(this.destroy$)
      ).subscribe(params => {
        const id = params['storeId'];
        if (id) {
          this.storeId = id;
          this.setupSearchDebounce();
          this.loadProducts();
        }
      });
    } else {
      this.setupSearchDebounce();
      this.loadProducts();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['storeId'] && !changes['storeId'].firstChange) {
      this.resetFilters();
      this.loadProducts();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage.set(1);
      this.loadProducts();
    });
  }

  onSearchInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.searchQuery.set(query);
    this.searchSubject.next(query);
  }

  async loadProducts(): Promise<void> {
    if (!this.storeId) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      let params = new HttpParams()
        .set('page', this.currentPage().toString())
        .set('limit', this.pageSize().toString())
        .set('sortBy', this.selectedSort());

      if (this.searchQuery()) {
        params = params.set('search', this.searchQuery());
      }
      if (this.selectedCategory()) {
        params = params.set('category', this.selectedCategory());
      }
      if (this.inStockOnly()) {
        params = params.set('inStock', 'true');
      }
      if (this.minPrice() !== null) {
        params = params.set('minPrice', this.minPrice()!.toString());
      }
      if (this.maxPrice() !== null) {
        params = params.set('maxPrice', this.maxPrice()!.toString());
      }
      if (this.minCommission() !== null) {
        params = params.set('minCommission', this.minCommission()!.toString());
      }
      if (this.maxCommission() !== null) {
        params = params.set('maxCommission', this.maxCommission()!.toString());
      }

      // FIXED: Correct API endpoint path
      const response = await this.apiService.get<StoreProductsResponse>(
        `api/v1/stores/product/${this.storeId}/store-published-products`,
        params,
        undefined,
        true
      ).toPromise();

      if (!response || !response.success) {
        this.error.set('Failed to load products.');
        this.products.set([]);
        this.totalProducts.set(0);
        this.totalPages.set(0);
        return;
      }

      this.store.set(response.store);
      this.products.set(response.data);
      this.totalProducts.set(response.total);
      this.totalPages.set(response.totalPages);
      
      // Set filter options
      if (response.filters?.categories) {
        this.categories.set(response.filters.categories);
      }
      if (response.filters?.priceRange) {
        this.priceRange.set(response.filters.priceRange);
      }
      if (response.filters?.commissionRange) {
        this.commissionRange.set(response.filters.commissionRange);
      }

    } catch (err) {
      console.error('Error loading store products:', err);
      this.error.set('Failed to load products. Please try again.');
      this.snackBar.open('Failed to load products', 'Close', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.selectedCategory.set('');
    this.selectedSort.set('newest');
    this.inStockOnly.set(false);
    this.minPrice.set(null);
    this.maxPrice.set(null);
    this.minCommission.set(null);
    this.maxCommission.set(null);
    this.currentPage.set(1);
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadProducts();
  }

  clearFilters(): void {
    this.resetFilters();
    this.loadProducts();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.loadProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onSortChange(sort: SortOption): void {
    this.selectedSort.set(sort);
    this.applyFilters();
  }

  onCategoryChange(category: string): void {
    this.selectedCategory.set(category === this.selectedCategory() ? '' : category);
    this.applyFilters();
  }

  viewProductDetails(product: Product): void {
    this.router.navigate(['dashboard/stores/product', product._id]);
  }

  buyProduct(product: Product): void {
    if (!product?._id) return;
    this.router.navigate(['/product', product._id], {
      queryParams: {
        source: 'promoter-store-products'
      }
    });
  }

  visitStore(): void {
    if (this.store()?.storeLink) {
      this.router.navigate(['/store', this.store()?.storeLink]);
    }
  }

  generateWhatsAppMessage(product: Product): void {
    void this.shareGeneratedWhatsAppMessage(product);
    /*
    return;

    const storeName = this.store()?.name || 'this store';
    const discountPercent = this.getDiscountPercentage(product);
    
    const message = `*${product.name}*
    
🛍️ Check out this product from ${storeName}!

💰 *Price:* $${product.price.toLocaleString()}
${discountPercent > 0 ? `⚠️ *Was:* $${product.originalPrice?.toLocaleString()} (${discountPercent}% OFF)` : ''}
${product.promotion?.commissionRate ? `💵 *Earn:* ${product.promotion.commissionRate}% commission` : ''}

🔗 *View product:*
${window.location.origin}/product/${product._id}

Don't miss out! 🎯`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    */
  }

  private async shareGeneratedWhatsAppMessage(product: Product): Promise<void> {
    const promotion = await this.createPromotion(product);
    if (!promotion) return;

    this.shareOnWhatsApp(product, promotion.trackingCode, promotion.affiliateUrl);
  }

  async onPromote(product: Product): Promise<void> {
    const promotion = await this.createPromotion(product);
    if (promotion) {
      await navigator.clipboard.writeText(promotion.affiliateUrl);
      this.shareOnWhatsApp(product, promotion.trackingCode, promotion.affiliateUrl);
    }
  }

  async copyProductUrl(product: Product): Promise<void> {
    try {
      const existingPromotion = this.activePromotions().get(product._id ?? '');
      
      if (!existingPromotion) {
        const promotion = await this.createPromotion(product);
        if (!promotion) return;
        
        await navigator.clipboard.writeText(promotion.affiliateUrl);
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

  async createPromotion(product: Product): Promise<{ trackingCode: string; uniqueId: string; affiliateUrl: string } | null> {
    try {
      const promoterId = this.user?._id;
      if (!promoterId) {
        this.snackBar.open('You must be logged in to promote products', 'Close', { duration: 5000 });
        return null;
      }

      const existingPromotion = this.activePromotions().get(product._id ?? '');
      
      if (existingPromotion) {
        return {
          trackingCode: existingPromotion.uniqueCode,
          uniqueId: existingPromotion.uniqueId,
          affiliateUrl: existingPromotion.affiliateUrl || this.promotionService.getTrackingLink(existingPromotion.uniqueCode, product._id ?? '')
        };
      }

      const snackBarRef = this.snackBar.open('Creating promotion link...', 'Close', { duration: 3000 });

      const response = await this.promotionService.createPromotion({
        productId: product._id ?? '',
        promoterId: promoterId,
        storeId: product.store._id,
        commissionRate: product.promotion?.commissionRate || 0,
        commissionType: product.promotion?.commissionType || 'percentage',
        fixedCommission: product.promotion?.fixedCommission || 0
      }).toPromise();

      const trackingCode = response.data.uniqueCode;
      const uniqueId = response.data.uniqueId;
      const affiliateUrl = response.data.affiliateUrl || response.data.promotionUrl || this.promotionService.getTrackingLink(trackingCode, product._id ?? '');

      this.activePromotions.update(map => {
        map.set(product._id ?? '', {
          uniqueCode: trackingCode,
          uniqueId: uniqueId,
          affiliateUrl,
          ...response.data
        });
        return new Map(map);
      });

      snackBarRef.dismiss();
      this.snackBar.open('Promotion link created!', 'Close', { duration: 3000 });

      return { trackingCode, uniqueId, affiliateUrl };
    } catch (error) {
      console.error('Error creating promotion:', error);
      this.snackBar.open('Failed to create promotion link.', 'Close', { duration: 5000 });
      return null;
    }
  }

  shareOnWhatsApp(product: Product, trackingCode: string, affiliateUrl?: string): void {
    const message = this.promotionService.generateWhatsAppMessage(
      product,
      trackingCode,
      product.promotion?.commissionRate || 0,
      product.price,
      affiliateUrl
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  }

  getDiscountPercentage(product: Product): number {
    if (product.originalPrice && product.originalPrice > product.price) {
      return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    }
    return 0;
  }

  getStockStatus(product: Product): { label: string; class: string } {
    // if (!product.isInStock) {
    //   return { label: 'Out of Stock', class: 'out-of-stock' };
    // }
    // if (product.isLowStock) {
    //   return { label: 'Low Stock', class: 'low-stock' };
    // }
    return { label: 'In Stock', class: 'in-stock' };
  }

  trackByProductId(index: number, product: Product): string {
    return product._id || index.toString();
  }
}
