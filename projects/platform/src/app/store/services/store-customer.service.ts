import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services/api';

export interface CustomerLinkedStore {
  _id: string;
  name: string;
  storeLink?: string;
  logo?: string;
}

export interface MarketerCustomerRecord {
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
  hasRegisteredAccount: boolean;
  customerTypes: string[];
  tags: string[];
  behaviorSegment: 'new' | 'repeat' | 'vip' | 'at_risk' | 'suppressed';
  linkedStores: CustomerLinkedStore[];
  source?: string;
  activityLog?: Array<{ type: string; message: string; channel?: string; createdAt: string }>;
}

export interface MarketerCustomerSummary {
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

export interface MarketerCustomerOrderItem {
  _id: string;
  name: string;
  quantity: number;
  totalPrice: number;
  commissionEarned: number;
  promoterId?: {
    _id: string;
    displayName?: string;
    username?: string;
  } | null;
}

export interface MarketerCustomerOrder {
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
  store?: CustomerLinkedStore | null;
  items: MarketerCustomerOrderItem[];
}

export interface MarketerCustomerDetail {
  buyer: MarketerCustomerRecord & {
    linkedMarketers?: Array<{
      _id: string;
      displayName?: string;
      username?: string;
      email?: string;
    }>;
    lastKnownLocation?: {
      city?: string;
      state?: string;
      country?: string;
    } | null;
  };
  storeRecords: Array<{
    _id: string;
    store: CustomerLinkedStore | null;
    orderCount: number;
    totalSpent: number;
    lastOrderAt?: string | null;
    firstSeenAt?: string | null;
    customerType: string;
    marketingOptIn: boolean;
    tags: string[];
    source?: string;
  }>;
  orders: MarketerCustomerOrder[];
}

export interface MarketerCustomersResponse {
  customers: MarketerCustomerRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: MarketerCustomerSummary;
  filters: {
    stores: CustomerLinkedStore[];
  };
}

@Injectable({ providedIn: 'root' })
export class StoreCustomerService {
  private readonly apiService = inject(ApiService);
  private readonly apiUrl = 'api/v1/stores/storefront/customers';

  getMarketerCustomers(
    marketerId: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      storeId?: string;
      lifecycleStage?: string;
      marketingOptIn?: string;
      customerType?: string;
      segment?: string;
      sortBy?: string;
      sortOrder?: string;
    } = {},
  ): Observable<{ success: boolean; data: MarketerCustomersResponse }> {
    let params = new HttpParams()
      .set('page', String(options.page ?? 1))
      .set('limit', String(options.limit ?? 18))
      .set('sortBy', options.sortBy ?? 'lastOrderAt')
      .set('sortOrder', options.sortOrder ?? 'desc');

    if (options.search) params = params.set('search', options.search);
    if (options.storeId) params = params.set('storeId', options.storeId);
    if (options.lifecycleStage) params = params.set('lifecycleStage', options.lifecycleStage);
    if (options.marketingOptIn) params = params.set('marketingOptIn', options.marketingOptIn);
    if (options.customerType) params = params.set('customerType', options.customerType);
    if (options.segment) params = params.set('segment', options.segment);

    return this.apiService.get<{ success: boolean; data: MarketerCustomersResponse }>(
      `${this.apiUrl}/marketer/${marketerId}`,
      params,
      undefined,
      true,
    );
  }

  getMarketerCustomerDetail(marketerId: string, email: string): Observable<{ success: boolean; data: MarketerCustomerDetail }> {
    const params = new HttpParams().set('email', email);
    return this.apiService.get<{ success: boolean; data: MarketerCustomerDetail }>(
      `${this.apiUrl}/marketer/${marketerId}/detail`,
      params,
      undefined,
      true,
    );
  }

  updateMarketerCustomerMeta(marketerId: string, payload: {
    email: string;
    lifecycleStage?: string;
    notes?: string;
    marketingOptIn?: boolean | string;
    preferredChannels?: string[];
    lastContactChannel?: string;
    lastCampaignName?: string;
    addTags?: string[];
    removeTags?: string[];
  }): Observable<{ success: boolean; message: string }> {
    return this.apiService.patch<{ success: boolean; message: string }>(
      `${this.apiUrl}/marketer/${marketerId}/meta`,
      payload,
      undefined,
      true,
    );
  }

  sendCustomerSms(marketerId: string, payload: { email: string; phone: string; message: string }): Observable<{ success: boolean; message: string }> {
    return this.apiService.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/marketer/${marketerId}/send-sms`, payload, undefined, true,
    );
  }

  sendBulkCustomerSms(marketerId: string, payload: { emails: string[]; message: string }): Observable<{ success: boolean; message: string }> {
    return this.apiService.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/marketer/${marketerId}/send-bulk-sms`, payload, undefined, true,
    );
  }
}
