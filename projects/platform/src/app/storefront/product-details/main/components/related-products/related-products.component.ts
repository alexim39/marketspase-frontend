import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RatingComponent } from '../../../../shared/rating/rating.component';
import { LazyImageDirective } from '../../../../shared/directives/lazy-image.directive';
import { TruncatePipe } from '../../../../../store/shared';
import { CurrencyUtilsPipe } from '../../../../../../../../shared-services/src/public-api';

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
  private snackBar = inject(MatSnackBar);
  
  @Input() products: RelatedProduct[] = [];
  @Input() storeLink: string = '';
  @Input() userCurrency: string = 'USD';
  @Input() showAddToCart: boolean = false;
  
  @Output() productClick = new EventEmitter<RelatedProduct>();
  @Output() addToCart = new EventEmitter<RelatedProduct>();
  
  trackByProductId(index: number, product: RelatedProduct): string {
    return product._id || index.toString();
  }
  
  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = 'img/product.png';
  }
  
  onAddToCart(product: RelatedProduct): void {
    this.addToCart.emit(product);
    this.snackBar.open(`${product.name} added to cart`, 'View Cart', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
      panelClass: ['success-snackbar']
    });
  }
  
  getDiscountPercentage(product: RelatedProduct): number {
    if (!product.originalPrice || product.originalPrice <= product.price) {
      return 0;
    }
    return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  }
}