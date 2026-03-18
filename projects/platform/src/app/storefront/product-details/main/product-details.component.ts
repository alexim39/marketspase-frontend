// product-details.component.ts
import { 
  Component, OnInit, OnDestroy, inject, signal, computed, ViewChild, ElementRef, AfterViewInit 
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
import { CurrencyUtilsPipe } from '../../../../../../shared-services/src/public-api';

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
  providers: [StorefrontService, WishlistService, CartService],
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
    this.loadProductData();
    this.checkWishlistStatus();
    this.setupScrollListener();
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

    // Use forkJoin to load product and related data in parallel
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
  }

  buyNow(): void {
    if (!this.canAddToCart()) return;
    
    // Add to cart first, then navigate to checkout
    this.addToCart();
    this.router.navigate(['/checkout']);
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
}