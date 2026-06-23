import { CommonModule, DatePipe, DecimalPipe, TitleCasePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  CollaborationService,
  LeadDailyRow,
  LeadPromotionRow,
} from '../../collaboration/collaboration.service';

@Component({
  selector: 'app-campaign-metrics-detail',
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
  templateUrl: './campaign-metrics-detail.component.html',
  styleUrls: ['./campaign-metrics-detail.component.scss'],
})
export class CampaignMetricsDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly collaborationService = inject(CollaborationService);
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

  readonly campaignTitle = signal('');
  readonly campaignStatus = signal('');
  readonly campaignId = signal('');

  readonly summary = signal({
    totalViews: 0, totalLeads: 0, totalContactMe: 0,
    totalFormViews: 0, totalFailures: 0, conversionRate: 0,
  });

  readonly promotionBreakdown = signal<LeadPromotionRow[]>([]);
  readonly dailySeries = signal<LeadDailyRow[]>([]);

  readonly filtersForm = this.fb.nonNullable.group({
    range: ['30'],
    startDate: [''],
    endDate: [''],
  });

  readonly hasPromotions = computed(() => this.promotionBreakdown().length > 0);
  readonly hasDailyData = computed(() => this.dailySeries().length > 0);

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('campaignId') || '';
          this.campaignId.set(id);
          return this.route.queryParams;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.loadData();
      });

    this.filtersForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (value.range !== 'custom' && (value.startDate || value.endDate)) {
          this.filtersForm.patchValue(
            { startDate: '', endDate: '' },
            { emitEvent: false },
          );
        }
        this.loadData(true);
      });
  }

  refreshNow(): void {
    this.loadData(true);
  }

  clearFilters(): void {
    this.filtersForm.setValue({ range: '30', startDate: '', endDate: '' });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/campaigns/metrics']);
  }

  formatNumber(value: number, digits: number = 0): string {
    const format = digits > 0 ? `1.${digits}-${digits}` : '1.0-0';
    return this.decimalPipe.transform(value || 0, format) || '0';
  }

  trackByPromotionId(_index: number, item: LeadPromotionRow): string {
    return item.promotionId || item.upi || '';
  }

  trackByDate(_index: number, item: LeadDailyRow): string {
    return item.date;
  }

  private loadData(silent: boolean = false): void {
    const campaignId = this.campaignId();
    if (!campaignId) return;

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

    this.collaborationService.getCampaignLeadDetail(campaignId, filters)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading.set(false);
          this.refreshing.set(false);
        }),
      )
      .subscribe({
        next: (response) => {
          const d = response.data;
          this.campaignTitle.set(d.campaign.title);
          this.campaignStatus.set(d.campaign.status);
          this.summary.set(d.summary);
          this.promotionBreakdown.set(d.promotionBreakdown);
          this.dailySeries.set(d.dailySeries);
          this.generatedAt.set(response.generatedAt);
        },
        error: (error) => {
          const message = error?.error?.message || 'Could not load campaign detail metrics.';
          this.error.set(message);
          this.snackBar.open(message, 'Close', { duration: 3200 });
        },
      });
  }
}
