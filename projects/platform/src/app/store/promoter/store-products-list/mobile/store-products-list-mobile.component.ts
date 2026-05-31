import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CurrencyUtilsPipe } from '@shared/services';
import { Product } from '../../../models';
import { PromotionService } from '../../services/promotion.service';
import { StoreProductsListComponent } from '../store-products-list.component';

type MobileSheet = 'filters' | 'sort' | null;
type MobileSort = 'newest' | 'oldest' | 'price_low' | 'price_high' | 'name' | 'popularity' | 'bestselling' | 'discount';

interface MobileStat {
  icon: string;
  label: string;
  value: string;
}

@Component({
  selector: 'app-store-products-list-mobile',
  standalone: true,
  providers: [PromotionService],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CurrencyUtilsPipe,
  ],
  templateUrl: './store-products-list-mobile.component.html',
  styleUrls: ['./store-products-list-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoreProductsListMobileComponent extends StoreProductsListComponent {
  readonly activeSheet = signal<MobileSheet>(null);
  readonly priceDraft = signal({ min: '', max: '' });
  readonly commissionDraft = signal({ min: '', max: '' });

  readonly quickCategories = computed(() => this.categories().slice(0, 8));

  readonly activeFilterCount = computed(() => {
    let count = 0;
    if (this.searchQuery()) count += 1;
    if (this.selectedCategory()) count += 1;
    if (this.inStockOnly()) count += 1;
    if (this.minPrice() !== null || this.maxPrice() !== null) count += 1;
    if (this.minCommission() !== null || this.maxCommission() !== null) count += 1;
    return count;
  });

  readonly storeStats = computed<MobileStat[]>(() => [
    {
      icon: 'inventory_2',
      label: 'Products',
      value: this.formatNumber(this.totalProducts()),
    },
    {
      icon: 'category',
      label: 'Categories',
      value: this.formatNumber(this.categories().length),
    },
    {
      icon: 'payments',
      label: 'Avg. price',
      value: this.moneyCompact(this.priceRange().avgPrice),
    },
    {
      icon: 'trending_up',
      label: 'Avg. comm.',
      value: `${Math.round(this.commissionRange().avgCommission || 0)}%`,
    },
  ]);

  readonly sortOptions: Array<{ value: MobileSort; label: string; icon: string }> = [
    { value: 'newest', label: 'Newest first', icon: 'fiber_new' },
    { value: 'oldest', label: 'Oldest first', icon: 'history' },
    { value: 'price_low', label: 'Lowest price', icon: 'south' },
    { value: 'price_high', label: 'Highest price', icon: 'north' },
    { value: 'name', label: 'Name', icon: 'sort_by_alpha' },
    { value: 'popularity', label: 'Popular', icon: 'local_fire_department' },
    { value: 'bestselling', label: 'Best selling', icon: 'workspace_premium' },
    { value: 'discount', label: 'Biggest discount', icon: 'sell' },
  ];

  openSheet(sheet: Exclude<MobileSheet, null>): void {
    this.priceDraft.set({
      min: this.minPrice()?.toString() || '',
      max: this.maxPrice()?.toString() || '',
    });
    this.commissionDraft.set({
      min: this.minCommission()?.toString() || '',
      max: this.maxCommission()?.toString() || '',
    });
    this.activeSheet.set(sheet);
  }

  closeSheet(): void {
    this.activeSheet.set(null);
  }

  updateSearch(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
    void this.loadProducts();
  }

  toggleStockOnly(): void {
    this.inStockOnly.update(value => !value);
    this.applyFilters();
  }

  selectSort(sort: MobileSort): void {
    this.onSortChange(sort);
    this.closeSheet();
  }

  applyAdvancedFilters(): void {
    const price = this.priceDraft();
    const commission = this.commissionDraft();
    this.minPrice.set(price.min ? Number(price.min) : null);
    this.maxPrice.set(price.max ? Number(price.max) : null);
    this.minCommission.set(commission.min ? Number(commission.min) : null);
    this.maxCommission.set(commission.max ? Number(commission.max) : null);
    this.applyFilters();
    this.closeSheet();
  }

  clearMobileFilters(): void {
    this.priceDraft.set({ min: '', max: '' });
    this.commissionDraft.set({ min: '', max: '' });
    this.clearFilters();
    this.closeSheet();
  }

  async loadNextPage(): Promise<void> {
    if (this.currentPage() >= this.totalPages()) return;
    this.currentPage.update(page => page + 1);
    await this.loadProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async loadPreviousPage(): Promise<void> {
    if (this.currentPage() <= 1) return;
    this.currentPage.update(page => page - 1);
    await this.loadProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  primaryImage(product: Product): string | null {
    return product.images?.[0]?.url || null;
  }

  commissionText(product: Product): string {
    const promotion = product.promotion;
    if (!promotion) return 'Promo ready';
    if (promotion.commissionType === 'fixed') {
      return `NGN ${Number(promotion.fixedCommission || promotion.commissionPerSale || 0).toLocaleString('en-NG')}`;
    }
    return `${promotion.commissionRate || 0}% commission`;
  }

  stockTone(product: Product): 'good' | 'warn' | 'bad' {
    if ((product.quantity || 0) <= 0) return 'bad';
    if ((product.quantity || 0) <= (product.lowStockAlert || 5)) return 'warn';
    return 'good';
  }

  trackCategory(index: number, category: { name: string }): string {
    return category.name || String(index);
  }

  trackStat(index: number, stat: MobileStat): string {
    return stat.label || String(index);
  }

  private formatNumber(value: number): string {
    return Number(value || 0).toLocaleString('en-NG');
  }

  private moneyCompact(value: number): string {
    if (!value) return 'NGN 0';
    return `NGN ${Math.round(value).toLocaleString('en-NG')}`;
  }
}
