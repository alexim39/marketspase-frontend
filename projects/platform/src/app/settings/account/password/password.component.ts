import { ChangeDetectorRef, Component, inject, Input, OnDestroy, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { SettingsService } from '../../settings.service';
import { UserInterface } from '../../../common/services/user.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'async-password-changer',
  standalone: true,
  providers: [SettingsService],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './password.component.html',
  styleUrls: ['./password.component.scss']
})
export class PasswordChangeComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  private settingsService = inject(SettingsService);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef); // Add ChangeDetectorRef

  @Input() user!: UserInterface;
  passwordForm!: FormGroup;
  hideCurrent = signal(true);
  hideNew = signal(true);
  isLoading = false;

  ngOnInit(): void {
    this.initializeForm();
  }

 private initializeForm(): void {
    this.passwordForm = new FormGroup({
      currentPassword: new FormControl('', [
        Validators.required,
        Validators.minLength(8)
      ]),
      newPassword: new FormControl('', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
      ]),
      id: new FormControl(this.user?._id || '')
    });
  }

  // Add this method to check password strength
  getPasswordStrength(): string {
    const password = this.passwordForm.get('newPassword')?.value;
    if (!password) return 'none';
    
    // Check for character diversity
    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecial = /[@$!%*?&]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    
    const strengthFactors = [
      password.length >= 8,
      hasLetters,
      hasNumbers,
      hasSpecial,
      hasUpper && hasLower
    ].filter(Boolean).length;
    
    if (password.length < 8) return 'weak';
    if (strengthFactors === 3) return 'fair';
    if (strengthFactors === 4) return 'good';
    if (strengthFactors === 5) return 'strong';
    
    return 'weak';
  }

  togglePasswordVisibility(field: 'current' | 'new', event: MouseEvent): void {
    event.stopPropagation();
    if (field === 'current') {
      this.hideCurrent.set(!this.hideCurrent());
    } else {
      this.hideNew.set(!this.hideNew());
    }
    this.cdr.markForCheck(); // Trigger change detection after signal update
  }

   onSubmit(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      this.showNotification('Please fill all fields correctly', 'error');
      return;
    }

    if (this.passwordForm.value.currentPassword === this.passwordForm.value.newPassword) {
      this.showNotification('New password must be different from current password', 'error');
      return;
    }

    this.isLoading = true;
    const passwordData = this.passwordForm.value;

    this.subscriptions.push(
      this.settingsService.changePassword(passwordData).subscribe({
        next: (response) => {
          this.showNotification('Password changed successfully!', 'success');
          this.passwordForm.reset();
          this.isLoading = false;
          this.cdr.detectChanges(); // Trigger change detection after async operation
        },
        error: (error: HttpErrorResponse) => {
          const errorMessage = error.error?.message || 'Failed to change password. Please try again.';
          this.showNotification(errorMessage, 'error');
          this.isLoading = false;
          this.cdr.detectChanges(); // Trigger change detection after error
        }
      })
    );
  }

  private showNotification(message: string, panelClass: string = 'error'): void {
    this.snackBar.open(message, 'Close', { 
      duration: 5000,
      panelClass: [`snackbar-${panelClass}`]
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}