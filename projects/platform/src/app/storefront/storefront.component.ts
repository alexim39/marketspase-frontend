// storefront.component.ts
import { Component, OnInit, inject, signal, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { CartService } from './services/cart.service';
import { WishlistService } from './services/wishlist.service';
import { ShareService } from '../store/services/share.service';
import { TruncatePipe } from '../store/shared/pipes/truncate.pipe';
import { CurrencyPipe } from '../store/shared/pipes/currency.pipe';
import { Product, Store } from '../store/models';
import { StorefrontService } from './services/storefront.service';

@Component({
  selector: 'app-storefront',
  standalone: true,
  providers: [StorefrontService, CartService, WishlistService, ShareService],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTabsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatBadgeModule,
    MatMenuModule,
    MatChipsModule,
    TruncatePipe,
    CurrencyPipe,
  ],
  templateUrl: './storefront.component.html',
  styleUrls: ['./storefront.component.scss']
})
export class StorefrontComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private storeService = inject(StorefrontService);
  private cartService = inject(CartService);
  private wishlistService = inject(WishlistService);
  private shareService = inject(ShareService);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  // Signals
  store = signal<Store | null>(null);
  products = signal<Product[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  viewMode = signal<'grid' | 'list'>('grid');
  selectedCategory = signal<string | null>(null);
  currentPage = signal<number>(1);
  pageSize = signal<number>(12);
  selectedProduct = signal<Product | null>(null);

  // Form Controls
  searchControl = new FormControl('');
  sortControl = new FormControl('newest');

  // Computed values
  categories = computed(() => {
    const products = this.products();
    const categories = new Set(products.map(p => p.category));
    return Array.from(categories).sort();
  });

  filteredProducts = computed(() => {
    let filtered = [...this.products()];
    const searchTerm = this.searchControl.value?.toLowerCase();
    const category = this.selectedCategory();
    const sortBy = this.sortControl.value;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.description?.toLowerCase().includes(searchTerm) ||
        product.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Filter by category
    if (category) {
      filtered = filtered.filter(product => product.category === category);
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

  currentYear = new Date().getFullYear();

  // Wishlist state
  wishlist = signal<Set<string>>(new Set());
  isFavorited = signal<boolean>(false);

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

    await this.loadStoreData(storeLink);
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

  // Actions
  setCategory(category: string | null): void {
    this.selectedCategory.set(category);
    this.currentPage.set(1);
  }

  toggleViewMode(): void {
    this.viewMode.set(this.viewMode() === 'grid' ? 'list' : 'grid');
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

  getPageNumbers(): (number | string)[] {
    const current = this.currentPage();
    const total = this.totalPages();
    const pages: (number | string)[] = [];

    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (current <= 3) {
        pages.push(1, 2, 3, 4, '...', total);
      } else if (current >= total - 2) {
        pages.push(1, '...', total - 3, total - 2, total - 1, total);
      } else {
        pages.push(1, '...', current - 1, current, current + 1, '...', total);
      }
    }

    return pages;
  }

  viewProductDetails(product: Product): void {
    this.router.navigate(['/product', product._id]);
  }

  addToCart(product: Product): void {
    this.cartService.addToCart({
      productId: product._id ?? '',
      quantity: 1,
      price: product.price,
      name: product.name,
      image: product.images?.[0]?.url,
      storeId: product.store ?? '' // Ensure storeId is provided
    });

    this.snackBar.open(`${product.name} added to cart`, 'View Cart', {
      duration: 3000,
      panelClass: ['success-snackbar']
    }).onAction().subscribe(() => {
      this.router.navigate(['/cart']);
    });
  }

  toggleWishlist(product: Product): void {
    if (this.isInWishlist(product?._id ?? '')) {
      this.wishlistService.removeFromWishlist(product._id ?? '');
      this.snackBar.open('Removed from wishlist', 'Close', { duration: 2000 });
    } else {
      this.wishlistService.addToWishlist({
        productId: product._id ?? '',
        name: product.name,
        price: product.price,
        image: product.images?.[0]?.url,
        storeId: product.store ?? '',
        category: ''
      });
      this.snackBar.open('Added to wishlist', 'Close', { duration: 2000 });
    }
    this.loadWishlist();
  }

  toggleFavorite(): void {
    const store = this.store();
    if (!store) return;

    if (this.isFavorited()) {
      this.wishlistService.removeFavoriteStore(store._id ?? '');
      this.snackBar.open('Store removed from favorites', 'Close', { duration: 2000 });
    } else {
      if (store._id) {
        this.wishlistService.addFavoriteStore({
          storeId: store._id,
          storeName: store.name,
        });
      }
      this.snackBar.open('Store added to favorites', 'Close', { duration: 2000 });
    }
    this.isFavorited.set(!this.isFavorited());
  }

  isInWishlist(productId: string): boolean {
    return this.wishlist().has(productId);
  }

  shareStore(): void {
    const store = this.store();
    if (!store) return;

    this.shareService.share({
      title: `Check out ${store.name} on MarketSpase`,
      text: store.description || `Visit ${store.name}'s store on MarketSpase`,
      url: window.location.href
    }, 'copy');

    this.snackBar.open('Store link copied to clipboard', 'Close', { duration: 3000 });
  }

  shareProduct(product: Product): void {
    const store = this.store();
    if (!store) return;

    this.shareService.share({
      title: product.name,
      text: `${product.name} - ${product.price} | Available at ${store.name}`,
      url: `${window.location.origin}/product/${product._id}`
    }, 'copy');

    this.snackBar.open('Product link copied to clipboard', 'Close', { duration: 3000 });
  }

  contactViaWhatsApp(): void {
    const store = this.store();
    if (!store?.whatsappNumber) return;

    const message = `Hello ${store.name}, I'm interested in your products.`;
    const url = `https://wa.me/${store.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  quickView(product: Product): void {
    this.selectedProduct.set(product);
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
}