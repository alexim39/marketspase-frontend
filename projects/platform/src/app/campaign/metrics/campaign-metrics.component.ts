import { CommonModule, DatePipe, DecimalPipe, TitleCasePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  CollaborationService,
  LeadAnalyticsResponse,
  LeadCampaignRow,
} from '../collaboration/collaboration.service';

@Component({
  selector: 'app-campaign-metrics',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  providers: [DatePipe, DecimalPipe, TitleCasePipe],
  templateUrl: './campaign-metrics.component.html',
  styleUrls: ['./campaign-metrics.component.scss'],
})
export class CampaignMetricsComponent {
  private readonly collaborationService = inject(CollaborationService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly decimalPipe = inject(DecimalPipe);
  private readonly datePipe = inject(DatePipe);
  private readonly titleCasePipe = inject(TitleCasePipe);

  readonly loading = signal(true);
  readonly refreshing = signal(false);
  readonly generatedAt = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly data = signal<LeadAnalyticsResponse['data'] | null>(null);

  readonly filtersForm = this.fb.nonNullable.group({
    range: ['30'],
    startDate: [''],
    endDate: [''],
  });

  readonly campaignBreakdown = computed<LeadCampaignRow[]>(() => {
    return this.data()?.campaignBreakdown ?? [];
  });

  readonly topCampaign = computed(() => this.data()?.topCampaign ?? null);
  readonly topPromoter = computed(() => this.data()?.topPromoter ?? null);

  readonly hasData = computed(() => (this.data()?.campaignBreakdown ?? []).length > 0);

  readonly totalLeads = computed(() =>
    this.campaignBreakdown().reduce((s, r) => s + (r.leads || 0), 0)
  );

  readonly totalViews = computed(() =>
    this.campaignBreakdown().reduce((s, r) => s + (r.landingViews || 0), 0)
  );

  readonly totalContactMe = computed(() =>
    this.campaignBreakdown().reduce((s, r) => s + (r.contactMe || 0), 0)
  );

  readonly aggregateRate = computed(() => {
    const v = this.totalViews();
    const l = this.totalLeads();
    return v > 0 ? Math.round((l / v) * 100) : 0;
  });

  constructor() {
    this.filtersForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (value.range !== 'custom' && (value.startDate || value.endDate)) {
          this.filtersForm.patchValue(
            { startDate: '', endDate: '' },
            { emitEvent: false }
          );
        }
        this.loadData(true);
      });

    this.loadData();
  }

  refreshNow(): void {
    this.loadData(true);
  }

  navigateToDetail(campaignId: string): void {
    this.router.navigate(['/dashboard/campaigns/metrics', campaignId]);
  }

  clearFilters(): void {
    this.filtersForm.setValue({ range: '30', startDate: '', endDate: '' });
  }

  formatNumber(value: number, digits: number = 0): string {
    const format = digits > 0 ? `1.${digits}-${digits}` : '1.0-0';
    return this.decimalPipe.transform(value || 0, format) || '0';
  }

  trackByCampaignId(_index: number, item: LeadCampaignRow): string {
    return item.campaignId;
  }

  private loadData(silent: boolean = false): void {
    if (silent) {
      this.refreshing.set(true);
    } else {
      this.loading.set(true);
    }
    this.error.set(null);

    const rawValue = this.filtersForm.getRawValue();
    const filters = {
      range: rawValue.range,
      startDate: rawValue.range === 'custom' ? rawValue.startDate || null : null,
      endDate: rawValue.range === 'custom' ? rawValue.endDate || null : null,
    };

    this.collaborationService.getMarketerLeadAnalytics(filters)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading.set(false);
          this.refreshing.set(false);
        })
      )
      .subscribe({
        next: (response) => {
          this.data.set(response.data);
          this.generatedAt.set(response.generatedAt);
        },
        error: (error) => {
          const message = error?.error?.message || 'Could not load campaign metrics.';
          this.error.set(message);
          this.snackBar.open(message, 'Close', { duration: 3200 });
        },
      });
  }
}
