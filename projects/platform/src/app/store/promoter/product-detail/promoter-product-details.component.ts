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
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
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
import { CurrencyUtilsPipe } from '../../../../../../shared-services/src/public-api';
import { TruncatePipe } from '../../shared';

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
import { ProductLoaderComponent } from './components/product-loader/product-loader.component';

@Component({
  selector: 'app-promoter-product-details',
  standalone: true,
  providers: [
    PromoterProductService,
    ShareService,
    AnalyticsService,
    StorefrontService
  ],
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    CurrencyUtilsPipe,
    ProductImageGalleryComponent,
    ProductHeaderComponent,
    ProductActionsComponent,
    ProductTabsComponent,
    CommissionCardComponent,
    StoreInfoCardComponent,
    RelatedProductsComponent,
    TruncatePipe,
    MatChipsModule,
    ProductLoaderComponent,
    
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
  private userService = inject(UserService);

  private destroyRef = inject(DestroyRef);

  // Signals
  product = signal<Product | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  selectedImageIndex = signal(0);
  relatedProducts = signal<Product[]>([]);
  loadingRelated = signal(false);

  user = this.userService.user;

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

  copyPromotionLink(): void {
    const product = this.product();
    if (!product) return;

    const link = `${window.location.origin}/promote/${product._id}?ref=${product.promotion.trackingCode}`;
    // `https://marketspase.com/promote/${productId}?ref=${uniqueCode}`; 

    navigator.clipboard.writeText(link).then(() => {
      this.snackBar.open('Promotion link copied!', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    });
  }

  shareProduct(platform: 'whatsapp' | 'facebook' | 'twitter' | 'copy' | any): void {
    const product = this.product();
    if (!product) return;

    const shareData = {
      title: `Check out ${product.name}`,
      text: `${product.name} - $${product.price} | ${product.promotion.commissionRate}% commission`,
      url: `${window.location.origin}/promote/${product._id}?ref=${product.promotion.trackingCode}`
    };

    this.shareService.share(shareData, platform);

    if (platform === 'copy') {
      this.snackBar.open('Link copied!', 'Close', { duration: 3000 });
    }
  }

  generateWhatsAppMessage(): void {
    const product = this.product();
    if (!product) return;

    const message = `🎯 *${product.name}*\n\n` +
      `💰 Price: $${product.price}\n` +
      `🎁 Commission: ${product.promotion.commissionRate}%\n\n` +
      `📦 Category: ${product.category}\n` +
      `🏪 Store: ${product.store.name}\n\n` +
      `👉 Promo Link: ${window.location.origin}/promote/${product._id}?ref=${product.promotion.trackingCode}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  }

  selectImage(index: number): void {
    this.selectedImageIndex.set(index);
  }

  navigateToProduct(product: Product): void {
    this.router.navigate(['/dashboard/stores/product', product._id]);
  }

  // ------------------ HELPERS ------------------

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

  async retryLoadProduct(): Promise<void> {
    const params = this.route.snapshot.paramMap;
    const productId = params.get('productId');
    
    if (productId) {
      await this.loadProductDetails(productId);
      await this.loadRelatedProducts();
    }
  }
}