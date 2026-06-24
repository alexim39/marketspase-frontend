import { Component, input, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '@shared/services';

const TIER_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  gold: { label: 'Gold', icon: 'workspace_premium', color: '#f59e0b' },
  silver: { label: 'Silver', icon: 'military_tech', color: '#94a3b8' },
  bronze: { label: 'Bronze', icon: 'shield', color: '#d97706' },
  unranked: { label: '', icon: '', color: '' },
};

@Component({
  selector: 'promoter-tier-badge',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  template: `
    @if (tierData()['label']) {
      <span class="tier-badge" [style.background]="tierBg()" [matTooltip]="'Promoter ' + tierData()['label'] + ' Tier'">
        <mat-icon>{{ tierData()['icon'] }}</mat-icon>
        {{ tierData()['label'] }}
      </span>
    }
  `,
  styles: [`
    .tier-badge { display: inline-flex; align-items: center; gap: 0.2rem; padding: 0.15rem 0.5rem; border-radius: 999px; font-size: 0.68rem; font-weight: 700; color: #fff; }
    .tier-badge mat-icon { width: 14px; height: 14px; font-size: 14px; }
  `],
})
export class PromoterTierBadgeComponent {
  private api = inject(ApiService);
  readonly promoterId = input.required<string>();
  readonly tierData = signal(TIER_CONFIG['unranked']);
  readonly tierBg = signal('');

  constructor() {
    effect(() => {
      const id = this.promoterId();
      if (!id) return;
      this.api.get<any>(`api/v1/user/promoter/${id}/tier`, undefined, undefined, true)
        .subscribe({
          next: (r) => {
            const tier = r?.data?.tier || 'unranked';
            this.tierData.set(TIER_CONFIG[tier] || TIER_CONFIG['unranked']);
            this.tierBg.set(TIER_CONFIG[tier]?.color || 'transparent');
          },
          error: () => null,
        });
    });
  }
}
