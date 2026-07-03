import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '@shared/services/api';

@Component({
  selector: 'app-storefront-analytics-widget',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <mat-card class="analytics-widget" appearance="outlined">
      <mat-card-header>
        <mat-icon mat-card-avatar>insights</mat-icon>
        <mat-card-title>Storefront Analytics</mat-card-title>
        <mat-card-subtitle>Last {{ days() }} days</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        @if (loading()) {
          <div class="loading"><mat-spinner diameter="28" /></div>
        } @else if (data(); as d) {
          <div class="metrics-grid">
            <div class="metric"><strong>{{ formatCurrency(d.overview?.gmv) }}</strong><span>GMV</span></div>
            <div class="metric"><strong>{{ d.overview?.totalOrders || 0 }}</strong><span>Orders</span></div>
            <div class="metric"><strong>{{ formatCurrency(d.overview?.averageOrderValue) }}</strong><span>Avg. Order</span></div>
            <div class="metric"><strong>{{ formatCurrency(d.overview?.totalCommission) }}</strong><span>Commission</span></div>
          </div>
          @if (d.topProducts?.length) {
            <h4 class="section-label">Top Products</h4>
            <div class="top-list">
              @for (p of d.topProducts.slice(0, 3); track p._id) {
                <div class="top-item"><div class="top-image" [style.background-image]="'url(' + (p.image || '') + ')'"></div><span>{{ p.name }}</span><small>{{ p.purchaseCount || 0 }} sold</small></div>
              }
            </div>
          }
          @if (d.topPromoters?.length) {
            <h4 class="section-label">Top Promoters</h4>
            <div class="top-list">
              @for (p of d.topPromoters.slice(0, 3); track p._id) {
                <div class="top-item"><span>{{ p.displayName }}</span><small>{{ p.totalConversions || 0 }} conversions &middot; {{ formatCurrency(p.totalEarnings) }}</small></div>
              }
            </div>
          }
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .analytics-widget { max-width: 600px; }
    .loading { display: flex; justify-content: center; padding: 1.5rem; }
    .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; margin-bottom: 1rem; }
    .metric { text-align: center; padding: 0.5rem; border-radius: 8px; background: rgba(var(--primary-rgb), 0.04); }
    .metric strong { display: block; font-size: 1.1rem; color: var(--text-primary); }
    .metric span { font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
    .section-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); margin: 0.75rem 0 0.35rem; }
    .top-list { display: flex; flex-direction: column; gap: 0.4rem; }
    .top-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; }
    .top-item small { margin-left: auto; color: var(--text-secondary); font-size: 0.72rem; }
    .top-image { width: 28px; height: 28px; border-radius: 4px; background: var(--border-color); background-size: cover; background-position: center; flex-shrink: 0; }
  `],
})
export class StorefrontAnalyticsWidgetComponent implements OnInit {
  private api = inject(ApiService);
  readonly loading = signal(true);
  readonly data = signal<any>(null);
  readonly days = signal(30);

  ngOnInit(): void {
    this.api.get<any>(`api/v1/stores/storefront/analytics?days=${this.days()}`, undefined, undefined, true)
      .subscribe({ next: (r) => { this.data.set(r?.data); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  formatCurrency(v: number): string { return v ? `₦${v.toLocaleString()}` : '₦0'; }
}
