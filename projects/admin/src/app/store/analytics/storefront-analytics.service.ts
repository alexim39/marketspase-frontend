import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../../../../shared-services/src/public-api';

export interface StorefrontAnalyticsRange {
  start: string;
  end: string;
}

export interface StorefrontAnalyticsSummary {
  grossSales: number;
  unitsSold: number;
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  fulfilledOrders: number;
  refundedOrders: number;
  uniqueBuyers: number;
  uniquePromoters: number;
  averageOrderValue: number;
  commissionAccrued: number;
  commissionPaid: number;
  commissionPending: number;
  lastPaidAt?: string | null;
}

export interface StorefrontTimeSeriesPoint {
  bucket: string;
  revenue: number;
  orders: number;
  units: number;
  commission: number;
}

export interface StorefrontStoreOption {
  _id: string;
  name: string;
  storeLink?: string;
  logo?: string;
  owner?: string;
  category?: string;
  isVerified?: boolean;
  isActive?: boolean;
  verificationTier?: string;
}

export interface StorefrontProductOption {
  _id: string;
  name: string;
  category?: string;
  price?: number;
  store?: {
    _id: string;
    name: string;
    storeLink?: string;
    logo?: string;
  } | null;
}

export interface StorefrontTopProductRow {
  product: {
    _id: string;
    name: string;
    category?: string;
    price?: number;
    images?: string[];
  } | null;
  store: {
    _id: string;
    name: string;
    storeLink?: string;
    logo?: string;
  } | null;
  revenue: number;
  units: number;
  commission: number;
  topPromoters: Array<{
    promoterId?: string | null;
    revenue: number;
    units: number;
    commission: number;
    orderCount: number;
    promoter?: {
      _id: string;
      displayName?: string;
      email?: string;
      username?: string;
    } | null;
  }>;
}

export interface StorefrontTopPromoterRow {
  promoterId: string;
  promoter: {
    _id: string;
    displayName?: string;
    email?: string;
    phone?: string;
    isActive?: boolean;
  } | null;
  revenue: number;
  units: number;
  orders: number;
  commission: number;
  commissionPaid: number;
  commissionPending: number;
  lastPaidAt?: string | null;
}

export interface StorefrontTopStoreRow {
  store: {
    _id: string;
    name: string;
    storeLink?: string;
    logo?: string;
    owner?: string;
  } | null;
  revenue: number;
  orders: number;
  units: number;
  lastPaidAt?: string | null;
}

export interface StorefrontPendingOrderRow {
  _id: string;
  orderNumber?: string;
  placedAt?: string;
  paidAt?: string;
  orderStatus?: string;
  paymentStatus?: string;
  escrowStatus?: string;
  totalAmount?: number;
  currency?: string;
  selectionRevenue?: number;
  store?: { _id: string; name: string; storeLink?: string; logo?: string } | null;
  buyer?: {
    customerId?: string | null;
    type?: string | null;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    country?: string | null;
    state?: string | null;
  } | null;
  promoters?: Array<{ _id: string; displayName?: string; email?: string }>;
}

export interface StorefrontBuyerGeoRow {
  country: string;
  state: string;
  orders: number;
  revenue: number;
  buyers: number;
}

export interface StorefrontReferralSourceRow {
  source: string;
  orders: number;
  revenue: number;
}

export interface StorefrontCategoryRow {
  category: string;
  revenue: number;
  units: number;
  commission: number;
  orders: number;
  products: number;
}

export interface StorefrontAnalyticsOverviewResponse {
  success: boolean;
  data: {
    range: StorefrontAnalyticsRange;
    summary: StorefrontAnalyticsSummary;
    alerts: string[];
    timeSeries: { daily: StorefrontTimeSeriesPoint[]; weekly: StorefrontTimeSeriesPoint[] };
    categoryBreakdown: StorefrontCategoryRow[];
    topProducts: StorefrontTopProductRow[];
    topPromoters: StorefrontTopPromoterRow[];
    topStores: StorefrontTopStoreRow[];
    pendingOrders: StorefrontPendingOrderRow[];
    buyerGeo: StorefrontBuyerGeoRow[];
    referralSources: StorefrontReferralSourceRow[];
  };
  message?: string;
}

export interface StorefrontListResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface StorefrontProductPromoterBreakdownResponse {
  success: boolean;
  data: {
    product: StorefrontProductOption;
    breakdown: Array<{
      promoterId: string;
      promoter?: {
        _id: string;
        displayName?: string;
        email?: string;
        username?: string;
        isActive?: boolean;
      } | null;
      revenue: number;
      units: number;
      commission: number;
      orderCount: number;
      lastPaidAt?: string | null;
    }>;
  };
  message?: string;
}

export interface StorefrontPromoterProductBreakdownResponse {
  success: boolean;
  data: {
    promoterId: string;
    breakdown: Array<{
      productId: string;
      product?: {
        _id: string;
        name?: string;
        category?: string;
        price?: number;
        images?: string[];
      } | null;
      store?: { _id: string; name?: string; storeLink?: string; logo?: string } | null;
      revenue: number;
      units: number;
      commission: number;
      orderCount: number;
      lastPaidAt?: string | null;
    }>;
  };
  message?: string;
}

@Injectable()
export class StorefrontAnalyticsService {
  private readonly apiService = inject(ApiService);
  private readonly apiUrl = 'api/v1/stores/admin/analytics';

  getOverview(filters?: {
    startDate?: Date | null;
    endDate?: Date | null;
    range?: number | null;
    storeId?: string | null;
    category?: string | null;
    productId?: string | null;
    promoterId?: string | null;
    buyerCountry?: string | null;
    buyerState?: string | null;
    timezone?: string | null;
    topLimit?: number | null;
  }): Observable<StorefrontAnalyticsOverviewResponse> {
    let params = new HttpParams();

    if (filters?.startDate) params = params.set('startDate', filters.startDate.toISOString());
    if (filters?.endDate) params = params.set('endDate', filters.endDate.toISOString());
    if (filters?.range) params = params.set('range', String(filters.range));
    if (filters?.storeId) params = params.set('storeId', filters.storeId);
    if (filters?.category) params = params.set('category', filters.category);
    if (filters?.productId) params = params.set('productId', filters.productId);
    if (filters?.promoterId) params = params.set('promoterId', filters.promoterId);
    if (filters?.buyerCountry) params = params.set('buyerCountry', filters.buyerCountry);
    if (filters?.buyerState) params = params.set('buyerState', filters.buyerState);
    if (filters?.timezone) params = params.set('timezone', filters.timezone);
    if (filters?.topLimit) params = params.set('topLimit', String(filters.topLimit));

    return this.apiService.get<StorefrontAnalyticsOverviewResponse>(`${this.apiUrl}/overview`, params);
  }

  listCategories(): Observable<StorefrontListResponse<string[]>> {
    return this.apiService.get<StorefrontListResponse<string[]>>(`${this.apiUrl}/categories`);
  }

  searchStores(filters?: { query?: string; limit?: number }): Observable<StorefrontListResponse<StorefrontStoreOption[]>> {
    let params = new HttpParams();
    if (filters?.query) params = params.set('query', filters.query);
    if (filters?.limit) params = params.set('limit', String(filters.limit));
    return this.apiService.get<StorefrontListResponse<StorefrontStoreOption[]>>(`${this.apiUrl}/stores`, params);
  }

  searchProducts(filters?: { query?: string; storeId?: string; category?: string; limit?: number }): Observable<StorefrontListResponse<StorefrontProductOption[]>> {
    let params = new HttpParams();
    if (filters?.query) params = params.set('query', filters.query);
    if (filters?.storeId) params = params.set('storeId', filters.storeId);
    if (filters?.category) params = params.set('category', filters.category);
    if (filters?.limit) params = params.set('limit', String(filters.limit));
    return this.apiService.get<StorefrontListResponse<StorefrontProductOption[]>>(`${this.apiUrl}/products`, params);
  }

  getProductPromoterBreakdown(filters: {
    startDate?: Date | null;
    endDate?: Date | null;
    range?: number | null;
    storeId?: string | null;
    productId: string;
    buyerCountry?: string | null;
    buyerState?: string | null;
    limit?: number | null;
  }): Observable<StorefrontProductPromoterBreakdownResponse> {
    let params = new HttpParams();
    if (filters?.startDate) params = params.set('startDate', filters.startDate.toISOString());
    if (filters?.endDate) params = params.set('endDate', filters.endDate.toISOString());
    if (filters?.range) params = params.set('range', String(filters.range));
    if (filters?.storeId) params = params.set('storeId', filters.storeId);
    params = params.set('productId', filters.productId);
    if (filters?.buyerCountry) params = params.set('buyerCountry', filters.buyerCountry);
    if (filters?.buyerState) params = params.set('buyerState', filters.buyerState);
    if (filters?.limit) params = params.set('limit', String(filters.limit));

    return this.apiService.get<StorefrontProductPromoterBreakdownResponse>(`${this.apiUrl}/product-promoters`, params);
  }

  getPromoterProductBreakdown(filters: {
    startDate?: Date | null;
    endDate?: Date | null;
    range?: number | null;
    storeId?: string | null;
    promoterId: string;
    buyerCountry?: string | null;
    buyerState?: string | null;
    limit?: number | null;
  }): Observable<StorefrontPromoterProductBreakdownResponse> {
    let params = new HttpParams();
    if (filters?.startDate) params = params.set('startDate', filters.startDate.toISOString());
    if (filters?.endDate) params = params.set('endDate', filters.endDate.toISOString());
    if (filters?.range) params = params.set('range', String(filters.range));
    if (filters?.storeId) params = params.set('storeId', filters.storeId);
    params = params.set('promoterId', filters.promoterId);
    if (filters?.buyerCountry) params = params.set('buyerCountry', filters.buyerCountry);
    if (filters?.buyerState) params = params.set('buyerState', filters.buyerState);
    if (filters?.limit) params = params.set('limit', String(filters.limit));

    return this.apiService.get<StorefrontPromoterProductBreakdownResponse>(`${this.apiUrl}/promoter-products`, params);
  }
}
