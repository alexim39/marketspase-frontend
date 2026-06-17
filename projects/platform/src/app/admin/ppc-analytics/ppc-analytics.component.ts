import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  DestroyRef,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, finalize, interval } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';

import {
  PpcAnalyticsService,
  PpcGranularity,
  PpcOverviewResponse,
  PpcPromoterRow,
} from './ppc-analytics.service';

type RangePreset = '7' | '30' | '90' | 'custom';

interface SummaryCard {
  label: string;
  value: string;
  helper: string;
  icon: string;
}

interface SeriesBar {
  bucket: string;
  label: string;
  totalClicks: number;
  billableClicks: number;
  invalidClicks: number;
  duplicateClicks: number;
  spend: number;
  widthTotal: number;
  widthBillable: number;
}

@Component({
  selector: 'app-ppc-analytics',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
  ],
  providers: [DatePipe, DecimalPipe],
  templateUrl: './ppc-analytics.component.html',
  styleUrls: ['./ppc-analytics.component.scss'],
})
export class PpcAnalyticsComponent implements AfterViewInit {
  private readonly service = inject(PpcAnalyticsService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly datePipe = inject(DatePipe);
  private readonly decimalPipe = inject(DecimalPipe);

  readonly loading = signal(true);
  readonly refreshing = signal(false);
  readonly error = signal<string | null>(null);
  readonly generatedAt = signal<string | null>(null);

  readonly overview = signal<PpcOverviewResponse['data'] | null>(null);

  readonly displayedColumns: string[] = [
    'promoter',
    'clicks',
    'quality',
    'conversions',
    'anomalies',
    'lastClickAt',
    'actions',
  ];

  readonly dataSource = new MatTableDataSource<PpcPromoterRow>([]);
  readonly promotersLoading = signal(true);
  readonly promotersError = signal<string | null>(null);
  readonly pagination = signal<{ page: number; limit: number; total: number; totalPages: number } | null>(null);

  @ViewChild(MatSort) sort?: MatSort;

  readonly filtersForm = this.fb.nonNullable.group({
    range: ['7' as RangePreset],
    startDate: [''],
    endDate: [''],
    promoterId: [''],
    country: [''],
    granularity: ['daily' as PpcGranularity],
  });

  readonly summaryCards = computed<SummaryCard[]>(() => {
    const summary = this.overview()?.summary;
    if (!summary) return [];

    const formatNum = (n: number) => this.decimalPipe.transform(n, '1.0-0') || String(n);
    const formatMoney = (n: number) => `N${this.decimalPipe.transform(n, '1.0-0') || String(n)}`;

    return [
      { label: 'Billable clicks', value: formatNum(summary.billableClicks), helper: `${summary.billableRate}% billable`, icon: 'ads_click' },
      { label: 'Unique clicks', value: formatNum(summary.uniqueClicks), helper: 'Deduped by fingerprint', icon: 'fingerprint' },
      { label: 'Spend', value: formatMoney(summary.spend), helper: `Avg CPC: ${summary.billableClicks > 0 ? formatMoney(summary.spend / summary.billableClicks) : 'N0'}`, icon: 'payments' },
      { label: 'Conversions', value: formatNum(summary.conversions), helper: `${summary.clickToConversionRate}% CVR`, icon: 'shopping_cart' },
      { label: 'Conversion revenue', value: formatMoney(summary.conversionRevenue), helper: 'From paid orders', icon: 'attach_money' },
      { label: 'Promoters', value: formatNum(summary.uniquePromoters), helper: 'Active in range', icon: 'group' },
    ];
  });

  readonly timeSeriesBars = computed<SeriesBar[]>(() => {
    const rows = this.overview()?.timeSeries || [];
    const maxTotal = Math.max(1, ...rows.map((r) => Number(r.totalClicks || 0)));

    return rows.map((row) => {
      const bucket = String(row.bucket || '');
      const label =
        this.filtersForm.controls.granularity.value === 'hourly'
          ? bucket
          : this.datePipe.transform(bucket, 'MMM d') || bucket;

      const totalClicks = Number(row.totalClicks || 0);
      const billableClicks = Number(row.billableClicks || 0);
      const invalidClicks = Number(row.invalidClicks || 0);
      const duplicateClicks = Number(row.duplicateClicks || 0);
      const spend = Number(row.spend || 0);

      return {
        bucket,
        label,
        totalClicks,
        billableClicks,
        invalidClicks,
        duplicateClicks,
        spend,
        widthTotal: (totalClicks / maxTotal) * 100,
        widthBillable: (billableClicks / maxTotal) * 100,
      };
    });
  });

  constructor() {
    // Initial load
    this.refreshAll(true);

    // Auto refresh every 5 minutes
    interval(5 * 60 * 1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshAll(false));

    // Refresh on filter changes (debounced)
    this.filtersForm.valueChanges
      .pipe(debounceTime(350), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshAll(false));

    // Keep table filter in sync with promoterId/country for quick narrowing
    effect(() => {
      const promoterId = String(this.filtersForm.controls.promoterId.value || '').trim().toLowerCase();
      const country = String(this.filtersForm.controls.country.value || '').trim().toLowerCase();
      const filter = [promoterId, country].filter(Boolean).join(' ');
      this.dataSource.filter = filter;
    });
  }

  ngAfterViewInit(): void {
    if (this.sort) this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = (row, filter) => {
      const haystack = [
        row.promoter?._id,
        row.promoter?.displayName,
        row.promoter?.email,
        row.promoter?.phone,
        ...(row.patterns?.countries || []).map((c) => c.country),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const tokens = String(filter || '')
        .split(/\s+/)
        .map((t) => t.trim())
        .filter(Boolean);
      if (!tokens.length) return true;
      return tokens.every((t) => haystack.includes(t));
    };
  }

  trackByPromoterId = (_: number, row: PpcPromoterRow) => row.promoter?._id || _;

  manualRefresh(): void {
    this.refreshAll(false);
  }

  onPromoterPage(event: PageEvent): void {
    const nextPage = (event?.pageIndex ?? 0) + 1;
    this.loadPromoters(nextPage);
  }

  private buildCommonFilters() {
    const range = this.filtersForm.controls.range.value;
    const startDate = range === 'custom' ? this.filtersForm.controls.startDate.value : '';
    const endDate = range === 'custom' ? this.filtersForm.controls.endDate.value : '';
    return {
      range: range === 'custom' ? undefined : range,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      promoterId: this.filtersForm.controls.promoterId.value || undefined,
      country: this.filtersForm.controls.country.value || undefined,
    };
  }

  private refreshAll(initial: boolean): void {
    if (initial) {
      this.loading.set(true);
    } else {
      this.refreshing.set(true);
    }

    this.error.set(null);

    let pending = 2;
    const done = () => {
      pending -= 1;
      if (pending > 0) return;
      this.loading.set(false);
      this.refreshing.set(false);
    };

    this.loadOverview(done);
    this.loadPromoters(1, done);
  }

  private loadOverview(done?: () => void): void {
    const filters = {
      ...this.buildCommonFilters(),
      granularity: this.filtersForm.controls.granularity.value,
    };

    this.service
      .getOverview(filters)
      .pipe(finalize(() => done?.()))
      .subscribe({
        next: (resp) => {
          this.overview.set(resp.data);
          this.generatedAt.set(new Date().toISOString());
          this.error.set(null);
        },
        error: (err) => {
          console.error('Failed to load PPC overview:', err);
          this.error.set(err?.message || 'Failed to load PPC overview');
        },
      });
  }

  private loadPromoters(page: number = 1, done?: () => void): void {
    this.promotersLoading.set(true);
    this.promotersError.set(null);

    const filters = {
      ...this.buildCommonFilters(),
      page,
      limit: 25,
      sortBy: 'billableClicks',
      sortOrder: 'desc' as const,
    };

    this.service
      .getPromoters(filters)
      .pipe(
        finalize(() => {
          this.promotersLoading.set(false);
          done?.();
        })
      )
      .subscribe({
        next: (resp) => {
          const rows = resp.data?.promoters || [];
          this.dataSource.data = rows;
          this.pagination.set(resp.data?.pagination || null);
        },
        error: (err) => {
          console.error('Failed to load PPC promoters:', err);
          this.promotersError.set(err?.message || 'Failed to load promoters');
        },
      });
  }

  openPatterns(row: PpcPromoterRow): void {
    this.dialog.open(PpcPromoterPatternsDialog, {
      width: '640px',
      maxWidth: '92vw',
      data: row,
    });
  }

  flag(row: PpcPromoterRow): void {
    const promoterId = row.promoter?._id;
    if (!promoterId) return;

    this.service.flagPromoter(promoterId).subscribe({
      next: () => this.snackBar.open('Promoter flagged for review.', 'OK', { duration: 2200 }),
      error: (err) => this.snackBar.open(err?.message || 'Failed to flag promoter', 'OK', { duration: 3000 }),
    });
  }

  warn(row: PpcPromoterRow): void {
    const promoterId = row.promoter?._id;
    if (!promoterId) return;

    const ref = this.dialog.open(PpcWarnDialog, {
      width: '520px',
      maxWidth: '92vw',
      data: { promoterId, displayName: row.promoter.displayName },
    });

    ref.afterClosed().subscribe((message: string | null | undefined) => {
      if (message === undefined) return;
      const payload = String(message || '').trim();
      this.service.warnPromoter(promoterId, payload).subscribe({
        next: () => this.snackBar.open('Warning sent.', 'OK', { duration: 2200 }),
        error: (err) => this.snackBar.open(err?.message || 'Failed to send warning', 'OK', { duration: 3000 }),
      });
    });
  }

  suspend(row: PpcPromoterRow): void {
    const promoterId = row.promoter?._id;
    if (!promoterId) return;

    const ref = this.dialog.open(PpcSuspendDialog, {
      width: '520px',
      maxWidth: '92vw',
      data: { promoterId, displayName: row.promoter.displayName },
    });

    ref.afterClosed().subscribe((reason: string | null | undefined) => {
      if (reason === undefined) return;
      const payload = String(reason || '').trim();
      this.service.suspendPromoter(promoterId, payload).subscribe({
        next: () => this.snackBar.open('Account suspended.', 'OK', { duration: 2200 }),
        error: (err) => this.snackBar.open(err?.message || 'Failed to suspend account', 'OK', { duration: 3000 }),
      });
    });
  }

  anomalyLabel(code: string): string {
    switch (code) {
      case 'high_click_volume':
        return 'High volume';
      case 'low_billable_rate':
        return 'Low billable';
      case 'high_invalid_rate':
        return 'High invalid';
      case 'high_duplicate_rate':
        return 'High duplicates';
      case 'repeat_click_pattern':
        return 'Repeat pattern';
      case 'high_spend_low_quality':
        return 'High spend/low quality';
      case 'zero_conversions':
        return 'Zero conversions';
      case 'low_conversion_rate':
        return 'Low conversion';
      default:
        return code.replace(/_/g, ' ');
    }
  }
}

@Component({
  selector: 'app-ppc-promoter-patterns-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatChipsModule],
  template: `
    <h2 mat-dialog-title>Traffic Patterns</h2>
    <div mat-dialog-content class="dialog-body">
      <div class="section">
        <div class="section-title">Top IPs</div>
        <div class="grid">
          @for (ip of (data.patterns.ips || []); track ip.ip) {
            <div class="pill">
              <div class="mono">{{ ip.ip || 'Unknown' }}</div>
              <div class="muted">{{ (ip.country || 'N/A') }} - {{ ip.billableClicks || 0 }} billable</div>
            </div>
          }
          @if (!(data.patterns.ips || []).length) {
            <div class="muted">No IP data.</div>
          }
        </div>
      </div>

      <div class="section">
        <div class="section-title">Devices</div>
        <div class="chips">
          @for (d of (data.patterns.devices || []); track d.deviceType) {
            <mat-chip selected>{{ d.deviceType || 'unknown' }} ({{ d.billableClicks || 0 }})</mat-chip>
          }
          @if (!(data.patterns.devices || []).length) {
            <div class="muted">No device data.</div>
          }
        </div>
      </div>

      <div class="section">
        <div class="section-title">Top Countries</div>
        <div class="chips">
          @for (c of (data.patterns.countries || []); track c.country) {
            <mat-chip selected>{{ c.country || 'N/A' }} ({{ c.billableClicks || 0 }})</mat-chip>
          }
          @if (!(data.patterns.countries || []).length) {
            <div class="muted">No geo data.</div>
          }
        </div>
      </div>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>Close</button>
    </div>
  `,
  styles: [
    `
      .dialog-body {
        display: grid;
        gap: 16px;
      }
      .section-title {
        font-weight: 600;
        margin-bottom: 10px;
      }
      .grid {
        display: grid;
        gap: 10px;
      }
      .pill {
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        padding: 10px 12px;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .mono {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
      }
      .muted {
        color: rgba(0, 0, 0, 0.6);
        font-size: 13px;
        margin-top: 4px;
      }
    `,
  ],
})
export class PpcPromoterPatternsDialog {
  readonly data = inject<PpcPromoterRow>(MAT_DIALOG_DATA);
}

@Component({
  selector: 'app-ppc-warn-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Send Warning</h2>
    <div mat-dialog-content>
      <mat-form-field appearance="outline" class="wide">
        <mat-label>Message (optional)</mat-label>
        <textarea matInput rows="4" [formControl]="form.controls.message" maxlength="240"></textarea>
      </mat-form-field>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-stroked-button (click)="close()">Cancel</button>
      <button mat-flat-button color="primary" (click)="submit()">Send</button>
    </div>
  `,
  styles: [`.wide{width:100%;}`],
})
export class PpcWarnDialog {
  readonly data = inject<{ promoterId: string; displayName: string }>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<PpcWarnDialog>);
  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({ message: [''] });

  close(): void {
    this.dialogRef.close(undefined);
  }

  submit(): void {
    this.dialogRef.close(String(this.form.controls.message.value || ''));
  }
}

@Component({
  selector: 'app-ppc-suspend-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Suspend Account</h2>
    <div mat-dialog-content>
      <mat-form-field appearance="outline" class="wide">
        <mat-label>Reason (optional)</mat-label>
        <textarea matInput rows="4" [formControl]="form.controls.reason" maxlength="240"></textarea>
      </mat-form-field>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-stroked-button (click)="close()">Cancel</button>
      <button mat-flat-button color="warn" (click)="submit()">Suspend</button>
    </div>
  `,
  styles: [`.wide{width:100%;}`],
})
export class PpcSuspendDialog {
  readonly data = inject<{ promoterId: string; displayName: string }>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<PpcSuspendDialog>);
  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({ reason: [''] });

  close(): void {
    this.dialogRef.close(undefined);
  }

  submit(): void {
    this.dialogRef.close(String(this.form.controls.reason.value || ''));
  }
}
