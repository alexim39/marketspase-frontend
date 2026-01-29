// product-grid-card.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
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
  styleUrls: ['./product-grid-card.component.scss']
})
export class ProductGridCardComponent {
  @Input() product!: Product;
  @Input() store: Store | null = null;
  @Input() isInWishlist = false;
  
  @Output() addToCart = new EventEmitter<Product>();
  @Output() toggleWishlist = new EventEmitter<Product>();
  @Output() quickView = new EventEmitter<Product>();
  @Output() share = new EventEmitter<Product>();
  @Output() viewDetails = new EventEmitter<Product>();

  getProductStatus(): string {
    if (!this.product.manageStock) return 'in-stock';
    if (this.product.quantity === 0) return 'out-of-stock';
    if (this.product.quantity <= this.product.lowStockAlert) return 'low-stock';
    return 'in-stock';
  }

  getStockText(): string {
    const status = this.getProductStatus();
    switch (status) {
      case 'out-of-stock': return 'Out of Stock';
      case 'low-stock': return `Only ${this.product.quantity} left`;
      default: return 'In Stock';
    }
  }

  calculateDiscount(price: number, originalPrice: number): number {
    if (!originalPrice || originalPrice <= price) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  }

  isNewProduct(date: Date): boolean {
    if (!date) return false;
    const createdDate = new Date(date);
    const now = new Date();
    const diffInDays = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
    return diffInDays <= 30;
  }

  onImageError(event: any): void {
    event.target.src = 'assets/images/product-placeholder.svg';
  }

  onAddToCart(event: Event): void {
    event.stopPropagation();
    this.addToCart.emit(this.product);
  }

  onToggleWishlist(event: Event): void {
    event.stopPropagation();
    this.toggleWishlist.emit(this.product);
  }

  onQuickView(event: Event): void {
    event.stopPropagation();
    this.quickView.emit(this.product);
  }

  onShare(event: Event): void {
    event.stopPropagation();
    this.share.emit(this.product);
  }

  onViewDetails(event: Event): void {
    event.stopPropagation();
    this.viewDetails.emit(this.product);
  }
}