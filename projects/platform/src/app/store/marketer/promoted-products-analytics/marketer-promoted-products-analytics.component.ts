import { CommonModule } from '@angular/common';
import { Component, DestroyRef, TemplateRef, ViewChild, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, timer } from 'rxjs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { CurrencyUtilsPipe } from '@shared/services';
import { UserService } from '../../../common/services/user.service';
import { StoreService } from '../../services/store.service';
import {
  ProductPromoterBreakdownRow,
  PromotedProductRow,
  PromotedProductsAnalyticsService,
  PromotedProductsTrendPoint,
} from './promoted-products-analytics.service';

type TrendView = 'daily' | 'weekly';

@Component({
  selector: 'app-marketer-promoted-products-analytics',
  standalone: true,
  providers: [PromotedProductsAnalyticsService, StoreService, ...provideNativeDateAdapter()],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
    MatPaginatorModule,
    CurrencyUtilsPipe,
  ],
  templateUrl: './marketer-promoted-products-analytics.component.html',
  styleUrls: ['./marketer-promoted-products-analytics.component.scss'],
})
export class MarketerPromotedProductsAnalyticsComponent {
  private readonly service = inject(PromotedProductsAnalyticsService);
  private readonly storeService = inject(StoreService);
  private readonly userService = inject(UserService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);

  @ViewChild('productPromotersDialog') productPromotersDialog!: TemplateRef<unknown>;

  readonly user = this.userService.user;

  readonly isLoading = signal(true);
  readonly isRefreshing = signal(false);
  readonly error = signal<string | null>(null);

  readonly overview = signal<any | null>(null);
  readonly lastRefreshedAt = signal<Date | null>(null);

  readonly storeOptions = signal<Array<{ _id: string; name: string; storeLink?: string; logo?: string }>>([]);

  readonly productOptions = signal<Array<{ _id: string; name: string; category?: string }>>([]);
  readonly promoterOptions = signal<Array<{ _id: string; displayName?: string; email?: string }>>([]);

  readonly trendView = signal<TrendView>('daily');
  readonly productsSort = signal<Sort>({ active: 'grossRevenue', direction: 'desc' });

  readonly selectedProduct = signal<PromotedProductRow | null>(null);
  readonly breakdownLoading = signal(false);
  readonly breakdownRows = signal<ProductPromoterBreakdownRow[]>([]);
  private breakdownDialogRef: MatDialogRef<unknown> | null = null;

  readonly filtersForm = this.fb.group({
    rangeDays: [7],
    startDate: [null as Date | null],
    endDate: [null as Date | null],
    storeId: ['' as string],
    category: ['' as string],
    product: [null as any],
    promoter: [null as any],
    search: ['' as string],
    page: [1],
    limit: [20],
  });

  readonly summaryCards = computed(() => {
    const s = this.overview()?.summary;
    if (!s) return [];

    return [
      { label: 'Revenue', value: s.grossRevenue || 0, icon: 'payments', format: 'money', tone: 'primary' },
      { label: 'Paid Orders', value: s.paidOrders || 0, icon: 'receipt_long', format: 'number', tone: 'neutral' },
      { label: 'Clicks', value: s.clicks || 0, icon: 'ads_click', format: 'number', tone: 'neutral' },
      { label: 'Unique Clicks', value: s.uniqueClicks || 0, icon: 'fingerprint', format: 'number', tone: 'neutral' },
      { label: 'Views', value: s.views || 0, icon: 'visibility', format: 'number', tone: 'neutral' },
      { label: 'Conversion', value: s.clickToOrderRate || 0, icon: 'track_changes', format: 'percent', tone: (s.clickToOrderRate || 0) < 0.8 ? 'warn' : 'neutral' },
      { label: 'Commission', value: s.commissionAccrued || 0, icon: 'account_balance_wallet', format: 'money', tone: (s.commissionAccrued || 0) > 0 ? 'warn' : 'neutral' },
      { label: 'Promoters', value: s.activePromoters || 0, icon: 'group', format: 'number', tone: 'neutral' },
    ];
  });

  readonly alerts = computed(() => (this.overview()?.alerts ?? []) as string[]);
  readonly topProducts = computed(() => (this.overview()?.topProducts ?? []) as any[]);
  readonly topPromoters = computed(() => (this.overview()?.topPromoters ?? []) as any[]);

  readonly productsPage = computed(() => this.overview()?.productsPage || { page: 1, limit: 20, total: 0, rows: [] });
  readonly productRows = computed(() => (this.productsPage().rows || []) as PromotedProductRow[]);

  readonly series = computed(() => {
    const data = this.overview()?.timeSeries;
    if (!data) return [];
    return this.trendView() === 'weekly' ? (data.weekly ?? []) : (data.daily ?? []);
  });

  readonly revenueSparkline = computed(() => {
    const points = this.series() as PromotedProductsTrendPoint[];
    const values = points.map((p) => Number(p.revenue || 0));
    const max = Math.max(1, ...values);
    return { points: this.buildSparklinePoints(values, 720, 140, max), max };
  });

  readonly clickSparkline = computed(() => {
    const points = this.series() as PromotedProductsTrendPoint[];
    const values = points.map((p) => Number(p.clicks || 0));
    const max = Math.max(1, ...values);
    return { points: this.buildSparklinePoints(values, 720, 140, max), max };
  });

  readonly displayedProductColumns: string[] = [
    'product',
    'store',
    'views',
    'clicks',
    'orders',
    'conversion',
    'revenue',
    'commission',
    'topPromoters',
    'actions',
  ];

  readonly displayedBreakdownColumns: string[] = [
    'promoter',
    'views',
    'clicks',
    'orders',
    'conversion',
    'revenue',
    'commission',
  ];

  constructor() {
    // Load store options (owned stores) for marketer.
    const userId = this.user()?._id;
    if (userId) {
      this.storeService.getStores(userId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (stores) => {
          const list = (stores || [])
            .filter((s: any) => Boolean(s?._id))
            .map((s: any) => ({
              _id: String(s._id),
              name: s.name || 'Store',
              storeLink: s.storeLink,
              logo: s.logo,
            }));
          this.storeOptions.set(list);
        },
        error: () => this.storeOptions.set([]),
      });
    }

    // Initial load + 5-minute refresh loop.
    timer(0, 5 * 60 * 1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refresh(false));

    // Autocomplete: product options
    this.filtersForm.controls.product.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef), debounceTime(250))
      .subscribe((value) => {
        const q = typeof value === 'string' ? value.trim() : (value?.name || '');
        if (!q) {
          this.productOptions.set([]);
          return;
        }
        // Only typeahead when user is typing. Selecting an option sets an object value.
        if (typeof value === 'object') return;
        const raw = this.filtersForm.getRawValue();
        const storeId = raw.storeId || undefined;
        const category = raw.category?.trim() || undefined;
        this.service.searchProducts({ query: q, limit: 20, storeId: storeId || undefined, category }).subscribe({
          next: (res) => this.productOptions.set(res?.data || []),
          error: () => this.productOptions.set([]),
        });
      });

    // Autocomplete: promoter options
    this.filtersForm.controls.promoter.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef), debounceTime(250))
      .subscribe((value) => {
        const q = typeof value === 'string' ? value.trim() : (value?.displayName || value?.email || '');
        if (!q) {
          this.promoterOptions.set([]);
          return;
        }
        // Only typeahead when user is typing. Selecting an option sets an object value.
        if (typeof value === 'object') return;
        this.service.searchPromoters({ query: q, limit: 20 }).subscribe({
          next: (res) => this.promoterOptions.set(res?.data || []),
          error: () => this.promoterOptions.set([]),
        });
      });

    // Filter changes: debounce to avoid flicker and request spam.
    // NOTE: Do not subscribe to the whole form, otherwise pagination changes would reset page to 1.
    const resetReload = () => this.refresh(true);

    this.filtersForm.controls.rangeDays.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef), debounceTime(450), distinctUntilChanged())
      .subscribe(resetReload);

    this.filtersForm.controls.startDate.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef), debounceTime(250))
      .subscribe(resetReload);

    this.filtersForm.controls.endDate.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef), debounceTime(250))
      .subscribe(resetReload);

    this.filtersForm.controls.storeId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef), distinctUntilChanged())
      .subscribe(resetReload);

    this.filtersForm.controls.category.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef), debounceTime(450), distinctUntilChanged())
      .subscribe(resetReload);

    this.filtersForm.controls.search.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef), debounceTime(450), distinctUntilChanged())
      .subscribe(resetReload);

    // Product/promoter: refresh only when selection is an object (or cleared), not on typing.
    this.filtersForm.controls.product.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(150),
        distinctUntilChanged((a: any, b: any) => String((a?._id ?? a) || '') === String((b?._id ?? b) || ''))
      )
      .subscribe((value) => {
        if (value == null || value === '' || typeof value === 'object') resetReload();
      });

    this.filtersForm.controls.promoter.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(150),
        distinctUntilChanged((a: any, b: any) => String((a?._id ?? a) || '') === String((b?._id ?? b) || ''))
      )
      .subscribe((value) => {
        if (value == null || value === '' || typeof value === 'object') resetReload();
      });
  }

  refresh(resetPage: boolean): void {
    if (this.user()?.role && this.user()?.role !== 'marketer') {
      this.isLoading.set(false);
      this.error.set('Only marketers can access this dashboard.');
      return;
    }

    if (resetPage) {
      this.filtersForm.patchValue({ page: 1 }, { emitEvent: false });
    }

    const firstLoad = this.overview() === null;
    if (firstLoad) this.isLoading.set(true);
    this.isRefreshing.set(!firstLoad);
    this.error.set(null);

    const value = this.filtersForm.getRawValue();
    const productId = value.product?._id || null;
    const promoterId = value.promoter?._id || null;
    const storeId = value.storeId && value.storeId !== 'all' ? value.storeId : null;
    const category = value.category?.trim() || null;
    const search = value.search?.trim() || null;

    this.service
      .getOverview({
        rangeDays: Number(value.rangeDays || 7),
        startDate: value.startDate,
        endDate: value.endDate,
        storeId,
        category,
        productId,
        promoterId,
        search,
        page: Number(value.page || 1),
        limit: Number(value.limit || 20),
        topLimit: 10,
        timezone: 'Africa/Lagos',
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.overview.set(response?.data || null);
          this.lastRefreshedAt.set(new Date());
          this.isLoading.set(false);
          this.isRefreshing.set(false);
        },
        error: (error) => {
          console.error('Failed to load promoted products analytics:', error);
          this.error.set(error?.error?.message || 'Failed to load promoted products analytics.');
          this.isLoading.set(false);
          this.isRefreshing.set(false);
        },
      });
  }

  onPage(event: PageEvent): void {
    // Pagination should not reset page to 1; fetch immediately and do not trigger filter subscriptions.
    this.filtersForm.patchValue({ page: event.pageIndex + 1, limit: event.pageSize }, { emitEvent: false });
    this.refresh(false);
  }

  setTrendView(view: TrendView): void {
    this.trendView.set(view);
  }

  trackByProductId = (_: number, row: PromotedProductRow) => row?.product?._id || _;

  openProductBreakdown(row: PromotedProductRow): void {
    if (!row?.product?._id) return;
    this.selectedProduct.set(row);
    this.breakdownRows.set([]);
    this.breakdownLoading.set(true);

    const value = this.filtersForm.getRawValue();
    const storeId = value.storeId && value.storeId !== 'all' ? value.storeId : null;

    // Open immediately so the user gets instant feedback, then load data into it.
    this.breakdownDialogRef?.close();
    this.breakdownDialogRef = this.dialog.open(this.productPromotersDialog, {
      width: 'min(1100px, 96vw)',
      maxWidth: '96vw',
      panelClass: 'promoted-products-dialog',
    });

    this.service
      .getProductPromoters({
        productId: row.product._id,
        rangeDays: Number(value.rangeDays || 7),
        startDate: value.startDate,
        endDate: value.endDate,
        storeId,
        timezone: 'Africa/Lagos',
        limit: 200,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.breakdownRows.set(response?.data?.rows || []);
          this.breakdownLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load product promoter breakdown:', error);
          this.breakdownLoading.set(false);
          this.snackBar.open(error?.error?.message || 'Failed to load breakdown.', 'Close', { duration: 3200 });
        },
      });
  }

  openBreakdownForProduct(productId: string, name?: string, category?: string, image?: string | null): void {
    if (!productId) return;
    const row = {
      product: { _id: productId, name: name || 'Product', category: category || '', image: image || null },
      store: null,
      links: { total: 0, active: 0 },
      allTime: { views: 0, clicks: 0, conversions: 0, earnings: 0 },
      range: {
        views: 0,
        uniqueViews: 0,
        clicks: 0,
        uniqueClicks: 0,
        clickThroughRate: 0,
        paidOrders: 0,
        totalOrders: 0,
        pendingOrders: 0,
        fulfilledOrders: 0,
        refundedOrders: 0,
        grossRevenue: 0,
        units: 0,
        commissionAccrued: 0,
        commissionPaid: 0,
        conversionRate: 0,
      },
      topPromoters: [],
      lastActivityAt: null,
    } as unknown as PromotedProductRow;

    this.openProductBreakdown(row);
  }

  closeBreakdown(): void {
    this.breakdownDialogRef?.close();
    this.breakdownDialogRef = null;
  }

  sortProducts(sort: Sort): void {
    this.productsSort.set(sort);
  }

  readonly sortedProductRows = computed(() => {
    const rows = this.productRows();
    const sort = this.productsSort();
    if (!sort?.active || !sort.direction) return rows;

    const dir = sort.direction === 'asc' ? 1 : -1;
    const key = sort.active;

    const valueOf = (row: PromotedProductRow) => {
      if (key === 'product') return (row.product?.name || '').toLowerCase();
      if (key === 'store') return (row.store?.name || '').toLowerCase();
      if (key === 'views') return Number(row.range?.views || 0);
      if (key === 'clicks') return Number(row.range?.clicks || 0);
      if (key === 'orders') return Number(row.range?.paidOrders || 0);
      if (key === 'conversion') return Number(row.range?.conversionRate || 0);
      if (key === 'commission') return Number(row.range?.commissionAccrued || 0);
      return Number(row.range?.grossRevenue || 0);
    };

    return [...rows].sort((a, b) => {
      const av = valueOf(a);
      const bv = valueOf(b);
      if (typeof av === 'string' && typeof bv === 'string') return av.localeCompare(bv) * dir;
      return (Number(av) - Number(bv)) * dir;
    });
  });

  productImage(row: PromotedProductRow): string | null {
    return row?.product?.image || null;
  }

  promoterLabel(row: any): string {
    return row?.displayName || row?.username || row?.email || 'Promoter';
  }

  productDisplay = (value: any) => (value && typeof value === 'object' ? (value.name || '') : String(value || ''));
  promoterDisplay = (value: any) => (value && typeof value === 'object' ? (this.promoterLabel(value)) : String(value || ''));

  applyPromoterFilter(promoter: any): void {
    if (!promoter?._id) return;
    this.filtersForm.patchValue({ promoter, page: 1 }, { emitEvent: false });
    this.refresh(true);
  }

  private buildSparklinePoints(values: number[], width: number, height: number, max: number): string {
    if (!values.length) return '';
    if (values.length === 1) {
      const x = 0;
      const y = height;
      return `${x},${y}`;
    }
    const step = width / (values.length - 1);
    return values
      .map((v, i) => {
        const x = i * step;
        const y = height - (Math.max(0, v) / max) * height;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');
  }

  exportCsv(): void {
    const rows = this.sortedProductRows();
    const now = new Date();
    const filename = `promoted-products-analytics_${now.toISOString().slice(0, 10)}.csv`;

    const escape = (v: unknown) => {
      const s = String(v ?? '');
      if (/[,"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const header = [
      'product_id',
      'product_name',
      'store_id',
      'store_name',
      'range_views',
      'range_unique_views',
      'range_clicks',
      'range_unique_clicks',
      'paid_orders',
      'revenue',
      'commission_accrued',
      'conversion_rate_pct',
      'last_activity_at',
    ];

    const lines = rows.map((r) => [
      escape(r.product?._id),
      escape(r.product?.name),
      escape(r.store?._id),
      escape(r.store?.name),
      escape(r.range?.views || 0),
      escape(r.range?.uniqueViews || 0),
      escape(r.range?.clicks || 0),
      escape(r.range?.uniqueClicks || 0),
      escape(r.range?.paidOrders || 0),
      escape(r.range?.grossRevenue || 0),
      escape(r.range?.commissionAccrued || 0),
      escape(Number(r.range?.conversionRate || 0).toFixed(2)),
      escape(r.lastActivityAt || ''),
    ].join(','));

    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    this.snackBar.open('CSV exported', 'Close', { duration: 2200 });
  }
}
