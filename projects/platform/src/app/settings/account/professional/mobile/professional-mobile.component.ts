import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { ProfessionalInfoComponent } from '../professional.component';
import { ProfileService } from '../../profile.service';

@Component({
  selector: 'async-professional-info-mobile',
  standalone: true,
  providers: [ProfileService],
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatSelectModule, MatIconModule, MatSnackBarModule,
    MatProgressSpinnerModule, MatChipsModule,
  ],
  templateUrl: './professional-mobile.component.html',
  styles: [`
    :host { display: block; width: 100%; }
    .mobile-form { display: flex; flex-direction: column; gap: 14px; padding: 16px; }
    mat-form-field { width: 100%; }
    .form-actions { display: flex; gap: 10px; margin-top: 8px; }
    .form-actions button { flex: 1; min-height: 44px; font-weight: 600; border-radius: 12px; }
    .saving-bar { display: flex; align-items: center; gap: 8px; padding: 10px; color: var(--text-secondary); font-size: 13px; }
    .chip-hint { font-size: 12px; color: var(--text-tertiary); margin-top: -8px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessionalInfoMobileComponent extends ProfessionalInfoComponent {}
