import { Component, input, output, signal, computed, inject, OnInit, ViewChild } from '@angular/core';
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
import { take } from 'rxjs';

import { Store } from '../../../models/store.model';
import { StoreService } from '../../../services/store.service';
import { Product } from '../../../models';
import { DialogService } from '../../../shared/services/dialog.service';
import { TruncatePipe } from '../../../shared';
import { SelectionModel } from '@angular/cdk/collections';

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
    MatDialogModule
  ],
  templateUrl: './marketer-product-list-management.component.html',
  styleUrls: ['./marketer-product-list-management.component.scss']
})
export class MarketerProductListManagementComponent {
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private storeService = inject(StoreService);
  private dialogService = inject(DialogService);

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
    this.router.navigate(['/dashboard/stores', this.store()._id, 'products', product._id, 'edit']);
  }

  viewProduct(product: Product): void {
    this.router.navigate(['/dashboard/stores', this.store()._id, 'products', product._id]);
  }

  async toggleProductStatus(product: Product): Promise<void> {
    const action = product.isActive ? 'deactivate' : 'activate';
    const result = await this.dialogService.confirmAction(
      `${action === 'deactivate' ? 'Deactivate' : 'Activate'} Product`,
      `Are you sure you want to ${action} "${product.name}"?`,
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
    try {
      this.loading.set(true);
      // Call your API to delete product
      // this.storeService.deleteProduct(this.store()._id!, product._id!).subscribe({
      //   next: () => {
      //     this.productUpdated.emit();
      //     this.snackBar.open('Product deleted successfully', 'OK', { 
      //       duration: 3000,
      //       panelClass: ['success-snackbar']
      //     });
      //     this.clearSelection();
      //   },
      //   error: (error) => {
      //     console.error('Failed to delete product:', error);
      //     this.snackBar.open('Failed to delete product', 'OK', { 
      //       duration: 5000,
      //       panelClass: ['error-snackbar']
      //     });
      //   }
      // });
    } finally {
      this.loading.set(false);
    }
  }

  duplicateProduct(product: Product): void {
    // Implement duplication logic
    this.snackBar.open('Duplicating product...', 'OK', { duration: 2000 });
    // Call your API to duplicate product
  }

  // Bulk actions
  exportSelected(): void {
    if (this.selectedProducts.length === 0) {
      this.snackBar.open('Please select products to export', 'OK', { duration: 3000 });
      return;
    }
    
    // Implement export selected logic
    this.snackBar.open(`Exporting ${this.selectedProducts.length} products...`, 'OK', { duration: 2000 });
  }

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
}