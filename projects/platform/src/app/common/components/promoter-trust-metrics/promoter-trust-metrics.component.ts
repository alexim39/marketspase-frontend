import { Component, input, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '@shared/services/api';

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
  styleUrls: ['./promoter-trust-metrics.component.scss'],
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
