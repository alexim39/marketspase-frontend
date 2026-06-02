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
import { MatNativeDateModule } from '@angular/material/core';
import { debounceTime, distinctUntilChanged, timer } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  PpcAnalyticsService,
  PpcOverviewResponse,
  PpcPromoterRow,
  PpcPromotionLinkBreakdown,
  PpcPromotionLinksResponse,
} from './ppc-analytics.service';

type PromoterAction = 'flag' | 'warn' | 'suspend';

@Component({
  selector: 'admin-ppc-analytics',
  standalone: true,
  providers: [PpcAnalyticsService, DatePipe, CurrencyPipe],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
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
  ],
  templateUrl: './ppc-analytics.component.html',
  styleUrls: ['./ppc-analytics.component.scss'],
})
export class PpcAnalyticsComponent {
  private readonly service = inject(PpcAnalyticsService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('promoterDetailsDialog') promoterDetailsDialog!: TemplateRef<unknown>;
  @ViewChild('promotionLinksDialog') promotionLinksDialog!: TemplateRef<unknown>;
  @ViewChild('actionDialog') actionDialog!: TemplateRef<unknown>;

  readonly isLoadingOverview = signal(true);
  readonly isLoadingPromoters = signal(true);
  readonly isLoadingPromotionLinks = signal(false);
  readonly actionBusy = signal(false);

  readonly overview = signal<PpcOverviewResponse['data'] | null>(null);
  readonly promoters = signal<PpcPromoterRow[]>([]);
  readonly promotionLinks = signal<PpcPromotionLinkBreakdown[]>([]);
  readonly promotionLinksSummary = signal<PpcPromotionLinksResponse['data']['summary'] | null>(null);
  readonly promotionLinksError = signal('');
  readonly lastRefreshedAt = signal<Date | null>(null);

  readonly pagination = signal({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });

  readonly promotionLinksPagination = signal({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  readonly sortState = signal<{ sortBy: string; sortOrder: 'asc' | 'desc' }>({
    sortBy: 'billableClicks',
    sortOrder: 'desc',
  });

  readonly filtersForm = this.fb.group({
    rangeDays: [7],
    startDate: [null as Date | null],
    endDate: [null as Date | null],
    granularity: ['daily' as 'daily' | 'hourly'],
    country: [''],
    promoterId: [''],
  });

  readonly summaryCards = computed(() => {
    const summary = this.overview()?.summary;
    if (!summary) return [];

    return [
      { label: 'Billable clicks', value: summary.billableClicks, icon: 'ads_click', tone: 'primary' },
      { label: 'Unique clicks', value: summary.uniqueClicks, icon: 'fingerprint', tone: 'neutral' },
      { label: 'Spend', value: summary.spend, icon: 'payments', tone: 'neutral', format: 'currency' },
      { label: 'Conversions', value: summary.conversions, icon: 'shopping_cart', tone: 'neutral' },
      { label: 'Conversion revenue', value: summary.conversionRevenue, icon: 'receipt_long', tone: 'neutral', format: 'currency' },
      { label: 'Click to conversion', value: summary.clickToConversionRate, icon: 'trending_up', tone: 'neutral', format: 'percent' },
    ];
  });

  readonly timeSeries = computed(() => this.overview()?.timeSeries ?? []);

  readonly timeSeriesHasData = computed(() => this.timeSeries().some((p) => (p.totalClicks ?? 0) > 0));

  readonly sparkline = computed(() => {
    const points = this.timeSeries();
    if (!points.length) return { total: '', billable: '', max: 0 };

    const totals = points.map((p) => Number(p.totalClicks || 0));
    const billables = points.map((p) => Number(p.billableClicks || 0));
    const max = Math.max(1, ...totals, ...billables);

    return {
      total: this.buildSparklinePath(totals, 640, 120, max),
      billable: this.buildSparklinePath(billables, 640, 120, max),
      max,
    };
  });

  readonly displayedColumns: string[] = [
    'promoter',
    'clicks',
    'spend',
    'conversions',
    'rates',
    'anomalies',
    'actions',
  ];

  readonly selectedPromoter = signal<PpcPromoterRow | null>(null);
  readonly selectedAction = signal<PromoterAction | null>(null);
  readonly actionText = signal('');
  private actionDialogRef: MatDialogRef<unknown> | null = null;
  private detailsDialogRef: MatDialogRef<unknown> | null = null;
  private promotionLinksDialogRef: MatDialogRef<unknown> | null = null;

  constructor() {
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
      .subscribe(() => {
        this.pagination.update((p) => ({ ...p, page: 1 }));
        this.refresh();
      });
  }

  refresh(): void {
    this.loadOverview();
    this.loadPromoters();
  }

  private loadOverview(): void {
    this.isLoadingOverview.set(true);
    const filters = this.filtersForm.getRawValue();

    this.service
      .getOverview({
        startDate: filters.startDate,
        endDate: filters.endDate,
        range: filters.rangeDays,
        promoterId: filters.promoterId?.trim() || null,
        country: filters.country?.trim() || null,
        granularity: filters.granularity ?? 'daily',
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          if (!resp?.success) {
            this.snackBar.open(resp?.message || 'Failed to load PPC overview', 'OK', { duration: 3000 });
            this.isLoadingOverview.set(false);
            return;
          }

          this.overview.set(resp.data);
          this.lastRefreshedAt.set(new Date());
          this.isLoadingOverview.set(false);
        },
        error: (err) => {
          console.error('PPC overview error:', err);
          this.snackBar.open('Unable to load PPC overview.', 'OK', { duration: 3500 });
          this.isLoadingOverview.set(false);
        },
      });
  }

  private loadPromoters(): void {
    this.isLoadingPromoters.set(true);
    const filters = this.filtersForm.getRawValue();
    const sort = this.sortState();
    const page = this.pagination().page;
    const limit = this.pagination().limit;

    this.service
      .getPromoters({
        startDate: filters.startDate,
        endDate: filters.endDate,
        range: filters.rangeDays,
        promoterId: filters.promoterId?.trim() || null,
        country: filters.country?.trim() || null,
        page,
        limit,
        sortBy: sort.sortBy,
        sortOrder: sort.sortOrder,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          if (!resp?.success) {
            this.snackBar.open(resp?.message || 'Failed to load promoters', 'OK', { duration: 3000 });
            this.isLoadingPromoters.set(false);
            return;
          }

          this.promoters.set(resp.data.promoters || []);
          this.pagination.set(resp.data.pagination);
          this.isLoadingPromoters.set(false);
        },
        error: (err) => {
          console.error('PPC promoters error:', err);
          this.snackBar.open('Unable to load promoter PPC analytics.', 'OK', { duration: 3500 });
          this.isLoadingPromoters.set(false);
        },
      });
  }

  changePage(delta: number): void {
    const current = this.pagination();
    const nextPage = current.page + delta;
    if (nextPage < 1 || nextPage > current.totalPages || this.isLoadingPromoters()) return;
    this.pagination.set({ ...current, page: nextPage });
    this.loadPromoters();
  }

  changeLimit(limit: number): void {
    if (this.isLoadingPromoters()) return;
    this.pagination.update((p) => ({ ...p, limit, page: 1 }));
    this.loadPromoters();
  }

  onSortChange(sort: Sort): void {
    const active = String(sort.active || '').trim();
    const direction = (sort.direction || 'desc') as 'asc' | 'desc';
    if (!active) return;

    const allowed = new Set(['billableClicks', 'totalClicks', 'spend', 'invalidClicks', 'duplicateClicks', 'lastClickAt']);
    const sortBy = allowed.has(active) ? active : 'billableClicks';

    this.sortState.set({ sortBy, sortOrder: direction || 'desc' });
    this.pagination.update((p) => ({ ...p, page: 1 }));
    this.loadPromoters();
  }

  openPromoterDetails(row: PpcPromoterRow): void {
    this.selectedPromoter.set(row);
    this.detailsDialogRef = this.dialog.open(this.promoterDetailsDialog, {
      width: '820px',
      maxWidth: '94vw',
      panelClass: 'ppc-details-dialog',
    });
  }

  closePromoterDetails(): void {
    this.detailsDialogRef?.close();
    this.detailsDialogRef = null;
    this.selectedPromoter.set(null);
  }

  openPromotionLinks(row: PpcPromoterRow): void {
    this.selectedPromoter.set(row);
    this.promotionLinks.set([]);
    this.promotionLinksSummary.set(null);
    this.promotionLinksError.set('');
    this.promotionLinksPagination.set({ page: 1, limit: 10, total: 0, totalPages: 0 });

    this.promotionLinksDialogRef = this.dialog.open(this.promotionLinksDialog, {
      width: '980px',
      maxWidth: '96vw',
      maxHeight: '92vh',
      panelClass: 'ppc-links-dialog',
    });

    this.loadPromotionLinks(1);
  }

  closePromotionLinks(): void {
    this.promotionLinksDialogRef?.close();
    this.promotionLinksDialogRef = null;
    this.promotionLinks.set([]);
    this.promotionLinksSummary.set(null);
    this.promotionLinksError.set('');
    this.selectedPromoter.set(null);
  }

  loadPromotionLinks(page = this.promotionLinksPagination().page): void {
    const row = this.selectedPromoter();
    if (!row?.promoter?._id || this.isLoadingPromotionLinks()) return;

    const filters = this.filtersForm.getRawValue();
    const limit = this.promotionLinksPagination().limit;
    this.isLoadingPromotionLinks.set(true);
    this.promotionLinksError.set('');

    this.service
      .getPromoterPromotionLinks(row.promoter._id, {
        startDate: filters.startDate,
        endDate: filters.endDate,
        range: filters.rangeDays,
        country: filters.country?.trim() || null,
        page,
        limit,
        sortBy: 'spend',
        sortOrder: 'desc',
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          if (!resp?.success) {
            const message = resp?.message || 'Failed to load promotion link attribution.';
            this.promotionLinksError.set(message);
            this.snackBar.open(message, 'OK', { duration: 3500 });
            this.isLoadingPromotionLinks.set(false);
            return;
          }

          this.promotionLinks.set(resp.data.links || []);
          this.promotionLinksSummary.set(resp.data.summary);
          this.promotionLinksPagination.set(resp.data.pagination);
          this.isLoadingPromotionLinks.set(false);
        },
        error: (err) => {
          console.error('PPC promotion link attribution error:', err);
          this.promotionLinksError.set('Unable to load promotion links behind this spend.');
          this.snackBar.open('Unable to load promotion links behind this spend.', 'OK', { duration: 3500 });
          this.isLoadingPromotionLinks.set(false);
        },
      });
  }

  changePromotionLinksPage(delta: number): void {
    const current = this.promotionLinksPagination();
    const nextPage = current.page + delta;
    if (nextPage < 1 || nextPage > current.totalPages || this.isLoadingPromotionLinks()) return;
    this.promotionLinksPagination.set({ ...current, page: nextPage });
    this.loadPromotionLinks(nextPage);
  }

  copyPromotionLink(link: PpcPromotionLinkBreakdown): void {
    const value = String(link.promotionUrl || '').trim();
    if (!value) {
      this.snackBar.open('No promotion link is available for this attribution row.', 'OK', { duration: 2500 });
      return;
    }

    this.copyText(value, 'Promotion link copied.');
  }

  copyUpi(link: PpcPromotionLinkBreakdown): void {
    const value = String(link.upi || '').trim();
    if (!value) {
      this.snackBar.open('No UPI is available for this attribution row.', 'OK', { duration: 2500 });
      return;
    }

    this.copyText(value, 'Promotion UPI copied.');
  }

  openPromotionLink(link: PpcPromotionLinkBreakdown): void {
    const url = String(link.promotionUrl || '').trim();
    if (!/^https?:\/\//i.test(url)) {
      this.snackBar.open('This promotion link is not a valid URL.', 'OK', { duration: 3000 });
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  openAction(row: PpcPromoterRow, action: PromoterAction): void {
    this.selectedPromoter.set(row);
    this.selectedAction.set(action);
    this.actionText.set('');

    this.actionDialogRef = this.dialog.open(this.actionDialog, {
      width: '520px',
      maxWidth: '94vw',
      panelClass: 'ppc-action-dialog',
    });
  }

  closeActionDialog(): void {
    this.actionDialogRef?.close();
    this.actionDialogRef = null;
    this.selectedAction.set(null);
    this.actionText.set('');
  }

  confirmAction(): void {
    const row = this.selectedPromoter();
    const action = this.selectedAction();
    if (!row || !action) return;

    this.actionBusy.set(true);

    const promoterId = row.promoter._id;
    const text = this.actionText().trim();
    const request$ =
      action === 'flag'
        ? this.service.flagPromoter(promoterId, text)
        : action === 'warn'
          ? this.service.warnPromoter(promoterId, text)
          : this.service.suspendPromoter(promoterId, text);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.snackBar.open('Action completed.', 'OK', { duration: 2500 });
        this.actionBusy.set(false);
        this.closeActionDialog();
        this.refresh();
      },
      error: (err) => {
        console.error('PPC action failed:', err);
        this.snackBar.open('Unable to complete that action right now.', 'OK', { duration: 3500 });
        this.actionBusy.set(false);
      },
    });
  }

  resolveAnomalyLabel(code: string): string {
    const labels: Record<string, string> = {
      high_click_volume: 'High click volume',
      low_billable_rate: 'Low billable rate',
      high_invalid_rate: 'High invalid rate',
      high_duplicate_rate: 'High duplicate rate',
      repeat_click_pattern: 'Repeat click pattern',
      high_spend_low_quality: 'High spend, low quality',
      zero_conversions: 'Zero conversions',
      low_conversion_rate: 'Low conversion rate',
    };
    return labels[code] || code;
  }

  private copyText(value: string, successMessage: string): void {
    const fallbackCopy = () => {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    };

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(value)
        .then(() => this.snackBar.open(successMessage, 'OK', { duration: 2200 }))
        .catch(() => {
          fallbackCopy();
          this.snackBar.open(successMessage, 'OK', { duration: 2200 });
        });
      return;
    }

    fallbackCopy();
    this.snackBar.open(successMessage, 'OK', { duration: 2200 });
  }

  private buildSparklinePath(values: number[], width: number, height: number, max: number): string {
    if (!values.length) return '';
    const w = Math.max(1, width);
    const h = Math.max(1, height);
    const step = values.length > 1 ? w / (values.length - 1) : 0;

    const points = values.map((v, idx) => {
      const x = idx * step;
      const y = h - (Math.min(Math.max(v, 0), max) / max) * h;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    });

    return points.join(' ');
  }
}
