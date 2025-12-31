// components/services/product.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Product, CreateProductRequest, UpdateProductRequest } from '../models/product.model';
import { ApiService } from '../../../../../shared-services/src/public-api';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiService = inject(ApiService);
  private readonly apiUrl = 'products';

  // State management using signals
  private products = signal<Product[]>([]);
  private loading = signal<boolean>(false);
  private error = signal<string | null>(null);

  // Public computed signals
  public readonly productsState = this.products.asReadonly();
  public readonly loadingState = this.loading.asReadonly();
  public readonly errorState = this.error.asReadonly();

  // Clear state
  clearState(): void {
    this.products.set([]);
    this.loading.set(false);
    this.error.set(null);
  }

  // Create a new product (generic version - can be used by any service)
  createProduct(productData: CreateProductRequest): Observable<Product> {
    this.loading.set(true);
    
    const formData = new FormData();
    Object.entries(productData).forEach(([key, value]) => {
      if (key === 'images' && Array.isArray(value)) {
        value.forEach(file => formData.append('images', file));
      } else if (value !== null && value !== undefined) {
        if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    return this.apiService.post<Product>(this.apiUrl, formData).pipe(
      tap({
        next: (product) => {
          this.products.update(products => [...products, product]);
          this.loading.set(false);
          this.error.set(null);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set('Failed to create product');
          console.error('Create product error:', err);
        }
      })
    );
  }

  // Update a product
  updateProduct(productId: string, updates: UpdateProductRequest): Observable<Product> {
    this.loading.set(true);

    // Handle form data for image uploads
    const formData = new FormData();
    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'images' && Array.isArray(value)) {
        value.forEach(file => {
          if (file instanceof File) {
            formData.append('images', file);
          }
        });
      } else if (value !== null && value !== undefined) {
        if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    return this.apiService.patch<Product>(`${this.apiUrl}/${productId}`, formData).pipe(
      tap({
        next: (updatedProduct) => {
          this.products.update(products => 
            products.map(p => p._id === productId ? updatedProduct : p)
          );
          this.loading.set(false);
          this.error.set(null);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set('Failed to update product');
          console.error('Update product error:', err);
        }
      })
    );
  }

  // Delete a product
  deleteProduct(productId: string): Observable<void> {
    this.loading.set(true);

    return this.apiService.delete<void>(`${this.apiUrl}/${productId}`).pipe(
      tap({
        next: () => {
          this.products.update(products => 
            products.filter(p => p._id !== productId)
          );
          this.loading.set(false);
          this.error.set(null);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set('Failed to delete product');
          console.error('Delete product error:', err);
        }
      })
    );
  }

  // Get product by ID
  getProductById(productId: string): Observable<Product> {
    this.loading.set(true);

    return this.apiService.get<Product>(`${this.apiUrl}/${productId}`).pipe(
      tap({
        next: () => {
          this.loading.set(false);
          this.error.set(null);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set('Failed to load product');
          console.error('Get product error:', err);
        }
      })
    );
  }

  // Search products across all stores
  searchProducts(query: string, category?: string): Observable<Product[]> {
    const params: any = { q: query };
    if (category) params.category = category;

    return this.apiService.get<Product[]>(`${this.apiUrl}/search`, params).pipe(
      tap({
        error: (err) => {
          console.error('Search products error:', err);
        }
      })
    );
  }

  // Get products by promoter
  getPromoterProducts(promoterId: string): Observable<Product[]> {
    return this.apiService.get<Product[]>(`${this.apiUrl}/promoter/${promoterId}`).pipe(
      tap(products => {
        this.products.set(products);
      })
    );
  }

  // Get low stock products globally
  getLowStockProducts(threshold: number = 5): Observable<Product[]> {
    const params: any = { threshold: threshold.toString() };
    return this.apiService.get<Product[]>(`${this.apiUrl}/low-stock`, params).pipe(
      tap({
        error: (err) => {
          console.error('Get low stock products error:', err);
        }
      })
    );
  }

  // Update promoter tracking for a product
  updatePromoterTracking(
    productId: string, 
    trackingData: Partial<Product['promoterTracking']>
  ): Observable<Product> {
    return this.apiService.patch<Product>(
      `${this.apiUrl}/${productId}/promoter-tracking`,
      trackingData
    ).pipe(
      tap({
        error: (err) => {
          console.error('Update promoter tracking error:', err);
        }
      })
    );
  }

  // Bulk update products
  bulkUpdateProducts(productIds: string[], updates: Partial<Product>): Observable<Product[]> {
    return this.apiService.patch<Product[]>(`${this.apiUrl}/bulk-update`, {
      productIds,
      updates
    }).pipe(
      tap({
        next: (updatedProducts) => {
          this.products.update(products => {
            const updatedMap = new Map(updatedProducts.map(p => [p._id!, p]));
            return products.map(p => updatedMap.get(p._id!) || p);
          });
        },
        error: (err) => {
          console.error('Bulk update products error:', err);
        }
      })
    );
  }
}