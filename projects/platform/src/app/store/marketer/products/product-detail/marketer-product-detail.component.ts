// product-detail.component.ts
import { Component, signal, inject, OnInit, TemplateRef, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { take } from 'rxjs';

import { StoreService } from '../../../services/store.service';
import { Product } from '../../../models';
import { DialogService } from '../../../shared/services/dialog.service';
import { TruncatePipe } from '../../../shared';
import { CurrencyUtilsPipe, UserInterface } from '../../../../../../../shared-services/src/public-api';
import { UserService } from '../../../../common/services/user.service';
import { ProductService } from '../product.service';
import { ProductImageViewerComponent } from './product-image-viewer/product-image-viewer.component';

interface StockStatus {
  text: string;
  color: string;
  icon: string;
}

interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  date: Date;
}

@Component({
  selector: 'app-marketer-product-detail',
  standalone: true,
  providers: [StoreService, ProductService, DialogService],
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatMenuModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatDialogModule,
    TruncatePipe,
    CurrencyUtilsPipe,
    
  ],
  templateUrl: './marketer-product-detail.component.html',
  styleUrls: ['./marketer-product-detail.component.scss']
})
export class MarketerProductDetailComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private storeService = inject(StoreService);
  private productService = inject(ProductService);
  private dialogService = inject(DialogService);

  private userService: UserService = inject(UserService);
  public user: Signal<UserInterface | null> = this.userService.user;

  // Product data
  product: Product | null = null;
  storeId: string = '';
  productId: string = '';
  
  // Image management
  selectedImage: any = null;
  
  // Signals
  loading = signal<boolean>(true);
  error = signal<boolean>(false);

  // Time range selection
  selectedRange: string = '30d';

  setTimeRange(range: string): void {
    this.selectedRange = range;
    // Here you would fetch new analytics data based on the selected range
    this.loadAnalyticsData(range);
  }

  // Format numbers with K/M suffixes
  formatNumber(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  }

  // Format revenue with currency
  formatRevenue(value: number, currency: string = 'NGN'): string {
    if (value >= 1000000) {
      return currency + ' ' + (value / 1000000).toFixed(1) + 'M';
    }
    if (value >= 1000) {
      return currency + ' ' + (value / 1000).toFixed(1) + 'K';
    }
    return currency + ' ' + value.toLocaleString();
  }

  // Load analytics data (implement based on your API)
  loadAnalyticsData(range: string): void {
    // TODO: Implement API call to fetch analytics data for the selected range
    console.log('Loading analytics for range:', range);
  }

  ngOnInit(): void {
    this.loadProduct();
  }

  loadProduct(): void {
    this.loading.set(true);
    this.error.set(false);
    
    // Get route parameters
    this.route.params.subscribe(params => {
      this.storeId = params['storeId'];
      this.productId = params['productId'];

      //console.log(`Loading product ${this.productId} for store ${this.storeId}`);
      
      // Fetch product data
      this.storeService.getProduct(this.storeId, this.productId)
        .pipe(take(1))
        .subscribe({
          next: (response) => {
            //console.log('Product loaded:', response.data);
            this.product = response.data;
            this.loading.set(false);
          },
          error: (error) => {
            console.error('Failed to load product:', error);
            this.error.set(true);
            this.loading.set(false);
          }
        });
    });
  }

  // Navigation
  goBack(): void {
    this.router.navigate(['/dashboard/stores', this.storeId, 'products']);
  }

  // Product actions
  editProduct(): void {
    if (this.product) {
      this.router.navigate(['/dashboard/stores', this.storeId, 'products', 'edit', this.product._id]);
    }
  }



  async deleteProduct(): Promise<void> {
    if (!this.product) return;
    
    const result = await this.dialogService.confirmDelete(this.product.name, 'product')
      .pipe(take(1))
      .toPromise();
    
    if (result) {
      try {
        this.loading.set(true);
        // Call your API to delete product
        this.productService.deleteProduct(this.storeId, this.user()?._id ?? '', this.productId).subscribe({
          next: () => {
            this.snackBar.open('Product deleted successfully', 'OK', { 
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.goBack();
          },
          error: (error) => {
            console.error('Failed to delete product:', error);
            this.snackBar.open('Failed to delete product', 'OK', { 
              duration: 5000,
              panelClass: ['error-snackbar']
            });
            this.loading.set(false);
          }
        });
      } catch (error) {
        this.loading.set(false);
      }
    }
  }

  async toggleProductStatus(): Promise<void> {
    if (!this.product) return;
    
    const action = this.product.isActive ? 'deactivate' : 'activate';
    const result = await this.dialogService.confirmAction(
      `${action === 'deactivate' ? 'Deactivate' : 'Activate'} Product`,
      `Are you sure you want to ${action} "${this.product.name}"?`,
      action === 'deactivate' ? 'Deactivate' : 'Activate'
    ).pipe(take(1)).toPromise();

    if (result) {
      try {
        this.loading.set(true);
        // Call your API to update product status
        // this.storeService.updateProductStatus(
        //   this.storeId,
        //   this.productId,
        //   !this.product.isActive
        // ).subscribe({
        //   next: () => {
        //     if (this.product) {
        //       this.product.isActive = !this.product.isActive;
        //     }
        //     this.snackBar.open(
        //       `Product ${!this.product?.isActive ? 'activated' : 'deactivated'} successfully`,
        //       'OK',
        //       { duration: 3000, panelClass: ['success-snackbar'] }
        //     );
        //     this.loading.set(false);
        //   },
        //   error: (error) => {
        //     console.error('Failed to update product:', error);
        //     this.snackBar.open('Failed to update product', 'OK', { 
        //       duration: 5000, 
        //       panelClass: ['error-snackbar'] 
        //     });
        //     this.loading.set(false);
        //   }
        // });
      } catch (error) {
        this.loading.set(false);
      }
    }
  }

  // duplicateProduct(): void {
  //   this.snackBar.open('Duplicating product...', 'OK', { duration: 2000 });
  //   // Implement duplication logic
  // }

  // exportProductData(): void {
  //   this.snackBar.open('Exporting product data...', 'OK', { duration: 2000 });
  //   // Implement export logic
  // }

  viewAllReviews(): void {
    this.snackBar.open('Opening all reviews...', 'OK', { duration: 2000 });
    // Implement view all reviews logic
  }

  // Image management
  selectImage(image: any): void {
    this.selectedImage = image;
  }

  openImageModal(image: any, templateRef: TemplateRef<any>): void {
    this.selectedImage = image;
    this.dialog.open(templateRef, {
      panelClass: 'image-modal-panel'
    });
  }

  closeImageModal(): void {
    this.dialog.closeAll();
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/product-placeholder.jpg';
    img.onerror = null;
  }

  handleThumbnailError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/thumbnail-placeholder.jpg';
    img.onerror = null;
  }

  // Utility methods
  getStockStatus(): StockStatus {
    if (!this.product) {
      return { text: 'Unknown', color: 'warn', icon: 'help' };
    }
    
    if (this.product.quantity === 0) {
      return { text: 'Out of Stock', color: 'warn', icon: 'cancel' };
    } else if (this.product.quantity <= (this.product.lowStockAlert || 10)) {
      return { text: 'Low Stock', color: 'accent', icon: 'warning' };
    } else {
      return { text: 'In Stock', color: 'primary', icon: 'check_circle' };
    }
  }

  trackByReviewId(index: number, review: Review): string {
    return review.id;
  }

  trackBySpecKey(index: number, spec: any): string {
    return spec.key;
  }

  openImageViewer(initialIndex: number = 0): void {
    if (!this.product || !this.product.images || this.product.images.length === 0) return;

    const images = this.product.images.map(img => ({
      url: img.url,
      thumbnail: img.thumbnail || img.url,
      alt: this.product?.name
    }));

    this.dialog.open(ProductImageViewerComponent, {
      data: {
        images,
        initialIndex,
        productName: this.product.name
      },
      panelClass: 'product-image-viewer-dialog',
      maxWidth: '100vw',
      maxHeight: '100vh',
      width: '100%',
      height: '100%',
      backdropClass: 'image-viewer-backdrop',
      disableClose: true
    });
  }
}