import { CommonModule } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  OnInit,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '@shared/services/api';
import { UserService } from '../../common/services/user.service';

interface UnifiedData {
  period: { days: number; from: string; to: string };
  campaigns: { total: number; active: number; totalBudget: number; totalSpent: number; totalClicks: number; billableClicks: number; totalPayouts: number };
  storefront: { totalOrders: number; totalRevenue: number; totalCommission: number; averageOrderValue: number };
  wallet: { available: number; reserved: number; total: number };
  topCampaigns: { _id: string; title: string; billableClicks: number; budget: number; spentBudget: number; status: string }[];
  topProducts: { name: string; image: string; totalSold: number; revenue: number }[];
}

@Component({
  selector: 'app-unified-analytics',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './unified-analytics.component.html',
  styleUrls: ['./unified-analytics.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnifiedAnalyticsComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly data = signal<UnifiedData | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly days = signal(30);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams().set('days', String(this.days()));
    this.apiService
      .get<{ success: boolean; data: UnifiedData }>('api/v1/analytics/unified', params, undefined, true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.data.set(response.data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Failed to load analytics.');
          this.loading.set(false);
        },
      });
  }

  selectDays(d: number): void {
    if (this.days() === d) return;
    this.days.set(d);
    this.load();
  }

  format(value: number): string {
    if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + 'M';
    if (value >= 1_000) return (value / 1_000).toFixed(1) + 'K';
    return Math.round(value).toString();
  }

  formatCurrency(value: number): string {
    if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + 'M';
    if (value >= 1_000) return (value / 1_000).toFixed(1) + 'K';
    return Math.round(value).toLocaleString();
  }
}
