import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CurrencyUtilsPipe } from '@shared/services';
import { StoreService } from '../../../../services/store.service';
import { Product } from '../../../../models';
import { Store } from '../../../../models/store.model';
import { MarketerStoreDashboardComponent } from '../store-dashboard.component';

type DashboardSheet = 'stores' | 'filters' | 'actions' | 'health' | null;

@Component({
  selector: 'app-marketer-store-dashboard-mobile',
  standalone: true,
  providers: [StoreService],
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CurrencyUtilsPipe,
  ],
  templateUrl: './store-dashboard-mobile.component.html',
  styleUrls: ['./store-dashboard-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketerStoreDashboardMobileComponent extends MarketerStoreDashboardComponent {
  readonly activeSheet = signal<DashboardSheet>(null);

  openSheet(sheet: DashboardSheet): void {
    this.activeSheet.set(sheet);
  }

  closeSheet(): void {
    this.activeSheet.set(null);
  }

  storeInitials(store: Store | null | undefined = this.currentStore()): string {
    const name = store?.name || 'Store';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('');
  }

  revenueValue(): number {
    return this.currentStore()?.analytics?.salesData?.totalRevenue || 0;
  }

  productHealthPercent(): number {
    const products = this.products() || [];
    if (!products.length) return 0;
    return Math.round((products.filter(product => product.isActive).length / products.length) * 100);
  }

  topProducts(): Product[] {
    return [...(this.products() || [])]
      .sort((a, b) => ((b.purchaseCount || 0) + (b.viewCount || 0)) - ((a.purchaseCount || 0) + (a.viewCount || 0)))
      .slice(0, 5);
  }

  urgentStockProducts(): Array<Product & { severity?: string }> {
    return this.lowStockProducts().slice(0, 5);
  }

  selectStoreFromSheet(store: Store): void {
    if (!store._id) return;
    this.manageStore(store._id);
    this.closeSheet();
  }

  applyCategory(category: string): void {
    this.onCategoryChange(category);
    this.closeSheet();
  }

  clearProductFilters(): void {
    this.onSearch('');
    this.onCategoryChange('all');
    this.closeSheet();
  }

  openStoreProducts(): void {
    const store = this.currentStore();
    if (store?._id) {
      this.viewStoreProducts(store._id);
    }
  }

  trackStore(index: number, store: Store): string {
    return store._id || store.name || String(index);
  }

  trackProduct(index: number, product: Product): string {
    return product._id || product.name || String(index);
  }
}
