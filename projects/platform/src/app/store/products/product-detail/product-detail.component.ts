// product-detail.component.ts
import { Component, signal, inject, OnInit, TemplateRef } from '@angular/core';
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

import { Store } from '../../models/store.model';
import { StoreService } from '../../services/store.service';
import { Product } from '../../models';
import { DialogService } from '../../shared/services/dialog.service';
import { TruncatePipe } from '../../shared';
import { SelectionModel } from '@angular/cdk/collections';

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
  selector: 'app-product-detail',
  standalone: true,
  providers: [StoreService],
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
  ],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private storeService = inject(StoreService);
  private dialogService = inject(DialogService);

  // Product data
  product: Product | null = null;
  storeId: string = '';
  productId: string = '';
  
  // Image management
  selectedImage: any = null;
  
  // Signals
  loading = signal<boolean>(true);
  error = signal<boolean>(false);

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
      this.router.navigate(['/dashboard/stores', this.storeId, 'products', this.productId, 'edit']);
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
        // this.storeService.deleteProduct(this.storeId, this.productId).subscribe({
        //   next: () => {
        //     this.snackBar.open('Product deleted successfully', 'OK', { 
        //       duration: 3000,
        //       panelClass: ['success-snackbar']
        //     });
        //     this.goBack();
        //   },
        //   error: (error) => {
        //     console.error('Failed to delete product:', error);
        //     this.snackBar.open('Failed to delete product', 'OK', { 
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

  duplicateProduct(): void {
    this.snackBar.open('Duplicating product...', 'OK', { duration: 2000 });
    // Implement duplication logic
  }

  exportProductData(): void {
    this.snackBar.open('Exporting product data...', 'OK', { duration: 2000 });
    // Implement export logic
  }

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
}