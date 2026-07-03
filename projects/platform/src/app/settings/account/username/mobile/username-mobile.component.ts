import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UsernameInfoComponent } from '../username.component';
import { ProfileService } from '../../profile.service';

@Component({
  selector: 'async-username-info-mobile',
  standalone: true,
  providers: [ProfileService],
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatSnackBarModule, MatProgressSpinnerModule,
  ],
  templateUrl: './username-mobile.component.html',
  styles: [`
    :host { display: block; width: 100%; }
    .mobile-form { display: flex; flex-direction: column; gap: 14px; padding: 16px; }
    mat-form-field { width: 100%; }
    .form-actions { display: flex; gap: 10px; margin-top: 8px; }
    .form-actions button { flex: 1; min-height: 44px; font-weight: 600; border-radius: 12px; }
    .saving-bar { display: flex; align-items: center; gap: 8px; padding: 10px; color: var(--text-secondary); font-size: 13px; }
    .url-preview { padding: 10px; background: rgba(var(--primary-rgb), 0.05); border-radius: 10px; font-size: 13px; color: var(--text-secondary); border: 1px solid rgba(var(--primary-rgb), 0.1); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsernameInfoMobileComponent extends UsernameInfoComponent {}
