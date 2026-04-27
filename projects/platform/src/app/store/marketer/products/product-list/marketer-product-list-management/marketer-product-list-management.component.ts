import { Component, input, output, signal, computed, inject, OnInit, ViewChild, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { finalize, take } from 'rxjs';

import { Store } from '../../../../models/store.model';
import { Product } from '../../../../models';
import { DialogService } from '../../../../shared/services/dialog.service';
import { TruncatePipe } from '../../../../shared';
import { SelectionModel } from '@angular/cdk/collections';
import { CurrencyUtilsPipe, UserInterface } from '../../../../../../../../shared-services/src/public-api';
import { UserService } from '../../../../../common/services/user.service';
import { ProductService } from '../../product.service';

interface ProductColumn {
  key: keyof Product | 'actions' | 'select';
  label: string;
  sortable?: boolean;
  hiddenOnMobile?: boolean;
}

interface StockStatus {
  text: string;
  color: string;
  icon: string;
}

@Component({
  selector: 'app-marketer-product-list-management',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatMenuModule,
    MatChipsModule,
    MatBadgeModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatCheckboxModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    TruncatePipe,
    MatDividerModule,
    MatDialogModule,
    CurrencyUtilsPipe
  ],
  providers: [ProductService, DialogService],
  templateUrl: './marketer-product-list-management.component.html',
  styleUrls: ['./marketer-product-list-management.component.scss']
})
export class MarketerProductListManagementComponent {
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialogService = inject(DialogService);
  private productService = inject(ProductService);

  private userService: UserService = inject(UserService);
  public user: Signal<UserInterface | null> = this.userService.user;

  // Inputs
  store = input.required<Store>();
  products = input.required<Product[]>();

  // Selection management
  selection = new SelectionModel<Product>(true, []);
  selectedProducts: Product[] = [];

  // Signals
  searchQuery = signal<string>('');
  selectedCategory = signal<string>('all');
  sortBy = signal<string>('createdAt');
  sortDirection = signal<'asc' | 'desc'>('desc');
  pageSize = signal<number>(10);
  currentPage = signal<number>(0);
  loading = signal<boolean>(false);
  viewMode = signal<'grid' | 'list'>('grid');

  // Computed properties
  categories = computed(() => {
    const categories = new Set(this.products().map(p => p.category).filter(Boolean));
    return Array.from(categories).sort();
  });

  filteredProducts = computed(() => {
    let filtered = this.products();
    const query = this.searchQuery().toLowerCase();
    const category = this.selectedCategory();

    // Filter by search query
    if (query) {
      filtered = filtered.filter(product => {
        const nameMatch = product.name?.toLowerCase().includes(query) || false;
        const descMatch = product.description?.toLowerCase().includes(query) || false;
        const tagsMatch = product.tags?.some(tag => tag.toLowerCase().includes(query)) || false;
        const skuMatch = product.sku?.toLowerCase().includes(query) || false;
        return nameMatch || descMatch || tagsMatch || skuMatch;
      });
    }

    // Filter by category
    if (category !== 'all') {
      filtered = filtered.filter(product => product.category === category);
    }

    // Sort products
    filtered = this.sortProducts(filtered);

    return filtered;
  });

  paginatedProducts = computed(() => {
    const startIndex = this.currentPage() * this.pageSize();
    return this.filteredProducts().slice(startIndex, startIndex + this.pageSize());
  });

  lowStockProducts = computed(() => 
    this.products().filter(p => p.quantity <= (p.lowStockAlert || 10) && p.quantity > 0 && p.isActive)
  );

  outOfStockProducts = computed(() => 
    this.products().filter(p => p.quantity === 0 && p.isActive)
  );

  // Table columns for list view
  columns: ProductColumn[] = [
    { key: 'select', label: '', sortable: false },
    //{ key: 'product', label: 'Product', sortable: true },
    { key: 'category', label: 'Category', sortable: true, hiddenOnMobile: true },
    { key: 'price', label: 'Price', sortable: true, hiddenOnMobile: true },
    //{ key: 'stock', label: 'Stock', sortable: true },
    //{ key: 'status', label: 'Status', sortable: true, hiddenOnMobile: true },
    { key: 'actions', label: 'Actions', sortable: false }
  ];

  displayedColumns = computed(() => 
    this.columns.map(col => col.key)
  );

  // Outputs
  productUpdated = output<void>();

  // Sorting
  sortProducts(products: Product[]): Product[] {
    const sortBy = this.sortBy();
    const direction = this.sortDirection();

    return [...products].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name?.toLowerCase();
          bValue = b.name?.toLowerCase();
          break;
        case 'price':
        case 'price_desc':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case 'sales':
          aValue = a.purchaseCount || 0;
          bValue = b.purchaseCount || 0;
          break;
        case 'createdAt':
          aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          break;
        default:
          aValue = a.name?.toLowerCase();
          bValue = b.name?.toLowerCase();
      }

      // Handle price_desc sorting
      if (sortBy === 'price_desc') {
        const temp = aValue;
        aValue = bValue;
        bValue = temp;
      }

      const dirMultiplier = direction === 'asc' ? 1 : -1;

      // Handle undefined/null values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1 * dirMultiplier;
      if (bValue == null) return -1 * dirMultiplier;

      // Numeric comparison
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return (aValue - bValue) * dirMultiplier;
      }

      // String comparison
      return String(aValue).localeCompare(String(bValue)) * dirMultiplier;
    });
  }

  onSort(sortKey: string): void {
    // Handle price_desc special case
    if (sortKey === 'price_desc') {
      this.sortBy.set('price_desc');
      this.sortDirection.set('desc');
    } else if (this.sortBy() === sortKey) {
      this.sortDirection.update(dir => dir === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(sortKey);
      this.sortDirection.set('asc');
    }
  }

  // Selection methods
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.paginatedProducts().length;
    return numSelected === numRows && numRows > 0;
  }

  isSomeSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.paginatedProducts().length;
    return numSelected > 0 && numSelected < numRows;
  }

  toggleSelectAll(event: any): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.paginatedProducts().forEach(row => this.selection.select(row));
    }
    this.updateSelectedProducts();
  }

  isProductSelected(product: Product): boolean {
    return this.selection.isSelected(product);
  }

  toggleProductSelection(product: Product): void {
    this.selection.toggle(product);
    this.updateSelectedProducts();
  }

  clearSelection(): void {
    this.selection.clear();
    this.selectedProducts = [];
  }

  private updateSelectedProducts(): void {
    this.selectedProducts = this.selection.selected;
  }

  // Pagination
  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    // Clear selection on page change
    this.clearSelection();
  }

  // Search and filtering
  onSearch(event: any): void {
    const query = event.target.value;
    this.searchQuery.set(query);
    this.currentPage.set(0);
    this.clearSelection();
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.currentPage.set(0);
  }

  onCategoryChange(category: string): void {
    this.selectedCategory.set(category);
    this.currentPage.set(0);
    this.clearSelection();
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedCategory.set('all');
    this.sortBy.set('createdAt');
    this.sortDirection.set('desc');
    this.currentPage.set(0);
    this.clearSelection();
  }

  // View mode control
  setGridView(): void {
    this.viewMode.set('grid');
  }

  setListView(): void {
    this.viewMode.set('list');
  }

  // Product actions
  addProduct(): void {
    this.router.navigate(['/dashboard/stores', this.store()._id, 'products', 'create']);
  }

  editProduct(product: Product): void {
    this.router.navigate(['/dashboard/stores', this.store()._id, 'products', 'edit', product._id]);
  }

  viewProduct(product: Product): void {
    this.router.navigate(['/dashboard/stores', this.store()._id, 'products', product._id]);
  }

/*   async toggleProductStatus(product: Product): Promise<void> {
    const action = product.isActive ? 'deactivate' : 'activate';
    const result = await this.dialogService.confirmAction(
      `${action === 'deactivate' ? 'Deactivate' : 'Activate'} Product`,
      `Are you sure you want to ${action} "${product.name}"?

      Note that this product will also no more be published for promotion.
      `,
      action === 'deactivate' ? 'Deactivate' : 'Activate'
    ).pipe(take(1)).toPromise();

    if (result) {
      try {
        this.loading.set(true);
        // Call your API to update product status
        // this.storeService.updateProductStatus(
        //   this.store()._id!,
        //   product._id!,
        //   !product.isActive
        // ).subscribe({
        //   next: () => {
        //     this.productUpdated.emit();
        //     this.snackBar.open(
        //       `Product ${!product.isActive ? 'activated' : 'deactivated'} successfully`,
        //       'OK',
        //       { duration: 3000, panelClass: ['success-snackbar'] }
        //     );
        //   },
        //   error: (error) => {
        //     console.error('Failed to update product:', error);
        //     this.snackBar.open('Failed to update product', 'OK', { 
        //       duration: 5000, 
        //       panelClass: ['error-snackbar'] 
        //     });
        //   }
        // });
      } finally {
        this.loading.set(false);
      }
    }
  } */

  async deleteProduct(product: Product): Promise<void> {
    const result = await this.dialogService.confirmDelete(product.name, 'product')
      .pipe(take(1))
      .toPromise();
    
    if (result) {
      await this.performDelete(product);
    }
  }

  private async performDelete(product: Product): Promise<void> {
    try {
      this.loading.set(true);
      // Call your API to delete product
      this.productService.deleteProduct(this.store()._id!, this.user()?._id ?? '', product._id!).subscribe({
        next: () => {
          this.productUpdated.emit();
          this.snackBar.open('Product deleted successfully', 'OK', { 
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.clearSelection();
        },
        error: (error) => {
          console.error('Failed to delete product:', error);
          this.snackBar.open('Failed to delete product', 'OK', { 
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    } finally {
      this.loading.set(false);
    }
  }

  duplicateProduct(product: Product): void {
    // Implement duplication logic
    this.snackBar.open('Duplicating product...', 'OK', { duration: 2000 });
    // Call your API to duplicate product
  }

  // publish selected products for promotion actions
 /*  publishedSelectedForPromotion(): void {
    if (this.selectedProducts.length === 0) {
      this.snackBar.open('Please select products to publish', 'OK', { duration: 3000 });
      return;
    }
    console.log('selected products ',this.selectedProducts)
    
    // Implement export selected logic
    this.snackBar.open(`Exporting ${this.selectedProducts.length} products...`, 'OK', { duration: 2000 });
  } */

  bulkUpdateStatus(): void {
    if (this.selectedProducts.length === 0) {
      this.snackBar.open('Please select products to update', 'OK', { duration: 3000 });
      return;
    }
    
    // Implement bulk status update
    this.snackBar.open(`Updating ${this.selectedProducts.length} products...`, 'OK', { duration: 2000 });
  }

  importProducts(): void {
    // Implement import logic
    this.snackBar.open('Import feature coming soon', 'OK', { duration: 3000 });
  }

  // Quick actions
  manageInventory(): void {
    this.router.navigate(['/dashboard/stores', this.store()._id, 'inventory']);
  }

  exportProducts(): void {
    this.snackBar.open('Exporting all products...', 'OK', { duration: 2000 });
    // Implement export all logic
  }

  // Utility methods
  getStockStatus(product: Product): StockStatus {
    if (product.quantity === 0) {
      return { text: 'Out of Stock', color: 'warn', icon: 'cancel' };
    } else if (product.quantity <= (product.lowStockAlert || 10)) {
      return { text: 'Low Stock', color: 'accent', icon: 'warning' };
    } else {
      return { text: 'In Stock', color: 'primary', icon: 'check_circle' };
    }
  }

  getPerformanceColor(views: number): string {
    if (views > 1000) return '#4caf50';
    if (views > 500) return '#ff9800';
    if (views > 100) return '#2196f3';
    return '#9e9e9e';
  }

  trackByProductId(index: number, product: Product): string {
    return product._id!;
  }

  trackByColumnKey(index: number, column: ProductColumn): string {
    return column.key;
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/product-placeholder.jpg';
    img.onerror = null; // Prevent infinite loop
  }

  getPublicationStatus(product: Product): { text: string; color: string; icon: string } {
    if (product.isPublished) {
      const now = new Date();
      const endDate = product.promotionEndDate ? new Date(product.promotionEndDate) : null;
      
      if (endDate && endDate < now) {
        return { text: 'Expired', color: 'warn', icon: 'timer_off' };
      }
      return { text: 'Published', color: 'primary', icon: 'publish' };
    }
    return { text: 'Not Published', color: '', icon: 'unpublished' };
  }

  // Implement the method
  publishedSelectedForPromotion(): void {
    if (this.selectedProducts.length === 0) {
      this.snackBar.open('Please select products to publish', 'OK', { duration: 3000 });
      return;
    }

    // First, filter out already published products
    const unpublishedProducts = this.selectedProducts.filter(p => !p.isPublished);
    
    if (unpublishedProducts.length === 0) {
      this.snackBar.open('All selected products are already published', 'OK', { duration: 3000 });
      return;
    }

    // Show confirmation dialog
    this.dialogService.confirmAction(
      'Publish Products for Promotion',
      
      `<p>
      Are you sure you want to publish ${unpublishedProducts.length} product(s) for promotion?
      </p>
      
      <p>
        Published products will be:
          Visible to promoters, 
          Eligible for commission tracking,
          Included in product promotion list
      </p>

      <p>
      Products that are inactive or out of stock will be skipped.
      </p>
      `,
      'Publish'
    ).pipe(take(1)).subscribe(result => {
      if (result) {
        this.loading.set(true);
        
        const productIds = unpublishedProducts.map(p => p._id!);
        
        this.productService.publishProductsForPromotion(
          this.store()._id!,
          this.user()?._id ?? '',
          productIds
        ).pipe(
          finalize(() => this.loading.set(false))
        ).subscribe({
          next: (response) => {
            if (response.success) {
              console.log('response ',response)
              const { published, skipped, failed } = response.data;
              
              let message = `Successfully published ${published} product(s)`;
              if (skipped > 0) message += `, ${skipped} skipped`;
              if (failed.length > 0) message += `, ${failed.length} failed`;
              
              this.snackBar.open(message, 'OK', { 
                duration: 5000,
                panelClass: published > 0 ? ['success-snackbar'] : ['info-snackbar']
              });
              
              // Show detailed results if there were skips or failures
              if (skipped > 0 || failed.length > 0) {
                this.showPublicationDetails(response.data.details);
              }
              
              // Refresh the product list
              this.productUpdated.emit();
              this.clearSelection();
            }
          },
          error: (error) => {
            console.error('Failed to publish products:', error);
            this.snackBar.open(
              error.error?.message || 'Failed to publish products', 
              'OK', 
              { duration: 5000, panelClass: ['error-snackbar'] }
            );
          }
        });
      }
    });
  }


  // Add this helper method to show publication details
  private showPublicationDetails(details: any[]): void {
    const skipped = details.filter(d => d.status === 'skipped');
    const failed = details.filter(d => d.status === 'failed');
    
    if (skipped.length === 0 && failed.length === 0) return;
    
    let message = '';
    if (skipped.length > 0) {
      message += `\nSkipped products:\n`;
      skipped.slice(0, 5).forEach(s => {
        message += `• ${s.name}: ${s.reason}\n`;
      });
    }
    
    if (failed.length > 0) {
      message += `\nFailed products:\n`;
      failed.slice(0, 5).forEach(f => {
        message += `• ${f.name}: ${f.error}\n`;
      });
    }
    
    if (skipped.length > 5 || failed.length > 5) {
      message += `\n... and more. Check logs for details.`;
    }
    
    // You might want to show this in a dialog instead of console
    console.warn('Publication details:', { skipped, failed });
  }

  async unpublishSelectedProducts(): Promise<void> {
  if (this.selectedProducts.length === 0) {
    this.snackBar.open('Please select products to unpublish', 'OK', { duration: 3000 });
    return;
  }

  // Filter to only published products
  const publishedProducts = this.selectedProducts.filter(p => p.isPublished);
  
  if (publishedProducts.length === 0) {
    this.snackBar.open('Selected products are not published', 'OK', { duration: 3000 });
    return;
  }

  const result = await this.dialogService.confirmAction(
    'Unpublish Products',
    `Are you sure you want to unpublish ${publishedProducts.length} product(s) from promotion?`,
    'Unpublish'
  ).pipe(take(1)).toPromise();

  if (result) {
    this.loading.set(true);
    
    const productIds = publishedProducts.map(p => p._id!);
    
    this.productService.unpublishProducts(
      this.store()._id!,
      productIds
    ).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (response) => {
        console.log('Unpublish response:', response);
        
        if (response.success) {
          // Refresh the product list
          this.productUpdated.emit();
          
          this.snackBar.open(
            response.message || `Successfully unpublished products`,
            'OK',
            { duration: 5000, panelClass: ['success-snackbar'] }
          );
          
          this.clearSelection();
        }
      },
      error: (error) => {
        console.error('Failed to unpublish products:', error);
        this.snackBar.open(
          error.error?.message || 'Failed to unpublish products',
          'OK',
          { duration: 5000, panelClass: ['error-snackbar'] }
        );
      }
    });
  }
}

  // For single product unpublish
  async unpublishProduct(product: Product): Promise<void> {
    if (!product.isPublished) {
      this.snackBar.open('This product is not published', 'OK', { duration: 3000 });
      return;
    }

    const result = await this.dialogService.confirmAction(
      'Unpublish Product',
      `Are you sure you want to unpublish "${product.name}" from promotion?`,
      'Unpublish'
    ).pipe(take(1)).toPromise();

    if (result) {
      this.loading.set(true);
      
      this.productService.unpublishSingleProduct(
        this.store()._id!,
        product._id!
      ).pipe(
        finalize(() => this.loading.set(false))
      ).subscribe({
        next: (response) => {
          if (response.success) {
            this.productUpdated.emit();
            this.snackBar.open('Product unpublished successfully', 'OK', { 
              duration: 3000,
              panelClass: ['success-snackbar']
            });
          }
        },
        error: (error) => {
          console.error('Failed to unpublish product:', error);
          this.snackBar.open(
            error.error?.message || 'Failed to unpublish product',
            'OK',
            { duration: 5000, panelClass: ['error-snackbar'] }
          );
        }
      });
    }
  }

  isUnpublishDisabled(): boolean {
    if (this.selectedProducts.length === 0) return true;
    return this.selectedProducts.every(p => !p.isPublished);
  }

  isPublishDisabled(): boolean {
    if (this.selectedProducts.length === 0) return true;
    return this.selectedProducts.every(p => p.isPublished);
  }
}