import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Store } from './shared/store.model';
import { User } from './shared/user.model';
import { ApiService } from '../../../../shared-services/src/public-api';

export interface StoreStatistics {
  totalStores: number;
  activeStores: number;
  verifiedStores: number;
  totalProducts: number;
  totalRevenue: number;
}

export interface StoreFilters {
  page?: number;
  limit?: number;
  search?: string;
  verification?: string;
  category?: string;
  startDate?: Date;
  endDate?: Date;
  sortBy?: string;
  sortOrder?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  success: boolean;
  message: string;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AdminBuyerLinkedStore {
  _id: string;
  name: string;
  storeLink?: string;
  logo?: string;
}

export interface AdminBuyerLinkedMarketer {
  _id: string;
  displayName?: string;
  username?: string;
  email?: string;
}

export interface AdminBuyerRecord {
  buyerKey: string;
  email: string;
  fullName: string;
  phone?: string;
  notes?: string;
  lifecycleStage: 'new' | 'active' | 'repeat' | 'vip' | 'at_risk' | 'suppressed';
  preferredChannels: Array<'email' | 'sms'>;
  lastContactedAt?: string | null;
  lastContactChannel?: 'email' | 'sms' | 'manual' | '';
  lastCampaignName?: string;
  marketingOptIn: boolean;
  orderCount: number;
  totalSpent: number;
  averageOrderValue: number;
  firstSeenAt?: string | null;
  lastOrderAt?: string | null;
  linkedStoreCount: number;
  linkedMarketerCount: number;
  hasRegisteredAccount: boolean;
  customerTypes: string[];
  tags: string[];
  behaviorSegment: 'new' | 'repeat' | 'vip' | 'at_risk' | 'suppressed';
  linkedStores: AdminBuyerLinkedStore[];
  linkedMarketers: AdminBuyerLinkedMarketer[];
}

export interface AdminBuyerSummary {
  totalCustomers: number;
  optedInCustomers: number;
  repeatCustomers: number;
  vipCustomers: number;
  suppressedCustomers: number;
  totalRevenue: number;
  totalOrders: number;
  linkedStores: number;
  averageOrderValue: number;
}

export interface AdminBuyerOrder {
  _id: string;
  orderNumber: string;
  totalAmount: number;
  currency: string;
  orderStatus: string;
  paymentStatus: string;
  escrowStatus: string;
  paidAt?: string | null;
  createdAt?: string | null;
  deliveredAt?: string | null;
  shippingAddress?: {
    fullName?: string;
    email?: string;
    phone?: string;
    city?: string;
    state?: string;
    country?: string;
  } | null;
  store?: AdminBuyerLinkedStore | null;
  items: Array<{
    _id: string;
    name: string;
    quantity: number;
    totalPrice: number;
    commissionEarned: number;
  }>;
}

export interface AdminBuyerDetail {
  buyer: AdminBuyerRecord & {
    lastKnownLocation?: {
      city?: string;
      state?: string;
      country?: string;
    } | null;
  };
  storeRecords: Array<{
    _id: string;
    store: AdminBuyerLinkedStore | null;
    orderCount: number;
    totalSpent: number;
    lastOrderAt?: string | null;
    firstSeenAt?: string | null;
    customerType: string;
    marketingOptIn: boolean;
    tags: string[];
    source?: string;
  }>;
  orders: AdminBuyerOrder[];
}

export interface AdminBuyersResponse {
  buyers: AdminBuyerRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: AdminBuyerSummary;
  filters: {
    stores: AdminBuyerLinkedStore[];
    marketers: AdminBuyerLinkedMarketer[];
  };
}

export interface AdminSubscribersResponse {
  subscribers: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    stores: AdminBuyerLinkedStore[];
  };
}

@Injectable()
export class StoreService {
  private readonly apiService: ApiService = inject(ApiService);
  private readonly apiUrl = 'api/v1/stores/admin';

  getStores(filters?: StoreFilters): Observable<PaginatedResponse<Store>> {
    // Build query params
    let queryParams = '';
    if (filters) {
      const params = new URLSearchParams();
      if (filters.page) params.set('page', filters.page.toString());
      if (filters.limit) params.set('limit', filters.limit.toString());
      if (filters.search) params.set('search', filters.search);
      if (filters.verification && filters.verification !== 'all') params.set('verification', filters.verification);
      if (filters.category && filters.category !== 'all') params.set('category', filters.category);
      if (filters.startDate) params.set('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.set('endDate', filters.endDate.toISOString());
      if (filters.sortBy) params.set('sortBy', filters.sortBy);
      if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
      
      const paramString = params.toString();
      if (paramString) queryParams = `?${paramString}`;
    }
    
    return this.apiService.get<PaginatedResponse<Store>>(`${this.apiUrl}/stores${queryParams}`);
  }

  getStoreById(id: string): Observable<Store> {
    return this.apiService.get<{ data: Store, success: boolean }>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  getStoreOwners(): Observable<{ data: User[], success: boolean }> {
    return this.apiService.get<{ data: User[], success: boolean }>('api/v1/stores/admin/store-owners');
  }

  getStoreStatistics(): Observable<StoreStatistics> {
    return this.apiService.get<{ data: StoreStatistics, success: boolean }>(`${this.apiUrl}/statistics`).pipe(
      map(response => response.data)
    );
  }

  toggleStoreVerification(storeId: string, verified: boolean): Observable<Store> {
    return this.apiService.patch<{ data: Store, success: boolean }>(
      `${this.apiUrl}/${storeId}/verification`,
      { verified }
    ).pipe(map(response => response.data));
  }

  toggleStoreActive(storeId: string, active: boolean): Observable<Store> {
    return this.apiService.patch<{ data: Store, success: boolean }>(
      `${this.apiUrl}/${storeId}/active`,
      { active }
    ).pipe(map(response => response.data));
  }

  upgradeStoreTier(storeId: string, tier: 'basic' | 'premium'): Observable<Store> {
    return this.apiService.patch<{ data: Store, success: boolean }>(
      `${this.apiUrl}/${storeId}/tier`,
      { tier }
    ).pipe(map(response => response.data));
  }

  updateStore(storeId: string, storeData: Partial<Store>): Observable<Store> {
    return this.apiService.put<{ data: Store, success: boolean }>(
      `${this.apiUrl}/${storeId}`,
      storeData
    ).pipe(map(response => response.data));
  }

  deleteStore(storeId: string): Observable<{ success: boolean, message: string }> {
    return this.apiService.delete<{ success: boolean, message: string }>(`${this.apiUrl}/${storeId}`);
  }

  exportStores(format: 'csv' | 'excel', data: Store[]): Observable<Blob> {
    return this.apiService.post(`${this.apiUrl}/export/${format}`, { data, responseType: 'blob' });
  }

  getStoreAnalytics(storeId: string, period: 'week' | 'month' | 'year' = 'month'): Observable<any> {
    return this.apiService.get<{ data: any, success: boolean }>(
      `${this.apiUrl}/${storeId}/analytics?period=${period}`
    ).pipe(map(response => response.data));
  }

  getStoreProducts(storeId: string): Observable<any> {
    return this.apiService.get<{ data: any, success: boolean }>(
      `${this.apiUrl}/${storeId}/products`
    ).pipe(map(response => response.data));
  }

  getAdminBuyers(filters?: {
    page?: number;
    limit?: number;
    search?: string;
    marketerId?: string;
    storeId?: string;
    lifecycleStage?: string;
    marketingOptIn?: string;
    customerType?: string;
    segment?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Observable<{ success: boolean; data: AdminBuyersResponse }> {
    let queryParams = '';
    if (filters) {
      const params = new URLSearchParams();
      if (filters.page) params.set('page', String(filters.page));
      if (filters.limit) params.set('limit', String(filters.limit));
      if (filters.search) params.set('search', filters.search);
      if (filters.marketerId) params.set('marketerId', filters.marketerId);
      if (filters.storeId) params.set('storeId', filters.storeId);
      if (filters.lifecycleStage) params.set('lifecycleStage', filters.lifecycleStage);
      if (filters.marketingOptIn) params.set('marketingOptIn', filters.marketingOptIn);
      if (filters.customerType) params.set('customerType', filters.customerType);
      if (filters.segment) params.set('segment', filters.segment);
      if (filters.sortBy) params.set('sortBy', filters.sortBy);
      if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
      const paramString = params.toString();
      if (paramString) queryParams = `?${paramString}`;
    }

    return this.apiService.get<{ success: boolean; data: AdminBuyersResponse }>(`${this.apiUrl}/buyers${queryParams}`);
  }

  getAdminBuyerDetail(email: string): Observable<{ success: boolean; data: AdminBuyerDetail }> {
    const query = new URLSearchParams({ email }).toString();
    return this.apiService.get<{ success: boolean; data: AdminBuyerDetail }>(`${this.apiUrl}/buyers/detail?${query}`);
  }

  updateAdminBuyerMeta(payload: {
    email: string;
    marketerId?: string;
    lifecycleStage?: string;
    notes?: string;
    marketingOptIn?: boolean | string;
    preferredChannels?: string[];
    lastContactChannel?: string;
    lastCampaignName?: string;
    addTags?: string[];
    removeTags?: string[];
  }): Observable<{ success: boolean; message: string }> {
    return this.apiService.patch<{ success: boolean; message: string }>(`${this.apiUrl}/buyers/meta`, payload);
  }

  getAdminSubscribers(filters?: {
    page?: number;
    limit?: number;
    search?: string;
    storeId?: string;
    ownerId?: string;
    status?: string;
    source?: string;
    startDate?: Date;
    endDate?: Date;
    sortBy?: string;
    sortOrder?: string;
  }): Observable<{ success: boolean; data: AdminSubscribersResponse }> {
    let queryParams = '';
    if (filters) {
      const params = new URLSearchParams();
      if (filters.page) params.set('page', String(filters.page));
      if (filters.limit) params.set('limit', String(filters.limit));
      if (filters.search) params.set('search', filters.search);
      if (filters.storeId) params.set('storeId', filters.storeId);
      if (filters.ownerId) params.set('ownerId', filters.ownerId);
      if (filters.status) params.set('status', filters.status);
      if (filters.source) params.set('source', filters.source);
      if (filters.startDate) params.set('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.set('endDate', filters.endDate.toISOString());
      if (filters.sortBy) params.set('sortBy', filters.sortBy);
      if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
      const paramString = params.toString();
      if (paramString) queryParams = `?${paramString}`;
    }

    return this.apiService.get<{ success: boolean; data: AdminSubscribersResponse }>(`${this.apiUrl}/subscribers${queryParams}`);
  }

  deleteAdminSubscriber(subscriberId: string): Observable<{ success: boolean; message?: string; data?: any }> {
    return this.apiService.delete<{ success: boolean; message?: string; data?: any }>(
      `${this.apiUrl}/subscribers/${subscriberId}`
    );
  }
}
