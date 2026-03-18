import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../../../../shared-services/src/public-api';
import { Product, ProductVariant } from '../../store/models';
import { ProductReview } from './models/product-reveiw.model';


// =========================================
// CATEGORY MODELS
// =========================================

export interface CategoryImage {
  url: string;
  altText?: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: CategoryImage;
  icon?: string;
  parent?: string | Category;
  children?: Category[];
  ancestors?: Array<{
    _id: string;
    name: string;
    slug: string;
  }>;
  level: number;
  order: number;
  isActive: boolean;
  isFeatured: boolean;
  featuredProducts?: Product[];
  productCount?: number;
  attributes?: CategoryAttribute[];
  metaTitle?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryAttribute {
  name: string;
  type: 'text' | 'number' | 'select' | 'multiselect';
  required: boolean;
  options?: string[];
  unit?: string;
}


// =========================================
// RESPONSE MODELS
// =========================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: any;
  metadata?: {
    page?: number;
    limit?: number;
    total?: number;
    pages?: number;
  };
}

export interface ProductResponse extends ApiResponse<Product> {
  relatedProducts?: Product[];
}

export interface ProductsResponse extends ApiResponse<Product[]> {
  metadata: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters?: {
    categories: any[];
    brands: string[];
    priceRange: { min: number; max: number };
  };
}

export interface CategoryResponse extends ApiResponse<Category> {}

export interface CategoriesResponse extends ApiResponse<Category[]> {
  tree?: Category[]; // Hierarchical structure
}

export interface ReviewsResponse extends ApiResponse<ProductReview[]> {
  metadata: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary?: {
    averageRating: number;
    totalReviews: number;
    ratingBreakdown: number[];
  };
}

export interface ReviewResponse extends ApiResponse<ProductReview> {}

export interface SearchResponse extends ApiResponse<Product[]> {
  suggestions?: string[];
  metadata: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    query: string;
  };
}

export interface ProductAnalytics {
  productId: string;
  views: number;
  uniqueViews: number;
  addToCarts: number;
  purchases: number;
  revenue: number;
  conversionRate: number;
  averageTimeOnPage: number;
  bounceRate: number;
}

// =========================================
// REQUEST MODELS
// =========================================

export interface ProductFilterOptions {
  page?: number;
  limit?: number;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'popular' | 'rating';
  category?: string;
  categoryId?: string;
  subcategory?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  onSale?: boolean;
  featured?: boolean;
  search?: string;
  tags?: string[];
  attributes?: Record<string, string>;
}

export interface ReviewFilterOptions {
  page?: number;
  limit?: number;
  sort?: 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful';
  rating?: number;
  hasImages?: boolean;
  verified?: boolean;
}

export interface CreateReviewRequest {
  productId: string;
  rating: number;
  title?: string;
  comment: string;
  images?: File[];
}

export interface UpdateReviewRequest {
  rating?: number;
  title?: string;
  comment?: string;
  images?: File[];
}

export interface SearchOptions {
  q: string;
  page?: number;
  limit?: number;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'rating';
}

// =========================================
// SERVICE
// =========================================

@Injectable()
export class ProductDetailService {
  private snackBar = inject(MatSnackBar);
  private apiService = inject(ApiService);
  private readonly apiUrl = 'products';
  private readonly categoryUrl = 'categories';
  private readonly reviewUrl = 'reviews';

  // Cache for product data
  private productCache = new Map<string, { data: Product; timestamp: number }>();
  private categoryCache = new Map<string, { data: Category; timestamp: number }>();
  private cacheDuration = 5 * 60 * 1000; // 5 minutes

  /**
   * Clear product cache
   */
  clearProductCache(productId?: string): void {
    if (productId) {
      this.productCache.delete(productId);
    } else {
      this.productCache.clear();
    }
  }

  /**
   * Clear category cache
   */
  clearCategoryCache(categoryId?: string): void {
    if (categoryId) {
      this.categoryCache.delete(categoryId);
    } else {
      this.categoryCache.clear();
    }
  }

  // =========================================
  // PRODUCT METHODS
  // =========================================

  /**
   * Get product by ID
   */
  getProductById(productId: string, includeAnalytics: boolean = false): Observable<ProductResponse> {
    // Check cache first
    const cached = this.productCache.get(productId);
    if (cached && (Date.now() - cached.timestamp) < this.cacheDuration) {
      return new Observable(observer => {
        observer.next({ success: true, data: cached.data });
        observer.complete();
      });
    }

    let params = new HttpParams();
    if (includeAnalytics) {
      params = params.set('includeAnalytics', 'true');
    }

    return this.apiService.get<ProductResponse>(`${this.apiUrl}/${productId}`,  params )
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            // Cache the product data
            this.productCache.set(productId, {
              data: response.data,
              timestamp: Date.now()
            });
          }
        }),
        catchError(error => {
          this.showError('Failed to load product details');
          throw error;
        })
      );
  }

  /**
   * Get product by slug
   */
  getProductBySlug(slug: string): Observable<ProductResponse> {
    return this.apiService.get<ProductResponse>(`${this.apiUrl}/slug/${slug}`)
      .pipe(
        catchError(error => {
          this.showError('Failed to load product details');
          throw error;
        })
      );
  }

  /**
   * Get products with filters
   */
  getProducts(filters?: ProductFilterOptions): Observable<ProductsResponse> {
    let params = new HttpParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(item => {
              params = params.append(key, item);
            });
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }

    return this.apiService.get<ProductsResponse>(this.apiUrl,  params )
      .pipe(
        catchError(error => {
          this.showError('Failed to load products');
          throw error;
        })
      );
  }

  /**
   * Get related products
   */
  getRelatedProducts(productId: string, limit: number = 8): Observable<ProductsResponse> {
    const params = new HttpParams().set('limit', limit.toString());

    return this.apiService.get<ProductsResponse>(`${this.apiUrl}/${productId}/related`, params).pipe(
      catchError(error => {
        console.error('Failed to load related products:', error);
        throw error;
      })
    );
  }

  /**
   * Get product analytics
   */
  getProductAnalytics(productId: string): Observable<ApiResponse<ProductAnalytics>> {
    return this.apiService.get<ApiResponse<ProductAnalytics>>(`${this.apiUrl}/${productId}/analytics`)
      .pipe(
        catchError(error => {
          console.error('Failed to load product analytics:', error);
          throw error;
        })
      );
  }

  /**
   * Check if product is in stock
   */
  checkStock(productId: string, variantId?: string, quantity: number = 1): Observable<ApiResponse<{ available: boolean; quantity: number }>> {
    let params = new HttpParams()
      .set('quantity', quantity.toString());
    
    if (variantId) {
      params = params.set('variantId', variantId);
    }

    return this.apiService.get<ApiResponse<{ available: boolean; quantity: number }>>(
      `${this.apiUrl}/${productId}/stock`,
       params 
    );
  }

  /**
   * Get product variants
   */
  getProductVariants(productId: string): Observable<ApiResponse<ProductVariant[]>> {
    return this.apiService.get<ApiResponse<ProductVariant[]>>(`${this.apiUrl}/${productId}/variants`)
      .pipe(
        catchError(error => {
          console.error('Failed to load product variants:', error);
          throw error;
        })
      );
  }

  /**
   * Get product by SKU
   */
  getProductBySku(sku: string): Observable<ProductResponse> {
    return this.apiService.get<ProductResponse>(`${this.apiUrl}/sku/${sku}`)
      .pipe(
        catchError(error => {
          this.showError('Failed to load product');
          throw error;
        })
      );
  }

  // =========================================
  // CATEGORY METHODS
  // =========================================

  /**
   * Get all categories
   */
    getCategories(paramsValue?: { level?: number; parent?: string; featured?: boolean }): Observable<CategoriesResponse> {
        let params = new HttpParams();

        if (paramsValue) { // Check the input object, not the empty 'params'
            Object.entries(paramsValue).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                // Reassign 'params' because HttpParams is immutable
                params = params.set(key, value.toString());
            }
            });
        }

        // Pass the updated 'params' as part of the options object
        return this.apiService.get<CategoriesResponse>(this.categoryUrl,  params )
            .pipe(
            catchError(error => {
                console.error('Failed to load categories:', error);
                throw error;
            })
            );
    }

  /**
   * Get category by ID
   */
  getCategoryById(categoryId: string): Observable<CategoryResponse> {
    // Check cache first
    const cached = this.categoryCache.get(categoryId);
    if (cached && (Date.now() - cached.timestamp) < this.cacheDuration) {
      return new Observable(observer => {
        observer.next({ success: true, data: cached.data });
        observer.complete();
      });
    }

    return this.apiService.get<CategoryResponse>(`${this.categoryUrl}/${categoryId}`)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.categoryCache.set(categoryId, {
              data: response.data,
              timestamp: Date.now()
            });
          }
        }),
        catchError(error => {
          console.error('Failed to load category:', error);
          throw error;
        })
      );
  }

  /**
   * Get category by slug
   */
  getCategoryBySlug(slug: string): Observable<CategoryResponse> {
    return this.apiService.get<CategoryResponse>(`${this.categoryUrl}/slug/${slug}`)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.categoryCache.set(response.data._id, {
              data: response.data,
              timestamp: Date.now()
            });
          }
        }),
        catchError(error => {
          console.error('Failed to load category:', error);
          throw error;
        })
      );
  }

  /**
   * Get category tree (hierarchical)
   */
  getCategoryTree(): Observable<ApiResponse<Category[]>> {
    return this.apiService.get<ApiResponse<Category[]>>(`${this.categoryUrl}/tree`)
      .pipe(
        catchError(error => {
          console.error('Failed to load category tree:', error);
          throw error;
        })
      );
  }

  /**
   * Get products by category
   */
  getProductsByCategory(categoryId: string, filters?: ProductFilterOptions): Observable<ProductsResponse> {
    let params = new HttpParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.apiService.get<ProductsResponse>(`${this.categoryUrl}/${categoryId}/products`,  params )
      .pipe(
        catchError(error => {
          console.error('Failed to load category products:', error);
          throw error;
        })
      );
  }

  /**
   * Get featured categories
   */
  getFeaturedCategories(limit: number = 6): Observable<CategoriesResponse> {
    const params = new HttpParams().set('limit', limit.toString())
    return this.apiService.get<CategoriesResponse>(`${this.categoryUrl}/featured`, params );
  }

  // =========================================
  // REVIEW METHODS
  // =========================================

  /**
   * Get product reviews
   */
  getProductReviews(productId: string, filters?: ReviewFilterOptions): Observable<ReviewsResponse> {
    let params = new HttpParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.apiService.get<ReviewsResponse>(`${this.reviewUrl}/product/${productId}`,  params )
      .pipe(
        catchError(error => {
          console.error('Failed to load reviews:', error);
          throw error;
        })
      );
  }

  /**
   * Get review by ID
   */
  getReviewById(reviewId: string): Observable<ReviewResponse> {
    return this.apiService.get<ReviewResponse>(`${this.reviewUrl}/${reviewId}`)
      .pipe(
        catchError(error => {
          console.error('Failed to load review:', error);
          throw error;
        })
      );
  }

  /**
   * Create a new review
   */
  createReview(reviewData: CreateReviewRequest): Observable<ReviewResponse> {
    const formData = new FormData();
    
    formData.append('productId', reviewData.productId);
    formData.append('rating', reviewData.rating.toString());
    if (reviewData.title) formData.append('title', reviewData.title);
    formData.append('comment', reviewData.comment);
    
    if (reviewData.images) {
      reviewData.images.forEach((image, index) => {
        formData.append(`images`, image);
      });
    }

    return this.apiService.post<ReviewResponse>(this.reviewUrl, formData)
      .pipe(
        tap(() => {
          this.showSuccess('Review submitted successfully');
          // Clear product cache to refresh reviews
          this.clearProductCache(reviewData.productId);
        }),
        catchError(error => {
          this.showError('Failed to submit review');
          throw error;
        })
      );
  }

  /**
   * Update a review
   */
  updateReview(reviewId: string, reviewData: UpdateReviewRequest): Observable<ReviewResponse> {
    const formData = new FormData();
    
    if (reviewData.rating) formData.append('rating', reviewData.rating.toString());
    if (reviewData.title) formData.append('title', reviewData.title);
    if (reviewData.comment) formData.append('comment', reviewData.comment);
    
    if (reviewData.images) {
      reviewData.images.forEach((image, index) => {
        formData.append(`images`, image);
      });
    }

    return this.apiService.put<ReviewResponse>(`${this.reviewUrl}/${reviewId}`, formData)
      .pipe(
        tap(() => {
          this.showSuccess('Review updated successfully');
        }),
        catchError(error => {
          this.showError('Failed to update review');
          throw error;
        })
      );
  }

  /**
   * Delete a review
   */
  deleteReview(reviewId: string): Observable<ApiResponse<null>> {
    return this.apiService.delete<ApiResponse<null>>(`${this.reviewUrl}/${reviewId}`)
      .pipe(
        tap(() => {
          this.showSuccess('Review deleted successfully');
        }),
        catchError(error => {
          this.showError('Failed to delete review');
          throw error;
        })
      );
  }

  /**
   * Mark review as helpful
   */
  markReviewHelpful(reviewId: string): Observable<ApiResponse<null>> {
    return this.apiService.post<ApiResponse<null>>(`${this.reviewUrl}/${reviewId}/helpful`, {})
      .pipe(
        catchError(error => {
          console.error('Failed to mark review as helpful:', error);
          throw error;
        })
      );
  }

  /**
   * Report a review
   */
  reportReview(reviewId: string, reason: string): Observable<ApiResponse<null>> {
    return this.apiService.post<ApiResponse<null>>(`${this.reviewUrl}/${reviewId}/report`, { reason })
      .pipe(
        tap(() => {
          this.showSuccess('Review reported successfully');
        }),
        catchError(error => {
          this.showError('Failed to report review');
          throw error;
        })
      );
  }

  // =========================================
  // SEARCH METHODS
  // =========================================

  /**
   * Search products
   */
  searchProducts(options: SearchOptions): Observable<SearchResponse> {
    let params = new HttpParams();

    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, value.toString());
      }
    });

    return this.apiService.get<SearchResponse>(`${this.apiUrl}/search`,  params )
      .pipe(
        catchError(error => {
          console.error('Failed to search products:', error);
          throw error;
        })
      );
  }

  /**
   * Get search suggestions
   */
  getSearchSuggestions(query: string, limit: number = 5): Observable<ApiResponse<string[]>> {
    const params = new HttpParams()
        .set('q', query)
        .set('limit', limit.toString())
    return this.apiService.get<ApiResponse<string[]>>(`${this.apiUrl}/search/suggestions`, params );
  }

  // =========================================
  // UTILITY METHODS
  // =========================================

  /**
   * Get product URL
   */
  getProductUrl(product: Product): string {
    return `/product/${product._id}`;
  }

  /**
   * Get category URL
   */
  getCategoryUrl(category: Category): string {
    return `/category/${category.slug || category._id}`;
  }

  /**
   * Calculate discount percentage
   */
  calculateDiscountPercentage(price: number, originalPrice: number): number {
    if (!originalPrice || originalPrice <= price) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  }

  /**
   * Format price
   */
  formatPrice(price: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(price);
  }

  /**
   * Get main product image
   */
  getMainProductImage(product: Product): string | null {
    const mainImage = product.images?.find(img => img.isMain);
    return mainImage?.url || product.images?.[0]?.url || null;
  }

  /**
   * Check if product has variants
   */
    hasVariants(product: Product): boolean {
        return !!(product.variants && product.variants.length > 0);
    }


  /**
   * Get available variants for attribute
   */
  getVariantsForAttribute(product: Product, attributeName: string): string[] {
    const attribute = product.attributes?.find(attr => attr.name === attributeName);
    return attribute?.values || [];
  }

  /**
   * Show success message
   */
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'bottom'
    });
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'bottom'
    });
  }
}