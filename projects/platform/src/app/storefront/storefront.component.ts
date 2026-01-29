// storefront.component.ts (UPDATED)
import { 
  Component, OnInit, inject, signal, OnDestroy, computed, ViewChild, ElementRef, 
  Renderer2, AfterViewInit 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule, NavigationEnd } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { 
  Subject, debounceTime, distinctUntilChanged, takeUntil, filter 
} from 'rxjs';

// Child Components
import { StoreHeaderComponent } from './components/store-header/store-header.component';
import { StoreFooterComponent } from './components/store-footer/store-footer.component';
import { StoreControlsComponent } from './components/store-controls/store-controls.component';
import { ProductGridCardComponent } from './components/product-grid-card/product-grid-card.component';
import { ProductListItemComponent } from './components/product-list-item/product-list-item.component';
import { PaginationComponent } from './components/pagination/pagination.component';
import { LoadingStateComponent } from './components/loading-state/loading-state.component';
import { EmptyStateComponent } from './components/empty-state/empty-state.component';
import { ErrorStateComponent } from './components/error-state/error-state.component';
import { FabContainerComponent } from './components/fab-container/fab-container.component';

// Services
import { CartService } from './services/cart.service';
import { WishlistService } from './services/wishlist.service';
import { StorefrontService } from './services/storefront.service';

// Components
import { FilterSidebarComponent } from './components/filter-sidebar/filter-sidebar.component';
import { ProductQuickViewComponent } from './components/product-quick-view/product-quick-view.component';

// Models
import { Product, Store } from '../store/models';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-storefront',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    // Child Components
    StoreHeaderComponent,
    StoreFooterComponent,
    StoreControlsComponent,
    ProductGridCardComponent,
    ProductListItemComponent,
    PaginationComponent,
    LoadingStateComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    FabContainerComponent,
    // Existing Components
    FilterSidebarComponent,
    MatIconModule
  ],
  providers: [StorefrontService, CartService, WishlistService],
  templateUrl: './storefront.component.html',
  styleUrls: ['./storefront.component.scss']
})
export class StorefrontComponent implements OnInit, OnDestroy, AfterViewInit {
  private route = inject(ActivatedRoute);
  public router = inject(Router);
  private storeService = inject(StorefrontService);
  private cartService = inject(CartService);
  private wishlistService = inject(WishlistService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private bottomSheet = inject(MatBottomSheet);
  private renderer = inject(Renderer2);
  private destroy$ = new Subject<void>();

  // Signals (unchanged)
  store = signal<Store | null>(null);
  products = signal<Product[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  viewMode = signal<'grid' | 'list' | 'compact'>('grid');
  selectedCategory = signal<string | null>(null);
  currentPage = signal<number>(1);
  pageSize = signal<number>(12);
  selectedProduct = signal<Product | null>(null);
  showFilters = signal<boolean>(false);
  isScrolled = signal<boolean>(false);
  lastScrollTop = signal<number>(0);

  // Price Range Filter
  minPrice = signal<number>(0);
  maxPrice = signal<number>(5000);
  priceRange = signal<[number, number]>([0, 5000]);
  
  // Advanced Filters
  availability = signal<'all' | 'in-stock' | 'out-of-stock'>('all');
  ratingFilter = signal<number>(0);
  tagsFilter = signal<string[]>([]);
  brandFilter = signal<string[]>([]);

  // Form Controls
  searchControl = new FormControl('');
  sortControl = new FormControl('newest');
  
  // Animation state
  productsLoaded = signal<boolean>(false);

  // Computed values (unchanged)
  categories = computed(() => {
    const products = this.products();
    const categories = new Map<string, number>();
    
    products.forEach(p => {
      const count = categories.get(p.category) || 0;
      categories.set(p.category, count + 1);
    });
    
    return Array.from(categories.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ({ category, count }));
  });

  brands = computed(() => {
    const products = this.products();
    const brands = new Map<string, number>();
    
    products.forEach(p => {
      if (p.brand) {
        const count = brands.get(p.brand) || 0;
        brands.set(p.brand, count + 1);
      }
    });
    
    return Array.from(brands.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([brand, count]) => ({ brand, count }));
  });

  tags = computed(() => {
    const products = this.products();
    const allTags = products.flatMap(p => p.tags || []);
    const tagCounts = new Map<string, number>();
    
    allTags.forEach(tag => {
      const count = tagCounts.get(tag) || 0;
      tagCounts.set(tag, count + 1);
    });
    
    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag, count]) => ({ tag, count }));
  });

  filteredProducts = computed(() => {
    let filtered = [...this.products()];
    const searchTerm = this.searchControl.value?.toLowerCase();
    const category = this.selectedCategory();
    const sortBy = this.sortControl.value;
    const [minPriceFilter, maxPriceFilter] = this.priceRange();
    const availabilityFilter = this.availability();
    const ratingFilterVal = this.ratingFilter();
    const tagsFilterVal = this.tagsFilter();
    const brandFilterVal = this.brandFilter();

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.description?.toLowerCase().includes(searchTerm) ||
        product.tags?.some(tag => tag.toLowerCase().includes(searchTerm)) ||
        product.brand?.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by category
    if (category) {
      filtered = filtered.filter(product => product.category === category);
    }

    // Filter by price range
    filtered = filtered.filter(product => 
      product.price >= minPriceFilter && product.price <= maxPriceFilter
    );

    // Filter by availability
    if (availabilityFilter === 'in-stock') {
      filtered = filtered.filter(product => !product.manageStock || product.quantity > 0);
    } else if (availabilityFilter === 'out-of-stock') {
      filtered = filtered.filter(product => product.manageStock && product.quantity === 0);
    }

    // Filter by rating
    if (ratingFilterVal > 0) {
      filtered = filtered.filter(product => product.averageRating >= ratingFilterVal);
    }

    // Filter by tags
    if (tagsFilterVal.length > 0) {
      filtered = filtered.filter(product => 
        tagsFilterVal.every(tag => product.tags?.includes(tag))
      );
    }

    // Filter by brands
    if (brandFilterVal.length > 0) {
      filtered = filtered.filter(product => 
        product.brand && brandFilterVal.includes(product.brand)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'popular':
          return b.purchaseCount - a.purchaseCount;
        case 'rating':
          return b.averageRating - a.averageRating;
        case 'discount':
          const discountA = this.calculateDiscount(a.price, a.originalPrice ?? 0);
          const discountB = this.calculateDiscount(b.price, b.originalPrice ?? 0);
          return discountB - discountA;
        default: // 'newest'
          return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
      }
    });

    // Apply pagination
    const startIndex = (this.currentPage() - 1) * this.pageSize();
    return filtered.slice(startIndex, startIndex + this.pageSize());
  });

  totalPages = computed(() => {
    const totalProducts = this.products().length;
    return Math.ceil(totalProducts / this.pageSize());
  });

  totalFilteredProducts = computed(() => {
    return this.filteredProducts().length;
  });

  currentYear = new Date().getFullYear();

  // Wishlist state
  wishlist = signal<Set<string>>(new Set());
  isFavorited = signal<boolean>(false);

  // Store analytics computed
  storeStats = computed(() => {
    const store = this.store();
    return {
      productCount: this.products().length,
      totalViews: store?.analytics?.totalViews || 0,
      totalSales: store?.analytics?.totalSales || 0,
      conversionRate: store?.analytics?.conversionRate || 0
    };
  });

  // Featured products
  featuredProducts = computed(() => {
    return this.products()
      .filter(p => p.isFeatured)
      .slice(0, 6);
  });

  // Active filters for store controls
  activeFilters = computed(() => ({
    selectedCategory: this.selectedCategory(),
    priceRange: this.priceRange(),
    minPrice: this.minPrice(),
    maxPrice: this.maxPrice(),
    ratingFilter: this.ratingFilter(),
    tagsFilter: this.tagsFilter(),
    brandFilter: this.brandFilter()
  }));

  async ngOnInit(): Promise<void> {
    const storeLink = this.route.snapshot.paramMap.get('storeLink');
    if (!storeLink) {
      this.router.navigate(['/']);
      return;
    }

    // Load wishlist
    this.loadWishlist();

    // Set up search debounce
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage.set(1);
      });

    // Set up sort changes
    this.sortControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentPage.set(1);
      });

    // Router scroll to top
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

    await this.loadStoreData(storeLink);
    
    // Auto-calculate price range
    this.calculatePriceRange();
  }

  ngAfterViewInit(): void {
    this.setupScrollListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadStoreData(storeLink: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      // Load store
      const storeResponse = await this.storeService.getStoreByLink(storeLink).toPromise();
      if (!storeResponse?.data) {
        throw new Error('Store not found');
      }
      this.store.set(storeResponse.data);

      // Load store products
      const productsResponse = await this.storeService.getStoreProducts(storeResponse.data._id ?? '').toPromise();
      this.products.set(productsResponse?.data || []);

      // Check if store is favorited
      this.isFavorited.set(this.wishlistService.isStoreFavorited(storeResponse.data._id ?? ''));

      // Animation trigger
      setTimeout(() => {
        this.productsLoaded.set(true);
      }, 300);
    } catch (err) {
      console.error('Failed to load store:', err);
      this.error.set('Failed to load store. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  private loadWishlist(): void {
    this.wishlist.set(new Set(this.wishlistService.getWishlistProductIds()));
  }

  private calculatePriceRange(): void {
    const prices = this.products().map(p => p.price);
    if (prices.length === 0) return;
    
    const min = Math.floor(Math.min(...prices));
    const max = Math.ceil(Math.max(...prices));
    
    this.minPrice.set(min);
    this.maxPrice.set(max);
    this.priceRange.set([min, max]);
  }

  private setupScrollListener(): void {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // Back to top button visibility
      this.isScrolled.set(scrollTop > 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    this.destroy$.subscribe(() => {
      window.removeEventListener('scroll', handleScroll);
    });
  }

  // Actions (unchanged)
  setCategory(category: string | null): void {
    this.selectedCategory.set(category);
    this.currentPage.set(1);
  }

  toggleViewMode(mode: 'grid' | 'list' | 'compact'): void {
    this.viewMode.set(mode);
  }

  applySearch(): void {
    this.currentPage.set(1);
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }

  clearFilters(): void {
    this.selectedCategory.set(null);
    this.searchControl.setValue('');
    this.sortControl.setValue('newest');
    this.priceRange.set([this.minPrice(), this.maxPrice()]);
    this.availability.set('all');
    this.ratingFilter.set(0);
    this.tagsFilter.set([]);
    this.brandFilter.set([]);
    this.currentPage.set(1);
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  goToPage(page: any): void {
    this.currentPage.set(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  viewProductDetails(product: Product): void {
    this.router.navigate(['/product', product._id], {
      state: { fromStore: this.store()?.storeLink }
    });
  }

  addToCart(product: Product): void {
    this.cartService.addToCart({
      productId: product._id ?? '',
      quantity: 1,
      price: product.price,
      name: product.name,
      image: product.images?.[0]?.url,
      storeId: product.store ?? ''
    });

    this.snackBar.open(`${product.name} added to cart`, 'View Cart', {
      duration: 3000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'bottom'
    }).onAction().subscribe(() => {
      this.router.navigate(['/cart']);
    });
  }

  toggleWishlist(product: Product): void {
    if (this.isInWishlist(product?._id ?? '')) {
      this.wishlistService.removeFromWishlist(product._id ?? '');
      this.showNotification('Removed from wishlist', 'info');
    } else {
      this.wishlistService.addToWishlist({
        productId: product._id ?? '',
        name: product.name,
        price: product.price,
        image: product.images?.[0]?.url,
        storeId: product.store ?? '',
        category: product.category
      });
      this.showNotification('Added to wishlist', 'success');
    }
    this.loadWishlist();
  }

  toggleFavorite(): void {
    const store = this.store();
    if (!store) return;

    if (this.isFavorited()) {
      this.wishlistService.removeFavoriteStore(store._id ?? '');
      this.showNotification('Store removed from favorites', 'info');
    } else {
      if (store._id) {
        this.wishlistService.addFavoriteStore({
          storeId: store._id,
          storeName: store.name,
          storeLogo: store.logo,
          storeLink: store.storeLink
        });
      }
      this.showNotification('Store added to favorites', 'success');
    }
    this.isFavorited.set(!this.isFavorited());
  }

  isInWishlist(productId: string): boolean {
    return this.wishlist().has(productId);
  }

  contactViaWhatsApp(): void {
    const store = this.store();
    if (!store?.whatsappNumber) return;

    const message = `Hello ${store.name}, I'm interested in your products.`;
    const url = `https://wa.me/${store.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  openShareBottomSheet(type: 'store' | 'product', product?: Product): void {
    // Implementation unchanged
  }

  quickView(product: Product): void {
    this.openQuickView(product);
  }

  shareStore(): void {
    this.openShareBottomSheet('store');
  }

  shareProduct(product: Product): void {
    this.openShareBottomSheet('product', product);
  }

  closeQuickView(): void {
    this.selectedProduct.set(null);
  }

  retryLoad(): void {
    const storeLink = this.route.snapshot.paramMap.get('storeLink');
    if (storeLink) {
      this.loadStoreData(storeLink);
    }
  }

  calculateDiscount(price: number, originalPrice: number): number {
    if (!originalPrice || originalPrice <= price) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  }

  showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const panelClass = `${type}-snackbar`;
    
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: [panelClass],
      horizontalPosition: 'right',
      verticalPosition: 'bottom'
    });
  }

  // Filter methods
  toggleFilterSidebar(): void {
    this.showFilters.set(!this.showFilters());
  }

  updatePriceRange(event: any): void {
    this.priceRange.set([event.value, event.value + 1000]);
  }

  toggleTagFilter(tag: string): void {
    const current = this.tagsFilter();
    if (current.includes(tag)) {
      this.tagsFilter.set(current.filter(t => t !== tag));
    } else {
      this.tagsFilter.set([...current, tag]);
    }
    this.currentPage.set(1);
  }

  toggleBrandFilter(brand: any): void {
    const current = this.brandFilter();
    if (current.includes(brand)) {
      this.brandFilter.set(current.filter(b => b !== brand));
    } else {
      this.brandFilter.set([...current, brand]);
    }
    this.currentPage.set(1);
  }

  // Utility methods
  getProductStatus(product: Product): string {
    if (!product.manageStock) return 'in-stock';
    if (product.quantity === 0) return 'out-of-stock';
    if (product.quantity <= product.lowStockAlert) return 'low-stock';
    return 'in-stock';
  }

  getStockText(product: Product): string {
    const status = this.getProductStatus(product);
    switch (status) {
      case 'out-of-stock': return 'Out of Stock';
      case 'low-stock': return `Only ${product.quantity} left`;
      default: return 'In Stock';
    }
  }

  trackByProductId(index: number, product: Product): string {
    return product._id ?? index.toString();
  }

  trackByCategory(index: number, category: { category: string; count: number }): string {
    return category.category;
  }

  onImageError(event: any): void {
    event.target.src = 'assets/images/product-placeholder.svg';
  }

  getCartCount(): number {
    return this.cartService.cartItemCount();
  }

  isNewProduct(date: Date): boolean {
    if (!date) return false;
    const createdDate = new Date(date);
    const now = new Date();
    const diffInDays = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
    return diffInDays <= 30;
  } 

  onProductVisible(product: Product): void {
    // Placeholder for any actions when product becomes visible (e.g., lazy loading)
  }

  openQuickView(product: Product): void {
    const dialogRef = this.dialog.open(ProductQuickViewComponent, {
      width: '90vw',
      maxWidth: '1200px',
      maxHeight: '90vh',
      panelClass: 'quick-view-dialog',
      data: {
        product: product,
        store: this.store(),
        onAddToCart: () => this.addToCart(product),
        onToggleWishlist: () => this.toggleWishlist(product),
        isInWishlist: this.isInWishlist(product._id ?? '')
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Quick view closed', result);
    });
  }

  onHeaderTransform(event: any) {

  }

}