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
  template: `
  <div class="testimonial-settings">
    <h3 class="section-title">Share Your Experience</h3>
    <p class="section-description">Write a testimonial and rate your experience with MarketSpase</p>

    <!-- Loading state -->
     @if (isLoading()) {
      <mat-card class="loading-state">
        <mat-card-content>
          <div class="loading-content">
            <mat-progress-bar mode="indeterminate"/>
            <p>Loading your testimonial...</p>
          </div>
        </mat-card-content>
      </mat-card>
     }
    

    <!-- Error state -->
     @if (error() && !isLoading()) {
      <mat-card class="error-state">
        <mat-card-content>
          <div class="error-content">
            <mat-icon>error_outline</mat-icon>
            <p>{{ error() }}</p>
          </div>
        </mat-card-content>
      </mat-card>
     }
    

    <!-- No testimonial yet -->
     @if (isProfileComplete() && !isLoading() && !testimonial()?.message) {
        <mat-card class="write-testimonial-prompt">
        <mat-card-content>
          <div class="prompt-content">
            <mat-icon>edit</mat-icon>
            <div class="prompt-text">
              <h4>Share Your Experience</h4>
              <p>You haven't written a testimonial yet. Let others know about your experience with MarketSpase!</p>
            </div>
            <button mat-flat-button color="primary" (click)="writeTestimonial()">
              Write Testimonial
            </button>
          </div>
        </mat-card-content>
      </mat-card>
     }


    <!-- Profile completion notification -->
     @if (!isProfileComplete() && !isLoading()) {
      <mat-card class="profile-completion-notification">
        <mat-card-content>
          <div class="notification-content">
            <span class="notification-icon">⚠️</span>
            <div class="notification-text">
              <h4>Complete Your Profile</h4>
              <p>Please complete your profile information (country and region) before posting a testimonial.</p>
            </div>
            <button mat-stroked-button color="primary" (click)="navigateToProfile()">
              Go to Profile
            </button>
          </div>
        </mat-card-content>
      </mat-card>
     }
    

    <!-- Existing testimonial display -->
     @if (testimonial() && !isLoading() && !error()) {
      <mat-card class="existing-testimonial">
        <mat-card-header>
          <mat-card-title>Your Current Testimonial</mat-card-title>
          <mat-card-subtitle>Posted on {{ testimonial().createdAt | date }}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <!-- Rating display -->
          <div class="rating-display">
            <span class="rating-label">Your Rating:</span>
            <div class="stars">
              @for (star of [1,2,3,4,5]; track star) {
                <mat-icon>{{ star <= testimonial().rating ? 'star' : 'star_border' }}</mat-icon>
              }
            </div>
            <span class="rating-value">({{ testimonial().rating }}/5)</span>
          </div>
          <p class="testimonial-content">{{ testimonial().message }}</p>
        </mat-card-content>
        <mat-divider></mat-divider>
        <mat-card-actions>
          <button mat-button color="primary" (click)="editTestimonial()">Edit Testimonial</button>
        </mat-card-actions>
      </mat-card>
     }
    

    <!-- Testimonial form -->
     @if (isEditing() && !isLoading()) {
      <mat-card class="testimonial-form-card">
      <form [formGroup]="testimonialForm" (ngSubmit)="onSubmit()">
        <!-- Rating input -->
        <div class="rating-input">
          <label>Rate your experience</label>
          <mat-radio-group formControlName="rating" class="rating-options">
            @for (option of ratingOptions; track option.value) {
              <mat-radio-button [value]="option.value" class="rating-option">
                <div class="option-content">
                  <span class="stars">
                    @for (star of [1,2,3,4,5]; track star) {
                      <mat-icon>{{ star <= option.value ? 'star' : 'star_border' }}</mat-icon>
                    }
                  </span>
                  <span class="label">{{ option.label }}</span>
                </div>
              </mat-radio-button>
            }
          </mat-radio-group>
          @if (testimonialForm.get('rating')?.hasError('required')) {
            <mat-error>
              Please select a rating
            </mat-error>
          }
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Your Testimonial</mat-label>
          <textarea 
            matInput 
            formControlName="message" 
            #message 
            maxlength="500" 
            rows="6"
            placeholder="Share your thoughts about MarketSpase..."
            >
          </textarea>
          <mat-hint align="start"><strong>Inspire others with your experience</strong></mat-hint>
          <mat-hint align="end">{{ message.value.length }} / 500</mat-hint>
          @if (testimonialForm.get('message')?.hasError('required')) {
            <mat-error>
              Testimonial is required
            </mat-error>
          }
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Country</mat-label>
            <input matInput formControlName="country" placeholder="Enter your country" readonly>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Region</mat-label>
            <input matInput formControlName="state" placeholder="Enter your region" readonly>
          </mat-form-field>
        </div>

        @if (isSpinning()) {
          <mat-progress-bar mode="indeterminate"/>
        }        

        <div class="form-actions">
          <button mat-flat-button color="primary" type="submit" [disabled]="testimonialForm.invalid || !isProfileComplete()">
            {{ testimonial() ? 'Update' : 'Publish' }} Testimonial
          </button>
          
        </div>
      </form>
    </mat-card>
     }
    
  </div>
  `,
  styles: [`
  .testimonial-settings {
    padding: 16px;

    .section-title {
      font-size: 18px;
      font-weight: 500;
      margin: 0 0 8px;
    }

    .section-description {
      font-size: 14px;
      color: #606060;
      margin: 0 0 24px;
    }

    .loading-state, .error-state {
      margin-bottom: 24px;

      mat-card-content {
        padding: 16px;
      }

      .loading-content, .error-content {
        display: flex;
        align-items: center;
        flex-direction: column;
        gap: 6px;

        p {
          margin: 0;
          color: gray;
        }
      }

      .error-content {
        color: #d32f2f;

        mat-icon {
          color: #d32f2f;
        }
      }
    }

    .profile-completion-notification {
      margin-bottom: 24px;
      background-color: #fff8e1;
      border-left: 4px solid #ffc107;

      .notification-content {
        display: flex;
        align-items: center;
        gap: 16px;
        justify-content: space-between;

        .notification-icon {
          font-size: 24px;
        }

        .notification-text {
          flex: 1;
          h4 {
            margin: 0 0 4px;
            font-size: 16px;
            color: #333;
          }

          p {
            margin: 0;
            font-size: 14px;
            color: #666;
          }
        }
      }
    }

    .existing-testimonial {
      margin-bottom: 24px;

      .rating-display {
        display: flex;
        align-items: center;
        margin-bottom: 16px;
        gap: 8px;

        .rating-label {
          font-weight: 500;
        }

        .stars {
          display: flex;
          
          mat-icon {
            color: #ffc107;
            font-size: 20px;
            height: 20px;
            width: 20px;
          }
        }

        .rating-value {
          color: #666;
          font-size: 14px;
        }
      }

      .testimonial-content {
        white-space: pre-line;
        line-height: 1.6;
      }

      mat-divider {
        margin: 16px 0;
      }
    }

    .testimonial-form-card {
      padding: 24px;
      border-radius: 8px;

      form {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .rating-input {
        display: flex;
        flex-direction: column;
        gap: 8px;

        label {
          font-weight: 500;
          color: rgba(0, 0, 0, 0.6);
        }

        .rating-options {
          display: flex;
          flex-direction: column;
          gap: 8px;

          .rating-option {
            .option-content {
              display: flex;
              align-items: center;
              gap: 8px;

              .stars {
                display: flex;
                
                mat-icon {
                  color: #ffc107;
                  font-size: 20px;
                  height: 20px;
                  width: 20px;
                }
              }

              .label {
                font-size: 14px;
              }
            }
          }
        }
      }

      .full-width {
        width: 100%;
      }

      .form-row {
        display: flex;
        gap: 16px;

        mat-form-field {
          flex: 1;
        }
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;

        button {
          padding: 0 24px;
          font-weight: 500;
        }
      }

      textarea {
        min-height: 150px;
        resize: vertical;
      }
    }
  }

  @media (max-width: 768px) {
    .testimonial-settings {
      padding: 8px;

      .profile-completion-notification {
        .notification-content {
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
        }
      }

      .testimonial-form-card {
        padding: 16px;

        .form-row {
          flex-direction: column;
          gap: 16px;
        }
      }
    }
  }

  .write-testimonial-prompt {
    margin-bottom: 24px;
   border: 1px solid #666;

    .prompt-content {
      display: flex;
      align-items: center;
      gap: 16px;

      mat-icon {
        color: #667eea;
        font-size: 32px;
        height: 32px;
        width: 32px;
      }

      .prompt-text {
        flex: 1;

        h4 {
          margin: 0 0 4px;
          font-size: 16px;
          color: #333;
        }

        p {
          margin: 0;
          font-size: 14px;
        }
      }
    }
  }

  @media (max-width: 768px) {
    .write-testimonial-prompt {
      .prompt-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;

        button {
          width: 100%;
        }
      }
    }
  }

  `]
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