// product-details.component.ts
import { 
  Component, OnInit, OnDestroy, inject, signal, computed, ViewChild, ElementRef, AfterViewInit 
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Params, Router, RouterModule } from '@angular/router';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, switchMap, of, forkJoin } from 'rxjs';

// Angular Material Imports
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatBadgeModule } from '@angular/material/badge';

// Shared Components/Directives/Pipes
import { RatingComponent } from '../../shared/rating/rating.component';
import { LazyImageDirective } from '../../shared/directives/lazy-image.directive';
import { CurrencyUtilsPipe, DeviceService } from '../../../../../../shared-services/src/public-api';

// Services
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';
import { StorefrontService } from '../../services/storefront.service';
import { ShareService } from '../../../store/services/share.service';

// Components (for dialogs/sheets)
import { ShareBottomSheetComponent } from '../../components/share-bottom-sheet/share-bottom-sheet.component';
import { ProductQuickViewComponent } from '../../components/product-quick-view/product-quick-view.component';

// Models
import { Product, Store, ProductVariant } from '../../../store/models';
import { TruncatePipe } from '../../../store/shared';
import { ProductReview } from '../models/product-reveiw.model';
import { UserService } from '../../../common/services/user.service';
import { StoreFooterComponent } from '../../core/store-footer/store-footer.component';
import { StoreHeaderComponent } from '../../core/store-header/store-header.component';
import { PromotionTrackingService } from '../../../store/promoter/services/promotion-tracking.service';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    // Material
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatExpansionModule,
    MatRadioModule,
    MatSelectModule,
    MatSliderModule,
    MatBadgeModule,
    // Shared
    RatingComponent,
    LazyImageDirective,
    TruncatePipe,
    CurrencyUtilsPipe,
    StoreFooterComponent,
    StoreHeaderComponent
  ],
  providers: [
    StorefrontService, 
    WishlistService, 
    CartService,
    PromotionTrackingService  // Add this
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
  //private shareService = inject(ShareService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private bottomSheet = inject(MatBottomSheet);
  private destroy$ = new Subject<void>();

  private userService = inject(UserService);
  public user = this.userService.user;

  private deviceService = inject(DeviceService);
  deviceType = computed(() => this.deviceService.type());

  // Add to class properties
  private promotionService = inject(PromotionTrackingService);

  // Add tracking signals
  trackingCode = signal<string | null>(null);
  promoterId = signal<string | null>(null);
  viewTracked = signal<boolean>(false);

  activePromotion = signal<any>(null);
  private viewRecordingAttempted = false;


  // =========================================
  // VIEW CHILD REFERENCES
  // =========================================
  
  @ViewChild('mainImageContainer') mainImageContainerRef!: ElementRef;
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
  
  selectedImageIndex = signal<number>(0);
  images = computed(() => {
    const product = this.product();
    return product?.images || [];
  });
  
  selectedImage = computed(() => {
    const images = this.images();
    const index = this.selectedImageIndex();
    return images[index] || images[0] || null;
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
    return 999; // Unlimited
  });
  
  stockStatus = computed(() => {
    const stock = this.currentStock();
    const product = this.product();
    
    if (!product?.manageStock) return 'in-stock';
    if (stock === 0) return 'out-of-stock';
    if (stock <= (product.lowStockAlert || 5)) return 'low-stock';
    return 'in-stock';
  });
  
  stockText = computed(() => {
    const status = this.stockStatus();
    const stock = this.currentStock();
    
    switch (status) {
      case 'out-of-stock': return 'Out of Stock';
      case 'low-stock': return `Only ${stock} left in stock`;
      default: return 'In Stock';
    }
  });
  
  canAddToCart = computed(() => {
    const status = this.stockStatus();
    return status !== 'out-of-stock';
  });
  
  maxQuantity = computed(() => {
    const stock = this.currentStock();
    const product = this.product();
    
    if (product?.soldIndividually) return 1;
    return Math.min(stock, 10); // Limit to 10 for UX
  });

  // =========================================
  // SIGNALS - Reviews & Ratings
  // =========================================
  
  reviews = signal<ProductReview[]>([]);
  loadingReviews = signal<boolean>(false);
  
  averageRating = computed(() => {
    const product = this.product();
    return product?.averageRating || 0;
  });
  
  ratingCount = computed(() => {
    const product = this.product();
    return product?.ratingCount || 0;
  });
  
  ratingBreakdown = computed(() => {
    const reviews = this.reviews();
    const breakdown = [0, 0, 0, 0, 0];
    
    reviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        breakdown[5 - review.rating]++; // Index 0 = 5 stars, index 4 = 1 star
      }
    });
    
    return breakdown;
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
  isDescriptionExpanded = signal<boolean>(false);
  isInWishlist = signal<boolean>(false);
  isScrolled = signal<boolean>(false);

  // =========================================
  // COMPUTED - Active Filters
  // =========================================
  
  tabs = [
    { id: 0, label: 'Description', icon: 'description' },
    { id: 1, label: 'Specifications', icon: 'settings' },
    { id: 2, label: 'Reviews', icon: 'star' },
    { id: 3, label: 'Shipping & Returns', icon: 'local_shipping' }
  ];

  // =========================================
  // LIFECYCLE HOOKS
  // =========================================

  ngOnInit(): void {
    this.extractTrackingParams(); // This runs first
    this.loadProductData(); // This runs after
    this.checkWishlistStatus();
    this.setupScrollListener();
    this.loadCurrentPromotionStats();
  }

  ngAfterViewInit(): void {
    // Any post-view initialization
  }

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
          
          // Load variants if they exist
          if (productData?.variants) {
            this.variants.set(productData?.variants);
            this.selectedVariant.set(productData.variants[0]);
          }
          
          this.reviews.set(result.reviews.data || []);
          this.relatedProducts.set(result.related.data || []);
          
          // Load store data
          if (productData.store) {
            this.loadStoreData(productData.store);
          }
          
          this.loading.set(false);
          
          // AFTER product is loaded, check if we need to track view
          this.checkAndTrackViewAfterProductLoad();
        },
        error: (err) => {
          console.error('Failed to load product:', err);
          this.error.set('Failed to load product details. Please try again.');
          this.loading.set(false);
        }
      });
  }


    /**
   * Check and track view after product is loaded
   */
  private checkAndTrackViewAfterProductLoad(): void {
    // If we already attempted to record view, skip
    if (this.viewRecordingAttempted) {
      return;
    }
    
    const trackingCode = this.trackingCode();
    const product = this.product();
    
    // Only track if we have both tracking code and product
    if (trackingCode && product && !this.viewTracked()) {
      console.log('Product loaded, tracking view for code:', trackingCode);
      this.trackPromotionView(trackingCode);
      this.viewRecordingAttempted = true;
    }
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
          // Non-critical error, don't show to user
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
  // IMAGE GALLERY METHODS
  // =========================================

  selectImage(index: number): void {
    this.selectedImageIndex.set(index);
  }

  nextImage(): void {
    const images = this.images();
    if (images.length <= 1) return;
    
    const currentIndex = this.selectedImageIndex();
    const nextIndex = (currentIndex + 1) % images.length;
    this.selectedImageIndex.set(nextIndex);
  }

  prevImage(): void {
    const images = this.images();
    if (images.length <= 1) return;
    
    const currentIndex = this.selectedImageIndex();
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    this.selectedImageIndex.set(prevIndex);
  }

  zoomImage(event: MouseEvent): void {
    // Implement image zoom functionality if needed
    const img = event.target as HTMLImageElement;
    // Could open a lightbox modal here
  }

  // =========================================
  // VARIANT METHODS
  // =========================================

  selectVariant(variant: ProductVariant): void {
    this.selectedVariant.set(variant);
    this.quantity.set(1); // Reset quantity on variant change
    
    // Update selected image if variant has specific images
    if (variant.images?.length) {
      // Find first matching image or keep current
      const variantImageIndex = this.images().findIndex(img => 
        variant.images?.some(vImg => vImg.url === img.url)
      );
      if (variantImageIndex >= 0) {
        this.selectedImageIndex.set(variantImageIndex);
      }
    }
  }

  selectVariantByAttribute(attributeName: string, value: string): void {
    const matchingVariant = this.variants().find(variant => 
      variant.options?.some(opt => opt.name === attributeName && opt.value === value)
    );
    
    if (matchingVariant) {
      this.selectVariant(matchingVariant);
    }
  }

  getAttributeValue(attributeName: string): string {
    const variant = this.selectedVariant();
    if (variant?.options) {
      const option = variant.options.find(opt => opt.name === attributeName);
      return option?.value || '';
    }
    return '';
  }

  getAttributeOptions(attributeName: string): string[] {
    const attribute = this.attributes().find(attr => attr.name === attributeName);
    return attribute?.values || [];
  }

  // =========================================
  // QUANTITY METHODS
  // =========================================

  incrementQuantity(): void {
    const current = this.quantity();
    const max = this.maxQuantity();
    
    if (current < max) {
      this.quantity.set(current + 1);
    }
  }

  decrementQuantity(): void {
    const current = this.quantity();
    if (current > 1) {
      this.quantity.set(current - 1);
    }
  }

  setQuantity(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value, 10);
    
    if (!isNaN(value) && value >= 1 && value <= this.maxQuantity()) {
      this.quantity.set(value);
    } else {
      input.value = this.quantity().toString();
    }
  }

  // =========================================
  // CART & WISHLIST ACTIONS
  // =========================================

/*   addToCart(): void {
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
      image: this.selectedImage()?.url || product.images?.[0]?.url,
      storeId: product.store ?? ''
    };
    
    this.cartService.addToCart(cartItem);
    
    this.snackBar.open(`${product.name} added to cart`, 'View Cart', {
      duration: 5000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'bottom'
    }).onAction().subscribe(() => {
      this.router.navigate(['/cart']);
    });
  } */

/*   buyNow(): void {
    if (!this.canAddToCart()) return;
    
    // Add to cart first, then navigate to checkout
    this.addToCart();
    this.router.navigate(['/checkout']);
  } */

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
            // Use a template literal instead of a pipe
            text: `${product.name} - $${this.currentPrice().toFixed(2)}`, 
            url: `${window.location.origin}/product/${product._id}`,
            image: product.images?.[0]?.url
        };

        this.bottomSheet.open(ShareBottomSheetComponent, {
            data: shareData,
            panelClass: ['share-bottom-sheet']
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
        this.loadingReviews.set(false);
      },
      error: () => {
        this.loadingReviews.set(false);
      }
    });
  }

  scrollToReviews(): void {
    this.selectedTab.set(2); // Switch to reviews tab
    this.reviewsSectionRef?.nativeElement.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
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

  viewRelatedProduct(product: Product): void {
    this.router.navigate(['/dashboard/store/product', product._id], {
      state: { fromStore: this.store()?.storeLink }
    });
    // Scroll to top
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

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = 'img/product.png';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getReviewDate(review: ProductReview): string {
    return this.formatDate(review.createdAt || new Date());
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  trackByProductId(index: number, product: Product): string {
    return product._id || index.toString();
  }

  trackByReviewId(index: number, review: ProductReview): string {
    return review._id || index.toString();
  }

  scrollToTop( ){
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  contactViaWhatsApp(): void {
    const store = this.store();
    if (!store?.whatsappNumber) return;

    const message = `Hello ${store.name}, I'm interested in your products.`;
    const url = `https://wa.me/${store.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  /**
   * Extract tracking parameters from URL query params
   */
  private extractTrackingParams(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params: Params) => {
      const trackingCode = params['track'];
      const uniqueId = params['ref'];
      const promoterId = params['promoter'];
      
      if (trackingCode) {
        this.trackingCode.set(trackingCode);
        console.log('Tracking code detected:', trackingCode);
      }
      
      if (uniqueId) {
        console.log('Unique ID detected:', uniqueId);
      }
      
      if (promoterId) {
        this.promoterId.set(promoterId);
      }
      
      // Check if product is already loaded, if so track immediately
      if (trackingCode && this.product() && !this.viewTracked()) {
        this.trackPromotionView(trackingCode);
        this.viewRecordingAttempted = true;
      }
    });
  }


  /**
 * Check if view was already tracked (on page refresh)
 */
private checkTrackedStatus(trackingCode: string): void {
  const tracked = sessionStorage.getItem(`tracked_${trackingCode}`);
  if (tracked === 'true') {
    this.viewTracked.set(true);
  }
}

/**
 * Add to cart with tracking information
 */
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
    image: this.selectedImage()?.url || product.images?.[0]?.url,
    storeId: product.store ?? '',
    // Add tracking information
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
    // Pass tracking info to cart page
    this.router.navigate(['/cart'], {
      queryParams: {
        track: this.trackingCode(),
        promoter: this.promoterId()
      }
    });
  });
}

/**
 * Buy now with tracking information
 */
buyNow(): void {
  if (!this.canAddToCart()) return;
  
  // Add to cart first with tracking
  this.addToCart();
  
  // Navigate to checkout with tracking params
  this.router.navigate(['/checkout'], {
    queryParams: {
      track: this.trackingCode(),
      promoter: this.promoterId()
    }
  });
}

// In product-details.component.ts
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
          
          const trackingLink = response.data.trackingLink;
          // Use the tracking link with click tracking
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


/**
 * Build WhatsApp message for promotion
 */
private buildPromotionMessage(product: Product, trackingLink: string): string {
  const price = this.currentPrice();
  const currency = this.user()?.wallets?.promoter?.currency || 'USD';
  const commission = product.promotion?.commissionRate || 10;
  
  return `🚀 Check out this amazing product!\n\n` +
         `📦 *${product.name}*\n` +
         `💰 Price: ${currency} ${price.toFixed(2)}\n` +
         `🎯 Commission: ${commission}%\n\n` +
         `✨ Shop now: ${trackingLink}\n\n` +
         `👉 Limited time offer!`;
}

/**
 * Show promotion success with stats option
 */
private showPromotionSuccess(product: Product, promotionData: any): void {
  const snackBarRef = this.snackBar.open(
    '✅ Promotion link generated! Track your performance.',
    'View Stats',
    { duration: 8000, horizontalPosition: 'right', verticalPosition: 'bottom' }
  );
  
  snackBarRef.onAction().subscribe(() => {
    this.viewPromotionStats(product, promotionData);
  });
}

/**
 * View promotion statistics for a product
 */
viewPromotionStats(product: Product, promotionData?: any): void {
  const promoterId = this.user()?._id;
  if (!promoterId) return;
  
  // If we already have promotion data, use it
  if (promotionData) {
    this.navigateToStatsPage(product, promotionData);
    return;
  }
  
  // Otherwise fetch stats from API
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

/**
 * Navigate to stats page with product and promotion data
 */
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


/**
 * Get promotion stats for current product (for display in UI)
 */
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
        // No active promotion for this product yet
        this.activePromotion.set(null);
      }
    });
}


  /**
   * Track promotion view when user lands from promoter link
   */
  private trackPromotionView(trackingCode: string): void {
    if (this.viewTracked()) return; // Prevent duplicate tracking
    
    const productId = this.product()?._id;
    if (!productId) {
      console.warn('Cannot track view: product not loaded yet');
      return;
    }
    
    // Detect device type
    const deviceType = this.deviceService.type();
    
    console.log('Tracking promotion view:', { trackingCode, productId, deviceType });
    
    this.promotionService.trackProductView(productId, trackingCode, undefined, deviceType).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        console.log('Promotion view tracked successfully:', response);
        this.viewTracked.set(true);
        
        // Store in session storage to prevent duplicate tracking on refresh
        sessionStorage.setItem(`tracked_${trackingCode}`, 'true');
        
        // Update active promotion stats if needed
        if (this.activePromotion()) {
          this.activePromotion.update(promo => ({
            ...promo,
            viewCount: (promo.viewCount || 0) + 1
          }));
        }
      },
      error: (error) => {
        console.error('Failed to track promotion view:', error);
        // Still mark as tracked to avoid repeated attempts
        this.viewTracked.set(true);
      }
    });
  }


}