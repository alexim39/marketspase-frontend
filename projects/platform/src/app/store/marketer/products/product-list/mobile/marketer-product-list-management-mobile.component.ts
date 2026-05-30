import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Product } from '../../../../models';
import { CurrencyUtilsPipe, TruncatePipe } from '@shared/services';
import { DialogService } from '../../../../shared/services/dialog.service';
import { ProductService } from '../../product.service';
import { MarketerProductListManagementComponent } from '../marketer-product-list-management/marketer-product-list-management.component';

type MobileStatusFilter = 'all' | 'published' | 'unpublished' | 'low-stock' | 'out-of-stock';

@Component({
  selector: 'app-marketer-product-list-management-mobile',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    RouterModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CurrencyUtilsPipe,
    TruncatePipe,
  ],
  providers: [ProductService, DialogService],
  templateUrl: './marketer-product-list-management-mobile.component.html',
  styleUrls: ['./marketer-product-list-management-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketerProductListManagementMobileComponent extends MarketerProductListManagementComponent {
  readonly filtersOpen = signal(false);
  readonly actionProduct = signal<Product | null>(null);
  readonly statusFilter = signal<MobileStatusFilter>('all');

  readonly activeProducts = computed(() => this.products().filter(product => product.isActive).length);
  readonly publishedProducts = computed(() => this.products().filter(product => product.isPublished).length);

  readonly mobileFilteredProducts = computed(() => {
    const status = this.statusFilter();
    const lowStock = new Set(this.lowStockProducts().map(product => product._id));
    const outOfStock = new Set(this.outOfStockProducts().map(product => product._id));

    return this.filteredProducts().filter(product => {
      if (status === 'published') return !!product.isPublished;
      if (status === 'unpublished') return !product.isPublished;
      if (status === 'low-stock') return lowStock.has(product._id);
      if (status === 'out-of-stock') return outOfStock.has(product._id);
      return true;
    });
  });

  readonly mobilePaginatedProducts = computed(() => {
    const startIndex = this.currentPage() * this.pageSize();
    return this.mobileFilteredProducts().slice(startIndex, startIndex + this.pageSize());
  });

  readonly pageStart = computed(() => {
    if (this.mobileFilteredProducts().length === 0) return 0;
    return this.currentPage() * this.pageSize() + 1;
  });

  readonly pageEnd = computed(() => {
    return Math.min((this.currentPage() + 1) * this.pageSize(), this.mobileFilteredProducts().length);
  });

  readonly hasPreviousPage = computed(() => this.currentPage() > 0);
  readonly hasNextPage = computed(() => this.pageEnd() < this.mobileFilteredProducts().length);

  setStatusFilter(status: MobileStatusFilter): void {
    this.statusFilter.set(status);
    this.currentPage.set(0);
    this.clearSelection();
  }

  openFilters(): void {
    this.filtersOpen.set(true);
  }

  closeFilters(): void {
    this.filtersOpen.set(false);
  }

  openActions(product: Product): void {
    this.actionProduct.set(product);
  }

  closeActions(): void {
    this.actionProduct.set(null);
  }

  override clearFilters(): void {
    super.clearFilters();
    this.statusFilter.set('all');
  }

  goToPreviousPage(): void {
    if (!this.hasPreviousPage()) return;
    this.currentPage.update(page => page - 1);
    this.clearSelection();
  }

  goToNextPage(): void {
    if (!this.hasNextPage()) return;
    this.currentPage.update(page => page + 1);
    this.clearSelection();
  }

  isAllVisibleSelected(): boolean {
    const visible = this.mobilePaginatedProducts();
    return visible.length > 0 && visible.every(product => this.selection.isSelected(product));
  }

  toggleVisibleSelection(): void {
    const visible = this.mobilePaginatedProducts();

    if (this.isAllVisibleSelected()) {
      visible.forEach(product => this.selection.deselect(product));
    } else {
      visible.forEach(product => this.selection.select(product));
    }

    this.selectedProducts = this.selection.selected;
  }

  selectProductFromSheet(product: Product): void {
    this.toggleProductSelection(product);
    this.closeActions();
  }

  publishProductFromSheet(product: Product): void {
    if (product.isPublished) return;
    this.selection.clear();
    this.selection.select(product);
    this.selectedProducts = this.selection.selected;
    this.closeActions();
    this.publishedSelectedForPromotion();
  }

  unpublishProductFromSheet(product: Product): void {
    this.closeActions();
    void this.unpublishProduct(product);
  }

  deleteProductFromSheet(product: Product): void {
    this.closeActions();
    void this.deleteProduct(product);
  }

  commissionLabel(product: Product): string {
    const promotion = product.promotion;
    const affiliate = product.affiliate;

    if (promotion?.commissionType === 'fixed' && promotion.fixedCommission) {
      return `${product.currency || 'NGN'} ${promotion.fixedCommission.toLocaleString()} per sale`;
    }

    if (affiliate?.commissionType === 'fixed' && affiliate.fixedCommission) {
      return `${product.currency || 'NGN'} ${affiliate.fixedCommission.toLocaleString()} per sale`;
    }

    const rate = promotion?.commissionRate ?? affiliate?.commissionRate ?? 0;
    return rate > 0 ? `${rate}% commission` : 'No commission set';
  }

  productImage(product: Product): string | null {
    return product.images?.[0]?.thumbnail || product.images?.[0]?.url || null;
  }

  stockPercent(product: Product): number {
    const alertLevel = Math.max(product.lowStockAlert || 10, 1);
    return Math.min(100, Math.round((product.quantity / (alertLevel * 3)) * 100));
  }

  conversionRate(product: Product): number {
    const clicks = product.promotion?.clickCount || 0;
    const conversions = product.promotion?.conversions || product.purchaseCount || 0;
    if (!clicks) return 0;
    return Math.round((conversions / clicks) * 1000) / 10;
  }
}
