// store.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../../../shared-services/src/public-api';

// store.model.ts
export interface Store {
  _id: string;
  name: string;
  description: string;
  logo: string;
  category: string;
  storeLink: string;
  isVerified: boolean;
  verificationTier: 'basic' | 'premium';
  createdAt: Date;
  analytics: {
    totalViews: number;
    totalSales: number;
    conversionRate: number;
    promoterTraffic: number;
  };
  productCount: number;
  productPreview: ProductPreview[];
  ownerInfo: {
    username: string;
    displayName: string;
    avatar: string;
  };
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
  };
  isFollowing?: boolean;
}

export interface ProductPreview {
  _id: string;
  name: string;
  price: number;
  images: { url: string }[];
  promotion: {
    commissionRate: number;
    commissionType: string;
  };
}

export interface StoreFilterOptions {
  categories: Array<{ name: string; count: number }>;
  verificationTiers: Array<{ name: string; count: number }>;
  totalStores: number;
  verifiedStores: number;
}

export interface StoreListResponse {
  success: boolean;
  data: Store[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: StoreFilterOptions;
}

@Injectable()
export class StoreListService {
  private apiService = inject(ApiService);
  private apiUrl = 'stores/store/promoter-store-list';

  getStoresForPromoter(params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    verificationTier?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    minProducts?: number;
  }): Observable<StoreListResponse> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });
    return this.apiService.get<StoreListResponse>(`${this.apiUrl}/stores`, httpParams);
  }

  getStoreDetails(storeId: string, page: number = 1, limit: number = 12): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.apiService.get(`${this.apiUrl}/${storeId}`, params);
  }

  getStoreProducts(storeId: string, page: number = 1, limit: number = 20, search: string = ''): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    if (search) params = params.set('search', search);
    return this.apiService.get(`${this.apiUrl}/${storeId}/products`, params);
  }

  toggleFollowStore(storeId: string): Observable<{ success: boolean; message: string; isFollowing: boolean }> {
    return this.apiService.post<any>(`${this.apiUrl}/${storeId}/follow`, {});
  }

  getFollowedStores(page: number = 1, limit: number = 20): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.apiService.get(`${this.apiUrl}/followed/stores`, params);
  }
}