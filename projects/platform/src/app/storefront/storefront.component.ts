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
  Subject, debounceTime, distinctUntilChanged, takeUntil, filter, firstValueFrom 
} from 'rxjs';

// Child Components
import { StoreHeaderComponent } from './core/store-header/store-header.component';
import { StoreFooterComponent } from './core/store-footer/store-footer.component';
import { StoreControlsComponent } from './components/store-controls/store-controls.component';
import { ProductGridCardComponent } from './components/product-grid-card/product-grid-card.component';
import { ProductListItemComponent } from './components/product-list-item/product-list-item.component';
import { PaginationComponent } from './components/pagination/pagination.component';
import { LoadingStateComponent } from './components/loading-state/loading-state.component';
import { EmptyStateComponent } from './components/empty-state/empty-state.component';
import { ErrorStateComponent } from './components/error-state/error-state.component';
import { FabContainerComponent } from './components/fab-container/fab-container.component';

// Services
import { StorefrontService } from './services/storefront.service';

// Components
import { FilterSidebarComponent } from './components/filter-sidebar/filter-sidebar.component';
import { ProductQuickViewComponent } from './components/product-quick-view/product-quick-view.component';

// Models
import { Product, ProductVariant, Service, Store } from '../store/models';
import { MatIconModule } from '@angular/material/icon';
import { StorefrontCartService } from './services/storefront-cart.service';
import { ShareService } from '../store/services/share.service';
import { buildWhatsAppChatUrl } from '../common/utils/whatsapp.util';
import { StorefrontChatComponent } from './components/storefront-chat/storefront-chat.component';
import { ServiceInquiryDialogComponent } from './components/service-inquiry-dialog/service-inquiry-dialog.component';

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
    StorefrontChatComponent,
    MatIconModule,
    ServiceInquiryDialogComponent
  ],
  providers: [StorefrontService, ShareService],
  templateUrl: './storefront.component.html',
  styleUrls: ['./storefront.component.scss']
})
export class StorefrontComponent implements OnInit, OnDestroy, AfterViewInit {
  private route = inject(ActivatedRoute);
  public router = inject(Router);
  private storeService = inject(StorefrontService);
  private cartService = inject(StorefrontCartService);
  private shareService = inject(ShareService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private bottomSheet = inject(MatBottomSheet);
  private renderer = inject(Renderer2);
  private destroy$ = new Subject<void>();

  // Signals (unchanged)
  store = signal<Store | null>(null);
  products = signal<Product[]>([]);
  services = signal<Service[]>([]);
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
  featuredOnly = signal<boolean>(false);

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

  matchingProducts = computed(() => {
    let filtered = [...this.products()];
    const searchTerm = this.searchControl.value?.toLowerCase();
    const category = this.selectedCategory();
    const sortBy = this.sortControl.value;
    const [minPriceFilter, maxPriceFilter] = this.priceRange();
    const availabilityFilter = this.availability();
    const ratingFilterVal = this.ratingFilter();
    const tagsFilterVal = this.tagsFilter();
    const brandFilterVal = this.brandFilter();
    const featuredOnly = this.featuredOnly();

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

    if (featuredOnly) {
      filtered = filtered.filter(product => product.isFeatured);
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

    return filtered;
  });

  filteredProducts = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.pageSize();
    return this.matchingProducts().slice(startIndex, startIndex + this.pageSize());
  });

  totalPages = computed(() => {
    const totalProducts = this.matchingProducts().length;
    return Math.ceil(totalProducts / this.pageSize());
  });

  totalFilteredProducts = computed(() => {
    return this.matchingProducts().length;
  });

  //currentYear = new Date().getFullYear();

  // Wishlist state
  wishlist = signal<Set<string>>(new Set());
  isFavorited = signal<boolean>(false);

  // Store analytics computed
  storeStats = computed(() => {
    const store = this.store();
    const followers = Array.isArray((store as any)?.followers)
      ? (store as any).followers.length
      : Number((store as any)?.followerCount || 0);
    return {
      productCount: this.products().length,
      totalViews: store?.analytics?.totalViews || 0,
      totalSales: store?.analytics?.totalSales || 0,
      conversionRate: store?.analytics?.conversionRate || 0,
      followerCount: Number.isFinite(followers) ? followers : 0
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

      if (storeResponse.data.type === 'service') {
        const servicesResponse = await firstValueFrom(this.storeService.getStoreServices(storeResponse.data._id ?? ''));
        this.services.set(servicesResponse?.data || []);
      } else {
        const productsResponse = await firstValueFrom(this.storeService.getStoreProducts(storeResponse.data._id ?? ''));
        this.products.set(productsResponse?.data || []);
      }

      const favoriteStores = this.readSet('marketspase_favorite_stores_v1');
      this.isFavorited.set(favoriteStores.has(storeResponse.data._id ?? storeResponse.data.storeLink));

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
    this.wishlist.set(this.readSet('marketspase_storefront_wishlist_v1'));
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
    this.featuredOnly.set(false);
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

  addToCart(product: Product, quantity = 1, variant?: ProductVariant | null): void {
    if (!product?._id) return;

    const store = this.store();
    const storeId = product.store?._id || store?._id;
    if (!storeId) {
      this.showNotification('This product cannot be added to cart right now', 'error');
      return;
    }

    if (product.manageStock && product.quantity <= 0) {
      this.showNotification('This product is out of stock', 'info');
      return;
    }

    this.cartService.addItem({
      productId: product._id,
      variantId: variant?._id,
      variantName: variant?.name,
      quantity,
      price: variant?.price || product.price,
      name: product.name,
      image: variant?.images?.[0]?.url || product.images?.[0]?.url,
      storeId,
      storeName: store?.name || product.store?.name,
      storeLink: store?.storeLink || product.store?.storeLink,
      currency: product.currency || 'NGN',
      maxQuantity: product.manageStock ? product.quantity : 999,
      manageStock: product.manageStock,
      soldIndividually: product.soldIndividually,
      trackingCode: product.activePromotion?.trackingCode || product.promotion?.trackingCode || null,
      uniqueId: product.activePromotion?.uniqueId || product.promotion?.uniqueId || null,
      promoterId: product.activePromotion?.promoter || null
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

  inquireService(service: Service): void {
    this.dialog.open(ServiceInquiryDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'inquiry-dialog',
      data: {
        service,
        store: this.store(),
      },
    });
  }

  navigateToInquiry(service: Service): void {
    const link = this.store()?.storeLink;
    if (link && service._id) {
      this.router.navigate(['/store', link, 'inquiry', service._id]);
    }
  }

  pricingTypeLabel(type: string): string {
    const labels: Record<string, string> = { fixed: 'Fixed Price', hourly: 'Hourly', package: 'Package', quote: 'Custom Quote' };
    return labels[type] || type;
  }

  responseTimeLabel(minutes: number): string {
    if (minutes < 60) return `Typically responds within ${minutes} min`;
    const hours = Math.round(minutes / 60);
    return `Typically responds within ${hours} hr`;
  }

  getAllPackageFeatures(packages: any[]): string[] {
    const features = new Set<string>();
    for (const p of packages) { (p.includes || []).forEach((f: string) => features.add(f)); }
    return Array.from(features);
  }

  readonly crossSellProducts = signal<any[]>([]);

  toggleWishlist(product: Product): void {
    const productId = product?._id ?? '';
    if (!productId) return;

    const current = new Set(this.wishlist());
    if (current.has(productId)) {
      current.delete(productId);
      this.showNotification('Removed from wishlist', 'info');
    } else {
      current.add(productId);
      this.showNotification('Added to wishlist', 'success');
    }
    this.wishlist.set(current);
    this.persistSet('marketspase_storefront_wishlist_v1', current);
  }

  toggleFavorite(): void {
    const store = this.store();
    if (!store) return;

    const current = this.readSet('marketspase_favorite_stores_v1');
    if (this.isFavorited()) {
      current.delete(store._id ?? store.storeLink);
      this.showNotification('Store removed from favorites', 'info');
    } else {
      current.add(store._id ?? store.storeLink);
      this.showNotification('Store added to favorites', 'success');
    }
    this.persistSet('marketspase_favorite_stores_v1', current);
    this.isFavorited.set(!this.isFavorited());
  }

  isInWishlist(productId: string): boolean {
    return this.wishlist().has(productId);
  }

  contactViaWhatsApp(): void {
    const store = this.store();
    if (!store?.whatsappNumber) return;

    const url = buildWhatsAppChatUrl(store.whatsappNumber);
    if (url) {
      window.open(url, '_blank', 'noopener');
    }
  }

  handleStoreContact(method: 'whatsapp' | 'email' | 'chat'): void {
    const store = this.store();
    if (!store) return;

    if (method === 'whatsapp') {
      this.contactViaWhatsApp();
      return;
    }

    if (method === 'email') {
      const email = (store as any).email || store.owner?.email;
      if (!email) {
        this.showNotification('This store has no email contact yet', 'info');
        return;
      }
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(`Product inquiry for ${store.name}`)}`;
      return;
    }

    const phone = (store as any).phoneNumber || store.owner?.personalInfo?.phone || store.whatsappNumber;
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  }

  openShareBottomSheet(type: 'store' | 'product', product?: Product): void {
    if (type === 'product' && product?._id) {
      void this.shareService.share({
        title: product.name,
        text: `${product.name} on MarketSpase`,
        url: `${window.location.origin}/product/${product._id}`
      });
      return;
    }

    const store = this.store();
    if (!store?.storeLink) return;
    void this.shareService.share({
      title: store.name,
      text: `${store.name} on MarketSpase`,
      url: `${window.location.origin}/store/${store.storeLink}`
    });
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
    return this.cartService.itemCount();
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
        onAddToCart: (quantity?: number, variant?: ProductVariant | null) => this.addToCart(product, quantity || 1, variant),
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

  showFeaturedOnly(): void {
    this.featuredOnly.set(true);
    this.currentPage.set(1);
  }

  onStoreTabChange(tabId: string): void {
    if (tabId === 'products') {
      this.clearFilters();
      return;
    }
    if (tabId === 'about') {
      this.showNotification(this.store()?.description || 'Store description is not available yet.', 'info');
      return;
    }
    if (tabId === 'reviews') {
      this.sortControl.setValue('rating');
      this.showNotification('Showing the highest rated products first.', 'info');
      return;
    }
    if (tabId === 'policies') {
      this.showNotification('MarketSpase checkout protects payments in escrow until delivery is confirmed.', 'info');
    }
  }

  reportStore(): void {
    this.showNotification('Thanks. Store reporting will be reviewed by MarketSpase support.', 'success');
  }

  private persistSet(key: string, values: Set<string>): void {
    localStorage.setItem(key, JSON.stringify(Array.from(values)));
  }

  private readSet(key: string): Set<string> {
    try {
      const raw = localStorage.getItem(key);
      const values = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(values) ? values : []);
    } catch {
      return new Set();
    }
  }

}
