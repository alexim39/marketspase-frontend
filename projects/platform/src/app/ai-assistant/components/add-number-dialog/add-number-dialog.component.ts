import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../../common/services/user.service';

@Component({
  selector: 'app-add-number-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,        // for mat-dialog-title, mat-dialog-content, mat-dialog-actions
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    ReactiveFormsModule
  ],
  template: `
    <h2 mat-dialog-title>Add WhatsApp Number</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-radio-group formControlName="source" class="source-group">
          <mat-radio-button value="profile">Use my profile number</mat-radio-button>
          <mat-radio-button value="new">Enter a new number</mat-radio-button>
        </mat-radio-group>

        <div *ngIf="form.get('source')?.value === 'profile'" class="profile-number">
          <p><strong>Your number:</strong> {{ userPhone }}</p>
        </div>

        <mat-form-field *ngIf="form.get('source')?.value === 'new'" appearance="outline" class="full-width">
          <mat-label>Phone Number</mat-label>
          <input matInput formControlName="phoneNumber" placeholder="+2348012345678" />
          <mat-error *ngIf="form.get('phoneNumber')?.hasError('required')">Phone number is required</mat-error>
          <mat-error *ngIf="form.get('phoneNumber')?.hasError('pattern')">Enter a valid number (e.g., +234...)</mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="!isValid" (click)="submit()">
        Connect Number
      </button>
    </mat-dialog-actions>
  `,
  styleUrls: ['./add-number-dialog.component.scss']
})
export class AddNumberDialogComponent {
  private dialogRef = inject(MatDialogRef<AddNumberDialogComponent>);
  private fb = inject(FormBuilder);
  private userService = inject(UserService);

  userPhone = this.userService.user()?.personalInfo?.phoneDetails?.fullNumber || '';

  form: FormGroup = this.fb.group({
    source: ['profile', Validators.required],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^\+?[1-9]\d{1,14}$/)]]
  });

  get isValid(): boolean {
    if (this.form.get('source')?.value === 'profile') return true;
    return this.form.get('phoneNumber')?.valid ?? false;
  }

  submit(): void {
    const phone = this.form.get('source')?.value === 'profile'
      ? this.userPhone
      : this.form.get('phoneNumber')?.value;
    this.dialogRef.close(phone);
  }
}