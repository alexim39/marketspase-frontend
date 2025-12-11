import { Component, DestroyRef, effect, inject, Input, OnDestroy, signal, Signal } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';  
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule, DatePipe } from '@angular/common';
import { SupportService } from '../support.service';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router } from '@angular/router';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { UserInterface } from '../../../../../../shared-services/src/public-api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatRadioModule } from '@angular/material/radio';

@Component({
  selector: 'async-testimonial-writeup-settings',
  standalone: true,
  imports: [
   MatExpansionModule, 
    CommonModule, 
    MatSelectModule, 
    MatInputModule, 
    MatButtonModule, 
    ReactiveFormsModule, 
    MatFormFieldModule,
    MatCardModule,
    MatProgressBarModule,
    MatDividerModule,
    DatePipe,
    MatIconModule,
    MatRadioModule,
  ],
  providers: [SupportService],
  templateUrl: './testimonial-writeup.component.html',
  styleUrls: ['./testimonial-writeup.component.scss']
})
export class TestimonialWriteupSettingsComponent {
  // Inputs: pass signals directly from parent
  @Input({ required: true }) user!: Signal<UserInterface | null>;
  @Input({ required: true }) testimonial!: Signal<any | null>;
  @Input({ required: true }) isLoading!: Signal<boolean>;
  @Input({ required: true }) error!: Signal<string | null>;

  // Rating options
  ratingOptions = [
    { value: 1, label: 'Poor' },
    { value: 2, label: 'Fair' },
    { value: 3, label: 'Good' },
    { value: 4, label: 'Very Good' },
    { value: 5, label: 'Excellent' }
  ];

  // Local state as signals
  readonly isSpinning = signal(false);
  readonly isEditing = signal(false);

  testimonialForm!: FormGroup;  
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private supportService = inject(SupportService);
  private readonly destroyRef = inject(DestroyRef);

   // Local state signal
  private _isProfileComplete = signal(false);
  readonly isProfileComplete = this._isProfileComplete.asReadonly();

  constructor() {
    effect(() => {
      // reactively rebuild form whenever testimonial or user changes
      this.initForm();
    });  
    
    effect(() => {
      const user = this.user();
      
      const value = !!user?.personalInfo?.address?.country && !!user?.personalInfo?.address?.state;
      this._isProfileComplete.set(value); // Manually update the signal
    });
  }

  private initForm(): void {
    const user = this.user();
    
    const testimonial = this.testimonial();
    //console.log('testimonial ',testimonial)

    this.testimonialForm = this.fb.group({  
      rating: [testimonial?.rating || null, [Validators.required, Validators.min(1), Validators.max(5)]],
      message: [{value: testimonial?.message || '',  disabled: !this.isProfileComplete(), }, [Validators.required]],
      country: [user?.personalInfo?.address?.country || ''],
      state: [user?.personalInfo?.address?.state || ''],
    });
  }


  navigateToProfile(): void {
    this.router.navigate(['dashboard/settings/account']);
  }

  editTestimonial(): void {
    this.isEditing.set(true);
  }

  writeTestimonial(): void {
    this.isEditing.set(true);
  }

  onSubmit(): void {
    if (!this.isProfileComplete()) {
      this.snackBar.open('Please complete your profile information first', 'Ok', { duration: 3000 });
      return;
    }

    if (this.testimonialForm.invalid) return;

    this.isSpinning.set(true);

    const updateObject = {
      message: this.testimonialForm.value.message,
      rating: this.testimonialForm.value.rating,
      userId: this.user()?._id,
    };

    this.supportService.updateTestimonial(updateObject)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (response) => {
        this.isSpinning.set(false);
        this.isEditing.set(false);
        this.snackBar.open(response.message, 'Ok', { duration: 3000 });
        // parent will refresh testimonial signal automatically
      },
      error: (error: HttpErrorResponse) => {
        this.isSpinning.set(false);
        let errorMessage = 'Server error occurred, please try again.';
        if (error.error?.message) {
          errorMessage = error.error.message;
        }
        this.snackBar.open(errorMessage, 'Ok', { duration: 3000 });
      }
    });
  }
}