// edit-display-name-dialog.component.ts
import { Component, Inject, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserInterface } from '../../../../../shared-services/src/public-api';
import { UserService } from './../users.service';

export interface EditDisplayNameDialogData {
  user: UserInterface;
  currentDisplayName: string;
}

@Component({
  selector: 'admin-edit-display-name-dialog',
  standalone: true,
  providers: [UserService],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  template: `
    <div class="p-6">
      <h2 class="text-xl font-semibold mb-4">Edit Display Name</h2>
      
      <form [formGroup]="editForm" (ngSubmit)="onSubmit()" class="space-y-4">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Display Name</mat-label>
          <input matInput 
                 formControlName="displayName" 
                 placeholder="Enter display name"
                 [attr.aria-label]="'Display name input'"
                 [attr.aria-describedby]="'current-name-hint'" />
          
          <mat-hint id="current-name-hint">
            Current: {{ data.currentDisplayName }}
          </mat-hint>
          
          @if (editForm.get('displayName')?.hasError('required') && editForm.get('displayName')?.touched) {
            <mat-error>Display name is required</mat-error>
          }
          @if (editForm.get('displayName')?.hasError('minlength') && editForm.get('displayName')?.touched) {
            <mat-error>Display name must be at least 2 characters</mat-error>
          }
          @if (editForm.get('displayName')?.hasError('maxlength') && editForm.get('displayName')?.touched) {
            <mat-error>Display name cannot exceed 50 characters</mat-error>
          }
          @if (editForm.get('displayName')?.hasError('pattern') && editForm.get('displayName')?.touched) {
            <mat-error>Display name can only contain letters, numbers, spaces, hyphens, and underscores</mat-error>
          }
        </mat-form-field>

        <div class="flex justify-end space-x-2 pt-4">
          <button 
            mat-button 
            type="button" 
            (click)="onCancel()"
            [disabled]="isLoading()"
            class="cancel-button"
          >
            Cancel
          </button>
          <button 
            mat-raised-button 
            color="primary" 
            type="submit"
            [disabled]="editForm.invalid || isLoading()"
            class="save-button"
          >
            <div class="flex items-center">
              @if (isLoading()) {
                <mat-spinner diameter="20" class="mr-2"></mat-spinner>
              }
              <span>Save Changes</span>
            </div>
          </button>
        </div>
      </form>
    </div>
  `,
  styleUrls: ['./edit-display-name-dialog.component.scss']
})
export class EditDisplayNameDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<EditDisplayNameDialogComponent>);
  private readonly userService = inject(UserService);
  private readonly snackBar = inject(MatSnackBar);
  
  readonly isLoading = signal(false);
  
  editForm: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: EditDisplayNameDialogData
  ) {
    this.editForm = this.fb.group({
      displayName: [
        data.currentDisplayName || '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-Z0-9\s\-_]+$/) // Basic validation for display names
        ]
      ]
    });
  }

  onSubmit(): void {
    if (this.editForm.valid && !this.isLoading()) {
      this.isLoading.set(true);
      
      const newDisplayName = this.editForm.get('displayName')?.value?.trim();
      
      this.userService.updateUserDisplayName(this.data.user._id, newDisplayName)
        .subscribe({
          next: (response: any) => {
            this.isLoading.set(false);
            
            if (response?.success) {
              this.dialogRef.close({
                success: true,
                user: response.data || this.data.user,
                displayName: newDisplayName
              });
            } else {
              this.showError(response?.message || 'Failed to update display name');
            }
          },
          error: (error: any) => {
            console.error('Error updating display name:', error);
            this.isLoading.set(false);
            this.showError(error?.error?.message || 'An error occurred. Please try again.');
          }
        });
    } else {
      // Mark all fields as touched to show validation errors
      this.editForm.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.dialogRef.close({ success: false });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}