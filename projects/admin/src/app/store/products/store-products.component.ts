import { Component, OnInit, signal, computed, inject, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, PageEvent, MatPaginator } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router, ActivatedRoute } from '@angular/router';
import { DatePipe, CurrencyPipe, PercentPipe } from '@angular/common';

import { StoreService } from '../store.service';

import { Store } from '../shared/store.model';

import { ConfirmationDialogComponent } from '../shared/confirmation-dialog/confirmation-dialog.component';
import { ProductDetailDialogComponent } from './product-detail-dialog/product-detail-dialog.component';
import { ProductEditDialogComponent } from './product-edit-dialog/product-edit-dialog.component';
import { ProductBulkActionsDialogComponent } from './product-bulk-actions-dialog/product-bulk-actions-dialog.component';
import { ProductService } from '../product.service';
import { Product, ProductStatus } from '../shared/product.model';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'admin-store-products',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    MatCardModule,
    MatMenuModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
    MatTabsModule,
    MatCheckboxModule,
    MatBadgeModule,
    MatProgressBarModule,
    DatePipe,
    CurrencyPipe,
    MatDividerModule
  ],
  providers: [StoreService, ProductService],
  templateUrl: './store-products.component.html',
  styleUrl: './store-products.component.scss',
})
export class StoreProductsComponent implements OnInit, AfterViewInit {
  private storeService = inject(StoreService);
  private productService = inject(ProductService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Route parameters
  storeId = signal<string>('');
  store = signal<Store | null>(null);

  // State with signals
  products = signal<Product[]>([]);
  isLoading = signal(true);
  isLoadingStore = signal(true);
  searchQuery = signal('');
  categoryFilter = signal('all');
  statusFilter = signal<ProductStatus | 'all'>('all');
  stockFilter = signal('all');
  priceRangeFilter = signal<{min: number | null, max: number | null}>({ min: null, max: null });
  dateRangeFilter = signal<{start: Date | null, end: Date | null}>({ start: null, end: null });
  
  // Table data source
  dataSource = new MatTableDataSource<Product>([]);
  displayedColumns: string[] = ['select', 'product', 'category', 'price', 'stock', 'status', 'performance', 'date', 'actions'];
  
  // Selection
  selectedProducts = signal<Set<string>>(new Set());
  isAllSelected = computed(() => {
    const filtered = this.filteredProducts();
    return filtered.length > 0 && this.selectedProducts().size === filtered.length;
  });
  
  // Pagination
  pageSize = signal(15);
  pageIndex = signal(0);
  totalProducts = signal(0);
  
  // Statistics
  stats = signal({
    totalProducts: 0,
    activeProducts: 0,
    outOfStock: 0,
    lowStock: 0,
    totalValue: 0,
    averagePrice: 0
  });
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Computed values
  filteredProducts = computed(() => {
    let filtered = this.products();
    
    // Apply search filter
    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.sku?.toLowerCase().includes(query) ||
        product.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Apply category filter
    if (this.categoryFilter() !== 'all') {
      filtered = filtered.filter(product => product.category === this.categoryFilter());
    }
    
    // Apply status filter
    if (this.statusFilter() !== 'all') {
      filtered = filtered.filter(product => product.status === this.statusFilter());
    }
    
    // Apply stock filter
    if (this.stockFilter() !== 'all') {
      filtered = filtered.filter(product => {
        switch (this.stockFilter()) {
          case 'in-stock':
            return product.stockStatus === 'in_stock';
          case 'low-stock':
            return product.stockStatus === 'low_stock';
          case 'out-of-stock':
            return product.stockStatus === 'out_of_stock';
          case 'no-tracking':
            return product.stockStatus === 'not_tracking';
          default:
            return true;
        }
      });
    }
    
    // Apply price range filter
    const { min, max } = this.priceRangeFilter();
    if (min !== null || max !== null) {
      filtered = filtered.filter(product => {
        const price = product.price || 0;
        return (min === null || price >= min) && (max === null || price <= max);
      });
    }
    
    // Apply date range filter
    const { start, end } = this.dateRangeFilter();
    if (start && end) {
      filtered = filtered.filter(product => {
        const productDate = new Date(product.createdAt);
        return productDate >= start && productDate <= end;
      });
    }
    
    return filtered;
  });

  // Available categories (extracted from products)
  categories = computed(() => {
    const categories = new Set<string>();
    this.products().forEach(product => {
      if (product.category) categories.add(product.category);
    });
    return Array.from(categories);
  });

  // Available tags
  tags = computed(() => {
    const tags = new Set<string>();
    this.products().forEach(product => {
      if (product.tags) {
        product.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags);
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.storeId.set(params['storeId']);
      this.loadStore();
      this.loadProducts();
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  async loadStore(): Promise<void> {
    try {
      this.isLoadingStore.set(true);
      this.storeService.getStoreById(this.storeId()).subscribe({
        next: (response) => {
          this.store.set(response);
          this.isLoadingStore.set(false);
        },
        error: (error) => {
          console.error('Error loading store:', error);
          this.isLoadingStore.set(false);
          this.showSnackbar('Failed to load store details', 'error');
        }
      });
    } catch (error) {
      console.error('Error loading store:', error);
      this.isLoadingStore.set(false);
    }
  }

  async loadProducts(): Promise<void> {
    try {
      this.isLoading.set(true);
      this.productService.getStoreProducts(this.storeId()).subscribe({
        next: (response) => {
          console.log('Products loaded:', response.data);
          this.products.set(response.data || []);
          this.applyFilters();
          this.isLoading.set(false);
          this.updateStats();
        },
        error: (error) => {
          console.error('Error loading products:', error);
          this.isLoading.set(false);
          this.showSnackbar('Failed to load products', 'error');
        }
      });
    } catch (error) {
      console.error('Error loading products:', error);
      this.isLoading.set(false);
      this.showSnackbar('Failed to load products', 'error');
    }
  }

  updateStats(): void {
    const products = this.products();
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.status === 'active').length;
    const outOfStock = products.filter(p => p.stockStatus === 'out_of_stock').length;
    const lowStock = products.filter(p => p.stockStatus === 'low_stock').length;
    const totalValue = products.reduce((sum, product) => sum + (product.price || 0) * (product.quantity || 0), 0);
    const averagePrice = totalProducts > 0 
      ? products.reduce((sum, product) => sum + (product.price || 0), 0) / totalProducts
      : 0;
    
    this.stats.set({
      totalProducts,
      activeProducts,
      outOfStock,
      lowStock,
      totalValue,
      averagePrice
    });
  }

  applyFilters(): void {
    const filtered = this.filteredProducts();
    this.dataSource.data = filtered;
    this.totalProducts.set(filtered.length);
    
    // Reset paginator to first page
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.pageIndex.set(0);
    
    // Clear selections when filters change
    this.selectedProducts.set(new Set());
  }

  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
    this.applyFilters();
  }

  onCategoryFilterChange(event: any): void {
    this.categoryFilter.set(event.value);
    this.applyFilters();
  }

  onStatusFilterChange(event: any): void {
    this.statusFilter.set(event.value);
    this.applyFilters();
  }

  onStockFilterChange(event: any): void {
    this.stockFilter.set(event.value);
    this.applyFilters();
  }

  onPriceRangeChange(min: string, max: string): void {
    this.priceRangeFilter.set({
      min: min ? parseFloat(min) : null,
      max: max ? parseFloat(max) : null
    });
    this.applyFilters();
  }

  onDateRangeChange(start: Date | null, end: Date | null): void {
    this.dateRangeFilter.set({ start, end });
    this.applyFilters();
  }

  onPageChange(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
  }

  // Selection handling
  toggleAllSelection(): void {
    if (this.isAllSelected()) {
      this.selectedProducts().clear();
    } else {
      const allIds = this.filteredProducts().map(p => p._id);
      this.selectedProducts.set(new Set(allIds));
    }
    this.selectedProducts.set(new Set(this.selectedProducts()));
  }

  toggleProductSelection(productId: string): void {
    const selected = this.selectedProducts();
    if (selected.has(productId)) {
      selected.delete(productId);
    } else {
      selected.add(productId);
    }
    this.selectedProducts.set(new Set(selected));
  }

  isProductSelected(productId: string): boolean {
    return this.selectedProducts().has(productId);
  }

  get selectedCount(): number {
    return this.selectedProducts().size;
  }

  // Product actions
  viewProductDetails(product: Product): void {
    this.dialog.open(ProductDetailDialogComponent, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: { product, store: this.store() }
    });
  }

  editProduct(product: Product): void {
    const dialogRef = this.dialog.open(ProductEditDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { 
        product,
        storeId: this.storeId(),
        categories: this.categories(),
        tags: this.tags()
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadProducts();
        this.showSnackbar('Product updated successfully', 'success');
      }
    });
  }

  toggleProductStatus(product: Product): void {
    const newStatus = product.status === 'active' ? 'draft' : 'active';
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: newStatus === 'active' ? 'Activate Product' : 'Deactivate Product',
        message: `Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} this product?`,
        confirmButtonText: newStatus === 'active' ? 'Activate' : 'Deactivate',
        confirmButtonColor: newStatus === 'active' ? 'primary' : 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.productService.updateProductStatus(product._id, newStatus)
          .subscribe({
            next: (updatedProduct) => {
              const index = this.products().findIndex(p => p._id === product._id);
              if (index !== -1) {
                const updatedProducts = [...this.products()];
                updatedProducts[index] = updatedProduct;
                this.products.set(updatedProducts);
                this.applyFilters();
                this.updateStats();
                this.showSnackbar(
                  `Product ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
                  'success'
                );
              }
            },
            error: (error) => {
              console.error('Error toggling product status:', error);
              this.showSnackbar('Failed to update product status', 'error');
            }
          });
      }
    });
  }

  toggleFeatured(product: Product): void {
    this.productService.toggleFeatured(product._id, !product.isFeatured)
      .subscribe({
        next: (updatedProduct) => {
          const index = this.products().findIndex(p => p._id === product._id);
          if (index !== -1) {
            const updatedProducts = [...this.products()];
            updatedProducts[index] = updatedProduct;
            this.products.set(updatedProducts);
            this.applyFilters();
            const message = updatedProduct.isFeatured 
              ? 'Product featured successfully' 
              : 'Product unfeatured successfully';
            this.showSnackbar(message, 'success');
          }
        },
        error: (error) => {
          console.error('Error toggling featured status:', error);
          this.showSnackbar('Failed to update featured status', 'error');
        }
      });
  }

  deleteProduct(product: Product): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Delete Product',
        message: 'Are you sure you want to delete this product? This action cannot be undone.',
        confirmButtonText: 'Delete',
        confirmButtonColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.productService.deleteProduct(product._id)
          .subscribe({
            next: () => {
              const updatedProducts = this.products().filter(p => p._id !== product._id);
              this.products.set(updatedProducts);
              this.applyFilters();
              this.updateStats();
              this.showSnackbar('Product deleted successfully', 'success');
            },
            error: (error) => {
              console.error('Error deleting product:', error);
              this.showSnackbar('Failed to delete product', 'error');
            }
          });
      }
    });
  }

  // Bulk actions
  openBulkActionsDialog(): void {
    if (this.selectedProducts().size === 0) {
      this.showSnackbar('Please select products first', 'warning');
      return;
    }

    const dialogRef = this.dialog.open(ProductBulkActionsDialogComponent, {
      width: '500px',
      data: {
        selectedCount: this.selectedProducts().size,
        storeId: this.storeId()
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        switch (result.action) {
          case 'activate':
            this.bulkUpdateStatus('active');
            break;
          case 'deactivate':
            this.bulkUpdateStatus('draft');
            break;
          case 'delete':
            this.bulkDeleteProducts();
            break;
          case 'update-category':
            if (result.category) {
              this.bulkUpdateCategory(result.category);
            }
            break;
          case 'update-price':
            if (result.priceData) {
              this.bulkUpdatePrice(result.priceData);
            }
            break;
        }
      }
    });
  }

  bulkUpdateStatus(status: ProductStatus): void {
    const productIds = Array.from(this.selectedProducts());
    
    this.productService.bulkUpdateStatus(productIds, status)
      .subscribe({
        next: (response) => {
          this.loadProducts();
          this.selectedProducts.set(new Set());
          this.showSnackbar(`${response.modifiedCount} products updated successfully`, 'success');
        },
        error: (error) => {
          console.error('Error in bulk status update:', error);
          this.showSnackbar('Failed to update products', 'error');
        }
      });
  }

  bulkDeleteProducts(): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Delete Selected Products',
        message: `Are you sure you want to delete ${this.selectedProducts().size} products? This action cannot be undone.`,
        confirmButtonText: 'Delete',
        confirmButtonColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const productIds = Array.from(this.selectedProducts());
        
        this.productService.bulkDeleteProducts(productIds)
          .subscribe({
            next: (response) => {
              this.loadProducts();
              this.selectedProducts.set(new Set());
              this.showSnackbar(`${response.deletedCount} products deleted successfully`, 'success');
            },
            error: (error) => {
              console.error('Error in bulk delete:', error);
              this.showSnackbar('Failed to delete products', 'error');
            }
          });
      }
    });
  }

  bulkUpdateCategory(category: string): void {
    const productIds = Array.from(this.selectedProducts());
    
    this.productService.bulkUpdateCategory(productIds, category)
      .subscribe({
        next: (response) => {
          this.loadProducts();
          this.selectedProducts.set(new Set());
          this.showSnackbar(`${response.modifiedCount} products updated successfully`, 'success');
        },
        error: (error) => {
          console.error('Error in bulk category update:', error);
          this.showSnackbar('Failed to update products', 'error');
        }
      });
  }

  bulkUpdatePrice(priceData: { type: 'fixed' | 'percentage', value: number }): void {
    const productIds = Array.from(this.selectedProducts());
    
    this.productService.bulkUpdatePrice(productIds, priceData)
      .subscribe({
        next: (response) => {
          this.loadProducts();
          this.selectedProducts.set(new Set());
          this.showSnackbar(`${response.modifiedCount} products updated successfully`, 'success');
        },
        error: (error) => {
          console.error('Error in bulk price update:', error);
          this.showSnackbar('Failed to update products', 'error');
        }
      });
  }

  // Export functionality
  exportProducts(format: 'csv' | 'excel' = 'csv'): void {
    const productIds = this.selectedProducts().size > 0 
      ? Array.from(this.selectedProducts())
      : this.filteredProducts().map(p => p._id);
    
    this.productService.exportProducts(format, productIds, this.storeId())
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `products_export_${new Date().toISOString().split('T')[0]}.${format}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          this.showSnackbar(`Products exported as ${format.toUpperCase()} successfully`, 'success');
        },
        error: (error) => {
          console.error('Error exporting products:', error);
          this.showSnackbar('Failed to export products', 'error');
        }
      });
  }

  refreshData(): void {
    this.loadProducts();
    this.showSnackbar('Data refreshed successfully', 'success');
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.categoryFilter.set('all');
    this.statusFilter.set('all');
    this.stockFilter.set('all');
    this.priceRangeFilter.set({ min: null, max: null });
    this.dateRangeFilter.set({ start: null, end: null });
    this.applyFilters();
  }

  clearSelection(): void {
    this.selectedProducts.set(new Set());
  }

  goBackToStores(): void {
    this.router.navigate(['/dashboard/stores']);
  }

  navigateToAddProduct(): void {
    this.router.navigate(['/dashboard/stores']);
    // this.router.navigate(['/admin/stores', this.storeId(), 'products', 'new']);
  }

  private showSnackbar(message: string, type: 'success' | 'error' | 'info' | 'warning'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: `snackbar-${type}`
    });
  }

  // Helper methods for display
  getStockPercentage(product: Product): number {
    if (!product.manageStock || product.quantity === undefined) return 0;
    const max = Math.max(product.quantity, product.lowStockAlert || 10);
    return (product.quantity / max) * 100;
  }

  getStockColor(product: Product): string {
    if (!product.manageStock) return 'not-tracking';
    
    const quantity = product.quantity || 0;
    const lowStockAlert = product.lowStockAlert || 5;
    
    if (quantity === 0) return 'out-of-stock';
    if (quantity <= lowStockAlert) return 'low-stock';
    return 'in-stock';
  }

  getStockText(product: Product): string {
    if (!product.manageStock) return 'No Tracking';
    
    const quantity = product.quantity || 0;
    const lowStockAlert = product.lowStockAlert || 5;
    
    if (quantity === 0) return 'Out of Stock';
    if (quantity <= lowStockAlert) return 'Low Stock';
    return `${quantity} in stock`;
  }

  getPerformanceRating(product: Product): number {
    // Simplified performance rating based on views and purchases
    const views = product.viewCount || 0;
    const purchases = product.purchaseCount || 0;
    
    if (views === 0) return 0;
    const conversion = (purchases / views) * 100;
    
    if (conversion > 10) return 5;
    if (conversion > 5) return 4;
    if (conversion > 2) return 3;
    if (conversion > 0.5) return 2;
    if (conversion > 0) return 1;
    return 0;
  }
}