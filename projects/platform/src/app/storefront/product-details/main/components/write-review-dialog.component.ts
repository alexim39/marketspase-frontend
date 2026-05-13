import { CommonModule } from '@angular/common';
import { Component, Inject, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RatingComponent } from '../../../shared/rating/rating.component';
import { StorefrontProductReview } from '../../../services/storefront.service';

export interface WriteReviewDialogData {
  productName: string;
  existingReview?: StorefrontProductReview | null;
}

@Component({
  selector: 'app-write-review-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    RatingComponent,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.existingReview ? 'Update your review' : 'Write a review' }}</h2>

    <mat-dialog-content>
      <p class="dialog-copy">Tell other shoppers what stood out about <strong>{{ data.productName }}</strong>.</p>

      <form [formGroup]="form" class="review-form">
        <div class="rating-field">
          <label>Overall rating</label>
          <app-rating
            [rating]="selectedRating"
            [interactive]="true"
            [readOnly]="false"
            size="large"
            (ratingChange)="setRating($event)">
          </app-rating>
          <span class="rating-value">{{ selectedRating || 0 }}/5</span>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Review title</mat-label>
          <input matInput formControlName="title" maxlength="100" placeholder="Short headline">
          <mat-hint align="end">{{ (form.controls.title.value || '').length }}/100</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Your review</mat-label>
          <textarea
            matInput
            formControlName="comment"
            rows="6"
            maxlength="2000"
            placeholder="What did you like, and what should others know?">
          </textarea>
          <mat-hint align="end">{{ (form.controls.comment.value || '').length }}/2000</mat-hint>
          @if (form.controls.comment.invalid && form.controls.comment.touched) {
            <mat-error>Please share at least 10 characters.</mat-error>
          }
        </mat-form-field>
      </form>

      @if (data.existingReview?.status && data.existingReview?.status !== 'approved') {
        <div class="status-note">
          <mat-icon>info</mat-icon>
          <span>Your current review is {{ data.existingReview?.status }}. Updates will keep that status until it is reviewed.</span>
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      @if (data.existingReview?._id) {
        <button mat-button type="button" color="warn" (click)="removeReview()">Delete review</button>
      }
      <button mat-button type="button" (click)="dialogRef.close()">Cancel</button>
      <button mat-flat-button color="primary" type="button" [disabled]="form.invalid" (click)="submit()">
        {{ data.existingReview ? 'Save changes' : 'Publish review' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-copy {
      margin: 0 0 1rem;
      color: var(--text-secondary, #64748b);
    }

    .review-form {
      display: grid;
      gap: 1rem;
      padding-top: 0.5rem;
    }

    .rating-field {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      flex-wrap: wrap;
    }

    .rating-field label {
      width: 100%;
      font-weight: 600;
      color: var(--text-primary, #0f172a);
    }

    .rating-value {
      color: var(--text-secondary, #64748b);
      font-size: 0.95rem;
    }

    mat-form-field {
      width: 100%;
    }

    .status-note {
      margin-top: 0.5rem;
      padding: 0.85rem 1rem;
      border-radius: 14px;
      display: flex;
      gap: 0.65rem;
      align-items: flex-start;
      background: rgba(59, 130, 246, 0.08);
      color: var(--text-secondary, #475569);
    }

    .status-note mat-icon {
      color: #2563eb;
      margin-top: 0.1rem;
    }
  `]
})
export class WriteReviewDialogComponent {
  readonly dialogRef = inject(MatDialogRef<WriteReviewDialogComponent>);
  private readonly fb = inject(FormBuilder);

  readonly form;

  constructor(@Inject(MAT_DIALOG_DATA) public data: WriteReviewDialogData) {
    this.form = this.fb.nonNullable.group({
      rating: [this.data.existingReview?.rating || 0, [Validators.required, Validators.min(1), Validators.max(5)]],
      title: [this.data.existingReview?.title || '', [Validators.maxLength(100)]],
      comment: [this.data.existingReview?.comment || '', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
    });
  }

  get selectedRating(): number {
    return Number(this.form.controls.rating.value || 0);
  }

  setRating(value: number): void {
    this.form.controls.rating.setValue(value);
    this.form.controls.rating.markAsDirty();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.dialogRef.close({
      action: 'submit',
      payload: {
        rating: this.selectedRating,
        title: this.form.controls.title.value.trim(),
        comment: this.form.controls.comment.value.trim(),
      }
    });
  }

  removeReview(): void {
    this.dialogRef.close({ action: 'delete' });
  }
}
