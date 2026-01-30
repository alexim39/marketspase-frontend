// product-list-item.component.ts
import { Component, Input, Output, EventEmitter, inject, Signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { LazyImageDirective } from '../../shared/directives/lazy-image.directive';
import { Product, Store } from '../../../store/models';
import { UserInterface } from '../../../../../../shared-services/src/public-api';
import { UserService } from '../../../common/services/user.service';

@Component({
  selector: 'app-product-list-item',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatCardModule, CurrencyPipe, LazyImageDirective],
  templateUrl: './product-list-item.component.html',
  styleUrls: ['./product-list-item.component.scss']
})
export class ProductListItemComponent {
  @Input() product!: Product;
  @Input() store: Store | null = null;
  @Input() isInWishlist = false;
  
  @Output() addToCart = new EventEmitter<Product>();
  @Output() toggleWishlist = new EventEmitter<Product>();
  @Output() quickView = new EventEmitter<Product>();
  @Output() share = new EventEmitter<Product>();
  @Output() viewDetails = new EventEmitter<Product>();

  private userService: UserService = inject(UserService);
  public user: Signal<UserInterface | null> = this.userService.user;

  getStockText(): string {
    if (!this.product.manageStock) return 'In Stock';
    if (this.product.quantity === 0) return 'Out of Stock';
    if (this.product.quantity <= this.product.lowStockAlert) return `Only ${this.product.quantity} left`;
    return 'In Stock';
  }

  calculateDiscount(price: number, originalPrice: number): number {
    if (!originalPrice || originalPrice <= price) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  }

  onImageError(event: any): void {
    event.target.src = 'assets/images/product-placeholder.svg';
  }

  onAddToCart(event: Event): void {
    event.stopPropagation();
    this.addToCart.emit(this.product);
  }

  onContactSeller(event: Event): void {
      event.stopPropagation();
      
      // const phoneNumber = this.user()?.personalInfo?.phone; // Replace with your actual data path
      const phoneNumber = this.store?.owner?.personalInfo?.phone;
      const storeName = this.store?.name || 'the store';

      if (phoneNumber) {
        // 1. Clean the phone number (remove spaces, +, or dashes)
        const cleanNumber = phoneNumber.replace(/\D/g, '');
        
        // 2. Create an optional encoded message
        const message = encodeURIComponent(`Hello! I'm interested in a product from ${storeName} on MarketSpase.`);
        
        // 3. Open the WhatsApp link in a new tab
        const whatsappUrl = `https://wa.me/${cleanNumber}?text=${message}`;
        window.open(whatsappUrl, '_blank');
      } else {
        // Optional: Show a toast or snackbar error if no number exists
        console.error('No phone number available for this seller');
      }
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