// src/app/services/product.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../../../shared-services/src/public-api';

export interface CreateProductRequest {
  storeId: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  costPrice?: number;
  images: File[];
  quantity: number;
  category: string;
  tags: string[];
  brand?: string;
  sku?: string;
  lowStockAlert: number;
  manageStock: boolean;
  backorderAllowed: boolean;
  soldIndividually: boolean;
  taxable: boolean;
  taxClass: string;
  requiresShipping: boolean;
  weight?: number;
  weightUnit?: string;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  };
  shippingClass?: string;
  hasVariants: boolean;
  attributes?: Array<{
    name: string;
    values: string[];
    visible: boolean;
    variation: boolean;
  }>;
  variants?: Array<{
    name: string;
    sku?: string;
    price: number;
    originalPrice?: number;
    quantity: number;
    attributes: Record<string, string>;
  }>;
  isDigital: boolean;
  digitalProduct?: {
    file?: File;
    downloadLimit?: number;
    downloadExpiry?: number;
  };
  seo?: {
    title: string;
    description: string;
    keywords: string[];
    slug?: string;
  };
  isFeatured: boolean;
  isActive: boolean;
  scheduledStart?: Date;
  scheduledEnd?: Date;
}

export interface ProductResponse {
  _id: string;
  store: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice: number;
  costPrice: number;
  images: Array<{
    url: string;
    altText: string;
    isMain: boolean;
    order: number;
  }>;
  quantity: number;
  category: string;
  brand: string;
  tags: string[];
  sku: string;
  lowStockAlert: number;
  manageStock: boolean;
  backorderAllowed: boolean;
  soldIndividually: boolean;
  taxable: boolean;
  taxClass: string;
  requiresShipping: boolean;
  weight?: number;
  weightUnit: string;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit: string;
  };
  shippingClass: string;
  hasVariants: boolean;
  attributes: Array<{
    name: string;
    values: string[];
    visible: boolean;
    variation: boolean;
    order: number;
  }>;
  variants: Array<{
    _id: string;
    name: string;
    sku: string;
    price: number;
    originalPrice: number;
    quantity: number;
    attributes: Record<string, string>;
    isActive: boolean;
    lowStockAlert: number;
  }>;
  isDigital: boolean;
  digitalProduct?: {
    fileUrl: string;
    fileName: string;
    fileSize: number;
    downloadLimit: number;
    downloadExpiry: number;
    downloadCount: number;
  };
  seo: {
    title: string;
    description: string;
    keywords: string[];
    slug: string;
  };
  isFeatured: boolean;
  isActive: boolean;
  scheduledStart?: Date;
  scheduledEnd?: Date;
  viewCount: number;
  purchaseCount: number;
  averageRating: number;
  ratingCount: number;
  meta: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ProductService {
  private apiService: ApiService = inject(ApiService);

  /**
   * Create a new product
  //  */
  // createProduct(storeId: string, productData: CreateProductRequest): Observable<ProductResponse> {
  //   return this.apiService.post<ProductResponse>(
  //     `stores/product/${storeId}/products`,
  //     productData,
  //     undefined,
  //     true
  //   );
  // }

  /**
   * Create product with file upload support (multipart form data)
   */
  createProduct(storeId: string, userId: string, formData: FormData): Observable<ProductResponse> {
    console.log('userid ', userId, 'storeid ', storeId)
    console.log('store record ',formData)
    return this.apiService.post<ProductResponse>(`stores/product/${storeId}/${userId}/create`, formData, undefined, true);
  }

  /**
   * Get product by ID
   */
//   getProduct(storeId: string, productId: string): Observable<ProductResponse> {
//     return this.apiService.get<ProductResponse>(`stores/product/${storeId}/products/${productId}`, undefined, undefined, true );
//   }

  /**
   * Update product
   */
//   updateProduct(storeId: string, productId: string, productData: Partial<CreateProductRequest>): Observable<ProductResponse> {
//     return this.apiService.put<ProductResponse>(`stores/product/${storeId}/products/${productId}`, productData, undefined, true);
//   }

  /**
   * Delete product (soft delete)
   */
//   deleteProduct(storeId: string, productId: string): Observable<{ success: boolean; message: string }> {
//     return this.apiService.delete<{ success: boolean; message: string }>(`stores/product/${storeId}/products/${productId}`, undefined, undefined, true);
//   }

  /**
   * Get all products for a store with pagination
   */
//   getStoreProducts(
//     storeId: string,
//     options?: {
//       page?: number;
//       limit?: number;
//       category?: string;
//       isActive?: boolean;
//       isFeatured?: boolean;
//       sortBy?: string;
//       sortOrder?: 'asc' | 'desc';
//     }
//   ): Observable<{
//     products: ProductResponse[];
//     total: number;
//     page: number;
//     limit: number;
//     totalPages: number;
//   }> {
//     const params: any = {};
//     if (options?.page) params.page = options.page;
//     if (options?.limit) params.limit = options.limit;
//     if (options?.category) params.category = options.category;
//     if (options?.isActive !== undefined) params.isActive = options.isActive;
//     if (options?.isFeatured !== undefined) params.isFeatured = options.isFeatured;
//     if (options?.sortBy) params.sortBy = options.sortBy;
//     if (options?.sortOrder) params.sortOrder = options.sortOrder;

//     return this.apiService.get<{
//       products: ProductResponse[];
//       total: number;
//       page: number;
//       limit: number;
//       totalPages: number;
//     }>(`stores/product/${storeId}/products`, params, undefined, true);
//   }

//   /**
//    * Search products
//    */
//   searchProducts(
//     storeId: string,
//     query: string,
//     options?: {
//       page?: number;
//       limit?: number;
//       category?: string;
//     }
//   ): Observable<{
//     products: ProductResponse[];
//     total: number;
//     page: number;
//     limit: number;
//     totalPages: number;
//   }> {
//     const params: any = { q: query };
//     if (options?.page) params.page = options.page;
//     if (options?.limit) params.limit = options.limit;
//     if (options?.category) params.category = options.category;

//     return this.apiService.get<{
//       products: ProductResponse[];
//       total: number;
//       page: number;
//       limit: number;
//       totalPages: number;
//     }>(`stores/product/${storeId}/products/search`, params, undefined, true);
//   }

  /**
   * Update product inventory
   */
//   updateInventory(
//     storeId: string,
//     productId: string,
//     quantity: number,
//     changeType: 'purchase' | 'restock' | 'adjustment' | 'return' | 'damage' | 'transfer',
//     options?: {
//       variantId?: string;
//       orderId?: string;
//       reason?: string;
//       notes?: string;
//     }
//   ): Observable<ProductResponse> {
//     return this.apiService.patch<ProductResponse>(
//       `stores/product/${storeId}/products/${productId}/inventory`,
//       { quantity, changeType, ...options },
//       undefined,
//       true
//     );
//   }

  /**
   * Update product price
   */
//   updatePrice(
//     storeId: string,
//     productId: string,
//     newPrice: number,
//     options?: {
//       variantId?: string;
//       changeType?: 'manual' | 'sale' | 'seasonal' | 'cost_based' | 'competitor';
//       reason?: string;
//       notes?: string;
//       isPromotional?: boolean;
//       promotionName?: string;
//       promotionStart?: Date;
//       promotionEnd?: Date;
//     }
//   ): Observable<ProductResponse> {
//     return this.apiService.patch<ProductResponse>(
//       `stores/product/${storeId}/products/${productId}/price`,
//       { newPrice, ...options },
//       undefined,
//       true
//     );
//   }

  /**
   * Upload product images
   */
//   uploadImages(
//     storeId: string,
//     productId: string,
//     images: File[]
//   ): Observable<{
//     success: boolean;
//     images: Array<{
//       url: string;
//       altText: string;
//       isMain: boolean;
//       order: number;
//     }>;
//   }> {
//     const formData = new FormData();
//     images.forEach((image, index) => {
//       formData.append('images', image);
//       formData.append(`altTexts[${index}]`, image.name);
//     });

//     return this.apiService.post<{
//       success: boolean;
//       images: Array<{
//         url: string;
//         altText: string;
//         isMain: boolean;
//         order: number;
//       }>;
//     }>(`stores/product/${storeId}/products/${productId}/images`, formData, undefined, true);
//   }

  /**
   * Set main image
   */
//   setMainImage(
//     storeId: string,
//     productId: string,
//     imageIndex: number
//   ): Observable<ProductResponse> {
//     return this.apiService.patch<ProductResponse>(
//       `stores/product/${storeId}/products/${productId}/images/main`,
//       { imageIndex },
//       undefined,
//       true
//     );
//   }

  /**
   * Delete product image
   */
//   deleteImage(
//     storeId: string,
//     productId: string,
//     imageIndex: number
//   ): Observable<ProductResponse> {
//     return this.apiService.delete<ProductResponse>(
//       `stores/product/${storeId}/products/${productId}/images/${imageIndex}`,
//       undefined,
//       undefined,
//       true
//     );
//   }

  /**
   * Reorder images
   */
//   reorderImages(
//     storeId: string,
//     productId: string,
//     fromIndex: number,
//     toIndex: number
//   ): Observable<ProductResponse> {
//     return this.apiService.patch<ProductResponse>(
//       `stores/product/${storeId}/products/${productId}/images/reorder`,
//       { fromIndex, toIndex },
//       undefined,
//       true
//     );
//   }
}