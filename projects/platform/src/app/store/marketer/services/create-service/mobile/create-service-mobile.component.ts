import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CreateServiceComponent } from '../create-service.component';

@Component({
  selector: 'app-create-service-mobile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule,
    MatSelectModule, MatChipsModule, MatRadioModule, MatProgressSpinnerModule],
  templateUrl: './create-service-mobile.component.html',
  styles: [`
    :host { display: block; min-height: 100dvh; background: var(--background-color); }
    .topbar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--surface-color); border-bottom: 1px solid var(--border-color); position: sticky; top: 0; z-index: 10; }
    .topbar strong { font-size: 15px; }
    .form-scroll { padding: 14px 14px 100px; }
    .ai-banner { padding: 12px; background: rgba(var(--primary-rgb), 0.04); border: 1px solid rgba(var(--primary-rgb), 0.12); border-radius: 12px; margin-bottom: 12px; }
    .ai-banner textarea { width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 10px; font: inherit; font-size: 14px; resize: vertical; }
    .ai-banner button { margin-top: 6px; width: 100%; font-weight: 600; }
    .form-card { background: var(--surface-color); border: 1px solid var(--border-color); border-radius: 14px; padding: 14px; margin-bottom: 12px; }
    .form-card h3 { font-size: 0.9rem; font-weight: 600; margin: 0 0 10px; color: var(--text-primary); }
    .form-card mat-form-field { width: 100%; margin-bottom: 2px; }
    .form-card mat-radio-group { display: flex; flex-direction: column; gap: 8px; }
    .submit-btn { position: fixed; bottom: 0; left: 0; right: 0; padding: 10px 14px calc(10px + env(safe-area-inset-bottom)); background: var(--surface-color); border-top: 1px solid var(--border-color); z-index: 9; }
    .submit-btn button { width: 100%; height: 48px; font-weight: 600; font-size: 15px; border-radius: 14px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateServiceMobileComponent extends CreateServiceComponent {}
