// utils/product-transformer.ts
import { Injectable } from '@angular/core';
import { PromotedProduct } from '../promoted-products.component';
import { PromotionTrackingService } from '../../services/promotion-tracking.service';
import { PerformanceCalculator } from './performance-calculator';

@Injectable()
export class ProductTransformer {
  constructor(private performanceCalculator: PerformanceCalculator) {}

  transform(promotions: any[], promotionService: PromotionTrackingService): PromotedProduct[] {
    if (!promotions || !Array.isArray(promotions)) {
      return [];
    }

    return promotions.map(promo => ({
      trackingId: promo.trackingId || promo._id,
      productId: promo.productId,
      productName: promo.productName || 'Unknown Product',
      productPrice: promo.productPrice,
      productImage: promo.productImage,
      uniqueCode: promo.uniqueCode,
      uniqueId: promo.uniqueId,
      shareLink: promo.shareLink || promotionService.getTrackingLink(promo.uniqueCode, promo.productId),
      views: promo.views || 0,
      clicks: promo.clicks || 0,
      conversions: promo.conversions || 0,
      earnings: promo.earnings || 0,
      clickThroughRate: promo.clickThroughRate || 0,
      conversionRate: promo.conversionRate || 0,
      commissionRate: promo.commissionRate || 10,
      isActive: promo.isActive === true,
      performance: promo.performance || this.performanceCalculator.calculate(promo),
      deviceTypes: promo.deviceTypes || { mobile: 0, desktop: 0, tablet: 0 },
      referralSources: promo.referralSources || [],
      createdAt: promo.createdAt,
      lastActivityAt: promo.lastActivityAt || promo.createdAt
    }));
  }
}