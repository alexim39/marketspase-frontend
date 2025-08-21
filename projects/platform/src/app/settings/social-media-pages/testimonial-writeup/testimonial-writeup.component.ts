import { ChangeDetectorRef, Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';  
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { AppReviewService } from '../app-review.service';
import { Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSelectModule } from '@angular/material/select';
import { UserInterface } from '../../../common/services/user.service';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router } from '@angular/router';
import { TestimonialInterface } from '../../../home/home.service';
import { MatDividerModule } from '@angular/material/divider';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

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
  ],
  providers: [AppReviewService],
  template: `
  <div class="testimonial-settings">
    <h3 class="section-title">Share Your Experience</h3>
    <p class="section-description">Write a testimonial about your experience with Davidotv</p>

    <!-- Loading state -->
    <mat-card *ngIf="isLoading" class="loading-state">
      <mat-card-content>
        <div class="loading-content">
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
          <p>Loading your testimonial...</p>
        </div>
      </mat-card-content>
    </mat-card>

    <!-- Error state -->
    <mat-card *ngIf="error && !isLoading" class="error-state">
      <mat-card-content>
        <div class="error-content">
          <mat-icon>error_outline</mat-icon>
          <p>{{ error }}</p>
        </div>
      </mat-card-content>
    </mat-card>

    <mat-card *ngIf="isProfileComplete() && !testimonial?.message && !isLoading" class="write-testimonial-prompt">
    <mat-card-content>
      <div class="prompt-content">
        <mat-icon>edit</mat-icon>
        <div class="prompt-text">
          <h4>Share Your Experience</h4>
          <p>You haven't written a testimonial yet. Let others know about your experience with Davidotv!</p>
        </div>
        <button mat-flat-button color="primary" (click)="writeTestimonial()">
          Write Testimonial
        </button>
      </div>
    </mat-card-content>
  </mat-card>

    <!-- Profile completion notification -->
    <mat-card *ngIf="!isProfileComplete() && !isLoading" class="profile-completion-notification">
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

    <!-- Existing testimonial display -->
    <mat-card *ngIf="testimonial && !isLoading && !error" class="existing-testimonial">
      <mat-card-header>
        <mat-card-title>Your Current Testimonial</mat-card-title>
        <mat-card-subtitle>Posted on {{testimonial.createdAt | date}}</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <p class="testimonial-content">{{ testimonial.message }}</p>
      </mat-card-content>
      <mat-divider></mat-divider>
      <mat-card-actions>
        <button mat-button color="primary" (click)="editTestimonial()">Edit Testimonial</button>
      </mat-card-actions>
    </mat-card>

    <!-- Testimonial form (shown when editing or no testimonial exists) -->
    <mat-card *ngIf="isEditing && !isLoading" class="testimonial-form-card">
      <form [formGroup]="testimonialForm" (ngSubmit)="onSubmit()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Your Testimonial</mat-label>
          <textarea 
            matInput 
            formControlName="message" 
            #message 
            maxlength="500" 
            rows="6"
            placeholder="Share your thoughts about Davidotv..."
            [disabled]="!isProfileComplete()">
          </textarea>
          <mat-hint align="start"><strong>Inspire others with your experience</strong></mat-hint>
          <mat-hint align="end">{{message.value.length}} / 500</mat-hint>
          <mat-error *ngIf="testimonialForm.get('message')?.hasError('required')">
            Testimonial is required
          </mat-error>
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

        <mat-progress-bar mode="indeterminate" *ngIf="isSpinning"/>

        <div class="form-actions">
          <button mat-flat-button color="primary" type="submit" [disabled]="testimonialForm.invalid || !isProfileComplete()">
            {{ testimonial ? 'Update' : 'Publish' }} Testimonial
          </button>
          <button *ngIf="testimonial && isEditing" mat-button (click)="cancelEdit()">Cancel</button>
        </div>
      </form>
    </mat-card>
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
        gap: 16px;

        p {
          margin: 0;
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
        color: #8f0045;
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
export class TestimonialWriteupSettingsComponent implements OnInit, OnDestroy {
  @Input() user!: UserInterface;
  @Input() testimonial: TestimonialInterface | null = null;
  @Input() isLoading = false;
  @Input() error: string | null = null;
  
  subscriptions: Array<Subscription> = [];
  private snackBar = inject(MatSnackBar);
  isSpinning = false;
  isEditing = false;
  
  testimonialForm!: FormGroup;  
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  constructor(
    private fb: FormBuilder,
    private socialPageService: AppReviewService,
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.testimonialForm = this.fb.group({  
      message: [this.testimonial?.message || '', {
        validators: [Validators.required],
        asyncValidators: []
      }],
      country: [this.user?.personalInfo?.address?.country, {
        //validators: [Validators.required],
        asyncValidators: []
      }],
      state: [this.user?.personalInfo?.address?.state, {
        //validators: [Validators.required],
        asyncValidators: []
      }],
    });
  }

  // Check if profile is complete (has country and state)
  isProfileComplete(): boolean {
    return !!this.user?.personalInfo?.address?.country && !!this.user?.personalInfo?.address?.state;
  }

  // Navigate to profile page
  navigateToProfile(): void {
    this.router.navigate(['/settings/account']);
  }

  // Edit existing testimonial
  editTestimonial(): void {
    this.isEditing = true;
    this.initForm(); // Reinitialize form with current testimonial
  }

  // write testimonial
  writeTestimonial(): void {
    this.isEditing = true;
    this.initForm(); // Reinitialize form with current testimonial
  }

  // Cancel editing
  cancelEdit(): void {
    this.isEditing = false;
  }

  onSubmit() {  
    if (!this.isProfileComplete()) {
        this.snackBar.open('Please complete your profile information first', 'Ok', {duration: 3000});
        return;
    }

    this.isSpinning = true;
    if (this.testimonialForm.valid) {  
        const updateObject = {
            message: this.testimonialForm.value.message,
            userId: this.user._id,
        };

        // Always use updateTestimonial (it can handle both create and update)
        this.subscriptions.push(
            this.socialPageService.updateTestimonial(updateObject).subscribe({
                next: (response) => {
                    this.isSpinning = false;
                    this.isEditing = false;
                    this.snackBar.open(response.message, 'Ok', {duration: 3000});
                    // Update the testimonial with the new data
                    this.testimonial = response.data;
                    this.cdr.markForCheck();
                },
                error: (error: HttpErrorResponse) => {
                    this.isSpinning = false;
                    let errorMessage = 'Server error occurred, please try again.';
                    if (error.error && error.error.message) {
                        errorMessage = error.error.message;
                    }  
                    this.snackBar.open(errorMessage, 'Ok', {duration: 3000});
                    this.cdr.markForCheck();
                }
            })
        );
    }  
} 

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
  }
}