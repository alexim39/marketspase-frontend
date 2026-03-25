import { Component, Input, Output, EventEmitter, inject, computed, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RatingComponent } from '../../../../shared/rating/rating.component';
import { LazyImageDirective } from '../../../../shared/directives/lazy-image.directive';
import { TruncatePipe } from '../../../../../store/shared';
import { CurrencyUtilsPipe, UserInterface } from '../../../../../../../../shared-services/src/public-api';
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
  private snackBar = inject(MatSnackBar);
  
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
  
  // Computed property to limit displayed products
  displayedProducts = computed(() => {
    return this.products.slice(0, this.maxProducts);
  });
  
  // Check if there are more products than displayed
  hasMoreProducts = computed(() => {
    return this.products.length > this.maxProducts;
  });
  
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
  
  onViewAll(): void {
    this.viewAll.emit();
  }

  productClick(product: RelatedProduct) {
    console.log('product ',product)
    this.router.navigate(['/promote', product._id], {
      // 3. Add the query parameters here
     queryParams: { ref: product._id },
      //state: { fromStore: this.store()?.storeLink }
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}