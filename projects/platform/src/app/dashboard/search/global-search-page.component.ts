import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';
import { CurrencyUtilsPipe } from '@shared/services';
import {
  GlobalSearchEntityType,
  GlobalSearchFacets,
  GlobalSearchPayload,
  GlobalSearchResult,
} from './global-search.model';
import { GlobalSearchService } from './global-search.service';

type EntityFilter = 'all' | GlobalSearchEntityType;

@Component({
  selector: 'app-global-search-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    CurrencyUtilsPipe,
  ],
  templateUrl: './global-search-page.component.html',
  styleUrl: './global-search-page.component.scss',
})
export class GlobalSearchPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackBar = inject(MatSnackBar);
  private readonly searchService = inject(GlobalSearchService);

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly payload = signal<GlobalSearchPayload | null>(null);
  readonly query = signal('');
  readonly selectedType = signal<EntityFilter>('all');
  readonly selectedUserType = signal('all');
  readonly selectedStatus = signal('all');
  readonly currentPage = signal(1);
  readonly currentLimit = signal(12);
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly regionControl = new FormControl('', { nonNullable: true });

  readonly results = computed(() => this.payload()?.results || []);
  readonly facets = computed<GlobalSearchFacets>(() => this.payload()?.facets || {
    entityTypes: {},
    statuses: {},
    userTypes: {},
    regions: {},
  });
  readonly pagination = computed(() => this.payload()?.pagination || {
    page: 1,
    limit: this.currentLimit(),
    total: 0,
    totalPages: 0,
  });
  readonly spotlightResult = computed(() => this.results()[0] || null);
  readonly remainingResults = computed(() => this.results().slice(1));
  readonly hasResults = computed(() => this.results().length > 0);
  readonly quickRegionSuggestions = computed(() => Object.keys(this.facets().regions || {}).slice(0, 6));
  readonly availableStatuses = computed(() => Object.keys(this.facets().statuses || {}));
  readonly availableUserTypes = computed(() => {
    const set = new Set([
      'marketer',
      'promoter',
      'marketing_rep',
      ...Object.keys(this.facets().userTypes || {}),
    ]);

    return [...set].filter(Boolean);
  });

  readonly typeOptions: Array<{ value: EntityFilter; label: string; icon: string }> = [
    { value: 'all', label: 'All', icon: 'grid_view' },
    { value: 'user', label: 'Users', icon: 'person' },
    { value: 'campaign', label: 'Campaigns', icon: 'campaign' },
    { value: 'promotion', label: 'Promotions', icon: 'local_offer' },
    { value: 'product', label: 'Products', icon: 'inventory_2' },
    { value: 'store', label: 'Stores', icon: 'storefront' },
  ];

  constructor() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const query = (params.get('q') || '').trim();
        const type = (params.get('type') as EntityFilter) || 'all';
        const userType = (params.get('userType') || 'all').trim();
        const status = (params.get('status') || 'all').trim();
        const region = (params.get('region') || '').trim();
        const page = Math.max(1, Number(params.get('page') || 1));
        const limit = Math.min(24, Math.max(6, Number(params.get('limit') || 12)));

        this.query.set(query);
        this.selectedType.set(this.typeOptions.some((option) => option.value === type) ? type : 'all');
        this.selectedUserType.set(userType || 'all');
        this.selectedStatus.set(status || 'all');
        this.currentPage.set(page);
        this.currentLimit.set(limit);

        if (this.searchControl.value !== query) {
          this.searchControl.setValue(query, { emitEvent: false });
        }

        if (this.regionControl.value !== region) {
          this.regionControl.setValue(region, { emitEvent: false });
        }

        this.fetchResults();
      });

    this.regionControl.valueChanges
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value) => {
        if ((value || '').trim() === (this.route.snapshot.queryParamMap.get('region') || '')) {
          return;
        }
        this.updateRoute({ region: value.trim() || null, page: 1 });
      });

    this.searchControl.valueChanges
      .pipe(
        debounceTime(220),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value) => {
        const nextQuery = (value || '').trim();
        const currentQuery = (this.route.snapshot.queryParamMap.get('q') || '').trim();
        if (nextQuery === currentQuery) {
          return;
        }
        this.updateRoute({ q: nextQuery || null, page: 1 });
      });
  }

  submitSearch(): void {
    this.updateRoute({
      q: this.searchControl.value.trim() || null,
      page: 1,
    });
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }

  selectType(type: EntityFilter): void {
    this.updateRoute({
      type: type === 'all' ? null : type,
      page: 1,
    });
  }

  selectUserType(userType: string): void {
    this.updateRoute({
      userType: userType === 'all' ? null : userType,
      page: 1,
    });
  }

  selectStatus(status: string): void {
    this.updateRoute({
      status: status === 'all' ? null : status,
      page: 1,
    });
  }

  applyQuickRegion(region: string): void {
    this.regionControl.setValue(region);
  }

  clearFilters(): void {
    this.updateRoute({
      type: null,
      userType: null,
      status: null,
      region: null,
      page: 1,
    });
  }

  handlePageChange(event: PageEvent): void {
    this.updateRoute({
      page: event.pageIndex + 1,
      limit: event.pageSize,
    });
  }

  openResult(result: GlobalSearchResult): void {
    if (!result.navigationPath) {
      return;
    }

    this.router.navigateByUrl(result.navigationPath);
  }

  exportResults(): void {
    if (!this.results().length) {
      this.snackBar.open('There are no results to export yet.', 'Close', { duration: 2500 });
      return;
    }

    this.searchService.exportResults(this.results(), this.query());
    this.snackBar.open('Search results exported.', 'Close', { duration: 2500 });
  }

  getEntityIcon(result: GlobalSearchResult): string {
    switch (result.entityType) {
      case 'campaign':
        return 'campaign';
      case 'promotion':
        return 'local_offer';
      case 'product':
        return 'inventory_2';
      case 'store':
        return 'storefront';
      case 'user':
      default:
        return 'person';
    }
  }

  getEntityCount(type: EntityFilter): number {
    if (type === 'all') {
      return this.pagination().total;
    }

    return Number(this.facets().entityTypes?.[type] || 0);
  }

  formatLabel(value: string): string {
    return String(value || '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  getResultMetrics(result: GlobalSearchResult): Array<{ label: string; value: string; icon: string }> {
    const metadata = result.metadata || {};

    switch (result.entityType) {
      case 'campaign':
        return [
          { label: 'Budget', value: this.formatCurrency(metadata['budget'] as number, metadata['currency'] as string), icon: 'payments' },
          { label: 'Billable Clicks', value: this.formatNumber(metadata['billableClicks'] as number), icon: 'ads_click' },
          { label: 'CPC', value: this.formatCurrency(metadata['costPerClick'] as number, metadata['currency'] as string), icon: 'tune' },
        ];
      case 'promotion':
        return [
          { label: 'Earned', value: this.formatCurrency(metadata['earnedAmount'] as number, metadata['currency'] as string), icon: 'savings' },
          { label: 'Tracked Clicks', value: this.formatNumber(metadata['trackedClicks'] as number), icon: 'touch_app' },
          { label: 'Billable', value: this.formatNumber(metadata['billableClicks'] as number), icon: 'verified' },
        ];
      case 'product':
        return [
          { label: 'Price', value: this.formatCurrency(metadata['price'] as number, metadata['currency'] as string), icon: 'sell' },
          { label: 'Store', value: String(metadata['storeName'] || 'Store'), icon: 'storefront' },
          { label: 'Rating', value: this.formatRating(metadata['rating'] as number, metadata['ratingCount'] as number), icon: 'star' },
        ];
      case 'store':
        return [
          { label: 'Category', value: String(metadata['category'] || 'Store'), icon: 'category' },
          { label: 'Views', value: this.formatNumber(metadata['totalViews'] as number), icon: 'visibility' },
          { label: 'Sales', value: this.formatNumber(metadata['totalSales'] as number), icon: 'shopping_bag' },
        ];
      case 'user':
      default:
        return [
          { label: 'Role', value: result.userType || 'member', icon: 'badge' },
          { label: 'Rating', value: this.formatRating(metadata['rating'] as number, metadata['ratingCount'] as number), icon: 'star' },
          { label: 'Region', value: result.region?.label || 'Unspecified', icon: 'place' },
        ];
    }
  }

  private fetchResults(): void {
    const query = this.query();
    if (!query && !this.hasActiveFilterOnly()) {
      this.payload.set({
        query: '',
        pagination: {
          page: 1,
          limit: this.currentLimit(),
          total: 0,
          totalPages: 0,
        },
        results: [],
        facets: {
          entityTypes: {},
          statuses: {},
          userTypes: {},
          regions: {},
        },
      });
      this.error.set(null);
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    const selectedType = this.selectedType();

    this.searchService.search(query, {
      types: selectedType === 'all' ? [] : [selectedType],
      userTypes: this.selectedUserType() === 'all' ? [] : [this.selectedUserType()],
      statuses: this.selectedStatus() === 'all' ? [] : [this.selectedStatus()],
      region: this.regionControl.value.trim(),
      page: this.currentPage(),
      limit: this.currentLimit(),
    })
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.payload.set(response.data);
        },
        error: () => {
          this.error.set('We could not load search results right now.');
        },
      });
  }

  private updateRoute(queryParams: Record<string, string | number | null>): void {
    const current = { ...this.route.snapshot.queryParams };

    Object.entries(queryParams).forEach(([key, value]) => {
      if (value == null || value === '') {
        delete current[key];
      } else {
        current[key] = value;
      }
    });

    if (!current['q'] && this.query()) {
      current['q'] = this.query();
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: current,
    });
  }

  private hasActiveFilterOnly(): boolean {
    return this.selectedType() !== 'all' ||
      this.selectedUserType() !== 'all' ||
      this.selectedStatus() !== 'all' ||
      this.regionControl.value.trim().length > 0;
  }

  private formatCurrency(value: number, currency = 'NGN'): string {
    const amount = Number(value || 0);
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('en-NG').format(Number(value || 0));
  }

  private formatRating(rating: number, count: number): string {
    const safeRating = Number(rating || 0);
    const safeCount = Number(count || 0);
    if (!safeCount) {
      return 'No rating';
    }
    return `${safeRating.toFixed(1)} / 5`;
  }
}
