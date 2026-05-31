import { Component, DestroyRef, TemplateRef, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { debounceTime, distinctUntilChanged, timer } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  StorefrontAnalyticsService,
  StorefrontAnalyticsOverviewResponse,
  StorefrontCategoryRow,
  StorefrontProductOption,
  StorefrontProductPromoterBreakdownResponse,
  StorefrontPromoterProductBreakdownResponse,
  StorefrontStoreOption,
  StorefrontTopProductRow,
  StorefrontTopPromoterRow,
} from './storefront-analytics.service';
import { Router, RouterModule } from '@angular/router';

type TrendView = 'daily' | 'weekly';

@Component({
  selector: 'admin-storefront-analytics',
  standalone: true,
  providers: [StorefrontAnalyticsService, DatePipe, CurrencyPipe, ...provideNativeDateAdapter()],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTableModule,
    MatSortModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatAutocompleteModule,
    MatMenuModule,
    MatButtonToggleModule,
  ],
  templateUrl: './storefront-analytics.component.html',
  styleUrls: ['./storefront-analytics.component.scss'],
})
export class StorefrontAnalyticsComponent {
  private readonly service = inject(StorefrontAnalyticsService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  @ViewChild('productBreakdownDialog') productBreakdownDialog!: TemplateRef<unknown>;
  @ViewChild('promoterBreakdownDialog') promoterBreakdownDialog!: TemplateRef<unknown>;

  readonly isLoading = signal(true);
  readonly isLoadingFilters = signal(true);
  readonly isLoadingBreakdown = signal(false);

  readonly overview = signal<StorefrontAnalyticsOverviewResponse['data'] | null>(null);
  readonly lastRefreshedAt = signal<Date | null>(null);

  readonly categories = signal<string[]>([]);
  readonly storeOptions = signal<StorefrontStoreOption[]>([]);
  readonly productOptions = signal<StorefrontProductOption[]>([]);

  readonly trendView = signal<TrendView>('daily');

  readonly topProductsSort = signal<Sort>({ active: 'revenue', direction: 'desc' });
  readonly topPromotersSort = signal<Sort>({ active: 'revenue', direction: 'desc' });

  readonly filtersForm = this.fb.group({
    rangeDays: [7],
    startDate: [null as Date | null],
    endDate: [null as Date | null],
    store: [null as StorefrontStoreOption | string | null],
    category: [''],
    product: [null as StorefrontProductOption | string | null],
    promoterId: [''],
    buyerCountry: [''],
    buyerState: [''],
  });

  readonly summaryCards = computed(() => {
    const summary = this.overview()?.summary;
    if (!summary) return [];

    return [
      { label: 'Gross sales', value: summary.grossSales, icon: 'payments', tone: 'primary', format: 'currency' as const },
      { label: 'Units sold', value: summary.unitsSold, icon: 'inventory_2', tone: 'neutral', format: 'number' as const },
      { label: 'Paid orders', value: summary.paidOrders, icon: 'receipt_long', tone: 'neutral', format: 'number' as const },
      { label: 'Pending fulfillment', value: summary.pendingOrders, icon: 'local_shipping', tone: 'warn', format: 'number' as const },
      { label: 'Unique buyers', value: summary.uniqueBuyers, icon: 'groups', tone: 'neutral', format: 'number' as const },
      { label: 'Unique promoters', value: summary.uniquePromoters, icon: 'group', tone: 'neutral', format: 'number' as const },
      { label: 'Commission pending', value: summary.commissionPending, icon: 'account_balance_wallet', tone: summary.commissionPending > 0 ? 'warn' : 'neutral', format: 'currency' as const },
    ];
  });

  readonly alerts = computed(() => this.overview()?.alerts ?? []);

  readonly series = computed(() => {
    const view = this.trendView();
    const data = this.overview()?.timeSeries;
    if (!data) return [];
    return view === 'weekly' ? (data.weekly ?? []) : (data.daily ?? []);
  });

  readonly revenueSparkline = computed(() => {
    const points = this.series();
    const values = points.map((p) => Number(p.revenue || 0));
    const max = Math.max(1, ...values);
    return { points: this.buildSparklinePoints(values, 720, 140, max), max };
  });

  readonly ordersSparkline = computed(() => {
    const points = this.series();
    const values = points.map((p) => Number(p.orders || 0));
    const max = Math.max(1, ...values);
    return { points: this.buildSparklinePoints(values, 720, 140, max), max };
  });

  readonly categoryRows = computed(() => (this.overview()?.categoryBreakdown ?? []).slice());

  readonly sortedCategoryRows = computed(() => {
    const rows = this.categoryRows();
    return [...rows].sort((a, b) => Number(b.revenue || 0) - Number(a.revenue || 0));
  });

  readonly sortedTopProducts = computed(() => {
    const rows = (this.overview()?.topProducts ?? []) as StorefrontTopProductRow[];
    const sort = this.topProductsSort();
    return this.sortRows(rows, sort, (row, key) => {
      if (key === 'product') return (row.product?.name || '').toLowerCase();
      if (key === 'store') return (row.store?.name || '').toLowerCase();
      if (key === 'units') return Number(row.units || 0);
      if (key === 'commission') return Number(row.commission || 0);
      return Number(row.revenue || 0);
    });
  });

  readonly sortedTopPromoters = computed(() => {
    const rows = (this.overview()?.topPromoters ?? []) as StorefrontTopPromoterRow[];
    const sort = this.topPromotersSort();
    return this.sortRows(rows, sort, (row, key) => {
      if (key === 'promoter') return (row.promoter?.displayName || row.promoter?.email || row.promoterId || '').toLowerCase();
      if (key === 'units') return Number(row.units || 0);
      if (key === 'orders') return Number(row.orders || 0);
      if (key === 'commission') return Number(row.commission || 0);
      if (key === 'commissionPending') return Number(row.commissionPending || 0);
      return Number(row.revenue || 0);
    });
  });

  readonly productBreakdown = signal<StorefrontProductPromoterBreakdownResponse['data'] | null>(null);
  readonly promoterBreakdown = signal<StorefrontPromoterProductBreakdownResponse['data'] | null>(null);
  private breakdownDialogRef: MatDialogRef<unknown> | null = null;

  readonly displayedTopProductColumns: string[] = ['product', 'store', 'revenue', 'units', 'commission', 'topPromoters', 'actions'];
  readonly displayedTopPromoterColumns: string[] = ['promoter', 'revenue', 'orders', 'units', 'commission', 'payout', 'actions'];
  readonly displayedPendingOrderColumns: string[] = ['order', 'store', 'buyer', 'promoters', 'amount', 'status', 'actions'];
  readonly displayedTopStoreColumns: string[] = ['store', 'revenue', 'orders', 'units', 'actions'];

  constructor() {
    this.loadStaticFilters();

    // Initial load + 5-minute refresh loop.
    timer(0, 5 * 60 * 1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refresh());

    // Filter changes.
    this.filtersForm.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(250),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      )
      .subscribe(() => this.refresh());

    this.setupStoreAutocomplete();
    this.setupProductAutocomplete();
  }

  refresh(): void {
    this.loadOverview();
  }

  setTrendView(view: TrendView): void {
    this.trendView.set(view);
  }

  onTopProductsSort(sort: Sort): void {
    this.topProductsSort.set(sort);
  }

  onTopPromotersSort(sort: Sort): void {
    this.topPromotersSort.set(sort);
  }

  clearStore(): void {
    this.filtersForm.patchValue({ store: null, product: null }, { emitEvent: true });
    this.storeOptions.set([]);
    this.productOptions.set([]);
  }

  clearProduct(): void {
    this.filtersForm.patchValue({ product: null }, { emitEvent: true });
    this.productOptions.set([]);
  }

  storeDisplay(value: StorefrontStoreOption | string | null): string {
    if (!value) return '';
    return typeof value === 'string' ? value : value.name;
  }

  productDisplay(value: StorefrontProductOption | string | null): string {
    if (!value) return '';
    return typeof value === 'string' ? value : value.name;
  }

  applyCategory(category: string): void {
    this.filtersForm.patchValue({ category, product: null }, { emitEvent: true });
  }

  openStoreProducts(storeId?: string | null): void {
    if (!storeId) return;
    this.router.navigate(['/dashboard/stores/products', storeId]).catch(() => undefined);
  }

  openUserDetails(userId?: string | null): void {
    if (!userId) return;
    this.router.navigate(['/dashboard/users', userId]).catch(() => undefined);
  }

  async copyText(text: string, message: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.snackBar.open(message, 'OK', { duration: 2400 });
    } catch (error) {
      console.error('Clipboard error:', error);
      this.snackBar.open('Unable to copy to clipboard.', 'OK', { duration: 3200 });
    }
  }

  exportCsv(): void {
    const data = this.overview();
    if (!data) {
      this.snackBar.open('Nothing to export yet.', 'OK', { duration: 2600 });
      return;
    }

    const rows: string[][] = [];
    rows.push(['Marketspase Storefront Analytics']);
    rows.push([`Range start`, data.range.start]);
    rows.push([`Range end`, data.range.end]);
    rows.push([]);

    const s = data.summary;
    rows.push(['Summary']);
    rows.push(['Gross sales', String(s.grossSales || 0)]);
    rows.push(['Units sold', String(s.unitsSold || 0)]);
    rows.push(['Paid orders', String(s.paidOrders || 0)]);
    rows.push(['Pending fulfillment orders', String(s.pendingOrders || 0)]);
    rows.push(['Fulfilled orders', String(s.fulfilledOrders || 0)]);
    rows.push(['Refunded orders', String(s.refundedOrders || 0)]);
    rows.push(['Unique buyers', String(s.uniqueBuyers || 0)]);
    rows.push(['Unique promoters', String(s.uniquePromoters || 0)]);
    rows.push(['Average order value', String(s.averageOrderValue || 0)]);
    rows.push(['Commission accrued', String(s.commissionAccrued || 0)]);
    rows.push(['Commission paid', String(s.commissionPaid || 0)]);
    rows.push(['Commission pending', String(s.commissionPending || 0)]);
    rows.push([]);

    rows.push(['Top categories']);
    rows.push(['Category', 'Revenue', 'Orders', 'Units', 'Products']);
    for (const row of data.categoryBreakdown || []) {
      rows.push([row.category || '', String(row.revenue || 0), String(row.orders || 0), String(row.units || 0), String(row.products || 0)]);
    }
    rows.push([]);

    rows.push(['Top products']);
    rows.push(['Product', 'Category', 'Store', 'Revenue', 'Units', 'Commission', 'Top promoters']);
    for (const row of data.topProducts || []) {
      const promoterNames = (row.topPromoters || [])
        .map((p) => p.promoter?.displayName || p.promoter?.email || p.promoterId || '')
        .filter(Boolean)
        .join(' | ');
      rows.push([
        row.product?.name || '',
        row.product?.category || '',
        row.store?.name || '',
        String(row.revenue || 0),
        String(row.units || 0),
        String(row.commission || 0),
        promoterNames,
      ]);
    }
    rows.push([]);

    rows.push(['Top promoters']);
    rows.push(['Promoter', 'Promoter ID', 'Revenue', 'Orders', 'Units', 'Commission', 'Commission paid', 'Commission pending']);
    for (const row of data.topPromoters || []) {
      rows.push([
        row.promoter?.displayName || row.promoter?.email || '',
        row.promoterId || '',
        String(row.revenue || 0),
        String(row.orders || 0),
        String(row.units || 0),
        String(row.commission || 0),
        String(row.commissionPaid || 0),
        String(row.commissionPending || 0),
      ]);
    }

    const csv = rows.map((r) => r.map((v) => `"${String(v ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `storefront-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  exportPdf(): void {
    // We rely on the browser print dialog (admins can save as PDF).
    window.print();
  }

  closeBreakdownDialog(): void {
    this.breakdownDialogRef?.close();
    this.breakdownDialogRef = null;
  }

  openProductBreakdown(row: StorefrontTopProductRow): void {
    const productId = row.product?._id;
    if (!productId) return;

    const filters = this.filtersForm.getRawValue();
    const store = filters.store && typeof filters.store !== 'string' ? filters.store : null;

    this.isLoadingBreakdown.set(true);
    this.productBreakdown.set(null);
    this.breakdownDialogRef = this.dialog.open(this.productBreakdownDialog, {
      width: '920px',
      maxWidth: '96vw',
      autoFocus: false,
    });

    this.service
      .getProductPromoterBreakdown({
        startDate: filters.startDate,
        endDate: filters.endDate,
        range: filters.rangeDays,
        storeId: store?._id || null,
        productId,
        buyerCountry: filters.buyerCountry?.trim() || null,
        buyerState: filters.buyerState?.trim() || null,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          if (!resp?.success) {
            this.snackBar.open(resp?.message || 'Failed to load breakdown', 'OK', { duration: 3200 });
            this.isLoadingBreakdown.set(false);
            return;
          }
          this.productBreakdown.set(resp.data);
          this.isLoadingBreakdown.set(false);
        },
        error: (err) => {
          console.error('Product breakdown error:', err);
          this.snackBar.open('Unable to load product breakdown.', 'OK', { duration: 3600 });
          this.isLoadingBreakdown.set(false);
        },
      });
  }

  openPromoterBreakdown(row: StorefrontTopPromoterRow): void {
    const promoterId = row.promoterId;
    if (!promoterId) return;

    const filters = this.filtersForm.getRawValue();
    const store = filters.store && typeof filters.store !== 'string' ? filters.store : null;

    this.isLoadingBreakdown.set(true);
    this.promoterBreakdown.set(null);
    this.breakdownDialogRef = this.dialog.open(this.promoterBreakdownDialog, {
      width: '980px',
      maxWidth: '96vw',
      autoFocus: false,
    });

    this.service
      .getPromoterProductBreakdown({
        startDate: filters.startDate,
        endDate: filters.endDate,
        range: filters.rangeDays,
        storeId: store?._id || null,
        promoterId,
        buyerCountry: filters.buyerCountry?.trim() || null,
        buyerState: filters.buyerState?.trim() || null,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          if (!resp?.success) {
            this.snackBar.open(resp?.message || 'Failed to load breakdown', 'OK', { duration: 3200 });
            this.isLoadingBreakdown.set(false);
            return;
          }
          this.promoterBreakdown.set(resp.data);
          this.isLoadingBreakdown.set(false);
        },
        error: (err) => {
          console.error('Promoter breakdown error:', err);
          this.snackBar.open('Unable to load promoter breakdown.', 'OK', { duration: 3600 });
          this.isLoadingBreakdown.set(false);
        },
      });
  }

  private loadStaticFilters(): void {
    this.isLoadingFilters.set(true);
    this.service
      .listCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          if (resp?.success) {
            this.categories.set(resp.data || []);
          }
          this.isLoadingFilters.set(false);
        },
        error: (err) => {
          console.error('Failed to load storefront categories:', err);
          this.isLoadingFilters.set(false);
        },
      });
  }

  private loadOverview(): void {
    this.isLoading.set(true);
    const filters = this.filtersForm.getRawValue();
    const store = filters.store && typeof filters.store !== 'string' ? filters.store : null;
    const product = filters.product && typeof filters.product !== 'string' ? filters.product : null;
    const category = filters.category?.trim() || null;
    const promoterId = filters.promoterId?.trim() || null;

    this.service
      .getOverview({
        startDate: filters.startDate,
        endDate: filters.endDate,
        range: filters.rangeDays,
        storeId: store?._id || null,
        category,
        productId: product?._id || null,
        promoterId,
        buyerCountry: filters.buyerCountry?.trim() || null,
        buyerState: filters.buyerState?.trim() || null,
        timezone: 'Africa/Lagos',
        topLimit: 15,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          if (!resp?.success) {
            this.snackBar.open(resp?.message || 'Failed to load storefront analytics', 'OK', { duration: 3200 });
            this.isLoading.set(false);
            return;
          }

          this.overview.set(resp.data);
          this.lastRefreshedAt.set(new Date());
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Storefront analytics overview error:', err);
          this.snackBar.open('Unable to load storefront analytics.', 'OK', { duration: 3600 });
          this.isLoading.set(false);
        },
      });
  }

  private setupStoreAutocomplete(): void {
    this.filtersForm.controls.store.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(250),
        distinctUntilChanged(),
      )
      .subscribe((value) => {
        if (value && typeof value !== 'string') {
          // Selected.
          this.storeOptions.set([value]);
          // Clear dependent product selection.
          this.filtersForm.patchValue({ product: null }, { emitEvent: false });
          this.productOptions.set([]);
          return;
        }

        const query = String(value || '').trim();
        if (query.length < 2) {
          this.storeOptions.set([]);
          return;
        }

        this.service
          .searchStores({ query, limit: 15 })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (resp) => {
              if (resp?.success) this.storeOptions.set(resp.data || []);
            },
            error: (err) => console.error('Store options error:', err),
          });
      });
  }

  private setupProductAutocomplete(): void {
    this.filtersForm.controls.product.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(250),
        distinctUntilChanged(),
      )
      .subscribe((value) => {
        if (value && typeof value !== 'string') {
          this.productOptions.set([value]);
          return;
        }

        const query = String(value || '').trim();
        if (query.length < 2) {
          this.productOptions.set([]);
          return;
        }

        const filters = this.filtersForm.getRawValue();
        const store = filters.store && typeof filters.store !== 'string' ? filters.store : null;
        const category = filters.category?.trim() || '';

        this.service
          .searchProducts({ query, storeId: store?._id, category: category || undefined, limit: 15 })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (resp) => {
              if (resp?.success) this.productOptions.set(resp.data || []);
            },
            error: (err) => console.error('Product options error:', err),
          });
      });
  }

  private sortRows<T>(
    rows: T[],
    sort: Sort,
    valueForKey: (row: T, key: string) => string | number,
  ): T[] {
    if (!rows?.length) return [];
    if (!sort?.active || !sort.direction) return [...rows];

    const dir = sort.direction === 'asc' ? 1 : -1;
    const key = sort.active;
    return [...rows].sort((a, b) => {
      const va = valueForKey(a, key);
      const vb = valueForKey(b, key);
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
  }

  private buildSparklinePoints(values: number[], width: number, height: number, max: number): string {
    if (!values.length) return '';
    const w = Math.max(1, width);
    const h = Math.max(1, height);
    const step = values.length > 1 ? w / (values.length - 1) : 0;

    return values
      .map((v, idx) => {
        const x = idx * step;
        const y = h - (Math.min(Math.max(v, 0), max) / max) * h;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');
  }
}
