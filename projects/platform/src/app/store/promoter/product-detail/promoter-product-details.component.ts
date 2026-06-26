import {
  Component,
  OnInit,
  inject,
  signal,
  OnDestroy,
  computed,
  DestroyRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

// Services
import { PromoterProductService } from '../../services/promoter-product.service';
import { ShareService } from '../../services/share.service';
import { AnalyticsService } from '../../services/analytics.service';
import { UserService } from '../../../common/services/user.service';
import { StorefrontService } from '../../../storefront/services/storefront.service';

// Models & Pipes
import { Product } from '../../models';
import { TruncatePipe } from '@shared/services';

// Components
import { ProductImageGalleryComponent } from './components/product-image-gallery/product-image-gallery.component';
import { ProductHeaderComponent } from './components/product-header/product-header.component';
import { ProductActionsComponent } from './components/product-actions/product-actions.component';
import { ProductTabsComponent } from './components/product-tabs/product-tabs.component';
import { CommissionCardComponent } from './components/commission-card/commission-card.component';
import { StoreInfoCardComponent } from './components/store-info-card/store-info-card.component';
import { RelatedProductsComponent } from './components/related-products/related-products.component';

import { MatChipsModule } from '@angular/material/chips';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PromotionService } from '../services/promotion.service';

@Component({
  selector: 'app-promoter-product-details',
  standalone: true,
  providers: [
    PromoterProductService,
    ShareService,
    AnalyticsService,
    StorefrontService,
    PromotionService
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    ProductImageGalleryComponent,
    ProductHeaderComponent,
    ProductActionsComponent,
    ProductTabsComponent,
    CommissionCardComponent,
    StoreInfoCardComponent,
    RelatedProductsComponent,
    TruncatePipe,
    MatChipsModule,    
  ],
  templateUrl: './promoter-product-details.component.html',
  styleUrls: ['./promoter-product-details.component.scss']
})
export class PromoterProductDetailsComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(PromoterProductService);
  private storeService = inject(StorefrontService);
  private snackBar = inject(MatSnackBar);
  private shareService = inject(ShareService);
  private analyticsService = inject(AnalyticsService);
  private promotionService = inject(PromotionService);
  private userService = inject(UserService);
  user = this.userService.user;
  private destroyRef = inject(DestroyRef);

  // Signals
  product = signal<Product | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  selectedImageIndex = signal(0);
  relatedProducts = signal<Product[]>([]);
  loadingRelated = signal(false);
  blurb = signal('');

  landingUrl = computed(() => {
    const code = this.product()?.promotion?.trackingCode;
    return code ? `marketspase.com/promote/p/${code}` : '';
  });

  tierAdjustedCommission = computed(() => {
    const p = this.product()?.promotion as any;
    if (!p) return null;

    const tierBonus = p.metadata?.tierBonus || 0;
    const baseRate = p.metadata?.baseCommissionRate ?? p.commissionRate;
    const tier = p.metadata?.promoterTier;

    if (tierBonus > 0) {
      return {
        rate: p.commissionRate,
        baseRate,
        tierBonus,
        tier
      };
    }

    return {
      rate: p.commissionRate,
      baseRate: null,
      tierBonus: 0,
      tier: null
    };
  });

  

  // ------------------ COMPUTED ------------------

  performanceStats = computed(() => {
    const product = this.product();
    if (!product) return null;

    const p = product.promotion;

    const ctr = p.views ? (p.clickCount / p.views) * 100 : 0;
    const cvr = p.clickCount ? (p.conversions / p.clickCount) * 100 : 0;
    const avgOrderValue = p.conversions ? (p.earnings / p.conversions) : 0;

    return {
      ctr,
      cvr,
      avgOrderValue,
      performanceScore: ((ctr + cvr + (p.commissionRate / 2)) / 3).toFixed(1)
    };
  });

  commissionDetails = computed(() => {
    const product = this.product();
    if (!product) return null;

    const p = product.promotion;

    const type = p.commissionType ?? 'percentage';

    const value =
      type === 'percentage' ? `${p.commissionRate}%` : `$${p.fixedCommission?.toFixed(2)} per sale`;

    const potential =
      type === 'percentage'
        ? ((product.price * p.commissionRate) / 100).toFixed(2)
        : (p.fixedCommission ?? 0).toFixed(2);

    return {
      type,
      value,
      potentialPerSale: potential,
      totalEarned: p.earnings.toFixed(2),
      isHighCommission: p.commissionRate >= 20
    };
  });

  // ------------------ LIFECYCLE ------------------

ngOnInit(): void {
  this.route.paramMap
    .pipe(takeUntilDestroyed(this.destroyRef)) // ✅ FIXED
    .subscribe(async (params) => {
      const productId = params.get('productId');

      if (!productId) {
        this.error.set('Product ID is required');
        this.router.navigate(['/dashboard/stores']);
        return;
      }

      await this.loadProductDetails(productId);
      await this.loadRelatedProducts();

      this.analyticsService.trackProductView(productId, 'promoter');
    });
}

  // ------------------ DATA LOADERS ------------------

  private async loadProductDetails(productId: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await firstValueFrom(
        this.productService.getProductById(
          productId,
          this.user()?._id ?? ''
        )
      );

      if (!response?.data) throw new Error('Product not found');

      this.product.set(response.data);

    } catch (err) {
      console.error(err);
      this.error.set('Failed to load product details.');
      this.snackBar.open('Failed to load product details', 'Close', {
        duration: 5000
      });
    } finally {
      this.loading.set(false);
    }
  }

  private async loadRelatedProducts(): Promise<void> {
    const product = this.product();
    if (!product) return;

    this.loadingRelated.set(true);

    try {
      const related = await firstValueFrom(
        this.storeService.getRelatedProducts(product._id ?? '', { limit: 8 })
      );

      this.relatedProducts.set(Array.isArray(related.data) ? related.data : []);

    } catch (err) {
      console.error('Failed to load related products:', err);
    } finally {
      this.loadingRelated.set(false);
    }
  }

  // ------------------ ACTIONS ------------------

  async copyPromotionLink(): Promise<void> {
    const product = this.product();
    if (!product) return;

    const promotion = await this.ensurePromotion(product);
    if (!promotion) return;

    navigator.clipboard.writeText(promotion.affiliateUrl).then(() => {
      this.snackBar.open('Promotion link copied!', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    });
  }

  async shareProduct(platform: 'whatsapp' | 'facebook' | 'twitter' | 'copy' | any): Promise<void> {
    const product = this.product();
    if (!product) return;
    const promotion = await this.ensurePromotion(product);
    if (!promotion) return;

    const shareData = {
      title: `Check out ${product.name}`,
      text: `${product.name} - $${product.price} | ${product.promotion.commissionRate}% commission`,
      url: promotion.affiliateUrl
    };

    this.shareService.share(shareData, platform);

    if (platform === 'copy') {
      this.snackBar.open('Link copied!', 'Close', { duration: 3000 });
    }
  }

  generateWhatsAppMessage(): void {
    void this.shareGeneratedWhatsAppMessage();
  }

  private async shareGeneratedWhatsAppMessage(): Promise<void> {
    const product = this.product();
    if (!product) return;

    const promotion = await this.ensurePromotion(product);
    if (!promotion) return;

    const message = `*${product.name}*\n\n` +
      `Price: NGN ${product.price.toLocaleString()}\n` +
      `Commission: ${product.promotion.commissionRate}%\n\n` +
      `Category: ${product.category}\n` +
      `Store: ${product.store.name}\n\n` +
      `Order here: ${promotion.affiliateUrl}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  }

  selectImage(index: number): void {
    this.selectedImageIndex.set(index);
  }

  navigateToProduct(product: Product): void {
    this.router.navigate(['/dashboard/stores/product', product._id]);
  }

  // ------------------ HELPERS ------------------

  private async ensurePromotion(product: Product): Promise<{ trackingCode: string; uniqueId: string; affiliateUrl: string } | null> {
    const existingUrl = product.promotion?.affiliateUrl || product.promotion?.promotionUrl;
    const existingCode = product.promotion?.trackingCode;

    if (existingUrl && existingCode) {
      return {
        trackingCode: existingCode,
        uniqueId: product.promotion?.uniqueId || '',
        affiliateUrl: existingUrl
      };
    }

    const promoterId = this.user()?._id;
    if (!promoterId) {
      this.snackBar.open('You must be logged in to promote products', 'Close', { duration: 5000 });
      return null;
    }

    try {
      const response = await firstValueFrom(this.promotionService.createPromotion({
        productId: product._id ?? '',
        promoterId,
        storeId: product.store._id,
        commissionRate: product.promotion?.commissionRate,
        commissionType: product.promotion?.commissionType,
        fixedCommission: product.promotion?.fixedCommission
      }));

      const data = response?.data;
      const trackingCode = data?.uniqueCode || data?.trackingCode;
      const affiliateUrl = data?.affiliateUrl || data?.promotionUrl || this.promotionService.getTrackingLink(trackingCode, product._id ?? '');

      this.product.update(current => current ? {
        ...current,
        promotion: {
          ...current.promotion,
          trackingCode,
          uniqueId: data?.uniqueId,
          affiliateUrl,
          promotionUrl: affiliateUrl
        }
      } : current);

      return {
        trackingCode,
        uniqueId: data?.uniqueId || '',
        affiliateUrl
      };
    } catch (error) {
      console.error('Failed to create promotion link:', error);
      this.snackBar.open('Failed to create promotion link. Please try again.', 'Close', { duration: 5000 });
      return null;
    }
  }

  getPerformanceColor(rate: number): string {
    if (rate >= 30) return 'success';
    if (rate >= 15) return 'warning';
    return 'primary';
  }

  getPerformanceLabel(score: number): string {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Average';
    return 'Low';
  }

  getStoreBadgeClass(tier: string): string {
    return tier === 'premium' ? 'premium-badge' : 'basic-badge';
  }

  getFormattedDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  setActiveTab(_: number): void {}

  copyLandingUrl(): void {
    const url = this.landingUrl();
    if (!url) return;
    navigator.clipboard.writeText('https://' + url).then(() => {
      this.snackBar.open('Landing URL copied!', 'Close', { duration: 3000 });
    });
  }

  async retryLoadProduct(): Promise<void> {
    const params = this.route.snapshot.paramMap;
    const productId = params.get('productId');
    
    if (productId) {
      await this.loadProductDetails(productId);
      await this.loadRelatedProducts();
    }
  }
}
