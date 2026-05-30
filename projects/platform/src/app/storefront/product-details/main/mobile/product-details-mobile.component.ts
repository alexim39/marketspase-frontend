import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { CurrencyUtilsPipe, TruncatePipe } from '@shared/services';
import { PaystackService } from '../../../../common/services/paystack.service';
import { StoreFooterComponent } from '../../../core/store-footer/store-footer.component';
import { StorefrontService } from '../../../services/storefront.service';
import { PromotionService } from '../../../../store/promoter/services/promotion.service';
import { ShareService } from '../../../../store/services/share.service';
import { ProductDetailsComponent } from '../product-details.component';
import { ProductReviewsComponent } from '../components/product-reviews/product-reviews.component';
import { ProductSpecificationsComponent } from '../components/product-specifications/product-specifications.component';
import { RelatedProductsComponent } from '../components/related-products/related-products.component';

@Component({
  selector: 'app-mobile-product-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    CurrencyUtilsPipe,
    TruncatePipe,
    StoreFooterComponent,
    ProductReviewsComponent,
    ProductSpecificationsComponent,
    RelatedProductsComponent,
  ],
  providers: [
    StorefrontService,
    PromotionService,
    PaystackService,
    ShareService,
  ],
  templateUrl: './product-details-mobile.component.html',
  styleUrl: './product-details-mobile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileProductDetailsComponent extends ProductDetailsComponent {
  readonly selectedImageIndex = signal(0);
  readonly detailsOpen = signal<'description' | 'specs' | 'reviews'>('description');

  readonly activeImage = computed(() => {
    const images = this.images();
    return images[this.selectedImageIndex()] || images[0] || null;
  });

  readonly currentProductUrl = computed(() => {
    if (typeof window === 'undefined') return '';
    return window.location.href;
  });

  readonly hasPromotionContext = computed(() => {
    const productPromotion = this.product()?.promotion;
    return Boolean(
      this.trackingCode()
      || this.uniqueId()
      || this.activePromotion()?.affiliateUrl
      || productPromotion?.affiliateUrl
      || productPromotion?.promotionUrl
      || productPromotion?.shareUrl
    );
  });

  readonly productLinkForCopy = computed(() => {
    const productPromotion = this.product()?.promotion;
    return this.activePromotion()?.affiliateUrl
      || productPromotion?.affiliateUrl
      || productPromotion?.promotionUrl
      || productPromotion?.shareUrl
      || this.currentProductUrl();
  });

  stockLabel(): string {
    const status = this.stockStatus();
    if (status === 'out-of-stock') return 'Out of stock';
    if (status === 'low-stock') return `Only ${this.currentStock()} left`;
    return 'In stock';
  }

  stockTone(): string {
    const status = this.stockStatus();
    if (status === 'out-of-stock') return 'tone-bad';
    if (status === 'low-stock') return 'tone-warn';
    return 'tone-good';
  }

  setImage(index: number): void {
    const images = this.images();
    if (index < 0 || index >= images.length) return;
    this.selectedImageIndex.set(index);
  }

  decreaseQuantity(): void {
    this.onQuantityChange(Math.max(1, this.quantity() - 1));
  }

  increaseQuantity(): void {
    this.onQuantityChange(Math.min(this.maxQuantity(), this.quantity() + 1));
  }

  async copyProductLink(): Promise<void> {
    const url = this.productLinkForCopy();
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      this.showNotification(this.hasPromotionContext() ? 'Referral link copied' : 'Product link copied', 'success');
    } catch (error) {
      console.error('Failed to copy product link:', error);
      this.showNotification('Could not copy this link on your device.', 'error');
    }
  }

  async shareProduct(): Promise<void> {
    const product = this.product();
    const url = this.productLinkForCopy();
    if (!product || !url) return;

    const data = {
      title: product.name,
      text: `${product.name} on MarketSpase`,
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(data);
        return;
      }

      await navigator.clipboard.writeText(url);
      this.showNotification('Product link copied for sharing', 'success');
    } catch (error) {
      console.error('Failed to share product:', error);
      this.showNotification('Sharing was cancelled or unavailable.', 'info');
    }
  }
}
