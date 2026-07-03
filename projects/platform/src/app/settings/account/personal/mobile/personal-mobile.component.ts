import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { PersonalInfoComponent } from '../personal.component';
import { ProfileService } from '../../profile.service';

@Component({
  selector: 'async-personal-infor-mobile',
  standalone: true,
  providers: [ProfileService],
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatDatepickerModule, MatNativeDateModule, MatSlideToggleModule,
    MatSnackBarModule, MatIconModule, MatSelectModule,
    MatProgressSpinnerModule, MatAutocompleteModule,
  ],
  templateUrl: './personal-mobile.component.html',
  styles: [`
    :host { display: block; width: 100%; }
    .mobile-form { display: flex; flex-direction: column; gap: 14px; padding: 16px; }
    mat-form-field { width: 100%; }

    .phone-row { display: flex; gap: 8px;
      .country-code { flex: 0 0 130px; min-width: 0; }
      .phone-field { flex: 1; min-width: 0; }
      .phone-prefix { font-size: 13px; color: var(--text-secondary); padding-left: 2px; }
    }
    .search-box { padding: 8px; border-bottom: 1px solid var(--border-color); }
    .search-box input { width: 100%; border: none; outline: none; font-size: 14px; background: transparent; color: var(--text-primary); }

    .toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0;
      strong { display: block; font-size: 14px; color: var(--text-primary); }
      span { font-size: 12px; color: var(--text-secondary); }
    }

    .age-banner { display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: rgba(var(--warning-rgb), 0.08); border: 1px solid rgba(var(--warning-rgb), 0.2); border-radius: 10px; font-size: 13px; color: var(--warning-color);
      mat-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }
    }

    .form-actions { margin-top: 4px; }
    .form-actions button { width: 100%; min-height: 48px; font-weight: 600; font-size: 15px; border-radius: 12px; }

    .saving-bar { display: flex; align-items: center; gap: 8px; padding: 10px; color: var(--text-secondary); font-size: 13px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonalInfoMobileComponent extends PersonalInfoComponent {}
