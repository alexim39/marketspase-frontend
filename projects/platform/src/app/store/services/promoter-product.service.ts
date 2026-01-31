// services/promoter-product.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { PromoterProduct, ProductFilter } from '../promoter/models/promoter-product.model';
import { ApiService } from '../../../../../shared-services/src/public-api';

@Injectable()
export class PromoterProductService {
  private apiService = inject(ApiService);
  private apiUrl = 'stores/product';

  getProducts(filters?: Partial<ProductFilter>): Observable<any> {
    let params = new HttpParams();
    
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

    return this.apiService.get<any>(`${this.apiUrl}/list`, params, undefined, true).pipe(
      catchError(error => {
        console.error('Error fetching promoter products:', error);
        return of([]);
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