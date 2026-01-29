// components/product-quick-view/product-quick-view.component.ts
import { Component, Inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { RatingComponent } from '../../shared/rating/rating.component';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';
import { Product, Store } from '../../../store/models';
import { ShareService } from '../../../store/services/share.service';

export interface QuickViewData {
  product: Product;
  store: Store | null;
  onAddToCart: () => void;
  onToggleWishlist: () => void;
  isInWishlist: boolean;
}

@Component({
  selector: 'app-product-quick-view',
  standalone: true,
  providers: [CartService,WishlistService,ShareService],
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    CurrencyPipe,
    RatingComponent
  ],
  templateUrl: './product-quick-view.component.html',
  styleUrls: ['./product-quick-view.component.scss']
})
export class ProductQuickViewComponent implements OnInit {
  // Signals
  selectedImageIndex = signal<number>(0);
  quantity = signal<number>(1);
  selectedVariant = signal<any>(null);
  loading = signal<boolean>(false);
  
  // Computed values
  product = computed(() => this.data.product);
  store = computed(() => this.data.store);
  isInWishlist = computed(() => this.data.isInWishlist);
  
  // Computed properties
  images = computed(() => {
    const product = this.product();
    return product?.images || [];
  });
  
  selectedImage = computed(() => {
    const images = this.images();
    const index = this.selectedImageIndex();
    return images[index] || images[0] || null;
  });
  
  hasVariants = computed(() => {
    return this.product()?.hasVariants && this.product();
  });
  
  variants = computed(() => {
    return this.product()?.variants || [];
  });
  
  attributes = computed(() => {
    return this.product()?.attributes || [];
  });
  
  discountPercentage = computed(() => {
    const product = this.product();
    if (!product?.originalPrice || product.originalPrice <= product.price) return 0;
    return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  });
  
  stockStatus = computed(() => {
    const product = this.product();
    if (!product?.manageStock) return 'in-stock';
    if (product.quantity === 0) return 'out-of-stock';
    if (product.quantity <= (product.lowStockAlert || 5)) return 'low-stock';
    return 'in-stock';
  });
  
  stockText = computed(() => {
    const status = this.stockStatus();
    const product = this.product();
    
    switch (status) {
      case 'out-of-stock': return 'Out of Stock';
      case 'low-stock': return `Only ${product?.quantity} left`;
      default: return 'In Stock';
    }
  });
  
  canAddToCart = computed(() => {
    const product = this.product();
    if (!product?.manageStock) return true;
    return product.quantity > 0;
  });
  
  maxQuantity = computed(() => {
    const product = this.product();
    //if (!product?.manageStock || product.soldIndividually) return 1;
    return Math.min(product.quantity, 10); // Limit to 10 for UX
  });

  constructor(
    private dialogRef: MatDialogRef<ProductQuickViewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: QuickViewData,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private shareService: ShareService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    // If product has variants, select the first one by default
    if (this.hasVariants() && this.variants().length > 0) {
      this.selectedVariant.set(this.variants()[0]);
    }
  }

  // Image navigation
  selectImage(index: number): void {
    this.selectedImageIndex.set(index);
  }

  nextImage(): void {
    const images = this.images();
    if (images.length <= 1) return;
    
    const currentIndex = this.selectedImageIndex();
    const nextIndex = (currentIndex + 1) % images.length;
    this.selectedImageIndex.set(nextIndex);
  }

  prevImage(): void {
    const images = this.images();
    if (images.length <= 1) return;
    
    const currentIndex = this.selectedImageIndex();
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    this.selectedImageIndex.set(prevIndex);
  }

  // Quantity handling
  incrementQuantity(): void {
    const current = this.quantity();
    const max = this.maxQuantity();
    
    if (current < max) {
      this.quantity.set(current + 1);
    }
  }

  decrementQuantity(): void {
    const current = this.quantity();
    if (current > 1) {
      this.quantity.set(current - 1);
    }
  }

  setQuantity(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value, 10);
    
    if (!isNaN(value) && value >= 1 && value <= this.maxQuantity()) {
      this.quantity.set(value);
    } else {
      input.value = this.quantity().toString();
    }
  }

  // Variant selection
  selectVariant(variant: any): void {
    this.selectedVariant.set(variant);
  }

  getVariantPrice(): number {
    const variant = this.selectedVariant();
    return variant?.price || this.product()?.price || 0;
  }

  getVariantStock(): number {
    const variant = this.selectedVariant();
    if (variant?.quantity !== undefined) {
      return variant.quantity;
    }
    return this.product()?.quantity || 0;
  }

  // Actions
  addToCart(): void {
    if (!this.canAddToCart()) return;
    
    const product = this.product();
    const variant = this.selectedVariant();
    
    const cartItem = {
      productId: product._id ?? '',
      variantId: variant?._id,
      quantity: this.quantity(),
      price: this.getVariantPrice(),
      name: product.name,
      variantName: variant?.name,
      image: this.selectedImage()?.url || product.images?.[0]?.url,
      storeId: product.store ?? ''
    };
    
    this.cartService.addToCart(cartItem);
    this.data.onAddToCart();
    this.showNotification('Added to cart');
    
    // Optionally close the dialog
    // this.close();
  }

  toggleWishlist(): void {
    this.data.onToggleWishlist();
    this.showNotification(
      this.isInWishlist() ? 'Removed from wishlist' : 'Added to wishlist'
    );
  }

  shareProduct(): void {
    const product = this.product();
    const store = this.store();
    
    this.shareService.share({
      title: product.name,
      text: `${product.name} - ${this.getVariantPrice()} | Available at ${store?.name}`,
      url: `${window.location.origin}/product/${product._id}`
    }, 'copy');
    
    this.showNotification('Product link copied to clipboard');
  }

  viewFullDetails(): void {
    this.close();
    this.router.navigate(['/product', this.product()._id]);
  }

  contactStore(): void {
    const store = this.store();
    if (!store?.whatsappNumber) return;

    const message = `Hello ${store.name}, I'm interested in your product: ${this.product().name}`;
    const url = `https://wa.me/${store.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  // Helpers
  showNotification(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  getAttributeValue(attributeName: string): string {
    const variant = this.selectedVariant();
    if (variant?.attributes?.[attributeName]) {
      return variant.attributes[attributeName];
    }
    return '';
  }

  getAttributeOptions(attributeName: string): string[] {
    const attribute = this.attributes().find(attr => attr.name === attributeName);
    return attribute?.values || [];
  }

  close(): void {
    this.dialogRef.close();
  }

  // Prevent dialog close when clicking inside
  onDialogClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  onImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'assets/images/image-placeholder.png';
  }

  selectVariantByAttribute(attributeName: string, value: string): void {
        const matchingVariant = this.variants().find(variant => 
        variant.options.some((opt: any) => opt.name === attributeName && opt.value === value)
        );
        if (matchingVariant) {
        this.selectedVariant.set(matchingVariant);
        } else {
        this.showNotification(`No variant found for ${attributeName}: ${value}`);
        } 
    }
}