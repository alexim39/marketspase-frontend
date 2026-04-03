import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RatingComponent } from '../../../../shared/rating/rating.component';
import { CurrencyUtilsPipe } from '../../../../../../../../shared-services/src/public-api';
import { LazyImageDirective } from '../../../../shared/directives/lazy-image.directive';

export interface StoreInfo {
  name: string;
  logo?: string;
  storeLink?: string;
  isVerified?: boolean;
  whatsappNumber?: string;
}

export interface Attribute {
  name: string;
  values: string[];
}

export interface ProductVariant {
  _id?: string;
  name?: string;
  price: number;
  originalPrice?: number;
  quantity?: number;
  options?: { name: string; value: string }[];
  images?: { url: string }[];
}

@Component({
  selector: 'app-product-info',
  standalone: true,
  imports: [
    CommonModule, 
    MatIconModule, 
    MatButtonModule, 
    MatTooltipModule,
    RatingComponent,
    CurrencyUtilsPipe,
    LazyImageDirective
  ],
  templateUrl: './product-info.component.html',
  styleUrls: ['./product-info.component.scss']
})
export class ProductInfoComponent {
  @Input() product: any = null;
  @Input() store: StoreInfo | null = null;
  @Input() variants: ProductVariant[] = [];
  @Input() attributes: Attribute[] = [];
  @Input() selectedVariant: ProductVariant | null = null;
  @Input() quantity: number = 1;
  @Input() maxQuantity: number = 10;
  @Input() canAddToCart: boolean = true;
  @Input() isInWishlist: boolean = false;
  @Input() userCurrency: string = 'NGN';
  @Input() userRole: string = '';
  @Input() activePromotion: any = null;
  
  @Output() storeClick = new EventEmitter<void>();
  @Output() reviewsClick = new EventEmitter<void>();
  @Output() variantSelect = new EventEmitter<ProductVariant>();
  @Output() variantByAttribute = new EventEmitter<{ attributeName: string; value: string }>();
  @Output() quantityChange = new EventEmitter<number>();
  @Output() addToCart = new EventEmitter<void>();
  @Output() buyNow = new EventEmitter<void>();
  @Output() toggleWishlist = new EventEmitter<void>();
  @Output() contactStore = new EventEmitter<void>();
  @Output() viewPromotionStats = new EventEmitter<any>();
  
  currentPrice = computed(() => {
    if (this.selectedVariant?.price) return this.selectedVariant.price;
    return this.product?.price || 0;
  });
  
  originalPrice = computed(() => {
    if (this.selectedVariant?.originalPrice) return this.selectedVariant.originalPrice;
    return this.product?.originalPrice || null;
  });
  
  discountPercentage = computed(() => {
    const current = this.currentPrice();
    const original = this.originalPrice();
    if (!original || original <= current) return 0;
    return Math.round(((original - current) / original) * 100);
  });
  
  hasDiscount = computed(() => this.discountPercentage() > 0);
  
  currentStock = computed(() => {
    if (this.selectedVariant?.quantity !== undefined) return this.selectedVariant.quantity;
    if (this.product?.manageStock) return this.product.quantity;
    return 999;
  });
  
  stockStatus = computed(() => {
    const stock = this.currentStock();
    if (!this.product?.manageStock) return 'in-stock';
    if (stock === 0) return 'out-of-stock';
    if (stock <= (this.product?.lowStockAlert || 5)) return 'low-stock';
    return 'in-stock';
  });
  
  stockText = computed(() => {
    const status = this.stockStatus();
    const stock = this.currentStock();
    switch (status) {
      case 'out-of-stock': return 'Out of Stock';
      case 'low-stock': return `Only ${stock} left in stock`;
      default: return 'In Stock';
    }
  });
  
  averageRating = computed(() => this.product?.averageRating || 0);
  ratingCount = computed(() => this.product?.ratingCount || 0);
  
  incrementQuantity(): void {
    if (this.quantity < this.maxQuantity) {
      this.quantityChange.emit(this.quantity + 1);
    }
  }
  
  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantityChange.emit(this.quantity - 1);
    }
  }
  
  setQuantity(value: number): void {
    if (value >= 1 && value <= this.maxQuantity) {
      this.quantityChange.emit(value);
    }
  }
  
  selectVariant(variant: ProductVariant): void {
    this.variantSelect.emit(variant);
  }
  
  selectVariantByAttribute(attributeName: string, value: string): void {
    this.variantByAttribute.emit({ attributeName, value });
  }
  
  getAttributeValue(attributeName: string): string {
    if (this.selectedVariant?.options) {
      const option = this.selectedVariant.options.find(opt => opt.name === attributeName);
      return option?.value || '';
    }
    return '';
  }
  
  getAttributeOptions(attributeName: string): string[] {
    const attribute = this.attributes.find(attr => attr.name === attributeName);
    return attribute?.values || [];
  }
  
  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = 'img/avatar.png';
  }
  
  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}