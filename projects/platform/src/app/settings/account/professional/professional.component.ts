import { ChangeDetectorRef, Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

import { SettingsService } from '../../settings.service';
import { UserInterface } from '../../../common/services/user.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpErrorResponse } from '@angular/common/http';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

@Component({
  selector: 'async-professional-info',
  standalone: true,
  providers: [SettingsService],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  templateUrl: './professional.component.html',
  styleUrls: ['./professional.component.scss']
})
export class ProfessionalInfoComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  private settingsService = inject(SettingsService);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);
  @Input() user!: UserInterface;
  professionalForm!: FormGroup;
  isLoading = false;

  educationOptions = [
    'Basic Education Certificate (Primary School)',
    'WASSCE',
    'NECO',
    'GCE',
    'ND',
    'HND',
    'B.Sc., B.A., B.Eng.',
    'M.Sc., M.A., M.B.A.',
    'Ph.D.',
    'NCE',
    'None'
  ];

  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  skills: string[] = [];
  //skills: string[] = ['JavaScript', 'Angular', 'TypeScript'];
  hobbies: string[] = [];
  //hobbies: string[] = ['Reading', 'Hiking', 'Photography'];


  ngOnInit(): void {
    this.initializeForm();
    // Initialize with existing data if available
    if (this.user?.professionalInfo?.skills) {
      this.skills = Array.isArray(this.user.professionalInfo.skills) 
        ? this.user.professionalInfo.skills 
        : [this.user.professionalInfo.skills];
    }
    if (this.user?.interests?.hobbies) {
      this.hobbies = Array.isArray(this.user.interests.hobbies)
        ? this.user.interests.hobbies
        : [this.user.interests.hobbies];
    }
  }

  private initializeForm(): void {
      this.professionalForm = new FormGroup({
        jobTitle: new FormControl(this.user?.personalInfo?.jobTitle || '', [
          Validators.required,
          Validators.maxLength(50)
        ]),
        educationBackground: new FormControl(this.user?.personalInfo?.educationBackground || '', [
          Validators.required
        ]),
        hobbies: new FormControl(this.hobbies || [], [  // Changed to use array
          Validators.required,
          Validators.maxLength(50)
        ]),
        skills: new FormControl(this.skills || [], [  // Changed to use array
          Validators.required,
          Validators.maxLength(50)
        ]),
        userId: new FormControl(this.user?._id || '')
      });
    }

  onSubmit(): void {
    if (this.professionalForm.invalid) {
      this.professionalForm.markAllAsTouched();
      this.showNotification('Please fill all required fields correctly');
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();
    const professionalData = this.professionalForm.value;

    this.subscriptions.push(
      this.settingsService.updateProfession(professionalData).subscribe({
        next: (response) => {
          this.showNotification(response.message, 'success');
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.handleError(error);
          //this.showNotification('Failed to update professional information. Please try again.');
          this.isLoading = false;
          this.cdr.markForCheck();
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

  private handleError(error: HttpErrorResponse): void {
    const errorMessage = error.error?.message || 'Server error occurred, please try again.';
    this.showNotification(errorMessage);
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  addSkill(event: MatChipInputEvent): void {
      const value = (event.value || '').trim();
      if (value) {
        this.skills.push(value);
        this.professionalForm.get('skills')?.setValue([...this.skills]);
        this.professionalForm.get('skills')?.updateValueAndValidity();
      }
      event.chipInput!.clear();
    }

   removeSkill(skill: string): void {
    const index = this.skills.indexOf(skill);
    if (index >= 0) {
      this.skills.splice(index, 1);
      this.professionalForm.get('skills')?.setValue([...this.skills]);
      this.professionalForm.get('skills')?.updateValueAndValidity();
    }
  }

  addHobby(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      this.hobbies.push(value);
      this.professionalForm.get('hobbies')?.setValue([...this.hobbies]);
      this.professionalForm.get('hobbies')?.updateValueAndValidity();
    }
    event.chipInput!.clear();
  }

 removeHobby(hobby: string): void {
    const index = this.hobbies.indexOf(hobby);
    if (index >= 0) {
      this.hobbies.splice(index, 1);
      this.professionalForm.get('hobbies')?.setValue([...this.hobbies]);
      this.professionalForm.get('hobbies')?.updateValueAndValidity();
    }
  }
}