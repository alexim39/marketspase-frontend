import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CurrencyUtilsPipe, TruncatePipe } from '@shared/services';
import { StorefrontComponent } from '../storefront.component';
import { StorefrontService } from '../services/storefront.service';
import { ShareService } from '../../store/services/share.service';
import { StoreFooterComponent } from '../core/store-footer/store-footer.component';
import { StorefrontChatComponent } from '../components/storefront-chat/storefront-chat.component';
import { Product, Store } from '../../store/models';

@Component({
  selector: 'app-mobile-storefront',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    CurrencyUtilsPipe,
    TruncatePipe,
    StoreFooterComponent,
    StorefrontChatComponent,
  ],
  providers: [StorefrontService, ShareService],
  templateUrl: './storefront-mobile.component.html',
  styleUrls: ['./storefront-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MobileStorefrontComponent extends StorefrontComponent {
  readonly filtersOpen = signal(false);
  readonly mobilePageSize = signal(8);

  readonly visibleProducts = computed(() => {
    const limit = this.currentPage() * this.mobilePageSize();
    return this.matchingProducts().slice(0, limit);
  });

  readonly hasMoreProducts = computed(() => this.visibleProducts().length < this.matchingProducts().length);

  readonly storeHeroImage = computed(() => {
    const store = this.store() as (Store & { coverImage?: string }) | null;
    return store?.coverImage || store?.logo || '';
  });

  readonly mobileStats = computed(() => {
    const stats = this.storeStats();
    return [
      { label: 'Products', value: stats.productCount, icon: 'inventory_2' },
      { label: 'Sales', value: stats.totalSales, icon: 'shopping_bag' },
      { label: 'Views', value: stats.totalViews, icon: 'visibility' }
    ];
  });

  readonly activeFilterCount = computed(() => {
    let count = 0;
    if (this.selectedCategory()) count++;
    if (this.featuredOnly()) count++;
    if (this.availability() !== 'all') count++;
    if (this.ratingFilter() > 0) count++;
    if (this.tagsFilter().length) count += this.tagsFilter().length;
    if (this.brandFilter().length) count += this.brandFilter().length;
    const [min, max] = this.priceRange();
    if (min !== this.minPrice() || max !== this.maxPrice()) count++;
    return count;
  });

  readonly topCategories = computed(() => this.categories().slice(0, 8));

  loadMoreProducts(): void {
    if (!this.hasMoreProducts()) return;
    this.currentPage.set(this.currentPage() + 1);
  }

  openFilters(): void {
    this.filtersOpen.set(true);
  }

  closeFilters(): void {
    this.filtersOpen.set(false);
  }

  applyMobileFilters(): void {
    this.currentPage.set(1);
    this.closeFilters();
  }

  setMobileSort(sort: string): void {
    this.sortControl.setValue(sort);
    this.currentPage.set(1);
  }

  setMobileAvailability(value: 'all' | 'in-stock' | 'out-of-stock'): void {
    this.availability.set(value);
    this.currentPage.set(1);
  }

  toggleFeaturedMobile(): void {
    this.featuredOnly.set(!this.featuredOnly());
    this.currentPage.set(1);
  }

  goBack(): void {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    this.router.navigate(['/']);
  }

  productImage(product: Product): string {
    return product.images?.[0]?.url || 'assets/images/product-placeholder.svg';
  }

  productStockTone(product: Product): 'good' | 'warn' | 'bad' {
    const status = this.getProductStatus(product);
    if (status === 'out-of-stock') return 'bad';
    if (status === 'low-stock') return 'warn';
    return 'good';
  }

  storeLocation(): string {
    const store = this.store() as any;
    const city = store?.address?.city;
    const country = store?.address?.country;
    return [city, country].filter(Boolean).join(', ');
  }

  storeEmail(): string {
    const store = this.store() as any;
    return store?.email || store?.owner?.email || '';
  }
}
