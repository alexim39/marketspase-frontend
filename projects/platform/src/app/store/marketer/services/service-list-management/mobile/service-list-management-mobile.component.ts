import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ServiceListManagementComponent } from '../service-list-management.component';

@Component({
  selector: 'app-service-list-mobile',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatTooltipModule],
  templateUrl: './service-list-management-mobile.component.html',
  styles: [`
    :host { display: block; min-height: 100dvh; background: var(--background-color); }
    .topbar { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: var(--surface-color); border-bottom: 1px solid var(--border-color); position: sticky; top: 0; z-index: 10; }
    .topbar-title { flex: 1; span { display: block; font-size: 0.7rem; color: var(--text-secondary); } h1 { font-size: 1.05rem; font-weight: 800; margin: 0; color: var(--text-primary); } }
    .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 12px 14px; }
    .stat-item { text-align: center; padding: 10px 6px; background: var(--surface-color); border-radius: 10px; border: 1px solid var(--border-color); strong { display: block; font-size: 1.15rem; font-weight: 800; color: var(--primary-color); } span { display: block; font-size: 0.65rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.04em; margin-top: 2px; } }
    .stat-item.published strong { color: var(--success-color); }
    .stat-item.draft strong { color: var(--text-secondary); }
    .svc-list { padding: 0 14px 40px; display: flex; flex-direction: column; gap: 10px; }
    .svc-card { background: var(--surface-color); border: 1px solid var(--border-color); border-radius: 14px; padding: 14px; }
    .svc-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; strong { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); } }
    .svc-badge { padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; white-space: nowrap; }
    .svc-badge.published { background: rgba(var(--success-rgb), 0.1); color: var(--success-color); }
    .svc-badge.draft { background: rgba(var(--primary-rgb), 0.06); color: var(--text-secondary); }
    .svc-desc { font-size: 0.75rem; color: var(--text-secondary); margin: 0 0 8px; line-height: 1.4; }
    .svc-meta { display: flex; gap: 10px; font-size: 0.7rem; color: var(--text-tertiary); margin-bottom: 6px; }
    .svc-pricing { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-top: 1px solid var(--border-color); margin-bottom: 8px; strong { font-size: 0.92rem; font-weight: 800; color: var(--text-primary); } span { font-size: 0.68rem; color: var(--text-tertiary); text-transform: uppercase; } }
    .svc-footer { display: flex; align-items: center; justify-content: space-between; }
    .svc-inquiries { display: flex; align-items: center; gap: 4px; font-size: 0.73rem; color: var(--text-secondary); mat-icon { font-size: 16px; width: 16px; height: 16px; color: var(--text-tertiary); } }
    .svc-actions { display: flex; gap: 4px; }
    .loading-state { display: flex; flex-direction: column; align-items: center; padding: 3rem; gap: 10px; color: var(--text-secondary); }
    .error-state { display: flex; flex-direction: column; align-items: center; padding: 3rem; gap: 10px; color: var(--text-secondary); button { margin-top: 8px; } }
    .empty-state { text-align: center; padding: 3rem; color: var(--text-secondary); mat-icon { font-size: 3rem; width: 3rem; height: 3rem; opacity: 0.4; } h3 { margin: 8px 0; color: var(--text-primary); } p { font-size: 0.85rem; margin: 0 0 12px; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceListManagementMobileComponent extends ServiceListManagementComponent {}
