// components/product-management/product-management.component.ts
import { Component, input, output, signal, computed, inject, OnInit } from '@angular/core';
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
import { Store, } from '../../models/store.model';
import { StoreService } from '../../services/store.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { Product } from '../../models';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DialogService } from '../../shared/services/dialog.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TruncatePipe } from '../../shared';
import { MatDividerModule } from '@angular/material/divider';

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
    TruncatePipe,
    MatDividerModule
    
  ],
  templateUrl: './product-management.component.html',
  styleUrls: ['./product-management.component.scss']
})
export class ProductManagementComponent implements OnInit {
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private storeService = inject(StoreService);

  // Inputs
  store = input.required<Store>();
  products = input.required<Product[]>();
  // Change this line:
  viewMode = signal<'grid' | 'list'>('grid'); // Change this to signal()// Writable signal with initial value

  // Outputs
  productUpdated = output<void>();

   // Methods to change view mode
  setGridView(): void {
    this.viewMode.set('grid');
  }

  setListView(): void {
    this.viewMode.set('list');
  }

  // Add to constructor
private dialogService = inject(DialogService);

  // Signals
  searchQuery = signal<string>('');
  selectedCategory = signal<string>('all');
  sortBy = signal<keyof Product>('createdAt');
  sortDirection = signal<'asc' | 'desc'>('desc');
  pageSize = signal<number>(10);
  currentPage = signal<number>(0);
  loading = signal<boolean>(false);

  // Computed properties
  categories = computed(() => {
    const categories = new Set(this.products().map(p => p.category));
    return Array.from(categories);
  });

  filteredProducts = computed(() => {
    let filtered = this.products();
    const query = this.searchQuery().toLowerCase();
    const category = this.selectedCategory();

    // Filter by search query
    if (query) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.tags.some(tag => tag.toLowerCase().includes(query))
      );
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

  ngOnInit(): void {
    // Initialize with any necessary data
  }

  // Sorting
 sortProducts(products: Product[]): Product[] {
  const sortBy = this.sortBy();
  const direction = this.sortDirection();

  return [...products].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    // Handle nested properties
    if (sortBy === 'promoterTracking') {
      aValue = a.promoterTracking?.viewCount ?? 0;
      bValue = b.promoterTracking?.viewCount ?? 0;
    }

    // Safe comparison handling undefined/null
    const dirMultiplier = direction === 'asc' ? 1 : -1;
    const safeCompare = (x: unknown, y: unknown): number => {
      if (x == null && y == null) return 0;
      if (x == null) return dirMultiplier;  // Nulls sort last in asc, first in desc
      if (y == null) return -dirMultiplier;

      // Assume numeric or string; coerce to number if possible, else use string comparison
      const xNum = Number(x);
      const yNum = Number(y);
      if (!isNaN(xNum) && !isNaN(yNum)) {
        return (xNum - yNum) * dirMultiplier;
      }
      // Fallback to string comparison
      return String(x).localeCompare(String(y)) * dirMultiplier;
    };

    return safeCompare(aValue, bValue);
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
  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(0);
  }

  onCategoryChange(category: string): void {
    this.selectedCategory.set(category);
    this.currentPage.set(0);
  }

  // Product actions
  addProduct(): void {
    this.router.navigate(['/dashboard/stores', this.store()._id, 'products', 'create']);
  }

  editProduct(product: Product): void {
    this.router.navigate(['/dashboard/stores', this.store()._id, 'products', product._id, 'edit']);
  }

  viewProduct(product: Product): void {
    this.router.navigate(['/dashboard/stores', this.store()._id, 'products', product._id]);
  }

  // async toggleProductStatus(product: Product): Promise<void> {
  //   try {
  //     this.loading.set(true);
  //     await this.storeService.updateProduct(
  //       this.store()._id!,
  //       product._id!,
  //       { isActive: !product.isActive }
  //     ).subscribe({
  //       next: () => {
  //         this.productUpdated.emit();
  //         this.snackBar.open(
  //           `Product ${!product.isActive ? 'activated' : 'deactivated'} successfully`,
  //           'OK',
  //           { duration: 3000 }
  //         );
  //       },
  //       error: (error) => {
  //         this.snackBar.open('Failed to update product', 'OK', { duration: 3000 });
  //       }
  //     });
  //   } finally {
  //     this.loading.set(false);
  //   }
  // }


  // You can also use the convenience methods for other actions
async toggleProductStatus(product: Product): Promise<void> {
  const action = product.isActive ? 'deactivate' : 'activate';
  const result = await this.dialogService.confirmAction(
    `${action === 'deactivate' ? 'Deactivate' : 'Activate'} Product`,
    `Are you sure you want to ${action} "${product.name}"?`,
    action === 'deactivate' ? 'Deactivate' : 'Activate'
  ).toPromise();

  if (result) {
    try {
      this.loading.set(true);
      await this.storeService.updateProduct(
        this.store()._id!,
        product._id!,
        { isActive: !product.isActive }
      ).subscribe({
        next: () => {
          this.productUpdated.emit();
          this.snackBar.open(
            `Product ${!product.isActive ? 'activated' : 'deactivated'} successfully`,
            'OK',
            { duration: 3000 }
          );
        },
        error: (error) => {
          this.snackBar.open('Failed to update product', 'OK', { duration: 3000 });
        }
      });
    } finally {
      this.loading.set(false);
    }
  }
}

  // async deleteProduct(product: Product): Promise<void> {
  //   const dialogRef = this.dialog.open(ConfirmDialogComponent, {
  //     data: {
  //       title: 'Delete Product',
  //       message: `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
  //       confirmText: 'Delete',
  //       cancelText: 'Cancel',
  //       confirmColor: 'warn'
  //     }
  //   });

  //   dialogRef.afterClosed().subscribe(result => {
  //     if (result) {
  //       this.performDelete(product);
  //     }
  //   });
  // }

  // Update the deleteProduct method
async deleteProduct(product: Product): Promise<void> {
  const result = await this.dialogService.confirmDelete(product.name, 'product').toPromise();
  
  if (result) {
    await this.performDelete(product);
  }
}

  private async performDelete(product: Product): Promise<void> {
    try {
      this.loading.set(true);
      await this.storeService.deleteProduct(this.store()._id!, product._id!).subscribe({
        next: () => {
          this.productUpdated.emit();
          this.snackBar.open('Product deleted successfully', 'OK', { duration: 3000 });
        },
        error: (error) => {
          this.snackBar.open('Failed to delete product', 'OK', { duration: 3000 });
        }
      });
    } finally {
      this.loading.set(false);
    }
  }

  duplicateProduct(product: Product): void {
    // Implement duplicate logic
    this.snackBar.open('Duplication feature coming soon', 'OK', { duration: 3000 });
  }

  // Quick actions
  manageInventory(): void {
    this.router.navigate(['/dashboard/stores', this.store()._id, 'inventory']);
  }

  exportProducts(): void {
    // Implement export logic
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
}