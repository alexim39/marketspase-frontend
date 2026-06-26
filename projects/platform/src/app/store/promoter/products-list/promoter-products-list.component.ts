// promoter-products-list.component.ts
import { Component, OnInit, inject, signal, computed, OnDestroy, Signal, Input, effect } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

import { PromoterProductService } from '../../services/promoter-product.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '@shared/services/api';
import { DeviceService } from '@shared/services/device';
import { UserInterface } from '@shared/services';
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
  private apiService = inject(ApiService);
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
        limit: this.pageSize(),
        promoterId: this.user()?._id
      }).toPromise();

      if (!response || !response.data) {
        this.error.set('No products found.');
        this.snackBar.open('No products available', 'Close', { duration: 5000 });
        this.products.set([]);
        this.totalProducts.set(0);
        this.totalPages.set(0);
        return;
      }

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

  buyProduct(product: Product): void {
    if (!product?._id) return;
    this.router.navigate(['/product', product._id], {
      queryParams: {
        source: 'promoter-products'
      }
    });
  }

  generateWhatsAppMessage(product: Product): void {
    void this.shareGeneratedWhatsAppMessage(product);
    return;

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

  private async shareGeneratedWhatsAppMessage(product: Product): Promise<void> {
    const promotion = await this.createPromotion(product);
    if (!promotion) return;

    // Best-effort "direct share" on the web:
    // 1) On mobile browsers that support sharing files, share the product image + caption (includes link).
    // 2) Fall back to WhatsApp click-to-chat with text-only.
    const captionText = this.promotionService.buildWhatsAppMessage(
      product,
      promotion.trackingCode,
      product.promotion.commissionRate,
      product.price,
      promotion.affiliateUrl
    );

    const assetUrl = this.getProductMediaUrl(product);

    try {
      if (assetUrl && typeof navigator.share === 'function') {
        const shareFile = await this.createShareFile(assetUrl, product, promotion.trackingCode);
        const shareData: ShareData = {
          title: product.name,
          text: captionText,
          files: [shareFile],
        };

        if (typeof navigator.canShare === 'function' && !this.canShareFiles(shareData)) {
          throw new Error('native-file-share-unavailable');
        }

        await navigator.share(shareData);

        this.snackBar.open(
          'Share ready. Choose WhatsApp, then select My Status or a contact to post it.',
          'Close',
          { duration: 5000, panelClass: ['success-snackbar'] }
        );
        return;
      }
    } catch (error) {
      if (this.isShareCanceled(error)) {
        return;
      }

      console.warn('Native share with media failed, falling back to WhatsApp text-only:', error);
      // fall through to text-only
    }

    const encodedMessage = encodeURIComponent(captionText);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank', 'noopener');
  }

  shareToWhatsAppStatus(product: Product): void {
    void this.shareGeneratedWhatsAppStatus(product);
  }

  private async shareGeneratedWhatsAppStatus(product: Product): Promise<void> {
    const promotion = await this.createPromotion(product);
    if (!promotion) return;

    const assetUrl = this.getProductMediaUrl(product);
    if (!assetUrl) {
      this.snackBar.open('This product does not have a shareable image yet.', 'Close', { duration: 3500 });
      return;
    }

    const caption = this.promotionService.buildWhatsAppStatusCaption(
      product,
      promotion.trackingCode,
      product.price,
      promotion.affiliateUrl
    );

    try {
      const shareFile = await this.createShareFile(assetUrl, product, promotion.trackingCode);
      const shareData: ShareData = {
        title: product.name,
        text: caption,
        files: [shareFile]
      };

      if (typeof navigator.share !== 'function') {
        throw new Error('native-share-unavailable');
      }

      if (typeof navigator.canShare === 'function' && !this.canShareFiles(shareData)) {
        throw new Error('native-file-share-unavailable');
      }

      await navigator.share(shareData);

      this.snackBar.open(
        'Share ready. Choose WhatsApp, then select My Status or a contact to post it.',
        'Close',
        { duration: 5000, panelClass: ['success-snackbar'] }
      );
    } catch (error) {
      if (this.isShareCanceled(error)) {
        return;
      }

      console.warn('WhatsApp Status share fell back to manual flow:', error);
      await this.handleStatusShareFallback(assetUrl, caption);
    }
  }

  // Promotion methods moved from child component
  async createPromotion(product: Product): Promise<{ trackingCode: string; uniqueId: string; affiliateUrl: string } | null> {
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
      let affiliateUrl: string;

      if (existingPromotion) {
        trackingCode = existingPromotion.uniqueCode;
        uniqueId = existingPromotion.uniqueId;
        affiliateUrl = existingPromotion.affiliateUrl || this.promotionService.getTrackingLink(trackingCode, product._id ?? '');
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
        affiliateUrl = response.data.affiliateUrl || response.data.promotionUrl || this.promotionService.getTrackingLink(trackingCode, product._id ?? '');

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
        this.snackBar.open('Promotion link created successfully!', 'Close', { duration: 3000 });
      }

      return { trackingCode, uniqueId, affiliateUrl };
    } catch (error) {
      console.error('Error creating promotion:', error);
      this.snackBar.open('Failed to create promotion link. Please try again.', 'Close', { duration: 5000 });
      return null;
    }
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
      // Prefer copying the backend-computed affiliate URL already attached to the product payload.
      // This avoids broken links when the API base URL or routing differs across environments.
      const directAffiliateUrl = (product as any)?.promotion?.affiliateUrl || (product as any)?.promotion?.promotionUrl;
      if (directAffiliateUrl) {
        await navigator.clipboard.writeText(directAffiliateUrl);
        this.snackBar.open('Link copied to clipboard!', 'Close', { duration: 2000 });
        return;
      }

      const existingPromotion = this.activePromotions().get(product._id ?? '');

      if (!existingPromotion) {
        // Create promotion first if it doesn't exist
        const promotion = await this.createPromotion(product);
        if (!promotion) return;
        
        await navigator.clipboard.writeText(promotion.affiliateUrl);
        this.snackBar.open('Link copied to clipboard!', 'Close', { duration: 2000 });
      } else {
        const trackingLink = existingPromotion.affiliateUrl || this.promotionService.getTrackingLink(existingPromotion.uniqueCode, product._id ?? '');
        await navigator.clipboard.writeText(trackingLink);
        this.snackBar.open('Link copied to clipboard!', 'Close', { duration: 2000 });
      }
    } catch (error) {
      console.error('Copy failed', error);
      this.snackBar.open('Failed to copy link.', 'Close', { duration: 3000 });
    }
  }

  shareOnWhatsApp(product: Product, trackingCode: string, affiliateUrl?: string): void {
    const existingPromotion = this.activePromotions().get(product._id ?? '');
    const message = this.promotionService.generateWhatsAppMessage(
      product,
      trackingCode,
      product.promotion.commissionRate,
      product.price,
      affiliateUrl || existingPromotion?.affiliateUrl
    );
    
    window.open(`https://wa.me/?text=${message}`, '_blank');
  }

  private getProductMediaUrl(product: Product): string {
    const primaryImage = product.images?.[0]?.url || '';

    if (!primaryImage) {
      return '';
    }

    if (/^https?:\/\//i.test(primaryImage)) {
      return primaryImage;
    }

    if (primaryImage.startsWith('/')) {
      return `${this.apiService.getBaseUrl().replace(/\/$/, '')}${primaryImage}`;
    }

    return primaryImage;
  }

  private async createShareFile(assetUrl: string, product: Product, trackingCode: string): Promise<File> {
    const response = await fetch(assetUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch product media for sharing: ${response.status}`);
    }

    const blob = await response.blob();
    const mimeType = blob.type || 'image/jpeg';
    const extension = this.getFileExtensionForMimeType(mimeType) || 'jpg';
    const safeName = (product.name || 'marketspase-product')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'marketspase-product';

    return new File([blob], `${safeName}-${trackingCode}.${extension}`, {
      type: mimeType,
      lastModified: Date.now()
    });
  }

  private getFileExtensionForMimeType(mimeType: string): string {
    const normalizedMimeType = mimeType.toLowerCase();

    if (normalizedMimeType.includes('png')) return 'png';
    if (normalizedMimeType.includes('gif')) return 'gif';
    if (normalizedMimeType.includes('webp')) return 'webp';
    if (normalizedMimeType.includes('jpeg') || normalizedMimeType.includes('jpg')) return 'jpg';

    return '';
  }

  private canShareFiles(shareData: ShareData): boolean {
    try {
      return navigator.canShare(shareData);
    } catch {
      return false;
    }
  }

  private isShareCanceled(error: unknown): boolean {
    return error instanceof DOMException && error.name === 'AbortError';
  }

  private async handleStatusShareFallback(assetUrl: string, caption: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(caption);
    } catch (clipboardError) {
      console.warn('Failed to copy product status caption automatically:', clipboardError);
    }

    window.open(assetUrl, '_blank', 'noopener');

    this.snackBar.open(
      'We copied your caption and opened the product image. Add it to WhatsApp Status and paste the caption.',
      'Close',
      { duration: 5500 }
    );
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
