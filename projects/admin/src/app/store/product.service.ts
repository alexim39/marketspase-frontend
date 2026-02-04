import { Injectable, inject } from '@angular/core';
import { HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Product, ProductFilterOptions, ProductStats, ProductStatus } from './shared/product.model';
import { ApiService } from '../../../../shared-services/src/public-api';

@Injectable()
export class ProductService {
  private readonly apiService: ApiService = inject(ApiService);
  private readonly apiUrl = 'stores/admin';
  
  // Get products for a store with filtering
  getStoreProducts(storeId: string, filters?: ProductFilterOptions): Observable<{ data: Product[], pagination: any }> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof ProductFilterOptions];
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => params = params.append(key, v));
          } else if (value instanceof Date) {
            params = params.set(key, value.toISOString());
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }
    
    return this.apiService.get<{ data: Product[], pagination: any, success: boolean }>(
      `${this.apiUrl}/${storeId}/products`,
       params 
    ).pipe(
      map(response => ({
        data: this.transformProducts(response.data),
        pagination: response.pagination
      })),
      catchError(error => {
        console.error('Error fetching products:', error);
        throw error;
      })
    );
  }

  // Get single product by ID
  getProductById(productId: string): Observable<Product> {
    return this.apiService.get<{ data: Product, success: boolean }>(
      `${this.apiUrl}/${productId}`
    ).pipe(
      map(response => this.transformProduct(response.data)),
      catchError(error => {
        console.error('Error fetching product:', error);
        throw error;
      })
    );
  }

  // Create new product
  createProduct(productData: Partial<Product>, storeId: string): Observable<Product> {
    return this.apiService.post<{ data: Product, success: boolean }>(
      `${this.apiUrl}/${storeId}/products`,
      productData
    ).pipe(
      map(response => this.transformProduct(response.data)),
      catchError(error => {
        console.error('Error creating product:', error);
        throw error;
      })
    );
  }

  // Update existing product
  updateProduct(productId: string, productData: Partial<Product>): Observable<Product> {
    return this.apiService.put<{ data: Product, success: boolean }>(
      `${this.apiUrl}/${productId}`,
      productData
    ).pipe(
      map(response => this.transformProduct(response.data)),
      catchError(error => {
        console.error('Error updating product:', error);
        throw error;
      })
    );
  }

  // Update product status
  updateProductStatus(productId: string, status: ProductStatus): Observable<Product> {
    return this.apiService.patch<{ data: Product, success: boolean }>(
      `${this.apiUrl}/${productId}/status`,
      { status }
    ).pipe(
      map(response => this.transformProduct(response.data)),
      catchError(error => {
        console.error('Error updating product status:', error);
        throw error;
      })
    );
  }

  // Toggle featured status
  toggleFeatured(productId: string, featured: boolean): Observable<Product> {
    return this.apiService.patch<{ data: Product, success: boolean }>(
      `${this.apiUrl}/${productId}/featured`,
      { featured }
    ).pipe(
      map(response => this.transformProduct(response.data)),
      catchError(error => {
        console.error('Error toggling featured status:', error);
        throw error;
      })
    );
  }

  // Delete product
  deleteProduct(productId: string): Observable<{ success: boolean, message: string }> {
    return this.apiService.delete<{ success: boolean, message: string }>(
      `${this.apiUrl}/${productId}`
    ).pipe(
      catchError(error => {
        console.error('Error deleting product:', error);
        throw error;
      })
    );
  }

  // Bulk operations
  bulkUpdateStatus(productIds: string[], status: ProductStatus): Observable<{ modifiedCount: number }> {
    return this.apiService.post<{ data: { modifiedCount: number }, success: boolean }>(
      `${this.apiUrl}/bulk/status`,
      { productIds, status }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error in bulk status update:', error);
        throw error;
      })
    );
  }

  bulkDeleteProducts(productIds: string[]): Observable<{ deletedCount: number }> {
    return this.apiService.post<{ data: { deletedCount: number }, success: boolean }>(
      `${this.apiUrl}/bulk/delete`,
      { productIds }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error in bulk delete:', error);
        throw error;
      })
    );
  }

  bulkUpdateCategory(productIds: string[], category: string): Observable<{ modifiedCount: number }> {
    return this.apiService.post<{ data: { modifiedCount: number }, success: boolean }>(
      `${this.apiUrl}/bulk/category`,
      { productIds, category }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error in bulk category update:', error);
        throw error;
      })
    );
  }

  bulkUpdatePrice(productIds: string[], priceData: { 
    type: 'fixed' | 'percentage', 
    value: number,
    operation?: 'increase' | 'decrease' | 'set'
  }): Observable<{ modifiedCount: number }> {
    return this.apiService.post<{ data: { modifiedCount: number }, success: boolean }>(
      `${this.apiUrl}/bulk/price`,
      { productIds, ...priceData }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error in bulk price update:', error);
        throw error;
      })
    );
  }

  // Export products
  exportProducts(format: 'csv' | 'excel', productIds: string[], storeId: string): Observable<Blob> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    return this.apiService.post<Blob>(
      `${this.apiUrl}/${storeId}/products/export/${format}`,
      { productIds },
      // { 
      //   headers,
      //   responseType: 'blob' 
      // }
    ).pipe(
      catchError(error => {
        console.error('Error exporting products:', error);
        throw error;
      })
    );
  }

  // Get product statistics
  getProductStats(storeId: string): Observable<ProductStats> {
    return this.apiService.get<{ data: ProductStats, success: boolean }>(
      `${this.apiUrl}/${storeId}/products/stats`
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error fetching product stats:', error);
        throw error;
      })
    );
  }

  // Search products
  searchProducts(storeId: string, query: string): Observable<Product[]> {
    return this.apiService.get<{ data: Product[], success: boolean }>(
      `${this.apiUrl}/${storeId}/products/search`,
      //{ params: { q: query } }
    ).pipe(
      map(response => this.transformProducts(response.data)),
      catchError(error => {
        console.error('Error searching products:', error);
        throw error;
      })
    );
  }

  // Get low stock products
  getLowStockProducts(storeId: string): Observable<Product[]> {
    return this.apiService.get<{ data: Product[], success: boolean }>(
      `${this.apiUrl}/${storeId}/products/low-stock`
    ).pipe(
      map(response => this.transformProducts(response.data)),
      catchError(error => {
        console.error('Error fetching low stock products:', error);
        throw error;
      })
    );
  }

  // Get out of stock products
  getOutOfStockProducts(storeId: string): Observable<Product[]> {
    return this.apiService.get<{ data: Product[], success: boolean }>(
      `${this.apiUrl}/${storeId}/products/out-of-stock`
    ).pipe(
      map(response => this.transformProducts(response.data)),
      catchError(error => {
        console.error('Error fetching out of stock products:', error);
        throw error;
      })
    );
  }

  // Get featured products
  getFeaturedProducts(storeId: string): Observable<Product[]> {
    return this.apiService.get<{ data: Product[], success: boolean }>(
      `${this.apiUrl}/${storeId}/products/featured`
    ).pipe(
      map(response => this.transformProducts(response.data)),
      catchError(error => {
        console.error('Error fetching featured products:', error);
        throw error;
      })
    );
  }

  // Upload product image
  uploadProductImage(productId: string, imageFile: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    return this.apiService.post<{ data: { url: string }, success: boolean }>(
      `${this.apiUrl}/${productId}/images`,
      formData
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error uploading product image:', error);
        throw error;
      })
    );
  }

  // Delete product image
  deleteProductImage(productId: string, imageUrl: string): Observable<{ success: boolean }> {
    return this.apiService.delete<{ success: boolean }>(
      `${this.apiUrl}/${productId}/images`,
      //{ body: { url: imageUrl } }
    ).pipe(
      catchError(error => {
        console.error('Error deleting product image:', error);
        throw error;
      })
    );
  }

  // Set main image
  setMainImage(productId: string, imageUrl: string): Observable<Product> {
    return this.apiService.patch<{ data: Product, success: boolean }>(
      `${this.apiUrl}/${productId}/images/main`,
      { url: imageUrl }
    ).pipe(
      map(response => this.transformProduct(response.data)),
      catchError(error => {
        console.error('Error setting main image:', error);
        throw error;
      })
    );
  }

  // Reorder product images
  reorderProductImages(productId: string, imageOrder: Array<{ url: string, order: number }>): Observable<Product> {
    return this.apiService.patch<{ data: Product, success: boolean }>(
      `${this.apiUrl}/${productId}/images/reorder`,
      { images: imageOrder }
    ).pipe(
      map(response => this.transformProduct(response.data)),
      catchError(error => {
        console.error('Error reordering product images:', error);
        throw error;
      })
    );
  }

  // Private helper methods
  private transformProduct(product: any): Product {
    return {
      ...product,
      stockStatus: this.calculateStockStatus(product),
      isInStock: this.isInStock(product),
      isLowStock: this.isLowStock(product),
      isOutOfStock: this.isOutOfStock(product),
      mainImage: this.getMainImage(product)
    };
  }

  private transformProducts(products: any[]): Product[] {
    return products.map(product => this.transformProduct(product));
  }

  private calculateStockStatus(product: any): string {
    if (!product.manageStock) return 'not_tracking';
    
    const quantity = product.quantity || 0;
    const lowStockAlert = product.lowStockAlert || 5;
    
    if (quantity === 0) return 'out_of_stock';
    if (quantity <= lowStockAlert) return 'low_stock';
    return 'in_stock';
  }

  private isInStock(product: any): boolean {
    if (!product.manageStock) return true;
    return (product.quantity || 0) > 0;
  }

  private isLowStock(product: any): boolean {
    if (!product.manageStock) return false;
    const quantity = product.quantity || 0;
    const lowStockAlert = product.lowStockAlert || 5;
    return quantity > 0 && quantity <= lowStockAlert;
  }

  private isOutOfStock(product: any): boolean {
    if (!product.manageStock) return false;
    return (product.quantity || 0) === 0;
  }

  private getMainImage(product: any): string {
    if (product.images && product.images.length > 0) {
      const mainImage = product.images.find((img: any) => img.isMain);
      if (mainImage) return mainImage.url;
      return product.images[0].url;
    }
    return '';
  }
}