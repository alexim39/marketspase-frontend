import { ChangeDetectionStrategy, Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CurrencyUtilsPipe, TruncatePipe } from '@shared/services';
import { Product } from '../../../models';
import { PromoterProductService } from '../../../services/promoter-product.service';
import { PromotionService } from '../../services/promotion.service';
import { SortBy } from '../models/filter-state.model';
import { LoadingStateMobileComponent } from '../components/loading-state/mobile/loading-state-mobile.component';
import { PromoterProductsListComponent } from '../promoter-products-list.component';

type MobileSortOption = {
  label: string;
  icon: string;
  sortBy: SortBy;
  sortDirection: 'asc' | 'desc';
};

@Component({
  selector: 'app-mobile-promoter-products-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatChipsModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    CurrencyUtilsPipe,
    TruncatePipe,
    TitleCasePipe,
    LoadingStateMobileComponent,
  ],
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss'],
  providers: [PromoterProductService, PromotionService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobilePromoterProductsListComponent extends PromoterProductsListComponent implements OnInit {
  readonly searchQuery = signal('');
  readonly selectedCategories = signal<string[]>([]);
  readonly selectedSort = signal<MobileSortOption>({
    label: 'Top commission',
    icon: 'percent',
    sortBy: 'commission',
    sortDirection: 'desc',
  });
  readonly filtersOpen = signal(false);

  readonly sortOptions: MobileSortOption[] = [
    { label: 'Top commission', icon: 'percent', sortBy: 'commission', sortDirection: 'desc' },
    { label: 'Popular', icon: 'local_fire_department', sortBy: 'popularity', sortDirection: 'desc' },
    { label: 'Newest', icon: 'fiber_new', sortBy: 'newest', sortDirection: 'desc' },
    { label: 'Lowest price', icon: 'south', sortBy: 'price', sortDirection: 'asc' },
  ];

  readonly quickCategories = computed(() => this.categories().slice(0, 8));
  readonly hasActiveFilters = computed(() => {
    return !!this.searchQuery().trim() ||
      this.selectedCategories().length > 0 ||
      this.selectedSort().sortBy !== 'commission' ||
      this.selectedSort().sortDirection !== 'desc';
  });

  override ngOnInit(): void {
    this.pageSize.set(8);
    super.ngOnInit();
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
  }

  submitSearch(): void {
    this.applyMobileFilters();
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.applyMobileFilters();
  }

  setSort(option: MobileSortOption): void {
    this.selectedSort.set(option);
    this.applyMobileFilters();
  }

  toggleCategory(category: string): void {
    const selected = this.selectedCategories();
    if (selected.includes(category)) {
      this.selectedCategories.set(selected.filter(item => item !== category));
    } else {
      this.selectedCategories.set([...selected, category]);
    }
    this.applyMobileFilters();
  }

  toggleCategoryFromSheet(checked: boolean, category: string): void {
    const selected = this.selectedCategories();
    if (checked && !selected.includes(category)) {
      this.selectedCategories.set([...selected, category]);
    }
    if (!checked) {
      this.selectedCategories.set(selected.filter(item => item !== category));
    }
  }

  isCategorySelected(category: string): boolean {
    return this.selectedCategories().includes(category);
  }

  openFilters(): void {
    this.filtersOpen.set(true);
  }

  closeFilters(): void {
    this.filtersOpen.set(false);
  }

  applySheetFilters(): void {
    this.applyMobileFilters();
    this.closeFilters();
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.selectedCategories.set([]);
    this.selectedSort.set(this.sortOptions[0]);
    this.applyMobileFilters();
    this.closeFilters();
  }

  loadNextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.onPageChange(this.currentPage() + 1);
    }
  }

  loadPreviousPage(): void {
    if (this.currentPage() > 1) {
      this.onPageChange(this.currentPage() - 1);
    }
  }

  imageUrl(product: Product): string {
    return product.images?.[0]?.url || '';
  }

  stockLabel(product: Product): string {
    if (!product.quantity || product.quantity <= 0) return 'Out of stock';
    if (product.quantity <= (product.lowStockAlert || 5)) return 'Low stock';
    return 'In stock';
  }

  stockTone(product: Product): 'danger' | 'warn' | 'good' {
    if (!product.quantity || product.quantity <= 0) return 'danger';
    if (product.quantity <= (product.lowStockAlert || 5)) return 'warn';
    return 'good';
  }

  private applyMobileFilters(): void {
    const sort = this.selectedSort();
    this.applyFilters({
      searchQuery: this.searchQuery().trim(),
      selectedCategories: this.selectedCategories(),
      selectedPriceRange: this.priceRange(),
      selectedCommissionRange: this.commissionRange(),
      sortBy: sort.sortBy,
      sortDirection: sort.sortDirection,
    });
  }
}
