import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { UnifiedAnalyticsComponent } from '../unified-analytics.component';

@Component({
  selector: 'app-unified-analytics-mobile',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatIconModule, MatButtonModule],
  templateUrl: './unified-analytics-mobile.component.html',
  styles: [`
    :host { display: block; min-height: 100dvh; background: var(--background-color); }
    .analytics-topbar { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--surface-color); border-bottom: 1px solid var(--border-color); position: sticky; top: 0; z-index: 10; }
    .analytics-topbar h1 { font-size: 1rem; font-weight: 700; margin: 0; }
    .period-chips { display: flex; gap: 4px; padding: 10px 14px; background: var(--background-color); }
    .period-chip { padding: 6px 14px; border-radius: 999px; border: 1px solid var(--border-color); font-size: 12px; font-weight: 600; background: none; color: var(--text-secondary); }
    .period-chip.active { background: var(--primary-color); color: #fff; border-color: var(--primary-color); }
    .kpi-scroll { display: flex; gap: 10px; overflow-x: auto; padding: 0 14px 10px; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; }
    .kpi-card { min-width: 140px; flex-shrink: 0; padding: 14px; background: var(--surface-color); border: 1px solid var(--border-color); border-radius: 14px; scroll-snap-align: start; }
    .kpi-card mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--primary-color); margin-bottom: 6px; }
    .kpi-card strong { display: block; font-size: 1.2rem; font-weight: 700; color: var(--text-primary); }
    .kpi-card span { font-size: 11px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.04em; }
    .section { padding: 0 14px; margin-bottom: 18px; }
    .section h2 { font-size: 0.9rem; font-weight: 600; margin: 0 0 8px; color: var(--text-primary); }
    .list-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--surface-color); border: 1px solid var(--border-color); border-radius: 12px; margin-bottom: 6px; }
    .list-item strong { font-size: 0.85rem; color: var(--text-primary); }
    .list-item span { font-size: 0.75rem; color: var(--text-secondary); display: block; }
    .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem; gap: 12px; color: var(--text-secondary); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnifiedAnalyticsMobileComponent extends UnifiedAnalyticsComponent {}
