import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services/api';

export type PromotedProductsTrendPoint = {
  bucket: string;
  revenue: number;
  orders: number;
  clicks: number;
  uniqueClicks: number;
  commission: number;
};

export type PromotedProductsSummary = {
  promotedProducts: number;
  activePromoters: number;
  views: number;
  uniqueViews: number;
  clicks: number;
  uniqueClicks: number;
  paidOrders: number;
  grossRevenue: number;
  commissionAccrued: number;
  commissionPaid: number;
  conversionRate: number;
  clickToOrderRate: number;
  lastPaidAt?: string | null;
};

export type PromotedProductRow = {
  product: {
    _id: string;
    name: string;
    category?: string;
    price?: number;
    currency?: string;
    image?: string | null;
    slug?: string;
    isActive?: boolean;
    isPublished?: boolean;
  };
  store?: { _id: string; name?: string; storeLink?: string; logo?: string; category?: string } | null;
  links: { total: number; active: number };
  allTime: { views: number; clicks: number; conversions: number; earnings: number };
  range: {
    views: number;
    uniqueViews: number;
    clicks: number;
    uniqueClicks: number;
    clickThroughRate: number;
    paidOrders: number;
    totalOrders: number;
    pendingOrders: number;
    fulfilledOrders: number;
    refundedOrders: number;
    grossRevenue: number;
    units: number;
    commissionAccrued: number;
    commissionPaid: number;
    conversionRate: number;
  };
  lastActivityAt?: string | Date | null;
  topPromoters: Array<{
    promoter: { _id: string; displayName?: string; username?: string; email?: string; avatar?: string };
    revenue: number;
    orders: number;
    commission: number;
  }>;
};

export type PromotedProductsOverviewResponse = {
  success: boolean;
  data: {
    summary: PromotedProductsSummary;
    alerts: string[];
    timeSeries: { daily: PromotedProductsTrendPoint[]; weekly: PromotedProductsTrendPoint[] };
    topProducts: any[];
    topPromoters: any[];
    productsPage: { page: number; limit: number; total: number; rows: PromotedProductRow[] };
  };
};

export type ProductPromoterBreakdownRow = {
  promoter: { _id: string; displayName?: string; username?: string; email?: string; avatar?: string };
  views: number;
  uniqueViews: number;
  clicks: number;
  uniqueClicks: number;
  clickThroughRate: number;
  paidOrders: number;
  totalOrders: number;
  pendingOrders: number;
  fulfilledOrders: number;
  refundedOrders: number;
  revenue: number;
  commission: number;
  commissionPaid: number;
  conversionRate: number;
  lastActivityAt?: string | null;
};

export type ProductPromoterBreakdownResponse = {
  success: boolean;
  data: { productId: string; rows: ProductPromoterBreakdownRow[] };
};

@Injectable()
export class PromotedProductsAnalyticsService {
  private readonly api = inject(ApiService);
  private readonly baseUrl = 'api/v1/stores/store/analytics/promoted-products';

  getOverview(filters: {
    rangeDays?: number;
    startDate?: Date | null;
    endDate?: Date | null;
    storeId?: string | null;
    category?: string | null;
    productId?: string | null;
    promoterId?: string | null;
    search?: string | null;
    page?: number;
    limit?: number;
    topLimit?: number;
    timezone?: string | null;
  }): Observable<PromotedProductsOverviewResponse> {
    const params = new URLSearchParams();
    if (filters.rangeDays) params.set('rangeDays', String(filters.rangeDays));
    if (filters.startDate) params.set('startDate', filters.startDate.toISOString());
    if (filters.endDate) params.set('endDate', filters.endDate.toISOString());
    if (filters.storeId) params.set('storeId', filters.storeId);
    if (filters.category) params.set('category', filters.category);
    if (filters.productId) params.set('productId', filters.productId);
    if (filters.promoterId) params.set('promoterId', filters.promoterId);
    if (filters.search) params.set('search', filters.search);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    if (filters.topLimit) params.set('topLimit', String(filters.topLimit));
    if (filters.timezone) params.set('timezone', filters.timezone);

    const qs = params.toString();
    return this.api.get<PromotedProductsOverviewResponse>(`${this.baseUrl}/overview${qs ? `?${qs}` : ''}`);
  }

  getProductPromoters(filters: {
    productId: string;
    rangeDays?: number;
    startDate?: Date | null;
    endDate?: Date | null;
    storeId?: string | null;
    timezone?: string | null;
    limit?: number;
  }): Observable<ProductPromoterBreakdownResponse> {
    const params = new URLSearchParams();
    params.set('productId', filters.productId);
    if (filters.rangeDays) params.set('rangeDays', String(filters.rangeDays));
    if (filters.startDate) params.set('startDate', filters.startDate.toISOString());
    if (filters.endDate) params.set('endDate', filters.endDate.toISOString());
    if (filters.storeId) params.set('storeId', filters.storeId);
    if (filters.limit) params.set('limit', String(filters.limit));
    if (filters.timezone) params.set('timezone', filters.timezone);
    return this.api.get<ProductPromoterBreakdownResponse>(`${this.baseUrl}/product-promoters?${params.toString()}`);
  }

  searchProducts(filters: { query?: string; limit?: number; storeId?: string; category?: string }): Observable<any> {
    const params = new URLSearchParams();
    if (filters.query) params.set('query', filters.query);
    if (filters.limit) params.set('limit', String(filters.limit));
    if (filters.storeId) params.set('storeId', filters.storeId);
    if (filters.category) params.set('category', filters.category);
    const qs = params.toString();
    return this.api.get<any>(`${this.baseUrl}/options/products${qs ? `?${qs}` : ''}`);
  }

  searchPromoters(filters: { query?: string; limit?: number }): Observable<any> {
    const params = new URLSearchParams();
    if (filters.query) params.set('query', filters.query);
    if (filters.limit) params.set('limit', String(filters.limit));
    const qs = params.toString();
    return this.api.get<any>(`${this.baseUrl}/options/promoters${qs ? `?${qs}` : ''}`);
  }
}

