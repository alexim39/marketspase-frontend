// services/store.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Store, Product, CreateProductRequest } from '../models/store.model';

@Injectable()
export class StoreService {
  private http = inject(HttpClient);
  private apiUrl = '/api/stores';

  // Signals for state management
  private stores = signal<Store[]>([]);
  private currentStore = signal<Store | null>(null);
  private storeProducts = signal<Product[]>([]);
  private loading = signal<boolean>(false);

  // Public computed signals
  public readonly storesState = this.stores.asReadonly();
  public readonly currentStoreState = this.currentStore.asReadonly();
  public readonly productsState = this.storeProducts.asReadonly();
  public readonly loadingState = this.loading.asReadonly();

  // Store management
  createStore(storeData: Partial<Store>): Observable<Store> {
    this.loading.set(true);
    return this.http.post<Store>(this.apiUrl, storeData).pipe(
      tap(store => {
        this.stores.update(stores => [...stores, store]);
        this.loading.set(false);
      })
    );
  }

  getStores(): Observable<Store[]> {
    this.loading.set(true);
    return this.http.get<Store[]>(this.apiUrl).pipe(
      tap(stores => {
        this.stores.set(stores);
        this.loading.set(false);
      })
    );
  }

  getStoreById(storeId: string): Observable<Store> {
    this.loading.set(true);
    return this.http.get<Store>(`${this.apiUrl}/${storeId}`).pipe(
      tap(store => {
        this.currentStore.set(store);
        this.loading.set(false);
      })
    );
  }

  updateStore(storeId: string, updates: Partial<Store>): Observable<Store> {
    return this.http.patch<Store>(`${this.apiUrl}/${storeId}`, updates).pipe(
      tap(updatedStore => {
        this.currentStore.set(updatedStore);
        this.stores.update(stores => 
          stores.map(s => s._id === storeId ? updatedStore : s)
        );
      })
    );
  }

  // Product management
  addProduct(storeId: string, productData: CreateProductRequest): Observable<Product> {
    const formData = new FormData();
    Object.entries(productData).forEach(([key, value]) => {
      if (key === 'images' && Array.isArray(value)) {
        value.forEach(file => formData.append('images', file));
      } else {
        formData.append(key, value as string);
      }
    });

    return this.http.post<Product>(`${this.apiUrl}/${storeId}/products`, formData).pipe(
      tap(product => {
        this.storeProducts.update(products => [...products, product]);
      })
    );
  }

  getStoreProducts(storeId: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/${storeId}/products`).pipe(
      tap(products => this.storeProducts.set(products))
    );
  }

  updateProduct(storeId: string, productId: string, updates: Partial<Product>): Observable<Product> {
    return this.http.patch<Product>(
      `${this.apiUrl}/${storeId}/products/${productId}`, 
      updates
    ).pipe(
      tap(updatedProduct => {
        this.storeProducts.update(products =>
          products.map(p => p._id === productId ? updatedProduct : p)
        );
      })
    );
  }

  deleteProduct(storeId: string, productId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${storeId}/products/${productId}`).pipe(
      tap(() => {
        this.storeProducts.update(products =>
          products.filter(p => p._id !== productId)
        );
      })
    );
  }

  // Analytics
  getStoreAnalytics(storeId: string): Observable<Store['analytics']> {
    return this.http.get<Store['analytics']>(`${this.apiUrl}/${storeId}/analytics`);
  }

  // Verification
  verifyStore(storeId: string, tier: 'basic' | 'premium'): Observable<Store> {
    return this.http.post<Store>(`${this.apiUrl}/${storeId}/verify`, { tier });
  }
}