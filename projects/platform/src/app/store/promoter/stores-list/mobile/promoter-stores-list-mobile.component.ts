import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CurrencyUtilsPipe } from '@shared/services';
import { Store, StoreListService } from '../stores-list.service';
import { PromoterStoresListComponent } from '../promoter-stores-list.component';

type StoreBrowserSheet = 'filters' | 'sort' | 'insights' | null;

@Component({
  selector: 'app-promoter-stores-list-mobile',
  standalone: true,
  providers: [StoreListService],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CurrencyUtilsPipe,
  ],
  templateUrl: './promoter-stores-list-mobile.component.html',
  styleUrls: ['./promoter-stores-list-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromoterStoresListMobileComponent extends PromoterStoresListComponent {
  private readonly mobileRouter = inject(Router);

  readonly activeSheet = signal<StoreBrowserSheet>(null);

  readonly activeFilterCount = computed(() => {
    const filters = this.currentFilters();
    return filters.selectedCategories.length
      + filters.selectedVerificationTiers.length
      + (filters.minProducts > 0 ? 1 : 0)
      + (filters.searchQuery ? 1 : 0);
  });

  readonly followedStoresCount = computed(() => this.stores().filter(store => store.isFollowing).length);
  readonly premiumStores = computed(() => this.stores().filter(store => store.verificationTier === 'premium').slice(0, 4));
  readonly topStores = computed(() => [...this.stores()].sort((a, b) => (b.productCount || 0) - (a.productCount || 0)).slice(0, 3));

  openSheet(sheet: StoreBrowserSheet): void {
    this.activeSheet.set(sheet);
  }

  closeSheet(): void {
    this.activeSheet.set(null);
  }

  storeInitials(store: Store): string {
    return (store.name || 'Store')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('');
  }

  toggleCategory(category: string): void {
    const filters = this.currentFilters();
    const selected = filters.selectedCategories.includes(category)
      ? filters.selectedCategories.filter(value => value !== category)
      : [...filters.selectedCategories, category];

    this.applyFilters({ selectedCategories: selected });
  }

  toggleVerificationTier(tier: string): void {
    const filters = this.currentFilters();
    const selected = filters.selectedVerificationTiers.includes(tier)
      ? filters.selectedVerificationTiers.filter(value => value !== tier)
      : [...filters.selectedVerificationTiers, tier];

    this.applyFilters({ selectedVerificationTiers: selected });
  }

  updateSort(sortBy: 'name' | 'rating' | 'productCount' | 'totalViews' | 'createdAt', sortOrder: 'asc' | 'desc' = 'desc'): void {
    this.applyFilters({ sortBy, sortOrder });
    this.closeSheet();
  }

  updateMinimumProducts(value: string): void {
    const minProducts = Number(value) || 0;
    this.applyFilters({ minProducts });
  }

  browseProducts(store: Store): void {
    this.mobileRouter.navigate(['/dashboard/stores/store', store._id, 'products']);
  }

  openPublicStore(store: Store): void {
    this.mobileRouter.navigate(['/store', store.storeLink]);
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.onPageChange(this.currentPage() + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.onPageChange(this.currentPage() - 1);
    }
  }

  bestCommission(store: Store): number {
    return Math.max(...(store.productPreview || []).map(product => product.promotion?.commissionRate || 0), 0);
  }

  trackStore(index: number, store: Store): string {
    return store._id || store.name || String(index);
  }

  trackCategory(index: number, category: { name: string }): string {
    return category.name || String(index);
  }

  trackProduct(index: number, product: { _id: string; name: string }): string {
    return product._id || product.name || String(index);
  }
}
