// services/promoted-products.service.ts
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PromotionTrackingService } from '../../services/promotion-tracking.service';
import { UserInterface } from '../../../../../../../shared-services/src/public-api';
import { PromotedProduct } from '../promoted-products.component';
import { PromotedProductsStore } from '../stores/promoted-products.store';
import { PerformanceCalculator } from '../utils/performance-calculator';
import { ProductTransformer } from '../utils/product-transformer';

@Injectable()
export class PromotedProductsService {
  private promotionService = inject(PromotionTrackingService);
  private snackBar = inject(MatSnackBar);
  private store = inject(PromotedProductsStore);
  private performanceCalculator = inject(PerformanceCalculator);
  private productTransformer = inject(ProductTransformer);

  async loadPromotedProducts(userId: string): Promise<void> {
    this.store.setLoading(true);
    this.store.setError(null);

    try {
      const response = await firstValueFrom(
        this.promotionService.getPromotionDashboard(userId)
      );

      const promotionsData = this.extractPromotionsData(response);

      if (!promotionsData || promotionsData.length === 0) {
        this.store.setProducts([]);
        this.store.setFilteredProducts([]);
        this.store.setLoading(false);
        return;
      }

      const productsWithPerformance = await this.fetchPerformanceData(promotionsData, userId);
      const products = this.productTransformer.transform(productsWithPerformance, this.promotionService);
      
      this.store.setProducts(products);
      this.store.setFilteredProducts(products);

    } catch (error) {
      console.error('Error loading promoted products:', error);
      this.store.setError('Failed to load promoted products. Please try again.');
      this.snackBar.open('Error loading products', 'Close', { duration: 5000 });
    } finally {
      this.store.setLoading(false);
    }
  }

  async refreshStats(userId: string): Promise<void> {
    if (this.store.refreshing()) return;

    this.store.setRefreshing(true);
    try {
      const response = await firstValueFrom(
        this.promotionService.getPromotionDashboard(userId)
      );

      const promotionsData = this.extractPromotionsData(response);
      
      if (!promotionsData || !Array.isArray(promotionsData)) {
        return;
      }

      const updatedProducts = this.productTransformer.transform(promotionsData, this.promotionService);
      
      // Update existing products with new stats
      const productMap = new Map(updatedProducts.map(p => [p.trackingId, p]));
      const currentProducts = this.store.products();
      
      const mergedProducts = currentProducts.map(product => {
        const updated = productMap.get(product.trackingId);
        if (updated) {
          return { ...product, ...updated };
        }
        return product;
      });

      this.store.setProducts(mergedProducts);

    } catch (error) {
      console.error('Error refreshing stats:', error);
    } finally {
      this.store.setRefreshing(false);
    }
  }

  async deactivatePromotion(product: PromotedProduct): Promise<boolean> {
    if (!confirm(`Are you sure you want to deactivate promotion for "${product.productName}"?`)) {
      return false;
    }

    try {
      await firstValueFrom(
        this.promotionService.deactivatePromotion(product.trackingId)
      );
      
      this.store.updateProduct(product.trackingId, { isActive: false });
      this.snackBar.open('Promotion deactivated successfully', 'Close', { duration: 3000 });
      return true;
      
    } catch (error) {
      console.error('Error deactivating promotion:', error);
      this.snackBar.open('Failed to deactivate promotion', 'Close', { duration: 5000 });
      return false;
    }
  }

  private extractPromotionsData(response: any): any[] {
    if (response?.data?.promotions) {
      return response.data.promotions;
    } else if (response?.promotions) {
      return response.promotions;
    } else if (Array.isArray(response?.data)) {
      return response.data;
    } else if (Array.isArray(response)) {
      return response;
    }
    return [];
  }

  private async fetchPerformanceData(promotionsData: any[], userId: string): Promise<any[]> {
    return await Promise.all(
      promotionsData.map(async (promo) => {
        try {
          const performance = await firstValueFrom(
            this.promotionService.getPromotionPerformance(promo.productId, userId)
          );
          
          return {
            ...promo,
            ...performance.data,
            shareLink: this.promotionService.getTrackingLink(promo.uniqueCode, promo.productId),
            performance: this.performanceCalculator.calculate(performance.data)
          };
        } catch (err) {
          console.error(`Error fetching performance for ${promo.productId}:`, err);
          return promo;
        }
      })
    );
  }
}