// product-details.component.ts
import { 
  Component, OnInit, OnDestroy, inject, signal, computed, ViewChild, ElementRef, AfterViewInit 
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Params, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil, forkJoin, firstValueFrom } from 'rxjs';

// Angular Material Imports
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';

// Shared Components/Directives/Pipes
import { CurrencyUtilsPipe, DeviceService, TruncatePipe } from '@shared/services';

// Services
import { StorefrontService } from '../../services/storefront.service';
import { StorefrontCartService } from '../../services/storefront-cart.service';

// Models
import { Product, Store, ProductVariant } from '../../../store/models';
import { UserService } from '../../../common/services/user.service';
import { CurrencyQuote, PaymentCurrencyService } from '../../../common/services/payment-currency.service';
import { StoreFooterComponent } from '../../core/store-footer/store-footer.component';
import { StoreHeaderComponent, StoreStats } from '../../core/store-header/store-header.component';
import { PromotionService } from '../../../store/promoter/services/promotion.service';
import { PaystackService } from '../../../common/services/paystack.service';
import { ShareService } from '../../../store/services/share.service';
import { buildWhatsAppChatUrl } from '../../../common/utils/whatsapp.util';

// Child Components
import { ProductGalleryComponent } from './components/product-gallery/product-gallery.component';
import { ProductInfoComponent } from './components/product-info/product-info.component';
import { ProductTabsComponent } from './components/product-tabs/product-tabs.component';
import { ProductSpecificationsComponent } from './components/product-specifications/product-specifications.component';
import { ProductReviewsComponent } from './components/product-reviews/product-reviews.component';
import { RelatedProductsComponent } from './components/related-products/related-products.component';
import { WriteReviewDialogComponent } from './components/write-review-dialog.component';

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
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    // Shared
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
    PromotionService,
    PaystackService,
    ShareService
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
  private cartService = inject(StorefrontCartService);
  private promotionService = inject(PromotionService);
  private paystackService = inject(PaystackService);
  private shareService = inject(ShareService);
  private paymentCurrencyService = inject(PaymentCurrencyService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private destroy$ = new Subject<void>();

  private userService = inject(UserService);
  public user = this.userService.user;

  private deviceService = inject(DeviceService);
  deviceType = computed(() => this.deviceService.type());


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

  storeStats = computed<StoreStats>(() => {
    const store: any = this.store();
    const product = this.product();
    const statistics = store?.statistics || {};
    const analytics = store?.analytics || {};
    const followers = Array.isArray(store?.followers)
      ? store.followers.length
      : this.toSafeNumber(store?.followerCount ?? statistics.followerCount ?? store?.followers);
    const productCount = this.toSafeNumber(
      statistics.productCount ?? store?.productCount ?? product?.store?.productCount ?? (product ? 1 : 0)
    );
    const totalViews = this.toSafeNumber(statistics.totalViews ?? analytics.totalViews ?? product?.viewCount);
    const totalSales = this.toSafeNumber(statistics.totalSales ?? analytics.totalSales ?? product?.purchaseCount);
    const conversionRate = this.toSafeNumber(
      statistics.conversionRate ?? analytics.conversionRate ?? (totalViews > 0 ? (totalSales / totalViews) * 100 : 0)
    );

    return {
      productCount,
      followerCount: followers,
      totalViews,
      totalSales,
      conversionRate,
      responseRate: this.toSafeNumber(statistics.responseRate ?? 100, 100),
      responseTime: statistics.responseTime || '< 1 hour',
      memberSince: store?.createdAt ? new Date(store.createdAt) : undefined
    };
  });

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
  reviewsPage = signal<number>(1);
  reviewSummary = signal<{ averageRating: number; totalReviews: number; ratingBreakdown: Record<number, number> }>({
    averageRating: 0,
    totalReviews: 0,
    ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  currentUserReview = signal<any | null>(null);
  
  averageRating = computed(() => {
    return this.reviewSummary().averageRating || this.product()?.averageRating || 0;
  });
  
  ratingCount = computed(() => {
    return this.reviewSummary().totalReviews || this.product()?.ratingCount || 0;
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
  uniqueId = signal<string | null>(null);
  promoterId = signal<string | null>(null);
  viewTracked = signal<boolean>(false);
  activePromotion = signal<any>(null);
  private viewRecordingAttempted = false;

  checkoutOpen = signal<boolean>(false);
  checkoutLoading = signal<boolean>(false);
  checkoutError = signal<string | null>(null);
  checkoutOrder = signal<any | null>(null);
  checkoutSuccess = signal<any | null>(null);
  cartFeedback = signal<{ name: string; quantity: number; totalItems: number } | null>(null);
  selectedCheckoutCurrency = signal<string>('NGN');
  checkoutQuote = signal<CurrencyQuote | null>(null);
  supportedCheckoutCurrencies = signal<Array<{ code: string; name: string; symbol: string }>>([]);

  checkoutTotal = computed(() => this.currentPrice() * this.quantity());

  checkoutForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required]],
    street: ['', [Validators.required]],
    city: ['', [Validators.required]],
    state: ['', [Validators.required]],
    country: ['Nigeria', [Validators.required]],
    postalCode: ['']
  });

  // =========================================
  // LIFECYCLE HOOKS
  // =========================================

  ngOnInit(): void {
    this.extractTrackingParams();
    this.prefillCheckoutForm();
    this.setupScrollListener();
    this.loadCheckoutCurrencyConfig();
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
      product: this.storeService.getProductById(productId, this.getTrackingContextForProductRequest()),
      reviews: this.storeService.getProductReviews(productId, { page: 1, limit: 10 }),
      related: this.storeService.getRelatedProducts(productId, { limit: 8 })
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          //console.log('related products ',result)
          const productData = result.product.data;
          this.product.set(productData);
          this.activePromotion.set(productData?.activePromotion || null);
          
          if (productData?.variants) {
            this.variants.set(productData.variants);
            this.selectedVariant.set(productData.variants[0]);
          }

          this.applyReviewResponse(result.reviews, true);
          this.relatedProducts.set(result.related.data || []);
          
          if (productData.store) {
            this.loadStoreData(productData.store);
          }

          this.loadCurrentUserReview(productId);
          this.refreshCheckoutQuote();
          
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

 

  private setupScrollListener(): void {
    this.handleScroll = this.handleScroll.bind(this);
    window.addEventListener('scroll', this.handleScroll, { passive: true });
  }

  private getTrackingContextForProductRequest(): {
    ref?: string | null;
    promoter?: string | null;
    clicked?: boolean;
    trackingCode?: string | null;
  } {
    const query = this.route.snapshot.queryParamMap;
    return {
      ref: this.uniqueId() || query.get('ref'),
      promoter: this.promoterId() || query.get('promoter'),
      clicked: query.get('clicked') === '1',
      trackingCode: this.trackingCode() || query.get('track')
    };
  }

  private prefillCheckoutForm(): void {
    const currentUser = this.user();
    const address = currentUser?.personalInfo?.address;

    this.checkoutForm.patchValue({
      fullName: currentUser?.displayName || '',
      email: currentUser?.email || '',
      phone: currentUser?.personalInfo?.phone || currentUser?.personalInfo?.phoneDetails?.fullNumber || '',
      street: address?.street || '',
      city: address?.city || '',
      state: address?.state || '',
      country: address?.country || 'Nigeria'
    });
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
    this.refreshCheckoutQuote();
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
    this.refreshCheckoutQuote();
  }

  // =========================================
  // CART & WISHLIST ACTIONS
  // =========================================

  addToCart(): void {
    if (!this.canAddToCart()) return;
    
    const product = this.product();
    const variant = this.selectedVariant();
    
    if (!product) return;
    
    const storeId = product.store?._id || this.store()?._id;
    if (!storeId) {
      this.showNotification('This product cannot be added to cart right now', 'error');
      return;
    }

    const addedItem = this.cartService.addItem({
      productId: product._id ?? '',
      variantId: variant?._id,
      quantity: this.quantity(),
      price: this.currentPrice(),
      name: product.name,
      variantName: variant?.name,
      image: product.images?.[0]?.url,
      storeId,
      storeName: this.store()?.name || product.store?.name,
      storeLink: this.store()?.storeLink || product.store?.storeLink,
      currency: product.currency || 'NGN',
      maxQuantity: this.maxQuantity(),
      manageStock: product.manageStock,
      soldIndividually: product.soldIndividually,
      trackingCode: this.trackingCode(),
      uniqueId: this.uniqueId(),
      promoterId: this.promoterId()
    });

    this.cartFeedback.set({
      name: product.name,
      quantity: addedItem.quantity,
      totalItems: this.cartService.itemCount()
    });
    
    this.snackBar.open(`${product.name} is in your cart`, 'View Cart', {
      panelClass: ['success-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'bottom'
    }).onAction().subscribe(() => {
      this.goToCart();
    });
  }

  buyNow(): void {
    if (!this.canAddToCart()) return;

    this.cartFeedback.set(null);
    this.checkoutOpen.set(true);
    this.checkoutError.set(null);
    this.checkoutSuccess.set(null);

    setTimeout(() => {
      document.querySelector('.checkout-section')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 50);
  }

  async submitCheckout(): Promise<void> {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      this.checkoutError.set('Please complete the delivery details.');
      return;
    }

    const product = this.product();
    const currentUser = this.user();
    if (!product?._id) {
      this.checkoutError.set('Reload the product before checkout.');
      return;
    }

    this.checkoutLoading.set(true);
    this.checkoutError.set(null);

    try {
      const formValue = this.checkoutForm.getRawValue();
      const customerEmail = formValue.email || currentUser?.email || '';
      const customerName = formValue.fullName || currentUser?.displayName || currentUser?.username || '';
      const customerPhone = formValue.phone || currentUser?.personalInfo?.phone || currentUser?.personalInfo?.phoneDetails?.fullNumber || '';
      const orderPayload: any = {
        productId: product._id,
        variantId: this.selectedVariant()?._id,
        quantity: this.quantity(),
        trackingCode: this.trackingCode(),
        ref: this.uniqueId(),
        checkoutCurrency: this.selectedCheckoutCurrency(),
        checkoutQuote: this.checkoutQuote(),
        shippingAddress: {
          fullName: customerName,
          email: customerEmail,
          phone: customerPhone,
          street: formValue.street,
          city: formValue.city,
          state: formValue.state,
          country: formValue.country || 'Nigeria',
          postalCode: formValue.postalCode || ''
        },
        paymentMethod: 'paystack'
      };

      if (currentUser?._id) {
        orderPayload.customerId = currentUser._id;
      }

      const createResponse = await firstValueFrom(this.storeService.createStorefrontOrder(orderPayload));

      const order = createResponse?.data?.order;
      const checkout = createResponse?.data?.checkout;
      if (!order?._id || !checkout?.reference) {
        throw new Error('Checkout could not be initialized.');
      }

      this.checkoutOrder.set(order);
      const paymentResult = await firstValueFrom(this.paystackService.initiatePayment({
        amount: checkout.amount,
        currency: checkout.currency || 'NGN',
        reference: checkout.reference,
        user: currentUser || undefined,
        customer: {
          email: customerEmail,
          fullName: customerName,
          phone: customerPhone
        },
        metadata: {
          orderId: order._id,
          productId: product._id,
          trackingCode: this.trackingCode(),
          uniqueId: this.uniqueId()
        }
      }));

      if (!paymentResult.success || !paymentResult.response) {
        throw new Error(paymentResult.error || 'Payment was not completed.');
      }

      const confirmPayload: any = {
        paymentReference: checkout.reference,
        paystackResult: paymentResult.response
      };

      if (currentUser?._id) {
        confirmPayload.customerId = currentUser._id;
      }

      const confirmResponse = await firstValueFrom(this.storeService.confirmStorefrontPayment(order._id, confirmPayload));

      this.checkoutSuccess.set(confirmResponse?.data?.order || order);
      this.checkoutOpen.set(false);
      this.showNotification('Payment successful. Order details have been sent to your email.', 'success');
      this.loadProductData();
    } catch (error: any) {
      console.error('Checkout failed:', error);
      this.checkoutError.set(error?.error?.message || error?.message || 'Checkout failed. Please try again.');
    } finally {
      this.checkoutLoading.set(false);
    }
  }

  cancelCheckout(): void {
    if (this.checkoutLoading()) return;
    this.checkoutOpen.set(false);
    this.checkoutError.set(null);
  }

  dismissCartFeedback(): void {
    this.cartFeedback.set(null);
  }

  goToCart(): void {
    this.router.navigate(['/cart'], {
      queryParams: {
        track: this.trackingCode(),
        promoter: this.promoterId()
      }
    });
  }


  contactStore(): void {
    const store = this.store();
    if (!store?.whatsappNumber) return;

    const url = buildWhatsAppChatUrl(store.whatsappNumber);
    if (url) {
      window.open(url, '_blank', 'noopener');
    }
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
    if (method === 'whatsapp') {
      this.contactViaWhatsApp();
      return;
    }
    if (method === 'email') {
      this.emailStore();
      return;
    }
    const store = this.store();
    const phone = (store as any)?.phoneNumber || store?.owner?.personalInfo?.phone || store?.whatsappNumber;
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  }

  emailStore(): void {
    const store = this.store();
    const email = (store as any)?.email || store?.owner?.email;
    if (!email) {
      this.showNotification('This store has no email contact yet', 'info');
      return;
    }
    const subject = `Product inquiry: ${this.product()?.name || store?.name || 'MarketSpase product'}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
  }

  openReturnPolicy(event?: Event): void {
    event?.preventDefault();
    this.selectedTab.set(3);
    this.showNotification('Payments stay in escrow until delivery is confirmed. Contact the store for product-specific return terms.', 'info');
  }

  addRelatedProductToCart(product: any): void {
    if (!product?._id) return;
    const currentStore = this.store();
    this.cartService.addItem({
      productId: product._id,
      quantity: 1,
      price: product.price,
      name: product.name,
      image: product.images?.[0]?.url,
      storeId: currentStore?._id || this.product()?.store?._id || '',
      storeName: currentStore?.name || this.product()?.store?.name,
      storeLink: currentStore?.storeLink || this.product()?.store?.storeLink,
      currency: this.product()?.currency || 'NGN',
      maxQuantity: 999
    });

    this.snackBar.open(`${product.name} added to cart`, 'View Cart', {
      duration: 4000,
      panelClass: ['success-snackbar']
    }).onAction().subscribe(() => this.router.navigate(['/cart']));
  }

  // =========================================
  // REVIEWS METHODS
  // =========================================

  loadMoreReviews(): void {
    const productId = this.product()?._id;
    if (!productId) return;
    
    this.loadingReviews.set(true);
    
    this.storeService.getProductReviews(productId, {
      page: this.reviewsPage() + 1,
      limit: 10 
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        this.applyReviewResponse(response, false);
        this.loadingReviews.set(false);
      },
      error: () => {
        this.loadingReviews.set(false);
      }
    });
  }

  writeReview(): void {
    const currentUser = this.user();
    const product = this.product();
    if (!product?._id) {
      return;
    }

    if (!currentUser?._id) {
      this.showNotification('Sign in from your dashboard to rate this product.', 'info');
      return;
    }

    const dialogRef = this.dialog.open(WriteReviewDialogComponent, {
      width: 'min(560px, 95vw)',
      maxWidth: '95vw',
      data: {
        productName: product.name,
        existingReview: this.currentUserReview(),
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (!result?.action) {
          return;
        }

        if (result.action === 'delete' && this.currentUserReview()?._id) {
          this.deleteReview(this.currentUserReview()._id);
          return;
        }

        if (result.action === 'submit') {
          this.saveReview(result.payload);
        }
      });
  }

  private loadCheckoutCurrencyConfig(): void {
    this.paymentCurrencyService.getConfig()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const supported = (response?.data?.supportedCurrencies || [])
            .filter((currency) => currency?.capabilities?.checkout)
            .map((currency) => ({
              code: currency.code,
              name: currency.name,
              symbol: currency.symbol,
            }));
          this.supportedCheckoutCurrencies.set(supported);
          const initial = supported.find((currency) => currency.code === (this.product()?.currency || 'NGN'))?.code
            || supported[0]?.code
            || this.product()?.currency
            || 'NGN';
          this.selectedCheckoutCurrency.set(initial);
          this.refreshCheckoutQuote();
        },
        error: () => {
          this.supportedCheckoutCurrencies.set([{ code: 'NGN', name: 'Nigerian Naira', symbol: '₦' }]);
          this.selectedCheckoutCurrency.set(this.product()?.currency || 'NGN');
        }
      });
  }

  private refreshCheckoutQuote(): void {
    const productCurrency = this.product()?.currency || 'NGN';
    const amount = this.checkoutTotal();
    if (!amount || amount <= 0) {
      this.checkoutQuote.set(null);
      return;
    }

    this.paymentCurrencyService.getQuote({
      amount,
      fromCurrency: productCurrency,
      toCurrency: this.selectedCheckoutCurrency() || productCurrency,
      purpose: 'storefront_checkout',
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => this.checkoutQuote.set(response?.data || null),
        error: () => this.checkoutQuote.set(null),
      });
  }

  onCheckoutCurrencyChange(currencyCode: string): void {
    this.selectedCheckoutCurrency.set(currencyCode || this.product()?.currency || 'NGN');
    this.refreshCheckoutQuote();
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

  // =========================================
  // UTILITY METHODS
  // =========================================

  private toSafeNumber(value: unknown, fallback = 0): number {
    const next = Number(value);
    return Number.isFinite(next) ? next : fallback;
  }

  showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const panelClass = `${type}-snackbar`;
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: [panelClass],
      horizontalPosition: 'center',
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
    // Handle query params first (they come immediately)
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params: Params) => {
      const trackingCode = params['track'] || null;
      const uniqueId = params['ref'] || null;
      const promoterId = params['promoter'];
      const clickedAlreadyRecorded = params['clicked'] === '1';
      
      if (trackingCode) {
        this.trackingCode.set(trackingCode);
        if (!clickedAlreadyRecorded) {
          this.trackPromotionClick(trackingCode);
        }
      } else if (uniqueId) {
        this.trackingCode.set(uniqueId);
        if (!clickedAlreadyRecorded) {
          this.trackPromotionClick(uniqueId);
        }
      }

      if (uniqueId) {
        this.uniqueId.set(uniqueId);
      }
      
      if (promoterId) {
        this.promoterId.set(promoterId);
      }
    });
    
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const productId = params.get('productId');
      if (productId) {
        this.viewRecordingAttempted = false;
        this.loadProductData();
      }
    });
  }

  shareStore(): void {
    const store = this.store();
    if (!store?.storeLink) return;
    void this.shareService.share({
      title: store.name,
      text: `${store.name} on MarketSpase`,
      url: `${window.location.origin}/store/${store.storeLink}`
    });
  }

  reportStore(): void {
    this.showNotification('Thanks. Store reporting will be reviewed by MarketSpase support.', 'success');
  }

  handleStoreTab(tabId: string): void {
    if (tabId === 'products') {
      this.viewStore();
      return;
    }
    if (tabId === 'about') {
      this.showNotification(this.store()?.description || 'Store description is not available yet.', 'info');
      return;
    }
    if (tabId === 'reviews') {
      this.scrollToReviews();
      return;
    }
    if (tabId === 'policies') {
      this.openReturnPolicy();
    }
  }

  private trackPromotionClick(uniqueCode: string): void {
    // Prevent duplicate click tracking in same session
    const clickTracked = sessionStorage.getItem(`click_tracked_${uniqueCode}`);
    if (clickTracked) return;
    
    const deviceType = this.deviceService.type();
    const source = document.referrer || 'direct';
    
    this.promotionService.trackPromotionClick(uniqueCode, deviceType, source)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Promotion click tracked successfully:', response);
          sessionStorage.setItem(`click_tracked_${uniqueCode}`, 'true');
        },
        error: (error) => {
          console.error('Failed to track promotion click:', error);
          // Don't prevent future attempts on error
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
    
    this.promotionService.trackProductView(productId, trackingCode, this.uniqueId() || undefined, deviceType).pipe(
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

  private applyReviewResponse(response: any, reset: boolean): void {
    const items = Array.isArray(response?.data) ? response.data : [];
    const pagination = response?.pagination;
    const summary = response?.summary;

    if (reset) {
      this.reviews.set(items);
      this.reviewsPage.set(Number(pagination?.page || 1));
    } else {
      this.reviews.update((existing) => [...existing, ...items]);
      this.reviewsPage.set(Number(pagination?.page || this.reviewsPage() + 1));
    }

    this.hasMoreReviews.set(Number(pagination?.page || 1) < Number(pagination?.pages || 1));
    this.reviewSummary.set({
      averageRating: Number(summary?.averageRating || this.product()?.averageRating || 0),
      totalReviews: Number(summary?.totalReviews || this.product()?.ratingCount || 0),
      ratingBreakdown: summary?.ratingBreakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    });

    this.product.update((product) => product ? ({
      ...product,
      averageRating: Number(summary?.averageRating || product.averageRating || 0),
      ratingCount: Number(summary?.totalReviews || product.ratingCount || 0)
    }) : product);
  }

  private loadCurrentUserReview(productId: string): void {
    if (!this.user()?._id) {
      this.currentUserReview.set(null);
      return;
    }

    this.storeService.getCurrentUserProductReview(productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.currentUserReview.set(response?.data || null);
        },
        error: () => {
          this.currentUserReview.set(null);
        }
      });
  }

  private saveReview(payload: { rating: number; title?: string; comment: string }): void {
    const productId = this.product()?._id;
    if (!productId) {
      return;
    }

    const request$ = this.currentUserReview()?._id
      ? this.storeService.updateProductReview(this.currentUserReview()._id, payload)
      : this.storeService.createProductReview(productId, payload);

    request$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.currentUserReview.set(response?.data || null);
          this.showNotification(
            response?.message || 'Review saved successfully',
            response?.data?.status === 'approved' ? 'success' : 'info'
          );
          this.refreshReviewsAndStore();
        },
        error: (error) => {
          this.showNotification(error?.error?.message || 'We could not save your review.', 'error');
        }
      });
  }

  private deleteReview(reviewId: string): void {
    this.storeService.deleteProductReview(reviewId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.currentUserReview.set(null);
          this.showNotification(response?.message || 'Review deleted successfully', 'success');
          this.refreshReviewsAndStore();
        },
        error: (error) => {
          this.showNotification(error?.error?.message || 'We could not delete your review.', 'error');
        }
      });
  }

  onReviewHelpful(review: any): void {
    if (!this.user()?._id) {
      this.showNotification('Sign in from your dashboard to react to reviews.', 'info');
      return;
    }

    if (review?.isOwnReview || !review?._id) {
      return;
    }

    this.storeService.toggleReviewHelpful(review._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const helpfulCount = Number(response?.data?.helpfulCount || 0);
          const isHelpfulByCurrentUser = Boolean(response?.data?.isHelpfulByCurrentUser);
          this.reviews.update((items) => items.map((item) => item._id === review._id
            ? { ...item, helpfulCount, isHelpfulByCurrentUser }
            : item));
        },
        error: (error) => {
          this.showNotification(error?.error?.message || 'We could not update that feedback right now.', 'error');
        }
      });
  }

  private refreshReviewsAndStore(): void {
    const productId = this.product()?._id;
    const storeId = this.store()?._id || this.product()?.store?._id;
    if (!productId) {
      return;
    }

    this.storeService.getProductReviews(productId, { page: 1, limit: 10 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.applyReviewResponse(response, true);
        }
      });

    this.loadCurrentUserReview(productId);

    if (storeId) {
      this.loadStoreData({ _id: storeId });
    }
  }

  /* loadCurrentPromotionStats(): void {
    const product = this.product();
    const promoterId = this.user()?._id;
    
    if (!product?._id || !promoterId || this.user()?.role !== 'promoter') return;
    
    this.promotionService.getPromotionStats(product._id, promoterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          console.log('current stat ', response)
          if (response.data) {
            this.activePromotion.set(response.data);
          }
        },
        error: () => {
          this.activePromotion.set(null);
        }
      });
  } */
}
