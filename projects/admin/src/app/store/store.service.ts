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

@Injectable()
export class StoreService {
  private readonly apiService: ApiService = inject(ApiService);
  private readonly apiUrl = 'stores/admin';

  getStores(): Observable<{ data: Store[], success: boolean, message: string }> {
    return this.apiService.get<{ data: Store[], success: boolean, message: string }>(`${this.apiUrl}/stores`);
  }

  getStoreById(id: string): Observable<Store> {
    return this.apiService.get<{ data: Store, success: boolean }>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  getStoreOwners(): Observable<{ data: User[], success: boolean }> {
    return this.apiService.get<{ data: User[], success: boolean }>('/api/admin/users/store-owners');
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
    return this.apiService.post(`${this.apiUrl}/export/${format}`,  { data , responseType: 'blob' }
    );
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
}