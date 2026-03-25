// product-details.component.ts
import { Component, OnInit, inject, signal, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';

import { PromoterProduct } from '../models/promoter-product.model';
import { PromoterProductService } from '../../services/promoter-product.service';
import { ShareService } from '../../services/share.service';
import { AnalyticsService } from '../../services/analytics.service';
import { UserService } from '../../../common/services/user.service';
import { CurrencyUtilsPipe } from '../../../../../../shared-services/src/public-api';

// Import child components
import { ProductImageGalleryComponent } from './components/product-image-gallery/product-image-gallery.component';
import { ProductHeaderComponent } from './components/product-header/product-header.component';
import { ProductActionsComponent } from './components/product-actions/product-actions.component';
import { ProductTabsComponent } from './components/product-tabs/product-tabs.component';
import { CommissionCardComponent } from './components/commission-card/commission-card.component';
import { StoreInfoCardComponent } from './components/store-info-card/store-info-card.component';
import { RelatedProductsComponent } from './components/related-products/related-products.component';
import { TruncatePipe } from '../../shared';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-promoter-product-details',
  standalone: true,
  providers: [PromoterProductService, ShareService, AnalyticsService],
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    CurrencyUtilsPipe,
    // Child components
    ProductImageGalleryComponent,
    ProductHeaderComponent,
    ProductActionsComponent,
    ProductTabsComponent,
    CommissionCardComponent,
    StoreInfoCardComponent,
    RelatedProductsComponent,
    TruncatePipe,
    MatChipsModule
  ],
  templateUrl: './promoter-product-details.component.html',
  styleUrls: ['./promoter-product-details.component.scss']
})
export class PromoterProductDetailsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(PromoterProductService);
  private snackBar = inject(MatSnackBar);
  private shareService = inject(ShareService);
  private analyticsService = inject(AnalyticsService);
  private userService = inject(UserService);
  private destroy$ = new Subject<void>();

  // Signals
  product = signal<PromoterProduct | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  selectedImageIndex = signal<number>(0);
  relatedProducts = signal<PromoterProduct[]>([]);
  loadingRelated = signal<boolean>(false);

  public user = this.userService.user;

  // Computed values for child components
  performanceStats = computed(() => {
    const product = this.product();
    if (!product) return null;

    const promotion = product.promotion;
    const ctr = promotion.views > 0 ? (promotion.clicks / promotion.views) * 100 : 0;
    const cvr = promotion.clicks > 0 ? (promotion.conversions / promotion.clicks) * 100 : 0;
    const avgOrderValue = promotion.conversions > 0 ? (promotion.earnings / promotion.conversions) : 0;

    return {
      ctr,
      cvr,
      avgOrderValue,
      performanceScore: ((ctr + cvr + (product.promotion.commissionRate / 2)) / 3).toFixed(1)
    };
  });

  commissionDetails = computed(() => {
    const product = this.product();
    if (!product) return null;

    const promotion = product.promotion;
    const commissionType = promotion.commissionType || 'percentage';
    const commissionValue = commissionType === 'percentage' 
      ? `${promotion.commissionRate}%` 
      : `$${promotion.fixedCommission?.toFixed(2)} per sale`;

    const potentialEarnings = promotion.commissionType === 'percentage'
      ? ((product.price * promotion.commissionRate) / 100).toFixed(2)
      : (promotion.fixedCommission || 0).toFixed(2);

    return {
      type: commissionType,
      value: commissionValue,
      potentialPerSale: potentialEarnings,
      totalEarned: promotion.earnings.toFixed(2),
      isHighCommission: promotion.commissionRate >= 20
    };
  });

  async ngOnInit(): Promise<void> {
    const productId = this.route.snapshot.paramMap.get('productId');
    console.log('Loading product details for ID:', productId);
    if (!productId) {
      this.error.set('Product ID is required');
      this.router.navigate(['/dashboard/stores']);
      return;
    }

    await this.loadProductDetails(productId);
    this.loadRelatedProducts();
    
    if (this.product()) {
      this.analyticsService.trackProductView(productId, 'promoter');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadProductDetails(productId: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const productResponse = await this.productService.getProductById(productId, this.user()?._id ?? '').toPromise();
      if (!productResponse?.data) {
        throw new Error('Product not found');
      }
      this.product.set(productResponse.data);
    } catch (err) {
      console.error('Failed to load product details:', err);
      this.error.set('Failed to load product details. Please try again.');
      this.snackBar.open('Failed to load product details', 'Close', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }

  private async loadRelatedProducts(): Promise<void> {
    const product = this.product();
    if (!product) return;

    this.loadingRelated.set(true);
    try {
      const related = await this.productService.getRelatedProducts(
        product._id, 
        product.category
      ).toPromise();
      this.relatedProducts.set(Array.isArray(related) ? related : []);
    } catch (err) {
      console.error('Failed to load related products:', err);
    } finally {
      this.loadingRelated.set(false);
    }
  }

  // Public methods for child components
  copyPromotionLink(): void {
    const product = this.product();
    if (!product) return;

    const link = `${window.location.origin}/promote/${product.promotion.trackingCode}`;
    navigator.clipboard.writeText(link).then(() => {
      this.snackBar.open('Promotion link copied to clipboard!', 'Close', {
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
      url: `${window.location.origin}/promote/${product.promotion.trackingCode}`
    };

    this.shareService.share(shareData, platform);
    
    if (platform === 'copy') {
      this.snackBar.open('Link copied to clipboard!', 'Close', { duration: 3000 });
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
                   `👉 Promo Link: ${window.location.origin}/promote/${product.promotion.trackingCode}\n\n` +
                   `#${product.category.replace(/\s+/g, '')} #Promotion`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

  selectImage(index: number): void {
    this.selectedImageIndex.set(index);
  }

  navigateToProduct(productId: string): void {
    this.router.navigate(['/promoter/products', productId]);
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

/*   calculateDiscount(price: number, originalPrice: number): number {
    if (!originalPrice || originalPrice <= price) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  } */

  // For product tabs
  setActiveTab(index: number): void {
    // Method exists for tab change handling
  }
}