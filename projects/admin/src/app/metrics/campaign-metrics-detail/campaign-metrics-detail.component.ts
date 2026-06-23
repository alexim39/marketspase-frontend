import { CommonModule, DecimalPipe, TitleCasePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  MetricService,
  AdminPromotionRow,
  AdminDailyRow,
} from '../metric.service';

@Component({
  selector: 'admin-campaign-metrics-detail',
  standalone: true,
  providers: [MetricService, DecimalPipe, TitleCasePipe],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './campaign-metrics-detail.component.html',
  styleUrls: ['./campaign-metrics-detail.component.scss'],
})
export class CampaignMetricsDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly metricService = inject(MetricService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly decimalPipe = inject(DecimalPipe);

  readonly loading = signal(true);
  readonly refreshing = signal(false);
  readonly error = signal<string | null>(null);

  readonly campaignTitle = signal('');
  readonly campaignStatus = signal('');
  readonly campaignId = signal('');
  readonly marketerName = signal('');
  readonly marketerEmail = signal('');
  readonly marketerAvatar = signal('');

  readonly summary = signal({
    totalViews: 0, totalLeads: 0, totalContactMe: 0,
    totalFormViews: 0, totalFailures: 0, conversionRate: 0,
  });

  readonly promotionBreakdown = signal<AdminPromotionRow[]>([]);
  readonly dailySeries = signal<AdminDailyRow[]>([]);

  readonly range = signal('30');
  readonly startDate = signal('');
  readonly endDate = signal('');

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
  }

  applyFilters(): void {
    this.loadData();
  }

  clearFilters(): void {
    this.range.set('30');
    this.startDate.set('');
    this.endDate.set('');
    this.loadData();
  }

  goBack(): void {
    this.router.navigate(['/dashboard/metrics']);
  }

  formatNumber(value: number, digits: number = 0): string {
    const format = digits > 0 ? `1.${digits}-${digits}` : '1.0-0';
    return this.decimalPipe.transform(value || 0, format) || '0';
  }

  trackByPromotionId(_index: number, item: AdminPromotionRow): string {
    return item.promotionId || item.upi || '';
  }

  trackByDate(_index: number, item: AdminDailyRow): string {
    return item.date;
  }

  private loadData(): void {
    const id = this.campaignId();
    if (!id) return;

    this.loading.set(true);
    this.error.set(null);

    this.metricService.getCampaignMetricsDetail(
      id,
      this.range(),
      this.range() === 'custom' ? this.startDate() : undefined,
      this.range() === 'custom' ? this.endDate() : undefined,
    )
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
          this.marketerName.set(d.campaign.marketer?.name || '');
          this.marketerEmail.set(d.campaign.marketer?.email || '');
          this.marketerAvatar.set(d.campaign.marketer?.avatar || '');
          this.summary.set(d.summary);
          this.promotionBreakdown.set(d.promotionBreakdown);
          this.dailySeries.set(d.dailySeries);
        },
        error: (error) => {
          const message = error?.error?.message || 'Could not load campaign detail metrics.';
          this.error.set(message);
          this.snackBar.open(message, 'Close', { duration: 3200 });
        },
      });
  }
}
