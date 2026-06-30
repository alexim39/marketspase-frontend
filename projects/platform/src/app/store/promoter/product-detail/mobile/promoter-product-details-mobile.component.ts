import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { CurrencyUtilsPipe } from '@shared/services';
import { AnalyticsService } from '../../../services/analytics.service';
import { PromoterProductService } from '../../../services/promoter-product.service';
import { ShareService } from '../../../services/share.service';
import { StorefrontService } from '../../../../storefront/services/storefront.service';
import { Product } from '../../../models';
import { PromotionService } from '../../services/promotion.service';
import { PromoterProductDetailsComponent } from '../promoter-product-details.component';

type MobileSection = 'pitch' | 'performance' | 'store' | 'details';

interface MobileMetric {
  icon: string;
  label: string;
  value: string;
  tone: 'good' | 'warn' | 'bad' | 'neutral';
}

@Component({
  selector: 'app-promoter-product-details-mobile',
  standalone: true,
  providers: [
    PromoterProductService,
    ShareService,
    AnalyticsService,
    StorefrontService,
    PromotionService,
  ],
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CurrencyUtilsPipe,
  ],
  templateUrl: './promoter-product-details-mobile.component.html',
  styleUrls: ['./promoter-product-details-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromoterProductDetailsMobileComponent extends PromoterProductDetailsComponent {
  private readonly mobileRouter = inject(Router);
  private readonly mobileSnackBar = inject(MatSnackBar);

  readonly activeSection = signal<MobileSection>('pitch');

  readonly currentImage = computed(() => {
    const product = this.product();
    if (!product?.images?.length) return null;
    return product.images[this.selectedImageIndex()] || product.images[0];
  });

  readonly sectionItems: Array<{ id: MobileSection; label: string; icon: string }> = [
    { id: 'pitch', label: 'Pitch', icon: 'campaign' },
    { id: 'performance', label: 'Stats', icon: 'monitoring' },
    { id: 'store', label: 'Store', icon: 'storefront' },
    { id: 'details', label: 'Details', icon: 'inventory_2' },
  ];

  readonly productImages = computed(() => this.product()?.images || []);

  setSection(section: MobileSection): void {
    this.activeSection.set(section);
  }

  goBack(): void {
    void this.mobileRouter.navigate(['/dashboard/stores/offerings']);
  }

  imageAlt(product: Product): string {
    return this.currentImage()?.altText || product.name;
  }

  previousImage(): void {
    const images = this.productImages();
    if (images.length < 2) return;
    const nextIndex = this.selectedImageIndex() === 0 ? images.length - 1 : this.selectedImageIndex() - 1;
    this.selectImage(nextIndex);
  }

  nextImage(): void {
    const images = this.productImages();
    if (images.length < 2) return;
    const nextIndex = (this.selectedImageIndex() + 1) % images.length;
    this.selectImage(nextIndex);
  }

  shareNative(): void {
    void this.shareProduct(undefined);
  }

  async copyPitch(): Promise<void> {
    const product = this.product();
    if (!product) return;

    const text = [
      product.name,
      `Price: NGN ${Number(product.price || 0).toLocaleString('en-NG')}`,
      product.description ? product.description.slice(0, 160) : '',
      'Ask me for the secure MarketSpase link to order.',
    ].filter(Boolean).join('\n\n');

    try {
      await navigator.clipboard.writeText(text);
      this.mobileSnackBar.open('Pitch copied', 'OK', { duration: 2200 });
    } catch {
      this.mobileSnackBar.open('Unable to copy pitch', 'OK', { duration: 2600 });
    }
  }

  metricCards(product: Product): MobileMetric[] {
    const conversionRate = this.conversionRate(product);
    const clicks = product.promotion?.clickCount || 0;
    const sales = product.purchaseCount || product.promotion?.conversions || 0;

    return [
      {
        icon: 'visibility',
        label: 'Views',
        value: this.formatNumber(product.viewCount || product.promotion?.views || 0),
        tone: 'neutral',
      },
      {
        icon: 'ads_click',
        label: 'Clicks',
        value: this.formatNumber(clicks),
        tone: clicks > 0 ? 'good' : 'neutral',
      },
      {
        icon: 'shopping_bag',
        label: 'Sales',
        value: this.formatNumber(sales),
        tone: sales > 0 ? 'good' : 'neutral',
      },
      {
        icon: 'percent',
        label: 'Conv.',
        value: `${conversionRate.toFixed(1)}%`,
        tone: conversionRate >= 5 ? 'good' : conversionRate > 0 ? 'warn' : 'neutral',
      },
    ];
  }

  commissionLabel(product: Product): string {
    const promotion = product.promotion;
    if (!promotion) return 'Not available';

    if (promotion.commissionType === 'fixed') {
      return `NGN ${Number(promotion.fixedCommission || promotion.commissionPerSale || 0).toLocaleString('en-NG')}`;
    }

    return `${promotion.commissionRate || 0}% per sale`;
  }

  potentialEarning(product: Product): number {
    const promotion = product.promotion;
    if (!promotion) return 0;
    if (promotion.commissionType === 'fixed') {
      return promotion.fixedCommission || promotion.commissionPerSale || 0;
    }
    return (Number(product.price || 0) * Number(promotion.commissionRate || 0)) / 100;
  }

  conversionRate(product: Product): number {
    const clicks = product.promotion?.clickCount || product.promotion?.views || product.viewCount || 0;
    const conversions = product.promotion?.conversions || product.promotion?.conversionCount || product.purchaseCount || 0;
    return clicks > 0 ? (conversions / clicks) * 100 : 0;
  }

  stockLabel(product: Product): string {
    if ((product.quantity || 0) <= 0) return 'Out of stock';
    if ((product.quantity || 0) <= (product.lowStockAlert || 5)) return 'Low stock';
    return 'Available';
  }

  stockTone(product: Product): 'good' | 'warn' | 'bad' {
    if ((product.quantity || 0) <= 0) return 'bad';
    if ((product.quantity || 0) <= (product.lowStockAlert || 5)) return 'warn';
    return 'good';
  }

  storeUrl(product: Product): string | null {
    if (!product.store?.storeLink) return null;
    return product.store.storeLink.startsWith('http') ? product.store.storeLink : `/store/${product.store.storeLink}`;
  }

  trackImage(index: number, image: { url?: string }): string {
    return image.url || String(index);
  }

  trackMetric(index: number, metric: MobileMetric): string {
    return metric.label || String(index);
  }

  private formatNumber(value: number): string {
    return Number(value || 0).toLocaleString('en-NG');
  }
}
