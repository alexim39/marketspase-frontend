// product-list-item.component.ts
import { Component, Input, Output, EventEmitter, inject, Signal } from '@angular/core';
import { CommonModule} from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { LazyImageDirective } from '../../shared/directives/lazy-image.directive';
import { Product, Store } from '../../../store/models';
import { CurrencyUtilsPipe, UserInterface } from '@shared/services';
import { UserService } from '../../../common/services/user.service';
import { buildWhatsAppChatUrl } from '../../../common/utils/whatsapp.util';

@Component({
  selector: 'app-product-list-item',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatCardModule, LazyImageDirective, CurrencyUtilsPipe],
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

    const phoneNumber = this.store?.whatsappNumber || this.store?.owner?.personalInfo?.phone;
    const whatsappUrl = buildWhatsAppChatUrl(phoneNumber);

    if (whatsappUrl) {
      window.open(whatsappUrl, '_blank', 'noopener');
    } else {
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
