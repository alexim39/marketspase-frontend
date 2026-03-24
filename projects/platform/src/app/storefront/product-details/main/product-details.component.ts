// product-details.component.ts
import { 
  Component, OnInit, OnDestroy, inject, signal, computed, ViewChild, ElementRef, AfterViewInit 
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Params, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil, forkJoin } from 'rxjs';

// Angular Material Imports
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Shared Components/Directives/Pipes
import { RatingComponent } from '../../shared/rating/rating.component';
import { CurrencyUtilsPipe, DeviceService } from '../../../../../../shared-services/src/public-api';

// Services
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';
import { StorefrontService } from '../../services/storefront.service';

// Components (for dialogs/sheets)
import { ShareBottomSheetComponent } from '../../components/share-bottom-sheet/share-bottom-sheet.component';

// Models
import { Product, Store, ProductVariant } from '../../../store/models';
import { TruncatePipe } from '../../../store/shared';
import { UserService } from '../../../common/services/user.service';
import { StoreFooterComponent } from '../../core/store-footer/store-footer.component';
import { StoreHeaderComponent } from '../../core/store-header/store-header.component';
import { PromotionTrackingService } from '../../../store/promoter/services/promotion-tracking.service';

// Child Components
import { ProductGalleryComponent } from './components/product-gallery/product-gallery.component';
import { ProductInfoComponent } from './components/product-info/product-info.component';
import { ProductTabsComponent } from './components/product-tabs/product-tabs.component';
import { ProductSpecificationsComponent } from './components/product-specifications/product-specifications.component';
import { ProductReviewsComponent } from './components/product-reviews/product-reviews.component';
import { RelatedProductsComponent } from './components/related-products/related-products.component';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    // Material
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    // Shared
    RatingComponent,
    TruncatePipe,
    CurrencyUtilsPipe,
    StoreFooterComponent,
    StoreHeaderComponent,
    // Child Components
    ProductGalleryComponent,
    ProductInfoComponent,
    ProductTabsComponent,
    ProductSpecificationsComponent,
    ProductReviewsComponent,
    RelatedProductsComponent
  ],
  providers: [
    StorefrontService, 
    WishlistService, 
    CartService,
    PromotionTrackingService
  ],
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.scss']
})
export class ProductDetailsComponent implements OnInit, OnDestroy, AfterViewInit {
  // =========================================
  // DEPENDENCY INJECTION
  // =========================================
  
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private storeService = inject(StorefrontService);
  private cartService = inject(CartService);
  private wishlistService = inject(WishlistService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private bottomSheet = inject(MatBottomSheet);
  private destroy$ = new Subject<void>();

  private userService = inject(UserService);
  public user = this.userService.user;

  private deviceService = inject(DeviceService);
  deviceType = computed(() => this.deviceService.type());

  private promotionService = inject(PromotionTrackingService);

  // =========================================
  // VIEW CHILD REFERENCES
  // =========================================
  
  @ViewChild('reviewsSection') reviewsSectionRef!: ElementRef;
  @ViewChild('specsSection') specsSectionRef!: ElementRef;

  // =========================================
  // SIGNALS - Core Data
  // =========================================
  
  product = signal<Product | null>(null);
  store = signal<Store | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  fromStore = signal<string | null>(null);

  // =========================================
  // SIGNALS - Image Gallery
  // =========================================
  
  images = computed(() => {
    const product = this.product();
    return product?.images || [];
  });

  // =========================================
  // SIGNALS - Variants
  // =========================================
  
  variants = signal<ProductVariant[]>([]);
  selectedVariant = signal<ProductVariant | null>(null);
  attributes = computed(() => {
    const product = this.product();
    return product?.attributes || [];
  });
  
  hasVariants = computed(() => {
    return this.variants().length > 0;
  });

  // =========================================
  // SIGNALS - Quantity & Pricing
  // =========================================
  
  quantity = signal<number>(1);
  
  currentPrice = computed(() => {
    const variant = this.selectedVariant();
    const product = this.product();
    if (variant?.price) return variant.price;
    return product?.price || 0;
  });
  
  originalPrice = computed(() => {
    const variant = this.selectedVariant();
    const product = this.product();
    if (variant?.originalPrice) return variant.originalPrice;
    return product?.originalPrice || null;
  });
  
  discountPercentage = computed(() => {
    const current = this.currentPrice();
    const original = this.originalPrice();
    if (!original || original <= current) return 0;
    return Math.round(((original - current) / original) * 100);
  });
  
  hasDiscount = computed(() => {
    return this.discountPercentage() > 0;
  });

  // =========================================
  // SIGNALS - Stock & Availability
  // =========================================
  
  currentStock = computed(() => {
    const variant = this.selectedVariant();
    const product = this.product();
    if (variant?.quantity !== undefined) return variant.quantity;
    if (product?.manageStock) return product.quantity;
    return 999;
  });
  
  stockStatus = computed(() => {
    const stock = this.currentStock();
    const product = this.product();
    if (!product?.manageStock) return 'in-stock';
    if (stock === 0) return 'out-of-stock';
    if (stock <= (product.lowStockAlert || 5)) return 'low-stock';
    return 'in-stock';
  });
  
  canAddToCart = computed(() => {
    const status = this.stockStatus();
    return status !== 'out-of-stock';
  });
  
  maxQuantity = computed(() => {
    const stock = this.currentStock();
    const product = this.product();
    if (product?.soldIndividually) return 1;
    return Math.min(stock, 10);
  });

  // =========================================
  // SIGNALS - Reviews & Ratings
  // =========================================
  
  reviews = signal<any[]>([]);
  loadingReviews = signal<boolean>(false);
  hasMoreReviews = signal<boolean>(true);
  
  averageRating = computed(() => {
    const product = this.product();
    return product?.averageRating || 0;
  });
  
  ratingCount = computed(() => {
    const product = this.product();
    return product?.ratingCount || 0;
  });

  // =========================================
  // SIGNALS - Related Products
  // =========================================
  
  relatedProducts = signal<Product[]>([]);
  loadingRelated = signal<boolean>(false);

  // =========================================
  // SIGNALS - UI State
  // =========================================
  
  selectedTab = signal<number>(0);
  isInWishlist = signal<boolean>(false);
  isScrolled = signal<boolean>(false);

  // =========================================
  // SIGNALS - Promotion
  // =========================================
  
  trackingCode = signal<string | null>(null);
  promoterId = signal<string | null>(null);
  viewTracked = signal<boolean>(false);
  activePromotion = signal<any>(null);
  private viewRecordingAttempted = false;

  // =========================================
  // LIFECYCLE HOOKS
  // =========================================

  ngOnInit(): void {
    this.extractTrackingParams();
    this.loadProductData();
    this.checkWishlistStatus();
    this.setupScrollListener();
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    window.removeEventListener('scroll', this.handleScroll.bind(this));
  }

  // =========================================
  // DATA LOADING
  // =========================================

  public loadProductData(): void {
    const productId = this.route.snapshot.paramMap.get('productId');
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { fromStore?: string };
    
    if (state?.fromStore) {
      this.fromStore.set(state.fromStore);
    }

    if (!productId) {
      this.error.set('Product not found');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      product: this.storeService.getProductById(productId),
      reviews: this.storeService.getProductReviews(productId, { page: 1, limit: 10 }),
      related: this.storeService.getRelatedProducts(productId, { limit: 8 })
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          const productData = result.product.data;
          this.product.set(productData);
          
          if (productData?.variants) {
            this.variants.set(productData.variants);
            this.selectedVariant.set(productData.variants[0]);
          }
          
          this.reviews.set(result.reviews.data || []);
          this.hasMoreReviews.set(result.reviews.data?.length === 10);
          this.relatedProducts.set(result.related.data || []);
          
          if (productData.store) {
            this.loadStoreData(productData.store);
          }
          
          this.loading.set(false);
          this.checkAndTrackViewAfterProductLoad();
        },
        error: (err) => {
          console.error('Failed to load product:', err);
          this.error.set('Failed to load product details. Please try again.');
          this.loading.set(false);
        }
      });
  }

  private loadStoreData(store: any): void {
    this.storeService.getStoreById(store._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.store.set(response.data);
        },
        error: (err) => {
          console.error('Failed to load store:', err);
        }
      });
  }

  private checkWishlistStatus(): void {
    const productId = this.route.snapshot.paramMap.get('productId');
    if (productId) {
      this.isInWishlist.set(this.wishlistService.isInWishlist(productId));
    }
  }

  private setupScrollListener(): void {
    this.handleScroll = this.handleScroll.bind(this);
    window.addEventListener('scroll', this.handleScroll, { passive: true });
  }

  private handleScroll(): void {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    this.isScrolled.set(scrollTop > 100);
  }

  // =========================================
  // VARIANT METHODS
  // =========================================

  selectVariant(variant: any): void {
    this.selectedVariant.set(variant);
    this.quantity.set(1);
  }

  selectVariantByAttribute(event: { attributeName: string; value: string }): void {
    const matchingVariant = this.variants().find(variant => 
      variant.options?.some(opt => opt.name === event.attributeName && opt.value === event.value)
    );
    
    if (matchingVariant) {
      this.selectVariant(matchingVariant);
    }
  }

  // =========================================
  // QUANTITY METHODS
  // =========================================

  onQuantityChange(quantity: number): void {
    this.quantity.set(quantity);
  }

  // =========================================
  // CART & WISHLIST ACTIONS
  // =========================================

  addToCart(): void {
    if (!this.canAddToCart()) return;
    
    const product = this.product();
    const variant = this.selectedVariant();
    
    if (!product) return;
    
    const cartItem = {
      productId: product._id ?? '',
      variantId: variant?._id,
      quantity: this.quantity(),
      price: this.currentPrice(),
      name: product.name,
      variantName: variant?.name,
      image: product.images?.[0]?.url,
      storeId: product.store ?? '',
      trackingCode: this.trackingCode(),
      promoterId: this.promoterId()
    };
    
    this.cartService.addToCart(cartItem);
    
    this.snackBar.open(`${product.name} added to cart`, 'View Cart', {
      duration: 5000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'bottom'
    }).onAction().subscribe(() => {
      this.router.navigate(['/cart'], {
        queryParams: {
          track: this.trackingCode(),
          promoter: this.promoterId()
        }
      });
    });
  }

  buyNow(): void {
    if (!this.canAddToCart()) return;
    this.addToCart();
    this.router.navigate(['/checkout'], {
      queryParams: {
        track: this.trackingCode(),
        promoter: this.promoterId()
      }
    });
  }

  toggleWishlist(): void {
    const product = this.product();
    if (!product?._id) return;
    
    if (this.isInWishlist()) {
      this.wishlistService.removeFromWishlist(product._id);
      this.showNotification('Removed from wishlist', 'info');
    } else {
      this.wishlistService.addToWishlist({
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.images?.[0]?.url,
        storeId: product.store ?? '',
        category: product.category
      });
      this.showNotification('Added to wishlist', 'success');
    }
    
    this.isInWishlist.set(!this.isInWishlist());
  }

  // =========================================
  // SHARE & SOCIAL ACTIONS
  // =========================================

  shareProduct(): void {
    const product = this.product();
    if (!product) return;

    const shareData = {
      title: product.name,
      text: `${product.name} - $${this.currentPrice().toFixed(2)}`, 
      url: `${window.location.origin}/product/${product._id}`,
      image: product.images?.[0]?.url
    };

    this.bottomSheet.open(ShareBottomSheetComponent, {
      data: shareData,
      panelClass: ['share-bottom-sheet']
    });
  }

  shareProductWithTracking(): void {
    const product = this.product();
    if (!product) return;

    const userRole = this.user()?.role;
    const promoterId = this.user()?._id;
    
    if (userRole === 'promoter' && promoterId) {
      const loadingSnackbar = this.snackBar.open('Generating promotion link...', 'Close', {
        duration: 3000
      });
      
      const promotionOptions = {
        storeId: product.store,
        commissionRate: product.promotion?.commissionRate || 10,
        commissionType: product.promotion?.commissionType || 'percentage',
        fixedCommission: product.promotion?.fixedCommission || 0
      };
      
      this.promotionService.generatePromotionLink(
        product._id ?? '', 
        promoterId, 
        promotionOptions
      ).pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            loadingSnackbar.dismiss();
            const trackingUrl = `${window.location.origin}/api/stores/product/promotions/track/${response.data.uniqueCode}?productId=${product._id}`;
            const message = this.buildPromotionMessage(product, trackingUrl);
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
            this.activePromotion.set(response.data);
            this.showPromotionSuccess(product, response.data);
          },
          error: (error) => {
            loadingSnackbar.dismiss();
            console.error('Failed to generate promotion link:', error);
            this.snackBar.open('Failed to generate promotion link. Please try again.', 'Close', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
    } else {
      this.shareProduct();
    }
  }

  private buildPromotionMessage(product: Product, trackingLink: string): string {
    const price = this.currentPrice();
    const commission = product.promotion?.commissionRate || 10;
    
    return `🚀 Check out this amazing product!\n\n` +
           `📦 *${product.name}*\n` +
           `💰 Price: $${price.toFixed(2)}\n` +
           `🎯 Commission: ${commission}%\n\n` +
           `✨ Shop now: ${trackingLink}\n\n` +
           `👉 Limited time offer!`;
  }

  private showPromotionSuccess(product: Product, promotionData: any): void {
    const snackBarRef = this.snackBar.open(
      '✅ Promotion link generated! Track your performance.',
      'View Stats',
      { duration: 8000, horizontalPosition: 'right', verticalPosition: 'bottom' }
    );
    
    snackBarRef.onAction().subscribe(() => {
      this.viewPromotionStats(promotionData);
    });
  }

  viewPromotionStats(promotionData?: any): void {
    const product = this.product();
    if (!product) return;
    
    const promoterId = this.user()?._id;
    if (!promoterId) return;
    
    if (promotionData) {
      this.navigateToStatsPage(product, promotionData);
      return;
    }
    
    this.promotionService.getPromotionStats(product._id ?? '', promoterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.navigateToStatsPage(product, response.data);
        },
        error: (error) => {
          console.error('Failed to load promotion stats:', error);
          this.snackBar.open('Failed to load promotion statistics', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  private navigateToStatsPage(product: Product, promotionData: any): void {
    this.router.navigate(['/dashboard/promotions/stats', product._id], {
      state: {
        product: {
          id: product._id,
          name: product.name,
          price: product.price,
          image: product.images?.[0]?.url,
          category: product.category
        },
        promotion: {
          id: promotionData.promotionId,
          uniqueCode: promotionData.uniqueCode,
          uniqueId: promotionData.uniqueId,
          trackingLink: promotionData.trackingLink,
          commissionRate: promotionData.commissionRate
        },
        stats: {
          views: promotionData.stats?.views || promotionData.viewCount || 0,
          clicks: promotionData.stats?.clicks || promotionData.clickCount || 0,
          conversions: promotionData.stats?.conversions || promotionData.conversionCount || 0,
          earnings: promotionData.stats?.earnings || promotionData.earnings || 0,
          ctr: promotionData.stats?.clickThroughRate || promotionData.clickThroughRate || 0,
          conversionRate: promotionData.stats?.conversionRate || promotionData.conversionRate || 0,
          lastActivity: promotionData.lastActivityAt
        }
      }
    });
  }

  contactStore(): void {
    const store = this.store();
    if (!store?.whatsappNumber) return;
    
    const product = this.product();
    const message = `Hello ${store?.name}, I'm interested in your product: ${product?.name}`;
    const url = `https://wa.me/${store?.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  contactViaWhatsApp(): void {
    const store = this.store();
    if (!store?.whatsappNumber) return;

    const message = `Hello ${store.name}, I'm interested in your products.`;
    const url = `https://wa.me/${store.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  // =========================================
  // REVIEWS METHODS
  // =========================================

  loadMoreReviews(): void {
    const productId = this.product()?._id;
    if (!productId) return;
    
    this.loadingReviews.set(true);
    
    this.storeService.getProductReviews(productId, { 
      page: Math.floor(this.reviews().length / 10) + 1, 
      limit: 10 
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        this.reviews.set([...this.reviews(), ...(response.data || [])]);
        this.hasMoreReviews.set(response.data?.length === 10);
        this.loadingReviews.set(false);
      },
      error: () => {
        this.loadingReviews.set(false);
      }
    });
  }

  writeReview(): void {
    // Implement review dialog
    this.showNotification('Review feature coming soon', 'info');
  }

  scrollToReviews(): void {
    this.selectedTab.set(2);
    setTimeout(() => {
      this.reviewsSectionRef?.nativeElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
  }

  // =========================================
  // NAVIGATION METHODS
  // =========================================

  goBack(): void {
    if (this.fromStore()) {
      this.router.navigate(['/store', this.fromStore()]);
    } else {
      this.location.back();
    }
  }

  viewStore(): void {
    const store = this.store();
    if (store?.storeLink) {
      this.router.navigate(['/store', store.storeLink]);
    }
  }

  viewRelatedProduct(product: Product | null): void {
    this.router.navigate(['/dashboard/store/product', product?._id], {
      state: { fromStore: this.store()?.storeLink }
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // =========================================
  // UTILITY METHODS
  // =========================================

  showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const panelClass = `${type}-snackbar`;
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: [panelClass],
      horizontalPosition: 'right',
      verticalPosition: 'bottom'
    });
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // =========================================
  // TRACKING METHODS
  // =========================================

  private extractTrackingParams(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params: Params) => {
      const trackingCode = params['track'];
      const promoterId = params['promoter'];
      
      if (trackingCode) {
        this.trackingCode.set(trackingCode);
        console.log('Tracking code detected:', trackingCode);
      }
      
      if (promoterId) {
        this.promoterId.set(promoterId);
      }
      
      if (trackingCode && this.product() && !this.viewTracked()) {
        this.trackPromotionView(trackingCode);
        this.viewRecordingAttempted = true;
      }
    });
  }

  private checkAndTrackViewAfterProductLoad(): void {
    if (this.viewRecordingAttempted) return;
    
    const trackingCode = this.trackingCode();
    const product = this.product();
    
    if (trackingCode && product && !this.viewTracked()) {
      console.log('Product loaded, tracking view for code:', trackingCode);
      this.trackPromotionView(trackingCode);
      this.viewRecordingAttempted = true;
    }
  }

  private trackPromotionView(trackingCode: string): void {
    if (this.viewTracked()) return;
    
    const productId = this.product()?._id;
    if (!productId) {
      console.warn('Cannot track view: product not loaded yet');
      return;
    }
    
    const deviceType = this.deviceService.type();
    
    this.promotionService.trackProductView(productId, trackingCode, undefined, deviceType).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        console.log('Promotion view tracked successfully:', response);
        this.viewTracked.set(true);
        sessionStorage.setItem(`tracked_${trackingCode}`, 'true');
        
        if (this.activePromotion()) {
          this.activePromotion.update(promo => ({
            ...promo,
            viewCount: (promo.viewCount || 0) + 1
          }));
        }
      },
      error: (error) => {
        console.error('Failed to track promotion view:', error);
        this.viewTracked.set(true);
      }
    });
  }

  loadCurrentPromotionStats(): void {
    const product = this.product();
    const promoterId = this.user()?._id;
    
    if (!product?._id || !promoterId || this.user()?.role !== 'promoter') return;
    
    this.promotionService.getPromotionStats(product._id, promoterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.data) {
            this.activePromotion.set(response.data);
          }
        },
        error: () => {
          this.activePromotion.set(null);
        }
      });
  }
}