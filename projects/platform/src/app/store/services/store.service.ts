// services/store.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, tap } from 'rxjs';
import { CreateStoreRequest, Store, StoreSettings } from '../models/store.model';
import { CreateProductRequest, Product, StorePromotion, PerformanceMetric } from '../models';

@Injectable()
export class StoreService {
  private http = inject(HttpClient);
  private apiUrl = '/api/stores';

  // Signals for state management
  private stores = signal<Store[]>([]);
  public currentStore = signal<Store | null>(null);
  private storeProducts = signal<Product[]>([]);
  private loading = signal<boolean>(false);
  
  // Analytics and Promotions signals
  private performanceMetrics = signal<PerformanceMetric[]>([]);
  private promotions = signal<StorePromotion[]>([]);

  // Public computed signals
  public readonly storesState = this.stores.asReadonly();
  public readonly currentStoreState = this.currentStore.asReadonly();
  public readonly productsState = this.storeProducts.asReadonly();
  public readonly loadingState = this.loading.asReadonly();
  
  // Analytics and Promotions public signals
  public readonly performanceMetricsState = this.performanceMetrics.asReadonly();
  public readonly promotionsState = this.promotions.asReadonly();

  // Store management
  // createStore(storeData: Partial<Store>): Observable<Store> {
  //   this.loading.set(true);
  //   return this.http.post<Store>(this.apiUrl, storeData).pipe(
  //     tap(store => {
  //       this.stores.update(stores => [...stores, store]);
  //       this.loading.set(false);
  //     })
  //   );
  // }


  createStore(storeData: CreateStoreRequest): Observable<Store> {
    this.loading.set(true);
    
    // Handle file upload separately if needed
    const formData = new FormData();
    Object.entries(storeData).forEach(([key, value]) => {
      if (key === 'logo' && value instanceof File) {
        formData.append('logo', value);
      } else if (value !== null && value !== undefined) {
        formData.append(key, value as string);
      }
    });

    return this.http.post<Store>(this.apiUrl, formData).pipe(
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

  // Performance Metrics
  getStorePerformanceMetrics(storeId: string): Observable<PerformanceMetric[]> {
    return this.http.get<PerformanceMetric[]>(`${this.apiUrl}/${storeId}/analytics/performance`).pipe(
      tap(metrics => this.performanceMetrics.set(metrics))
    );
  }

  // Promotions
  getStorePromotions(storeId: string): Observable<StorePromotion[]> {
    return this.http.get<StorePromotion[]>(`${this.apiUrl}/${storeId}/promotions`).pipe(
      tap(promotions => this.promotions.set(promotions))
    );
  }

  createPromotion(storeId: string, promotionData: Partial<StorePromotion>): Observable<StorePromotion> {
    return this.http.post<StorePromotion>(`${this.apiUrl}/${storeId}/promotions`, promotionData).pipe(
      tap(promotion => {
        this.promotions.update(promotions => [...promotions, promotion]);
      })
    );
  }

  updatePromotion(storeId: string, promotionId: string, updates: Partial<StorePromotion>): Observable<StorePromotion> {
    return this.http.patch<StorePromotion>(
      `${this.apiUrl}/${storeId}/promotions/${promotionId}`,
      updates
    ).pipe(
      tap(updatedPromotion => {
        this.promotions.update(promotions =>
          promotions.map(p => p._id === promotionId ? updatedPromotion : p)
        );
      })
    );
  }

  deletePromotion(storeId: string, promotionId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${storeId}/promotions/${promotionId}`).pipe(
      tap(() => {
        this.promotions.update(promotions =>
          promotions.filter(p => p._id !== promotionId)
        );
      })
    );
  }

  // Verification
  verifyStore(storeId: string, tier: 'basic' | 'premium'): Observable<Store> {
    return this.http.post<Store>(`${this.apiUrl}/${storeId}/verify`, { tier });
  }
}