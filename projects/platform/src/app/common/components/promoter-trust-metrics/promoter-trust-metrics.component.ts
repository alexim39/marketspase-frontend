import { Component, input, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '@shared/services';

@Component({
  selector: 'promoter-trust-metrics',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  template: `
    @if (metrics(); as m) {
      <span class="trust-badges" matTooltip="Clicks: {{ m.totalClicks }} | Leads: {{ m.totalLeads }} | Conv: {{ m.conversionRate }}%">
        <span class="trust-chip" [class.trust-high]="m.rating >= 4">
          <mat-icon>star</mat-icon>{{ m.rating }}
        </span>
        <span class="trust-chip">{{ m.totalClicks }} clicks</span>
        <span class="trust-chip">{{ m.conversionRate }}% conv.</span>
      </span>
    }
  `,
  styles: [`
    .trust-badges { display: inline-flex; gap: 0.3rem; align-items: center; cursor: help; }
    .trust-chip { display: inline-flex; align-items: center; gap: 0.1rem; padding: 0.1rem 0.35rem; border-radius: 999px; font-size: 0.65rem; font-weight: 600; background: rgba(var(--primary-rgb), 0.07); color: var(--text-secondary); }
    .trust-chip mat-icon { font-size: 12px; width: 12px; height: 12px; }
    .trust-high { background: rgba(var(--success-rgb), 0.12); color: var(--success-color); }
  `],
})
export class PromoterTrustMetricsComponent {
  private api = inject(ApiService);
  readonly promoterId = input.required<string>();
  readonly metrics = signal<any>(null);

  constructor() {
    effect(() => {
      const id = this.promoterId();
      if (!id) return;
      this.api.get<any>(`api/v1/user/promoter/${id}/trust`, undefined, undefined, true)
        .subscribe({
          next: (r) => this.metrics.set(r?.data || null),
          error: () => null,
        });
    });
  }
}
