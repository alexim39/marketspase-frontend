import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RatingComponent } from '../../../../shared/rating/rating.component';
import { LazyImageDirective } from '../../../../shared/directives/lazy-image.directive';
import { CurrencyUtilsPipe, UserInterface, TruncatePipe } from '@shared/services';
import { Product } from '../../../../../store/models';

export interface RelatedProduct {
  _id?: string;
  name: string;
  price: number;
  originalPrice?: number;
  category?: string;
  images?: { url: string }[];
  averageRating?: number;
  ratingCount?: number;
  isFeatured?: boolean;
  stockStatus?: 'in-stock' | 'low-stock' | 'out-of-stock';
  uniqueCode?: string;
  uniqueId?: string;

}

@Component({
  selector: 'app-related-products',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    RatingComponent,
    LazyImageDirective,
    TruncatePipe,
    CurrencyUtilsPipe
  ],
  templateUrl: './related-products.component.html',
  styleUrls: ['./related-products.component.scss']
})
export class RelatedProductsComponent {
  @Input() products: RelatedProduct[] = [];
  @Input() storeLink: string = '';
  @Input() userCurrency: string = 'USD';
  @Input() showAddToCart: boolean = false;
  @Input() maxProducts: number = 6; // New input to limit products
  
  //@Output() productClick = new EventEmitter<RelatedProduct>();
  @Output() addToCart = new EventEmitter<RelatedProduct>();
  @Output() viewAll = new EventEmitter<void>(); // Optional: emit when view all is clicked

  @Input({ required: true }) user!: UserInterface | null;

  private router = inject(Router);
  
  displayedProducts(): RelatedProduct[] {
    return this.products.slice(0, this.maxProducts);
  }
  
  hasMoreProducts(): boolean {
    return this.products.length > this.maxProducts;
  }
  
  trackByProductId(index: number, product: RelatedProduct): string {
    return product._id || index.toString();
  }
  
  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = 'img/product.png';
  }
  
  onAddToCart(product: RelatedProduct, event?: Event): void {
    event?.stopPropagation();
    this.addToCart.emit(product);
  }
  
  getDiscountPercentage(product: RelatedProduct): number {
    if (!product.originalPrice || product.originalPrice <= product.price) {
      return 0;
    }
    return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  }
  
  onViewAll(): void {
    this.viewAll.emit();
  }

  productClick(product: RelatedProduct) {
    this.router.navigate(['/product', product._id]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
