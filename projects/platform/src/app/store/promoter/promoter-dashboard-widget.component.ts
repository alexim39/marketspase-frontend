import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '@shared/services';

@Component({
  selector: 'app-promoter-dashboard-widget',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <mat-card class="promoter-widget" appearance="outlined">
      <mat-card-header>
        <mat-icon mat-card-avatar>campaign</mat-icon>
        <mat-card-title>Your Promotions</mat-card-title>
        <mat-card-subtitle>Performance overview</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        @if (loading()) {
          <div class="loading"><mat-spinner diameter="28" /></div>
        } @else if (data(); as d) {
          <div class="metrics-grid">
            <div class="metric"><strong>{{ d.overview?.activePromotions || 0 }}</strong><span>Active</span></div>
            <div class="metric"><strong>{{ d.overview?.totalClicks || 0 }}</strong><span>Clicks</span></div>
            <div class="metric"><strong>{{ d.overview?.totalConversions || 0 }}</strong><span>Conversions</span></div>
            <div class="metric highlight"><strong>{{ formatCurrency(d.overview?.totalEarnings) }}</strong><span>Earnings</span></div>
          </div>
          @if (d.overview?.overallConversionRate > 0) {
            <div class="conv-banner">Overall conversion rate: <strong>{{ d.overview.overallConversionRate }}%</strong></div>
          }
          @if (d.recentPromotions?.length) {
            <h4 class="section-label">Recent</h4>
            @for (p of d.recentPromotions.slice(0, 3); track p._id) {
              <div class="recent-row"><span>{{ p.productName }}</span><small>{{ p.clicks || 0 }} clicks &middot; {{ formatCurrency(p.earnings) }}</small></div>
            }
          }
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .promoter-widget { max-width: 500px; }
    .loading { display: flex; justify-content: center; padding: 1.5rem; }
    .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.6rem; margin-bottom: 0.75rem; }
    .metric { text-align: center; padding: 0.45rem; border-radius: 8px; background: rgba(var(--primary-rgb), 0.04); }
    .metric strong { display: block; font-size: 1.05rem; color: var(--text-primary); }
    .metric span { font-size: 0.68rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
    .metric.highlight strong { color: var(--success-color); }
    .conv-banner { font-size: 0.78rem; padding: 0.4rem 0.6rem; border-radius: 6px; background: rgba(var(--success-rgb), 0.08); color: var(--success-color); text-align: center; margin-bottom: 0.5rem; }
    .section-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); margin: 0.5rem 0 0.3rem; }
    .recent-row { display: flex; justify-content: space-between; align-items: center; padding: 0.35rem 0; font-size: 0.8rem; border-bottom: 1px solid var(--border-color); }
    .recent-row:last-child { border-bottom: none; }
    .recent-row small { color: var(--text-secondary); font-size: 0.72rem; }
  `],
})
export class PromoterDashboardWidgetComponent implements OnInit {
  private api = inject(ApiService);
  readonly loading = signal(true);
  readonly data = signal<any>(null);

  ngOnInit(): void {
    this.api.get<any>('api/v1/stores/product/promotions/overview', undefined, undefined, true)
      .subscribe({ next: (r) => { this.data.set(r?.data); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  formatCurrency(v: number): string { return v ? `₦${v.toLocaleString()}` : '₦0'; }
}
