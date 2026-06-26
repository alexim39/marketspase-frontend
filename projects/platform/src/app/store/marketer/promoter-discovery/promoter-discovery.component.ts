import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '@shared/services';
import { DeviceService } from '@shared/services';

interface DiscoveredPromoter {
  _id: string;
  displayName: string;
  avatar?: string;
  promoterTier: string;
  totalConversions: number;
  totalEarningsGenerated: number;
  averageConversionRate: number;
  topCategory: string;
}

const POPULAR_CATEGORIES = [
  'Fashion',
  'Electronics',
  'Health & Beauty',
  'Home & Garden',
  'Sports & Outdoors',
  'Toys & Games',
  'Automotive',
  'Books & Media',
  'Food & Groceries',
  'Jewelry & Watches',
];

type SortOption = 'earnings' | 'conversionRate' | 'conversions' | 'tier';
type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-promoter-discovery',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  templateUrl: './promoter-discovery.component.html',
  styleUrls: ['./promoter-discovery.component.scss'],
})
export class PromoterDiscoveryComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly deviceService = inject(DeviceService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly promoters = signal<DiscoveredPromoter[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly selectedCategory = signal('');
  readonly selectedProductId = signal('');
  readonly sortBy = signal<SortOption>('earnings');
  readonly sortDir = signal<SortDir>('desc');
  readonly availableProducts = signal<Array<{_id: string, name: string}>>([]);
  readonly productDialogOpen = signal(false);

  readonly categories = POPULAR_CATEGORIES;

  readonly sortOptions: Array<{ value: SortOption; label: string }> = [
    { value: 'earnings', label: 'Earnings' },
    { value: 'conversionRate', label: 'Conversion Rate' },
    { value: 'conversions', label: 'Conversions' },
    { value: 'tier', label: 'Tier' },
  ];

  readonly isMobile = this.deviceService.isMobile;

  ngOnInit(): void {
    this.fetchPromoters();
    this.loadProducts();
  }

  loadProducts(): void {
    this.api.get<any>('api/v1/stores/product/list/promoter', new HttpParams().set('limit', '100'), undefined, true)
      .subscribe({ next: (r) => { this.availableProducts.set((r?.data || []).map((p: any) => ({ _id: p._id, name: p.name }))); }, error: () => null });
  }

  fetchPromoters(): void {
    this.loading.set(true);
    this.error.set(null);

    let params = new HttpParams();
    const category = this.selectedCategory();
    if (category) {
      params = params.set('category', category);
    }
    params = params.set('sortBy', this.sortBy());
    params = params.set('sortDir', this.sortDir());

    this.api
      .get<{ success: boolean; data: DiscoveredPromoter[] }>(
        'api/v1/stores/product/promotions/promoters/discover',
        params,
        undefined,
        true,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.promoters.set(response?.data || []);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load discovered promoters:', err);
          this.error.set(err?.error?.message || 'Failed to load promoters.');
          this.loading.set(false);
        },
      });
  }

  invitePromoter(promoterId: string): void {
    const productId = this.selectedProductId();
    if (!productId) {
      this.snackBar.open('Please select a product first above', 'Close', { duration: 3000 });
      return;
    }

    this.api
      .post<{ success: boolean; message: string }>(
        `api/v1/stores/product/promotions/promoters/${promoterId}/invite-to-promote`,
        { productId },
        undefined,
        true,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.snackBar.open(response?.message || 'Invitation sent successfully.', 'Close', { duration: 3500 });
        },
        error: (err) => {
          console.error('Failed to invite promoter:', err);
          this.snackBar.open(err?.error?.message || 'Failed to send invitation.', 'Close', { duration: 4000 });
        },
      });
  }

  setCategory(category: string): void {
    this.selectedCategory.set(category);
    this.fetchPromoters();
  }

  setSortBy(value: SortOption): void {
    this.sortBy.set(value);
    this.fetchPromoters();
  }

  setSortDir(value: SortDir): void {
    this.sortDir.set(value);
    this.fetchPromoters();
  }

  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'P';
  }

  tierClass(tier: string): string {
    const t = tier?.toLowerCase() || '';
    if (t.includes('gold')) return 'tier-gold';
    if (t.includes('silver')) return 'tier-silver';
    if (t.includes('bronze')) return 'tier-bronze';
    return '';
  }

  formatConversionRate(rate: number): string {
    if (rate == null) return '0%';
    return `${Number(rate).toFixed(1)}%`;
  }

  formatCurrency(value: number): string { return value ? '₦' + value.toLocaleString() : '₦0'; }
}
