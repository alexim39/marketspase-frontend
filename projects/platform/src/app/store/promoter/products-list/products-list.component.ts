// promoter-products-list.component.ts
import { Component, OnInit, inject, signal, computed, OnDestroy, Signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';

import { PromoterProduct } from '../models/promoter-product.model';
import { TruncatePipe } from '../../shared/pipes/truncate.pipe';
import { CommissionPipe } from '../../shared/pipes/commission.pipe';
import { PromoterProductService } from '../../services/promoter-product.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { UserInterface } from '../../../../../../shared-services/src/public-api';

@Component({
  selector: 'app-promoter-products-list',
  standalone: true,
  providers: [PromoterProductService],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatSliderModule,
    MatRadioModule,
    MatCheckboxModule,
    MatDialogModule,
    MatBadgeModule,
    MatDividerModule,
    MatTabsModule,
    MatProgressBarModule,
    TruncatePipe,
    CommissionPipe,
    MatTableModule,
  ],
  templateUrl: './products-list.component.html',
  styleUrls: ['./products-list.component.scss']
})
export class PromoterProductsListComponent implements OnInit, OnDestroy {
  private productService = inject(PromoterProductService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  @Input({ required: true }) user!: Signal<UserInterface | null>;;

  // Signals
  products = signal<PromoterProduct[]>([]);
  filteredProducts = signal<PromoterProduct[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Filter signals
  categories = signal<string[]>([]);
  selectedCategories = signal<string[]>([]);
  priceRange = signal<[number, number]>([0, 10000]);
  selectedPriceRange = signal<[number, number]>([0, 10000]);
  commissionRange = signal<[number, number]>([0, 50]);
  selectedCommissionRange = signal<[number, number]>([0, 50]);
  
  searchQuery = signal<string>('');
  sortBy = signal<'commission' | 'popularity' | 'price' | 'newest' | 'name'>('commission');
  sortDirection = signal<'asc' | 'desc'>('desc');
  
  viewMode = signal<'grid' | 'list'>('grid');
  pageSize = signal<number>(12);
  currentPage = signal<number>(0);
  
  // Search subject for debouncing
  private searchSubject = new Subject<string>();

  // Computed properties
  paginatedProducts = computed(() => {
    const start = this.currentPage() * this.pageSize();
    return this.filteredProducts().slice(start, start + this.pageSize());
  });

  totalProducts = computed(() => this.filteredProducts().length);
  
  // Statistics
  stats = computed(() => {
    const products = this.filteredProducts();
    const totalCommissions = products.reduce((sum, p) => sum + p.promotion.commissionRate, 0);
    const avgCommission = products.length > 0 ? totalCommissions / products.length : 0;
    
    return {
      total: products.length,
      avgCommission,
      stores: new Set(products.map(p => p.store._id)).size,
      highCommission: products.filter(p => p.promotion.commissionRate >= 20).length
    };
  });

  ngOnInit(): void {
    this.loadProducts();
    
    // Setup search debouncing
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.searchQuery.set(query);
      this.applyFilters();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Updated loadProducts method to handle errors and improve readability
  async loadProducts(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await this.productService.getProducts().toPromise();
      console.log('Fetched response:', response);

      if (!response || !response.data || response.data.length === 0) {
        this.error.set('No products found.');
        this.snackBar.open('No products available', 'Close', { duration: 5000 });
        this.products.set([]);
        return;
      }

      // Map the data array to products
      this.products.set(response.data);

      // Extract filter options from the response
      this.extractFilterOptions(response.filters);

      // Apply initial filters
      this.applyFilters();
    } catch (err) {
      console.error('Failed to load products:', err);
      this.error.set('Failed to load products. Please try again later.');
      this.snackBar.open('Failed to load products', 'Close', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }

  private extractFilterOptions(filters: any): void {
    // Extract categories from filters
    if (filters.categories) {
      const categories = filters.categories.map((cat: any) => cat.name);
      this.categories.set(categories.sort());
    }

    // Extract price range from filters
    if (filters.priceRange) {
      const { minPrice, maxPrice } = filters.priceRange;
      this.priceRange.set([minPrice, maxPrice]);
      this.selectedPriceRange.set([minPrice, maxPrice]);
    }

    // Extract commission range from filters
    if (filters.commissionRange) {
      const { minCommission, maxCommission } = filters.commissionRange;
      this.commissionRange.set([minCommission, maxCommission]);
      this.selectedCommissionRange.set([minCommission, maxCommission]);
    }
  }

  applyFilters(): void {
    let filtered = [...this.products()];

    // Apply search
    const searchQuery = this.searchQuery().toLowerCase();
    if (searchQuery) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchQuery) ||
        product.description?.toLowerCase().includes(searchQuery) ||
        product.store.name.toLowerCase().includes(searchQuery) ||
        product.tags?.some(tag => tag.toLowerCase().includes(searchQuery)) ||
        product.category.toLowerCase().includes(searchQuery)
      );
    }

    // Apply category filter
    const selectedCats = this.selectedCategories();
    if (selectedCats.length > 0) {
      filtered = filtered.filter(product => 
        selectedCats.includes(product.category)
      );
    }

    // Apply price filter
    const [minPrice, maxPrice] = this.selectedPriceRange();
    filtered = filtered.filter(product => 
      product.price >= minPrice && product.price <= maxPrice
    );

    // Apply commission filter
    const [minCommission, maxCommission] = this.selectedCommissionRange();
    filtered = filtered.filter(product => 
      product.promotion.commissionRate >= minCommission && 
      product.promotion.commissionRate <= maxCommission
    );

    // Apply sorting
    filtered = this.sortProducts(filtered);

    this.filteredProducts.set(filtered);
    this.currentPage.set(0); // Reset to first page
  }

  private sortProducts(products: PromoterProduct[]): PromoterProduct[] {
    const sortBy = this.sortBy();
    const direction = this.sortDirection() === 'asc' ? 1 : -1;

    return [...products].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'commission':
          aValue = a.promotion.commissionRate;
          bValue = b.promotion.commissionRate;
          break;
        case 'popularity':
          aValue = (a.purchaseCount || 0) * (a.averageRating || 0);
          bValue = (b.purchaseCount || 0) * (b.averageRating || 0);
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'newest':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        default:
          aValue = a.promotion.commissionRate;
          bValue = b.promotion.commissionRate;
      }

      return (aValue > bValue ? 1 : -1) * direction;
    });
  }

  // Event handlers
  onSearchInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.searchSubject.next(query);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.applyFilters();
  }

  onCategoryChange(categories: string[]): void {
    this.selectedCategories.set(categories);
    this.applyFilters();
  }

  onPriceRangeChange(range: [number, number]): void {
    this.selectedPriceRange.set(range);
    this.applyFilters();
  }

  onCommissionRangeChange(range: [number, number]): void {
    this.selectedCommissionRange.set(range);
    this.applyFilters();
  }

  onSortChange(sortBy: 'commission' | 'popularity' | 'price' | 'newest' | 'name'): void {
    if (this.sortBy() === sortBy) {
      this.sortDirection.update(dir => dir === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(sortBy);
      this.sortDirection.set('desc');
    }
    this.applyFilters();
  }

  clearFilters(): void {
    this.selectedCategories.set([]);
    this.selectedPriceRange.set(this.priceRange());
    this.selectedCommissionRange.set(this.commissionRange());
    this.searchQuery.set('');
    this.sortBy.set('commission');
    this.sortDirection.set('desc');
    this.applyFilters();
  }

  // View controls
  setGridView(): void {
    this.viewMode.set('grid');
  }

  setListView(): void {
    this.viewMode.set('list');
  }

  // Product actions
  viewProductDetails(product: PromoterProduct): void {
    this.router.navigate(['/promoter/products', product._id]);
  }

  copyPromotionLink(product: PromoterProduct): void {
    const link = `${window.location.origin}/promote/${product.promotion.trackingCode}`;
    navigator.clipboard.writeText(link).then(() => {
      this.snackBar.open('Promotion link copied to clipboard!', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    }).catch(err => {
      console.error('Failed to copy:', err);
      this.snackBar.open('Failed to copy link', 'Close', { duration: 3000 });
    });
  }

  generateWhatsAppMessage(product: PromoterProduct): void {
    const message = `Check out this amazing product: ${product.name}\n\n` +
                   `💰 Price: $${product.price}\n` +
                   `🎯 Commission: ${product.promotion.commissionRate}%\n\n` +
                   `Shop now: ${window.location.origin}/promote/${product.promotion.trackingCode}\n\n` +
                   `From: ${product.store.name}`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

  // Pagination
  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  // Utility methods
  trackByProductId(index: number, product: PromoterProduct): string {
    return product._id;
  }

  getPerformanceColor(rate: number): string {
    if (rate >= 30) return 'success';
    if (rate >= 15) return 'warning';
    return 'primary';
  }

  getConversionRate(product: PromoterProduct): number {
    const { views, clicks, conversions } = product.promotion;
    if (clicks === 0) return 0;
    return (conversions / clicks) * 100;
  }

  getStoreBadgeClass(tier: string): string {
    return tier === 'premium' ? 'premium-badge' : 'basic-badge';
  }

  // New method to handle category selection logic
  toggleCategorySelection(checked: boolean, category: string): void {
    if (checked) {
      this.selectedCategories.update(categories => [...categories, category]);
    } else {
      this.selectedCategories.update(categories => categories.filter(c => c !== category));
    }
    this.applyFilters();
  }
}