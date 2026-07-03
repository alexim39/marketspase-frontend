import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ServiceListManagementComponent } from '../service-list-management.component';

@Component({
  selector: 'app-service-list-mobile',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './service-list-management-mobile.component.html',
  styles: [`
    :host { display: block; min-height: 100dvh; background: var(--background-color); }
    .topbar { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: var(--surface-color); border-bottom: 1px solid var(--border-color); position: sticky; top: 0; z-index: 10; }
    .topbar h1 { font-size: 1rem; font-weight: 700; margin: 0; flex: 1; }
    .stats { display: flex; gap: 8px; padding: 10px 14px; }
    .stat-chip { padding: 6px 12px; border-radius: 999px; font-size: 11px; font-weight: 600; background: rgba(var(--primary-rgb), 0.06); color: var(--text-secondary); }
    .stat-chip strong { color: var(--primary-color); }
    .svc-list { padding: 10px 14px 40px; display: flex; flex-direction: column; gap: 8px; }
    .svc-card { background: var(--surface-color); border: 1px solid var(--border-color); border-radius: 14px; padding: 14px; }
    .svc-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
    .svc-card-header strong { font-size: 0.9rem; color: var(--text-primary); }
    .svc-badge { padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; }
    .svc-badge.published { background: rgba(var(--success-rgb), 0.1); color: var(--success-color); }
    .svc-badge.draft { background: rgba(var(--primary-rgb), 0.06); color: var(--text-secondary); }
    .svc-meta { display: flex; gap: 12px; font-size: 0.72rem; color: var(--text-tertiary); margin-bottom: 8px; }
    .svc-actions { display: flex; gap: 6px; }
    .svc-actions button { font-size: 0.72rem; min-height: 32px; }
    .loading-state { display: flex; flex-direction: column; align-items: center; padding: 3rem; gap: 10px; color: var(--text-secondary); }
    .empty-state { text-align: center; padding: 3rem; color: var(--text-secondary); }
    .empty-state mat-icon { font-size: 2.5rem; width: 2.5rem; height: 2.5rem; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceListManagementMobileComponent extends ServiceListManagementComponent {}
