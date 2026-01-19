import { Component, input, output, signal, computed, inject, OnInit, Input, Output, EventEmitter } from '@angular/core';
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
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Store } from '../../models/store.model';
import { StoreService } from '../../services/store.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { Product } from '../../models';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DialogService } from '../../shared/services/dialog.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TruncatePipe } from '../../shared';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { take } from 'rxjs';

interface ProductColumn {
  key: keyof Product | 'actions';
  label: string;
  sortable?: boolean;
  hiddenOnMobile?: boolean;
}

@Component({
  selector: 'app-product-management',
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
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    TruncatePipe,
    MatDividerModule,
  ],
  templateUrl: './product-management.component.html',
  styleUrls: ['./product-management.component.scss']
})
export class ProductManagementComponent {
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private storeService = inject(StoreService);
  private dialogService = inject(DialogService);
  @Input() paginationData: any;
    @Output() pageChanged = new EventEmitter<number>();

  // Inputs
  store = input.required<Store>();
  products = input.required<Product[]>();

  // Signals
  searchQuery = signal<string>('');
  selectedCategory = signal<string>('all');
  sortBy = signal<keyof Product>('createdAt');
  sortDirection = signal<'asc' | 'desc'>('desc');
  pageSize = signal<number>(10);
  currentPage = signal<number>(0);
  loading = signal<boolean>(false);
  viewMode = signal<'grid' | 'list'>('grid');

  // Computed properties - FIXED VERSION
  categories = computed(() => {
    const categories = new Set(this.products().map(p => p.category).filter(Boolean));
    return Array.from(categories);
  });

  filteredProducts = computed(() => {
    let filtered = this.products();
    const query = this.searchQuery().toLowerCase();
    const category = this.selectedCategory();

    // Filter by search query - FIXED: Added null checks for tags
    if (query) {
      filtered = filtered.filter(product => {
        const nameMatch = product.name?.toLowerCase().includes(query) || false;
        const descMatch = product.description?.toLowerCase().includes(query) || false;
        const tagsMatch = product.tags?.some(tag => tag.toLowerCase().includes(query)) || false;
        return nameMatch || descMatch || tagsMatch;
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
    this.products().filter(p => p.quantity <= p.lowStockAlert && p.isActive)
  );

  outOfStockProducts = computed(() => 
    this.products().filter(p => p.quantity === 0 && p.isActive)
  );

  // Table columns for list view
  columns: ProductColumn[] = [
    { key: 'name', label: 'Product', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'price', label: 'Price', sortable: true, hiddenOnMobile: true },
    { key: 'quantity', label: 'Stock', sortable: true },
    { key: 'isActive', label: 'Status', sortable: true, hiddenOnMobile: true },
    { key: 'promoterTracking', label: 'Performance', sortable: false, hiddenOnMobile: true },
    { key: 'actions', label: 'Actions', sortable: false }
  ];

  displayedColumns = computed(() => 
    this.columns.map(col => col.key)
  );

  // Outputs
  productUpdated = output<void>();

  // Sorting - FIXED VERSION with proper type safety
  sortProducts(products: Product[]): Product[] {
    const sortBy = this.sortBy();
    const direction = this.sortDirection();

    return [...products].sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      // Handle nested properties
      if (sortBy === 'promoterTracking') {
        aValue = a.promoterTracking?.viewCount ?? 0;
        bValue = b.promoterTracking?.viewCount ?? 0;
      }

      // Handle dates
      if (sortBy === 'createdAt') {
        aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      }

      // Safe comparison
      const dirMultiplier = direction === 'asc' ? 1 : -1;
      
      // Handle undefined/null values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1 * dirMultiplier; // Nulls go to end
      if (bValue == null) return -1 * dirMultiplier;

      // Numeric comparison
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return (aValue - bValue) * dirMultiplier;
      }

      // String comparison
      return String(aValue).localeCompare(String(bValue)) * dirMultiplier;
    });
  }

  onSort(column: keyof Product): void {
    if (this.sortBy() === column) {
      this.sortDirection.update(dir => dir === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(column);
      this.sortDirection.set('asc');
    }
  }

  // Pagination
  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  // Search and filtering
  onSearch(event: any): void {
    let query = event.target.value
    this.searchQuery.set(query);
    this.currentPage.set(0);
  }

  onCategoryChange(category: string): void {
    this.selectedCategory.set(category);
    this.currentPage.set(0);
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
    //this.router.navigate(['/dashboard/stores', this.store()._id, 'products', product._id, 'edit']);
  }

  viewProduct(product: Product): void {
    this.router.navigate(['/dashboard/stores', this.store()._id, 'products', product._id]);
  }

  async toggleProductStatus(product: Product): Promise<void> {
    // const action = product.isActive ? 'deactivate' : 'activate';
    // const result = await this.dialogService.confirmAction(
    //   `${action === 'deactivate' ? 'Deactivate' : 'Activate'} Product`,
    //   `Are you sure you want to ${action} "${product.name}"?`,
    //   action === 'deactivate' ? 'Deactivate' : 'Activate'
    // ).pipe(take(1)).toPromise();

    // if (result) {
    //   try {
    //     this.loading.set(true);
    //     this.storeService.updateProduct(
    //       this.store()._id!,
    //       product._id!,
    //       { isActive: !product.isActive }
    //     ).subscribe({
    //       next: () => {
    //         this.productUpdated.emit();
    //         this.snackBar.open(
    //           `Product ${!product.isActive ? 'activated' : 'deactivated'} successfully`,
    //           'OK',
    //           { duration: 3000, panelClass: ['success-snackbar'] }
    //         );
    //       },
    //       error: (error) => {
    //         console.error('Failed to update product:', error);
    //         this.snackBar.open('Failed to update product', 'OK', { 
    //           duration: 5000, 
    //           panelClass: ['error-snackbar'] 
    //         });
    //       }
    //     });
    //   } finally {
    //     this.loading.set(false);
    //   }
    // }
  }

  async deleteProduct(product: Product): Promise<void> {
    const result = await this.dialogService.confirmDelete(product.name, 'product')
      .pipe(take(1))
      .toPromise();
    
    if (result) {
      await this.performDelete(product);
    }
  }

  private async performDelete(product: Product): Promise<void> {
    // try {
    //   this.loading.set(true);
    //   this.storeService.deleteProduct(this.store()._id!, product._id!).subscribe({
    //     next: () => {
    //       this.productUpdated.emit();
    //       this.snackBar.open('Product deleted successfully', 'OK', { 
    //         duration: 3000,
    //         panelClass: ['success-snackbar']
    //       });
    //     },
    //     error: (error) => {
    //       console.error('Failed to delete product:', error);
    //       this.snackBar.open('Failed to delete product', 'OK', { 
    //         duration: 5000,
    //         panelClass: ['error-snackbar']
    //       });
    //     }
    //   });
    // } finally {
    //   this.loading.set(false);
    // }
  }

  duplicateProduct(product: Product): void {
    this.snackBar.open('Duplication feature coming soon', 'OK', { duration: 3000 });
  }

  // Quick actions
  manageInventory(): void {
    this.router.navigate(['/dashboard/stores', this.store()._id, 'inventory']);
  }

  exportProducts(): void {
    this.snackBar.open('Export feature coming soon', 'OK', { duration: 3000 });
  }

  // Utility methods
  getStockStatus(product: Product): { text: string; color: string; icon: string } {
    if (product.quantity === 0) {
      return { text: 'Out of Stock', color: 'warn', icon: 'cancel' };
    } else if (product.quantity <= product.lowStockAlert) {
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

  // Add to product-management.component.ts
  handleImageError(event: Event): void {
        const img = event.target as HTMLImageElement;
        img.src = 'assets/images/product-placeholder.jpg'; // Add a placeholder image
   }
}