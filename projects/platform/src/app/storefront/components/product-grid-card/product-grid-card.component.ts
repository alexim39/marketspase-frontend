// product-grid-card.component.ts
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { RatingComponent } from '../../shared/rating/rating.component';
import { LazyImageDirective } from '../../shared/directives/lazy-image.directive';
import { TruncatePipe } from '../../../store/shared';
import { Product, Store } from '../../../store/models';

/**
 * Product Grid Card Component
 * 
 * A professional, mobile-first product card component for e-commerce storefronts.
 * Features:
 * - Responsive design with mobile-first approach
 * - Accessibility compliant (ARIA labels, keyboard navigation)
 * - Optimized performance with OnPush change detection
 * - Rich interactions (wishlist, quick view, share, cart)
 * - Visual feedback for stock status, discounts, and ratings
 */
@Component({
  selector: 'app-product-grid-card',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTooltipModule,
    RouterModule,
    TruncatePipe,
    CurrencyPipe,
    RatingComponent,
    LazyImageDirective
  ],
  templateUrl: './product-grid-card.component.html',
  styleUrls: ['./product-grid-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductGridCardComponent {
  // =========================================
  // INPUTS
  // =========================================
  
  @Input() product!: Product;
  @Input() store: Store | null = null;
  @Input() isInWishlist = false;

  // =========================================
  // OUTPUTS
  // =========================================
  
  @Output() addToCart = new EventEmitter<Product>();
  @Output() toggleWishlist = new EventEmitter<Product>();
  @Output() quickView = new EventEmitter<Product>();
  @Output() share = new EventEmitter<Product>();
  @Output() viewDetails = new EventEmitter<Product>();

  // =========================================
  // PRODUCT STATUS METHODS
  // =========================================

  /**
   * Determines the current stock status of the product
   * @returns Stock status: 'in-stock', 'low-stock', or 'out-of-stock'
   */
  getProductStatus(): 'in-stock' | 'low-stock' | 'out-of-stock' {
    if (!this.product.manageStock) {
      return 'in-stock';
    }

    if (this.product.quantity === 0) {
      return 'out-of-stock';
    }

    if (this.product.quantity <= this.product.lowStockAlert) {
      return 'low-stock';
    }

    return 'in-stock';
  }

  /**
   * Gets user-friendly stock status text
   * @returns Human-readable stock status
   */
  getStockText(): string {
    const status = this.getProductStatus();
    
    switch (status) {
      case 'out-of-stock':
        return 'Out of Stock';
      case 'low-stock':
        return `Only ${this.product.quantity} left`;
      default:
        return 'In Stock';
    }
  }

  /**
   * Checks if the product is available for purchase
   * @returns True if product can be added to cart
   */
  isAvailable(): boolean {
    return !this.product.manageStock || this.product.quantity > 0;
  }

  // =========================================
  // PRICING METHODS
  // =========================================

  /**
   * Calculates discount percentage between original and current price
   * @param price Current price
   * @param originalPrice Original price before discount
   * @returns Discount percentage (0-100)
   */
  calculateDiscount(price: number, originalPrice: number): number {
    if (!originalPrice || originalPrice <= price) {
      return 0;
    }
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  }

  /**
   * Checks if product has an active discount
   * @returns True if product is discounted
   */
  hasDiscount(): boolean {
    return !!(
      this.product.originalPrice && 
      this.product.originalPrice > this.product.price
    );
  }

  /**
   * Calculates actual savings amount
   * @returns Savings in currency
   */
  getSavingsAmount(): number {
    if (!this.hasDiscount()) {
      return 0;
    }
    return this.product.originalPrice! - this.product.price;
  }

  // =========================================
  // PRODUCT BADGE METHODS
  // =========================================

  /**
   * Determines if product should be marked as "New"
   * @param date Product creation date
   * @returns True if product was created within the last 30 days
   */
  isNewProduct(date: Date): boolean {
    if (!date) {
      return false;
    }

    const createdDate = new Date(date);
    const now = new Date();
    const diffInDays = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
    
    return diffInDays <= 30;
  }

  // =========================================
  // EVENT HANDLERS
  // =========================================

  /**
   * Handles image loading errors by setting a placeholder
   * @param event Error event from image element
   */
  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = 'assets/images/product-placeholder.svg';
    target.alt = 'Product image unavailable';
  }

  /**
   * Handles add to cart action
   * Prevents event propagation to avoid triggering card click
   * @param event Click event
   */
  onAddToCart(event: Event): void {
    event.stopPropagation();
    
    if (this.isAvailable()) {
      this.addToCart.emit(this.product);
    }
  }

  /**
   * Handles wishlist toggle action
   * @param event Click event
   */
  onToggleWishlist(event: Event): void {
    event.stopPropagation();
    this.toggleWishlist.emit(this.product);
  }

  /**
   * Handles quick view action
   * Opens product quick preview modal
   * @param event Click event
   */
  onQuickView(event: Event): void {
    event.stopPropagation();
    this.quickView.emit(this.product);
  }

  /**
   * Handles share action
   * Opens product sharing options
   * @param event Click event
   */
  onShare(event: Event): void {
    event.stopPropagation();
    this.share.emit(this.product);
  }

  /**
   * Handles view details action
   * Navigates to product detail page
   * @param event Click event
   */
  onViewDetails(event: Event): void {
    // Don't stop propagation - this is the default card click action
    this.viewDetails.emit(this.product);
  }

  // =========================================
  // UTILITY METHODS
  // =========================================

  /**
   * Generates structured data for SEO (Schema.org Product)
   * Can be used for rich snippets in search results
   * @returns Product schema object
   */
  getProductSchema(): object {
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: this.product.name,
      description: this.product.description,
      image: this.product.images?.[0]?.url || '',
      offers: {
        '@type': 'Offer',
        price: this.product.price,
        priceCurrency: 'USD',
        availability: this.isAvailable() 
          ? 'https://schema.org/InStock' 
          : 'https://schema.org/OutOfStock',
        itemCondition: 'https://schema.org/NewCondition'
      },
      ...(this.product.averageRating > 0 && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: this.product.averageRating,
          reviewCount: this.product.ratingCount
        }
      })
    };
  }

  /**
   * Tracks card by product ID for *ngFor optimization
   * @param index Array index
   * @param product Product item
   * @returns Unique identifier for tracking
   */
  trackByProductId(index: number, product: Product): string | number {
    return product._id || index;
  }
}