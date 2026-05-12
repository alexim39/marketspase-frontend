import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services';

@Injectable({ providedIn: 'root' })
export class StorefrontOrderService {
  private apiService = inject(ApiService);
  private readonly apiUrl = 'stores/storefront/orders';

  getPromoterOrders(promoterId: string, options: { limit?: number; skip?: number } = {}): Observable<any> {
    let params = new HttpParams()
      .set('limit', String(options.limit ?? 30))
      .set('skip', String(options.skip ?? 0));

    return this.apiService.get<any>(`${this.apiUrl}/promoter/${promoterId}`, params, undefined, true);
  }

  getMarketerOrders(marketerId: string, options: { limit?: number; skip?: number; escrowStatus?: string } = {}): Observable<any> {
    let params = new HttpParams()
      .set('limit', String(options.limit ?? 30))
      .set('skip', String(options.skip ?? 0));

    if (options.escrowStatus) {
      params = params.set('escrowStatus', options.escrowStatus);
    }

    return this.apiService.get<any>(`${this.apiUrl}/marketer/${marketerId}`, params, undefined, true);
  }

  getReleaseRequests(adminId: string, status = 'requested'): Observable<any> {
    const params = new HttpParams()
      .set('adminId', adminId)
      .set('status', status);

    return this.apiService.get<any>(`${this.apiUrl}/release-requests`, params, undefined, true);
  }

  requestRelease(orderId: string, payload: {
    userId: string;
    role: 'marketer' | 'promoter';
    note?: string;
    deliveryStatus?: 'processing' | 'shipped' | 'delivered' | 'received';
    buyerReceived?: boolean;
  }): Observable<any> {
    return this.apiService.post<any>(`${this.apiUrl}/${orderId}/confirm-delivery`, payload, undefined, true);
  }

  reviewRelease(orderId: string, payload: {
    adminId: string;
    decision: 'approved' | 'rejected';
    note?: string;
  }): Observable<any> {
    return this.apiService.post<any>(`${this.apiUrl}/${orderId}/release-review`, payload, undefined, true);
  }
}
