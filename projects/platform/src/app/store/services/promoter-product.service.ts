// services/promoter-product.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PromoterProduct, ProductFilter } from '../promoter/models/promoter-product.model';
import { ApiService } from '../../../../../shared-services/src/public-api';
import { PaginatedResponse } from '../promoter/products-list/models/filter-state.model';

@Injectable()
export class PromoterProductService {
  private apiService = inject(ApiService);
  private apiUrl = 'stores/product';

  getPromoterStoreProducts(filters?: Partial<ProductFilter> & { page?: number; limit?: number }): Observable<PaginatedResponse<PromoterProduct>> {
    let params = new HttpParams();
    
    // Pagination params
    if (filters?.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters?.limit) {
      params = params.set('limit', filters.limit.toString());
    }
    
    // Filter params
    if (filters?.categories?.length) {
      params = params.set('categories', filters.categories.join(','));
    }
    
    if (filters?.priceRange) {
      params = params
        .set('minPrice', filters.priceRange.min.toString())
        .set('maxPrice', filters.priceRange.max.toString());
    }
    
    if (filters?.commissionRange) {
      params = params
        .set('minCommission', filters.commissionRange.min.toString())
        .set('maxCommission', filters.commissionRange.max.toString());
    }
    
    if (filters?.searchQuery) {
      params = params.set('search', filters.searchQuery);
    }
    
    if (filters?.sortBy) {
      params = params
        .set('sortBy', filters.sortBy)
        .set('sortDirection', filters.sortDirection || 'desc');
    }

    return this.apiService.get<PaginatedResponse<PromoterProduct>>(`${this.apiUrl}/list/promoter`, params, undefined, true).pipe(
      map(response => {
        if (!response || !response.data) {
          return {
            data: [],
            count: 0,
            total: 0,
            totalPages: 0,
            currentPage: 1,
            filters: {
              categories: [],
              priceRange: { minPrice: 0, maxPrice: 0, avgPrice: 0 },
              commissionRange: { minCommission: 0, maxCommission: 0, avgCommission: 0 }
            }
          };
        }
        return response;
      }),
      catchError(error => {
        console.error('Error fetching promoter products:', error);
        throw error;
      })
    );
  }

  getProductById(productId: string, promoterId: string): Observable<any> {
    return this.apiService.get<any>(`${this.apiUrl}/${productId}`, new HttpParams().set('promoterId', promoterId), undefined, true);
  }

  getRelatedProducts(productId: string, category: string): Observable<PromoterProduct> {
    return this.apiService.get<PromoterProduct>(`${this.apiUrl}/${productId}`, undefined, undefined, true);
  }

  trackView(productId: string, promoterId?: string): Observable<void> {
    return this.apiService.post<void>(`${this.apiUrl}/${productId}/view`, { promoterId }, undefined, true);
  }

  getPromotionStats(productId: string): Observable<any> {
    return this.apiService.get(`${this.apiUrl}/${productId}/stats`, undefined, undefined, true);
  }
}