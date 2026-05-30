import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { CurrencyUtilsPipe } from '@shared/services';
import { StoreService } from '../../../services/store.service';
import { MarketerPromotedProductsAnalyticsComponent } from '../marketer-promoted-products-analytics.component';
import {
  PromotedProductRow,
  PromotedProductsAnalyticsService,
  PromotedProductsTrendPoint,
} from '../promoted-products-analytics.service';

@Component({
  selector: 'app-marketer-promoted-products-analytics-mobile',
  standalone: true,
  providers: [PromotedProductsAnalyticsService, StoreService, ...provideNativeDateAdapter()],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    CurrencyUtilsPipe,
  ],
  templateUrl: './marketer-promoted-products-analytics-mobile.component.html',
  styleUrls: ['./marketer-promoted-products-analytics-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketerPromotedProductsAnalyticsMobileComponent extends MarketerPromotedProductsAnalyticsComponent {
  readonly rangeOptions = [
    { label: '7D', value: 7 },
    { label: '30D', value: 30 },
    { label: '90D', value: 90 },
  ];

  readonly visibleSeries = computed(() => {
    const points = this.series().slice(-7) as PromotedProductsTrendPoint[];
    const maxRevenue = Math.max(1, ...points.map((point) => Number(point.revenue || 0)));
    const maxClicks = Math.max(1, ...points.map((point) => Number(point.clicks || 0)));

    return points.map((point: any) => ({
      ...point,
      label: this.shortBucketLabel(point.bucket),
      revenueWidth: Math.max(4, (Number(point.revenue || 0) / maxRevenue) * 100),
      clickWidth: Math.max(4, (Number(point.clicks || 0) / maxClicks) * 100),
    }));
  });

  readonly mobileProducts = computed(() => this.sortedProductRows());
  readonly topProductCards = computed(() => this.topProducts().slice(0, 5));
  readonly topPromoterCards = computed(() => this.topPromoters().slice(0, 5));

  readonly totalPages = computed(() => {
    const page = this.productsPage();
    return Math.max(1, Math.ceil(Number(page.total || 0) / Number(page.limit || 20)));
  });

  setRange(days: number): void {
    this.filtersForm.patchValue({
      rangeDays: days,
      startDate: null,
      endDate: null,
      page: 1,
    });
  }

  resetMobileFilters(): void {
    this.filtersForm.reset({
      rangeDays: 7,
      startDate: null,
      endDate: null,
      storeId: '',
      category: '',
      product: null,
      promoter: null,
      search: '',
      page: 1,
      limit: 20,
    });
  }

  goToProductPage(direction: 'previous' | 'next'): void {
    const page = this.productsPage();
    const currentPage = Number(page.page || 1);
    const pageSize = Number(page.limit || 20);
    const total = Number(page.total || 0);
    const nextPage = direction === 'next' ? currentPage + 1 : currentPage - 1;

    if (nextPage < 1 || nextPage > this.totalPages()) return;

    this.onPage({
      pageIndex: nextPage - 1,
      pageSize,
      length: total,
    } as PageEvent);
  }

  productHealth(row: PromotedProductRow): 'good' | 'warn' | 'bad' {
    const conversionRate = Number(row.range?.conversionRate || 0);
    const clicks = Number(row.range?.clicks || 0);
    const paidOrders = Number(row.range?.paidOrders || 0);

    if (clicks >= 30 && paidOrders === 0) return 'bad';
    if (conversionRate >= 2) return 'good';
    if (clicks >= 20 && conversionRate < 1) return 'warn';
    return 'good';
  }

  productHealthLabel(row: PromotedProductRow): string {
    const health = this.productHealth(row);
    if (health === 'bad') return 'Needs action';
    if (health === 'warn') return 'Watch';
    return 'Healthy';
  }

  private shortBucketLabel(bucket: string): string {
    const date = new Date(bucket);
    if (Number.isNaN(date.getTime())) return bucket;
    return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
  }
}
