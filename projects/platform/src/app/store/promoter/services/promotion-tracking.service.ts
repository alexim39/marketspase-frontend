// services/promotion-tracking.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../../../shared-services/src/public-api';

export interface CreatePromotionDto {
  productId: string;
  promoterId: string;
  storeId: string;
  commissionRate: number;
  commissionType: 'percentage' | 'fixed';
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
export class PromotionTrackingService {
  private apiService = inject(ApiService);
  private apiUrl = 'stores/product/promotions';

  /**
   * Create a new promotion tracking link
   */
  createPromotion(data: CreatePromotionDto): Observable<any> {
    return this.apiService.post<any>(`${this.apiUrl}/create`, data, undefined, true);
  }

  /**
   * Get all promotions for a promoter
   */
  getPromoterPromotions(promoterId: string): Observable<any> {
    const params = new HttpParams().set('promoterId', promoterId);
    return this.apiService.get<any>(`${this.apiUrl}/promoter`, params, undefined, true);
  }

  /**
   * Get promotion stats for a specific product
   */
  getProductPromotionStats(productId: string, promoterId: string): Observable<any> {
    const params = new HttpParams()
      .set('productId', productId)
      .set('promoterId', promoterId);
    return this.apiService.get<any>(`${this.apiUrl}/stats`, params, undefined, true);
  }

  /**
   * Get all promotion stats for dashboard
   */
  getPromotionDashboard(promoterId: string): Observable<{
    totalEarnings: number;
    totalClicks: number;
    totalConversions: number;
    activePromotions: number;
    promotions: PromotionStats[];
  }> {
    const params = new HttpParams().set('promoterId', promoterId);
    return this.apiService.get<any>(`${this.apiUrl}/dashboard`, params, undefined, true);
  }

  /**
   * Update promotion settings
   */
  updatePromotion(trackingId: string, data: Partial<CreatePromotionDto>): Observable<any> {
    return this.apiService.put<any>(`${this.apiUrl}/${trackingId}`, data, undefined, true);
  }

  /**
   * Deactivate promotion
   */
  deactivatePromotion(trackingId: string): Observable<any> {
    return this.apiService.patch<any>(`${this.apiUrl}/${trackingId}/deactivate`, {}, undefined, true);
  }

  /**
   * Get tracking link
   */
  getTrackingLink(uniqueCode: string): string {
    return `https://marketspase.com/promote/${uniqueCode}`;
  }

  /**
   * Generate WhatsApp message with tracking link
   */
  generateWhatsAppMessage(productName: string, uniqueCode: string, commissionRate: number, price: number): string {
    const link = this.getTrackingLink(uniqueCode);
    const message = `🚀 *Check out this amazing product!*\n\n` +
      `📦 *${productName}*\n` +
      `💰 Price: ₦${price.toLocaleString()}\n` +
      `🎯 Your Commission: ${commissionRate}%\n\n` +
      `👇 Click to view and earn:\n` +
      `${link}\n\n` +
      `Start promoting now and earn commissions on every sale! 💵`;
    
    return encodeURIComponent(message);
  }
}