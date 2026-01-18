// services/store.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Store, StoreAnalytics } from '../models/store.model';
import { Product, StorePromotion, PerformanceMetric, CreateStoreRequest, CreateProductRequest, UpdateProductRequest } from '../models';
import { ApiService } from '../../../../../shared-services/src/public-api';

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private apiService = inject(ApiService);
  private readonly apiUrl = 'stores';

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

  // Store CRUD Operations
  createStore(storeData: CreateStoreRequest): Observable<Store> {
    this.loading.set(true);
    
    const formData = new FormData();
    Object.entries(storeData).forEach(([key, value]) => {
      if (key === 'logo' && value instanceof File) {
        formData.append('logo', value);
      } else if (value !== null && value !== undefined) {
        formData.append(key, value as string);
      }
    });

    return this.apiService.post<Store>(this.apiUrl, formData).pipe(
      tap({
        next: (store) => {
          this.stores.update(stores => [...stores, store]);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      })
    );
  }

  getStores(userId: string): Observable<any> {
  // getStores(userId: string): Observable<Store[]> {
    this.loading.set(true);
    return this.apiService.get<Store[]>(`${this.apiUrl}?userId=${userId}`).pipe(
      tap({
        next: (storesData) => {
          this.stores.set(storesData);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      })
    );
  }

  getStoreById(storeId: string): Observable<Store> {
    this.loading.set(true);
    return this.apiService.get<Store>(`${this.apiUrl}/${storeId}`).pipe(
      tap({
        next: (store) => {
          this.currentStore.set(store);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      })
    );
  }

  updateStore(storeId: string, updates: Partial<Store>): Observable<Store> {
    return this.apiService.patch<Store>(`${this.apiUrl}/${storeId}`, updates).pipe(
      tap({
        next: (updatedStore) => {
          this.currentStore.set(updatedStore);
          this.stores.update(stores => 
            stores.map(s => s._id === storeId ? updatedStore : s)
          );
        }
      })
    );
  }

  setDefaultStore(store: Store): Observable<any> {
    console.log('this store ',store)
    return this.apiService.patch<Store>(
      `${this.apiUrl}/${store._id}/set-default`, 
      {userId: store.owner} 
    ).pipe(
      tap({
        next: (updatedStore) => {
          this.currentStore.set(updatedStore);
          this.stores.update(stores => 
            stores.map(s => s._id === store._id ? updatedStore : s)
          );
        }
      })
    );
  }

  // Store Products (delegates to ProductService via component, but maintains local state)
  getStoreProducts(storeId: string): Observable<Product[]> {
    this.loading.set(true);
    return this.apiService.get<Product[]>(`${this.apiUrl}/${storeId}/products`).pipe(
      tap({
        next: (products) => {
          this.storeProducts.set(products);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      })
    );
  }

  // Store Analytics
  getStoreAnalytics(storeId: string): Observable<StoreAnalytics> {
    return this.apiService.get<StoreAnalytics>(`${this.apiUrl}/${storeId}/analytics`);
  }

  updateStoreAnalytics(storeId: string, analyticsData: Partial<StoreAnalytics>): Observable<StoreAnalytics> {
    return this.apiService.patch<StoreAnalytics>(`${this.apiUrl}/${storeId}/analytics`, analyticsData).pipe(
      tap({
        next: (updatedAnalytics) => {
          const currentStore = this.currentStore();
          if (currentStore && currentStore._id === storeId) {
            this.currentStore.set({ ...currentStore, analytics: updatedAnalytics });
          }
        }
      })
    );
  }

  // Performance Metrics
  getStorePerformanceMetrics(storeId: string): Observable<PerformanceMetric[]> {
    return this.apiService.get<PerformanceMetric[]>(`${this.apiUrl}/${storeId}/analytics/performance`).pipe(
      tap({
        next: (metrics) => this.performanceMetrics.set(metrics)
      })
    );
  }

  // Promotions
  getStorePromotions(storeId: string): Observable<StorePromotion[]> {
    return this.apiService.get<StorePromotion[]>(`${this.apiUrl}/${storeId}/promotions`).pipe(
      tap({
        next: (promotions) => this.promotions.set(promotions)
      })
    );
  }

  createPromotion(storeId: string, promotionData: Partial<StorePromotion>): Observable<StorePromotion> {
    return this.apiService.post<StorePromotion>(`${this.apiUrl}/${storeId}/promotions`, promotionData).pipe(
      tap({
        next: (promotion) => {
          this.promotions.update(promotions => [...promotions, promotion]);
        }
      })
    );
  }

  updatePromotion(storeId: string, promotionId: string, updates: Partial<StorePromotion>): Observable<StorePromotion> {
    return this.apiService.patch<StorePromotion>(
      `${this.apiUrl}/${storeId}/promotions/${promotionId}`,
      updates
    ).pipe(
      tap({
        next: (updatedPromotion) => {
          this.promotions.update(promotions =>
            promotions.map(p => p._id === promotionId ? updatedPromotion : p)
          );
        }
      })
    );
  }

  deletePromotion(storeId: string, promotionId: string): Observable<void> {
    return this.apiService.delete<void>(`${this.apiUrl}/${storeId}/promotions/${promotionId}`).pipe(
      tap({
        next: () => {
          this.promotions.update(promotions =>
            promotions.filter(p => p._id !== promotionId)
          );
        }
      })
    );
  }

  // Verification
  verifyStore(storeId: string, tier: 'basic' | 'premium'): Observable<Store> {
    return this.apiService.post<Store>(`${this.apiUrl}/${storeId}/verify`, { tier });
  }

  // Update local store analytics state (for real-time updates)
  updateLocalStoreAnalytics(storeId: string, analytics: StoreAnalytics): void {
    const currentStore = this.currentStore();
    if (currentStore && currentStore._id === storeId) {
      this.currentStore.set({
        ...currentStore,
        analytics
      });
    }
  }

  // Clear store state
  clearStoreState(): void {
    this.currentStore.set(null);
    this.storeProducts.set([]);
    this.promotions.set([]);
    this.performanceMetrics.set([]);
  }

  // Set current store
  setCurrentStore(store: Store | null): void {
    this.currentStore.set(store);
  }


  // Add this method to StoreService class (after getStoreProducts method)
  addProduct(storeId: string, productData: CreateProductRequest): Observable<Product> {
    this.loading.set(true);
    
    const formData = new FormData();
    
    // Add store ID to the product data
    formData.append('store', storeId);
    
    // Process product data
    Object.entries(productData).forEach(([key, value]) => {
      if (key === 'images' && Array.isArray(value)) {
        value.forEach(file => {
          if (file instanceof File) {
            formData.append('images', file);
          }
        });
      } else if (key === 'seo' && typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else if (key === 'variants' && Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else if (value !== null && value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    return this.apiService.post<Product>(`${this.apiUrl}/${storeId}/products`, formData).pipe(
      tap({
        next: (product) => {
          // Update local state
          this.storeProducts.update(products => [...products, product]);
          this.loading.set(false);
        },
        error: (error) => {
          this.loading.set(false);
          console.error('Failed to add product:', error);
        }
      })
    );
  }

  // Also add this method for updating products in store context
  updateProduct(storeId: string, productId: string, updates: UpdateProductRequest): Observable<Product> {
    this.loading.set(true);
    
    const formData = new FormData();
    
    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'images' && Array.isArray(value)) {
        value.forEach(file => {
          if (file instanceof File) {
            formData.append('images', file);
          }
        });
      } else if (key === 'seo' && typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else if (key === 'variants' && Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else if (value !== null && value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    return this.apiService.patch<Product>(
      `${this.apiUrl}/${storeId}/products/${productId}`, 
      formData
    ).pipe(
      tap({
        next: (updatedProduct) => {
          this.storeProducts.update(products =>
            products.map(p => p._id === productId ? updatedProduct : p)
          );
          this.loading.set(false);
        },
        error: (error) => {
          this.loading.set(false);
          console.error('Failed to update product:', error);
        }
      })
    );
  }


  deleteProduct(storeId: string, productId: string): Observable<void> {
    this.loading.set(true);
    
    return this.apiService.delete<void>(`${this.apiUrl}/${storeId}/products/${productId}`).pipe(
      tap({
        next: () => {
          this.storeProducts.update(products =>
            products.filter(p => p._id !== productId)
          );
          this.loading.set(false);
        },
        error: (error) => {
          this.loading.set(false);
          console.error('Failed to delete product:', error);
        }
      })
    );
  }

  getStoreProduct(storeId: string, productId: string): Observable<Product> {
    this.loading.set(true);
    
    return this.apiService.get<Product>(`${this.apiUrl}/${storeId}/products/${productId}`).pipe(
      tap({
        next: () => {
          this.loading.set(false);
        },
        error: (error) => {
          this.loading.set(false);
          console.error('Failed to get product:', error);
        }
      })
    );
  }

}