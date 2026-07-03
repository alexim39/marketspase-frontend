import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ServiceInquiryPageComponent } from '../service-inquiry-page.component';

@Component({
  selector: 'app-service-inquiry-mobile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule,
    MatProgressBarModule, MatChipsModule, MatTooltipModule],
  templateUrl: './service-inquiry-mobile.component.html',
  styles: [`
    :host { display: block; min-height: 100dvh; background: var(--background-color); }
    .inquiry-topbar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--surface-color); border-bottom: 1px solid var(--border-color); position: sticky; top: 0; z-index: 10; }
    .inquiry-topbar a { color: var(--text-primary); }
    .inquiry-topbar strong { font-size: 15px; }
    .inquiry-scroll { padding: 14px; padding-bottom: 100px; }
    .svc-hero-img { width: 100%; height: 180px; object-fit: cover; border-radius: 14px; margin-bottom: 14px; background: rgba(var(--primary-rgb), 0.04); }
    .svc-title { font-size: 1.15rem; font-weight: 700; margin: 0 0 8px; color: var(--text-primary); }
    .svc-badges { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
    .badge { padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; background: rgba(var(--primary-rgb), 0.08); color: var(--primary-color); }
    .badge.avail { background: rgba(var(--success-rgb), 0.1); color: var(--success-color); }
    .svc-price { font-size: 1.4rem; font-weight: 800; color: var(--primary-color); margin-bottom: 10px; }
    .svc-desc { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 12px; }
    .svc-meta { display: flex; gap: 12px; font-size: 0.78rem; color: var(--text-tertiary); margin-bottom: 16px; align-items: center; }
    .svc-meta mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .pkg-chips { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 6px; margin-bottom: 16px; }
    .pkg-chip { flex-shrink: 0; padding: 10px 14px; border: 1.5px solid var(--border-color); border-radius: 12px; text-align: left; background: none; cursor: pointer; }
    .pkg-chip.selected { border-color: var(--primary-color); background: rgba(var(--primary-rgb), 0.04); }
    .pkg-chip strong { display: block; font-size: 13px; color: var(--text-primary); }
    .pkg-chip span { font-size: 12px; color: var(--primary-color); font-weight: 700; }

    .form-card { background: var(--surface-color); border-radius: 16px; border: 1px solid var(--border-color); padding: 16px; margin-bottom: 14px; }
    .form-card h3 { font-size: 0.95rem; font-weight: 600; margin: 0 0 12px; color: var(--text-primary); }
    .form-card mat-form-field { width: 100%; margin-bottom: 4px; }

    .submit-bar { position: fixed; bottom: 0; left: 0; right: 0; padding: 10px 14px calc(10px + env(safe-area-inset-bottom)); background: var(--surface-color); border-top: 1px solid var(--border-color); z-index: 9; }
    .submit-bar button { width: 100%; height: 48px; font-weight: 600; font-size: 15px; border-radius: 14px; }

    .loading-state, .error-state, .success-state { text-align: center; padding: 3rem 1rem; }
    .success-state mat-icon { font-size: 3rem; width: 3rem; height: 3rem; color: var(--success-color); }
    .success-state h2 { margin: 0.5rem 0; font-size: 1.2rem; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceInquiryMobileComponent extends ServiceInquiryPageComponent {}
