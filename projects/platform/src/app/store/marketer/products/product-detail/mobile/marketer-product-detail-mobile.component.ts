import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { CurrencyUtilsPipe } from '@shared/services';
import { StoreService } from '../../../../services/store.service';
import { DialogService } from '../../../../shared/services/dialog.service';
import { Product } from '../../../../models';
import { ProductService } from '../../product.service';
import { MarketerProductDetailComponent } from '../marketer-product-detail.component';

type DetailSection = 'overview' | 'pricing' | 'inventory' | 'promotion' | 'shipping' | 'variants' | 'seo';

interface MobileMetric {
  icon: string;
  label: string;
  value: string;
  tone?: 'good' | 'warn' | 'bad' | 'neutral';
}

@Component({
  selector: 'app-marketer-product-detail-mobile',
  standalone: true,
  providers: [StoreService, ProductService, DialogService],
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CurrencyUtilsPipe,
  ],
  templateUrl: './marketer-product-detail-mobile.component.html',
  styleUrls: ['./marketer-product-detail-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketerProductDetailMobileComponent extends MarketerProductDetailComponent {
  private readonly mobileSnackBar = inject(MatSnackBar);

  readonly activeSection = signal<DetailSection>('overview');
  readonly detailSheetOpen = signal(false);
  readonly actionSheetOpen = signal(false);

  metricCards(): MobileMetric[] {
    const product = this.product;
    if (!product) return [];

    return [
      {
        icon: 'visibility',
        label: 'Views',
        value: this.formatNumber(product.viewCount || 0),
        tone: 'neutral',
      },
      {
        icon: 'shopping_bag',
        label: 'Sales',
        value: this.formatNumber(product.purchaseCount || 0),
        tone: (product.purchaseCount || 0) > 0 ? 'good' : 'neutral',
      },
      {
        icon: 'inventory_2',
        label: 'Stock',
        value: String(product.quantity || 0),
        tone: this.stockTone(),
      },
      {
        icon: 'star',
        label: 'Rating',
        value: `${product.averageRating || 0}`,
        tone: (product.averageRating || 0) >= 4 ? 'good' : 'neutral',
      },
    ];
  }

  productImages(): Product['images'] {
    return this.product?.images || [];
  }

  primaryImageUrl(): string | null {
    if (this.selectedImage?.url) return this.selectedImage.url;
    return this.product?.images?.[0]?.url || null;
  }

  stockTone(): 'good' | 'warn' | 'bad' | 'neutral' {
    if (!this.product) return 'neutral';
    if ((this.product.quantity || 0) <= 0) return 'bad';
    if ((this.product.quantity || 0) <= (this.product.lowStockAlert || 10)) return 'warn';
    return 'good';
  }

  stockLabel(): string {
    return this.getStockStatus().text;
  }

  discountPercent(): number {
    const product = this.product;
    if (!product?.originalPrice || product.originalPrice <= product.price) return 0;
    return Math.round((1 - product.price / product.originalPrice) * 100);
  }

  receivableAmount(): number {
    const product = this.product;
    if (!product) return 0;
    return product.amountReceivable || product.promotion?.amountReceivable || product.price - product.price * 0.1;
  }

  commissionText(): string {
    const product = this.product;
    if (!product?.promotion && !product?.affiliate) return 'Not enabled';

    const promotion = product.promotion;
    const affiliate = product.affiliate;
    const type = promotion?.commissionType || affiliate?.commissionType;

    if (type === 'fixed') {
      const fixedAmount = promotion?.fixedCommission || affiliate?.fixedCommission || promotion?.commissionPerSale || product.commissionPerSale || 0;
      return this.formatRevenue(fixedAmount, product.currency || 'NGN');
    }

    const rate = promotion?.commissionRate || affiliate?.commissionRate || 0;
    return rate > 0 ? `${rate}% per sale` : 'Not enabled';
  }

  conversionRate(): number {
    const product = this.product;
    if (!product) return 0;
    const clicks = product.promotion?.clickCount || product.promotion?.views || product.viewCount || 0;
    const conversions = product.promotion?.conversions || product.promotion?.conversionCount || product.purchaseCount || 0;
    return clicks > 0 ? Math.round((conversions / clicks) * 1000) / 10 : 0;
  }

  specificationRows(): Array<{ key: string; value: string }> {
    const specs = this.product?.specifications;
    if (!specs) return [];

    if (Array.isArray(specs)) {
      return specs
        .map((spec, index) => ({
          key: spec?.key || spec?.name || `Spec ${index + 1}`,
          value: spec?.value || spec?.values?.join(', ') || '',
        }))
        .filter(spec => !!spec.value);
    }

    if (typeof specs === 'object') {
      return Object.entries(specs).map(([key, value]) => ({
        key,
        value: Array.isArray(value) ? value.join(', ') : String(value ?? ''),
      }));
    }

    return [];
  }

  visibilityLabel(): string {
    if (!this.product) return 'Unknown';
    if (this.product.isActive === false) return 'Inactive';
    if (this.product.isPublished === false) return 'Not published';
    return 'Live';
  }

  visibilityTone(): 'good' | 'warn' | 'bad' {
    if (!this.product?.isActive) return 'bad';
    if (this.product.isPublished === false) return 'warn';
    return 'good';
  }

  openSection(section: DetailSection): void {
    this.activeSection.set(section);
    this.detailSheetOpen.set(true);
    this.actionSheetOpen.set(false);
  }

  closeSection(): void {
    this.detailSheetOpen.set(false);
  }

  openActions(): void {
    this.actionSheetOpen.set(true);
    this.detailSheetOpen.set(false);
  }

  closeActions(): void {
    this.actionSheetOpen.set(false);
  }

  copyPublicLink(): void {
    const productId = this.product?._id || this.productId;
    if (!productId) return;

    const link = `${window.location.origin}/product/${productId}`;
    navigator.clipboard?.writeText(link).then(() => {
      this.mobileSnackBar.open('Product link copied', 'OK', { duration: 2200 });
    }).catch(() => {
      this.mobileSnackBar.open('Unable to copy link', 'OK', { duration: 2600 });
    });
  }

  trackImage(index: number, image: { url: string }): string {
    return image.url || String(index);
  }

  trackVariant(index: number, variant: { _id?: string; name?: string; sku?: string }): string {
    return variant._id || variant.sku || variant.name || String(index);
  }

  trackTag(index: number, tag: string): string {
    return tag || String(index);
  }
}
