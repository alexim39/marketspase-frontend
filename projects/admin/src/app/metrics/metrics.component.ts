import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule, DecimalPipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MetricService, CampaignMetricRow, MetricStats, TopEntry } from './metric.service';

@Component({
  selector: 'admin-campaign-metrics',
  standalone: true,
  providers: [MetricService, DecimalPipe, TitleCasePipe],
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatTooltipModule,
    MatProgressSpinnerModule, MatSnackBarModule,
  ],
  templateUrl: './metrics.component.html',
  styleUrls: ['./metrics.component.scss'],
})
export class AdminMetricsComponent implements OnInit {
  readonly metricService = inject(MetricService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly decimalPipe = inject(DecimalPipe);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly campaignBreakdown = signal<CampaignMetricRow[]>([]);
  readonly stats = signal<MetricStats | null>(null);
  readonly topCampaign = signal<TopEntry | null>(null);
  readonly topPromoter = signal<TopEntry | null>(null);

  readonly range = signal('30');
  readonly startDate = signal('');
  readonly endDate = signal('');

  readonly hasData = computed(() => this.campaignBreakdown().length > 0);

  readonly totalViews = computed(() => this.stats()?.totalViews ?? 0);
  readonly totalLeads = computed(() => this.stats()?.totalLeads ?? 0);
  readonly totalContactMe = computed(() => this.stats()?.totalContactMe ?? 0);
  readonly conversionRate = computed(() => this.stats()?.conversionRate ?? 0);

  ngOnInit(): void {
    this.loadMetrics();
  }

  loadMetrics(): void {
    this.loading.set(true);
    this.error.set(null);

    this.metricService.getMetrics(
      this.range(),
      this.range() === 'custom' ? this.startDate() : undefined,
      this.range() === 'custom' ? this.endDate() : undefined,
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.campaignBreakdown.set(res.data?.campaignBreakdown ?? []);
          this.stats.set(res.data?.summary ?? null);
          this.topCampaign.set(res.data?.topCampaign ?? null);
          this.topPromoter.set(res.data?.topPromoter ?? null);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Failed to load campaign metrics.');
          this.loading.set(false);
          this.snackBar.open('Could not load metrics.', 'Close', { duration: 3200 });
        },
      });
  }

  applyFilters(): void {
    this.loadMetrics();
  }

  clearFilters(): void {
    this.range.set('30');
    this.startDate.set('');
    this.endDate.set('');
    this.loadMetrics();
  }

  formatNumber(value: number, digits: number = 0): string {
    const format = digits > 0 ? `1.${digits}-${digits}` : '1.0-0';
    return this.decimalPipe.transform(value || 0, format) || '0';
  }

  trackById(_index: number, item: CampaignMetricRow): string {
    return item.campaignId;
  }
}
