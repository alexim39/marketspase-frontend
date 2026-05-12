// services/promotion-tracking.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services';
import { Router } from '@angular/router';
import { Product } from '../../models';

export interface CreatePromotionDto {
  productId: string;
  promoterId: string;
  storeId: string;
  commissionRate?: number;
  commissionType?: 'percentage' | 'fixed';
  fixedCommission?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface PromotionStats {
  trackingId: string;
  productId: string;
  productName: string;
  views: number;
  clicks: number;
  conversions: number;
  earnings: number;
  clickThroughRate: number;
  conversionRate: number;
  uniqueCode: string;
  uniqueId: string;
  createdAt: Date;
  lastActivityAt: Date;
  deviceTypes: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
}

@Injectable()
export class PromotionService {
  private apiService = inject(ApiService);
  private apiUrl = 'stores/product/promotions';
  private router = inject(Router);

  /**
   * Create a new promotion tracking link
   */
  createPromotion(data: CreatePromotionDto): Observable<any> {
    const { productId, storeId, commissionRate, commissionType, fixedCommission, startDate, endDate } = data;
    return this.apiService.post<any>(`${this.apiUrl}/create`, {
      productId,
      storeId,
      commissionRate,
      commissionType,
      fixedCommission,
      startDate,
      endDate
    }, undefined, true);
  }

  /**
   * Get all promotions for a promoter
   */
  getPromoterPromotions(promoterId: string): Observable<any> {
    return this.apiService.get<any>(`${this.apiUrl}/promoter`, undefined, undefined, true);
  }

  /**
   * Get promotion stats for a specific product
   */
 /*  getProductPromotionStats(productId: string, promoterId: string): Observable<any> {
    const params = new HttpParams()
      .set('productId', productId)
      .set('promoterId', promoterId);
    return this.apiService.get<any>(`${this.apiUrl}/stats`, params, undefined, true);
  } */

  /**
   * Get all promotion stats for dashboard
   */
  getPromotionDashboard(promoterId: string): Observable<any> {
    return this.apiService.get<any>(`${this.apiUrl}/dashboard`, undefined, undefined, true);
  }

  /**
   * Update promotion settings
   */
  // updatePromotion(trackingId: string, data: Partial<CreatePromotionDto>): Observable<any> {
  //   return this.apiService.put<any>(`${this.apiUrl}/${trackingId}`, data, undefined, true);
  // }

  /**
   * Deactivate promotion
   */
  // deactivatePromotion(trackingId: string): Observable<any> {
  //   return this.apiService.patch<any>(`${this.apiUrl}/${trackingId}/deactivate`, {}, undefined, true);
  // }

  /**
   * Get tracking link
   */
  getTrackingLink(uniqueCode: string, productId: string): string {
    return `${this.apiService.getBaseUrl()}/${this.apiUrl}/track-click/${encodeURIComponent(uniqueCode)}`;
  }

  /**
   * Generate WhatsApp message with tracking link
   */
  generateWhatsAppMessage(product: Product, uniqueCode: string, commissionRate: number, price: number, affiliateUrl?: string): string {
    const link = affiliateUrl || this.getTrackingLink(uniqueCode, product._id ?? '');
    const storeName = product.store?.name ? ` from ${product.store.name}` : '';

    const message = `*${product.name}*

I found this${storeName} on MarketSpase and thought you might like it.

Price: NGN ${Number(price || 0).toLocaleString('en-NG')}

View or order here:
${link}

Secure checkout is available on MarketSpase, with payment held until delivery is confirmed.`;

    return encodeURIComponent(message);
  }

  /**
   * Track a click on promotion link (already handled by redirect)
   * This is separate - called when user lands on product page
   */
  // recordPromotionView(uniqueCode: string): Observable<any> {
  //   return this.apiService.post(`${this.apiUrl}/${uniqueCode}/view`, {});
  // }

  /**
   * Generate promotion link for sharing
   */
  // getPromotionLink(trackingCode: string): string {
  //   return `${window.location.origin}/product/${trackingCode}`;
  // }


  /**
   * Generate a promotion link for a product
   * @param productId - ID of the product to promote
   * @param promoterId - ID of the promoter
   * @param options - Optional configuration (storeId, commissionRate, etc.)
   */
  // generatePromotionLink(
  //   productId: string, 
  //   promoterId: string, 
  //   options?: {
  //     storeId?: string;
  //     commissionRate?: number;
  //     commissionType?: string;
  //     fixedCommission?: number;
  //   }
  // ): Observable<any> {
  //   const body = {
  //     promoterId,
  //     storeId: options?.storeId,
  //     commissionRate: options?.commissionRate,
  //     commissionType: options?.commissionType,
  //     fixedCommission: options?.fixedCommission
  //   };
    
  //   return this.apiService.post(`stores/product/${productId}/generate-link`, body);
  // }

  /**
   * Get promotion statistics for a specific product and promoter
   * @param productId - ID of the product
   * @param promoterId - ID of the promoter (optional, defaults to current user)
   */
/*   getPromotionStats(productId: string, promoterId?: string): Observable<any> {
    let params = new HttpParams();
    
    if (promoterId) {
      params = params.set('promoterId', promoterId);
    }
    
    return this.apiService.get(`stores/product/${productId}/promotion-stats`, params);
  }
 */
  /**
   * Get all promotions for a promoter (dashboard view)
   * @param promoterId - ID of the promoter
   */
 /*  getPromoterDashboard(promoterId: string): Observable<any> {
    return this.apiService.get(`${this.apiUrl}/dashboard`, new HttpParams().set('promoterId', promoterId) );
  } */


  /**
   * View promotion stats (opens modal or navigates to stats page)
   * This is a UI helper method, not an API call
   */
 /*  viewPromotionStats(product: any, promotionData: any): void {
    // Navigate to stats page with state
    // This would be implemented in the component
    this.router.navigate(['/dashboard/promotions/stats', product._id], {
      state: { 
        product: product,
        promotion: promotionData,
        stats: {
          views: promotionData.viewCount,
          clicks: promotionData.clickCount,
          conversions: promotionData.conversionCount,
          earnings: promotionData.earnings,
          ctr: promotionData.clickThroughRate,
          conversionRate: promotionData.conversionRate
        }
      }
    });
  } */

  /**
   * Track a product view from a promotion link
   */
  trackProductView(productId: string, trackingCode?: string, uniqueId?: string, deviceType?: string): Observable<any> {
    //console.log('Tracking product view:', { productId, trackingCode, uniqueId, deviceType });
    
    return this.apiService.post(`${this.apiUrl}/${productId}/track-view`, {
      trackingCode,
      uniqueId,
      deviceType
    }, undefined, true);
  }


  /**
   * Track a click on promotion link
   */
  trackPromotionClick(uniqueCode: string, deviceType?: string, source?: string): Observable<any> {
    //console.log('Tracking promotion click:', { uniqueCode, deviceType, source });
    
    let params = new HttpParams();
    if (deviceType) params = params.set('deviceType', deviceType);
    if (source) params = params.set('source', source);
    params = params.set('redirect', 'false');
    
    // Use the correct endpoint for click tracking
    return this.apiService.get(`${this.apiUrl}/track-click/${uniqueCode}`, params, undefined, true);
  }


  /**
   * Get promotion performance for a specific product
   */
 /*  getPromotionPerformance(productId: string, promoterId?: string): Observable<any> {
    let params = new HttpParams();
    if (promoterId) {
      params = params.set('promoterId', promoterId);
    }
    
    return this.apiService.get(`${this.apiUrl}/${productId}/promotion-performance`, params, undefined, true);
  } */

}
