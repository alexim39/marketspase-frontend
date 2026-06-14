import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { ApiService } from "../../../../../../shared-services/src/public-api";

export interface CustomerContact {
  _id: string;
  marketer: string;
  store?: string;
  promotionId?: string;
  campaignId?: string;
  source: "manual" | "csv_import" | "click_capture" | "subscriber_sync" | "storefront_checkout";
  displayName: string;
  email: string;
  phone: string;
  phoneCountryCode: string;
  tags: string[];
  groups: Array<{ _id: string; name: string; color: string }>;
  lifecycleStage: "new" | "active" | "repeat" | "vip" | "at_risk" | "suppressed";
  consent: {
    sms: boolean;
    email: boolean;
    smsOptInAt: string | null;
    emailOptInAt: string | null;
    smsOptOutAt: string | null;
    emailOptOutAt: string | null;
    consentSource: string;
  };
  totalConversions: number;
  totalRevenueGenerated: number;
  lastContactedAt: string | null;
  lastPurchasedAt: string | null;
  orderCount: number;
  totalSpent: number;
  notes: string;
  customFields: Record<string, string>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContactLogEntry {
  _id: string;
  customer: string;
  marketer: string;
  type: "note" | "sms" | "email" | "call" | "whatsapp" | "purchase";
  direction: "outgoing" | "incoming";
  subject?: string;
  content: string;
  metadata?: {
    smsProviderId?: string;
    emailProviderId?: string;
    campaignId?: string;
    duration?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CustomerGroup {
  _id: string;
  marketer: string;
  name: string;
  description: string;
  color: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerListResponse {
  success: boolean;
  data: {
    customers: CustomerContact[];
    availableTags: string[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface CustomerDetailResponse {
  success: boolean;
  data: {
    customer: CustomerContact;
    logs: ContactLogEntry[];
  };
}

export interface CustomerAnalyticsResponse {
  success: boolean;
  data: {
    totals: { total: number; withSmsConsent: number; withEmailConsent: number };
    lifecycleBreakdown: Record<string, number>;
    topTags: Array<{ _id: string; count: number }>;
    recentAdditions: CustomerContact[];
  };
}

export interface GroupListResponse {
  success: boolean;
  data: { groups: CustomerGroup[] };
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
}

@Injectable({ providedIn: "root" })
export class ContactService {
  private readonly api = inject(ApiService);

  /* ────── Customers ────── */

  getCustomers(params?: {
    storeId?: string;
    groupId?: string;
    search?: string;
    tags?: string[];
    lifecycleStage?: string;
    source?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Observable<CustomerListResponse> {
    let query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") {
          if (Array.isArray(v)) {
            v.forEach((item) => query.append(k, item));
          } else {
            query.set(k, String(v));
          }
        }
      });
    }
    return this.api.get<CustomerListResponse>(
      `api/v1/customers?${query.toString()}`
    );
  }

  getCustomer(id: string): Observable<CustomerDetailResponse> {
    return this.api.get<CustomerDetailResponse>(`api/v1/customers/${id}`);
  }

  createCustomer(data: Partial<CustomerContact>): Observable<{ success: boolean; data: CustomerContact }> {
    return this.api.post<{ success: boolean; data: CustomerContact }>("api/v1/customers", data);
  }

  updateCustomer(id: string, data: Partial<CustomerContact>): Observable<{ success: boolean; data: CustomerContact }> {
    return this.api.patch<{ success: boolean; data: CustomerContact }>(`api/v1/customers/${id}`, data);
  }

  deleteCustomer(id: string): Observable<{ success: boolean; data: { deleted: boolean } }> {
    return this.api.delete<{ success: boolean; data: { deleted: boolean } }>(`api/v1/customers/${id}`);
  }

  importCustomers(customers: any[]): Observable<{ success: boolean; data: ImportResult }> {
    return this.api.post<{ success: boolean; data: ImportResult }>("api/v1/customers/import", { customers });
  }

  addCustomerLog(id: string, data: {
    type: string;
    direction?: string;
    subject?: string;
    content: string;
  }): Observable<{ success: boolean; data: ContactLogEntry }> {
    return this.api.post<{ success: boolean; data: ContactLogEntry }>(`api/v1/customers/${id}/logs`, data);
  }

  updateConsent(
    id: string,
    channel: "sms" | "email",
    action: "opt_in" | "opt_out",
    source?: string
  ): Observable<{ success: boolean; data: CustomerContact }> {
    return this.api.post<{ success: boolean; data: CustomerContact }>(
      `api/v1/customers/${id}/consent`,
      { channel, action, source }
    );
  }

  getAnalytics(): Observable<CustomerAnalyticsResponse> {
    return this.api.get<CustomerAnalyticsResponse>("api/v1/customers/analytics/summary");
  }

  getTags(): Observable<{ success: boolean; data: Array<{ name: string; count: number }> }> {
    return this.api.get<{ success: boolean; data: Array<{ name: string; count: number }> }>("api/v1/customers/tags");
  }

  /* ────── Groups ────── */

  getGroups(): Observable<GroupListResponse> {
    return this.api.get<GroupListResponse>("api/v1/customer-groups");
  }

  createGroup(data: { name: string; description?: string; color?: string }): Observable<{ success: boolean; data: CustomerGroup }> {
    return this.api.post<{ success: boolean; data: CustomerGroup }>("api/v1/customer-groups", data);
  }

  updateGroup(id: string, data: Partial<CustomerGroup>): Observable<{ success: boolean; data: CustomerGroup }> {
    return this.api.patch<{ success: boolean; data: CustomerGroup }>(`api/v1/customer-groups/${id}`, data);
  }

  deleteGroup(id: string): Observable<{ success: boolean; data: { deleted: boolean } }> {
    return this.api.delete<{ success: boolean; data: { deleted: boolean } }>(`api/v1/customer-groups/${id}`);
  }

  addGroupMembers(groupId: string, customerIds: string[]): Observable<{ success: boolean; data: any }> {
    return this.api.post<{ success: boolean; data: any }>(`api/v1/customer-groups/${groupId}/members`, { customerIds });
  }

  removeGroupMembers(groupId: string, customerIds: string[]): Observable<{ success: boolean; data: any }> {
    return this.api.delete<{ success: boolean; data: any }>(`api/v1/customer-groups/${groupId}/members`, undefined, undefined, true);
  }
}
