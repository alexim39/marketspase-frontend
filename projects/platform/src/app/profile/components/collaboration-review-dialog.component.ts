import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

export interface CollaborationReviewDialogData {
  targetName: string;
  campaignTitle?: string | null;
  promotionId: string;
}

export interface CollaborationReviewDialogResult {
  rating: number;
  title?: string;
  comment?: string;
}

@Component({
  selector: 'app-collaboration-review-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  template: `
    <div class="dialog-shell">
      <div class="dialog-head">
        <span class="context-chip">Collaboration Review</span>
        <h2>Rate {{ data.targetName }}</h2>
        <p>Share what it felt like to work together so future collaborators can trust the signal.</p>
        @if (data.campaignTitle) {
          <div class="context-note">
            <mat-icon>campaign</mat-icon>
            <span>{{ data.campaignTitle }}</span>
          </div>
        }
      </div>

      <div class="star-picker">
        @for (star of [1, 2, 3, 4, 5]; track star) {
          <button
            type="button"
            class="star-button"
            [class.active]="rating() >= star"
            (click)="rating.set(star)">
            <mat-icon>{{ rating() >= star ? 'star' : 'star_outline' }}</mat-icon>
            <span>{{ star }}</span>
          </button>
        }
      </div>

      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline">
          <mat-label>Headline</mat-label>
          <input matInput formControlName="title" maxlength="80" placeholder="Reliable traffic and clear communication">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Review</mat-label>
          <textarea
            matInput
            rows="5"
            formControlName="comment"
            maxlength="400"
            placeholder="Mention delivery, communication, and traffic quality so the review stays useful."></textarea>
        </mat-form-field>
      </form>

      <div class="dialog-actions">
        <button mat-button type="button" (click)="dialogRef.close()">Cancel</button>
        <button mat-flat-button color="primary" type="button" [disabled]="rating() < 1 || form.invalid" (click)="submit()">
          Publish review
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-shell {
      display: grid;
      gap: 1rem;
      min-width: min(560px, 92vw);
      padding: 0.25rem;
    }
    .dialog-head h2 {
      margin: 0.35rem 0;
    }
    .dialog-head p,
    .context-note {
      color: var(--text-secondary);
    }
    .context-chip {
      display: inline-flex;
      width: fit-content;
      padding: 0.35rem 0.7rem;
      border-radius: 999px;
      background: rgba(var(--primary-rgb), 0.08);
      color: var(--primary-color);
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .context-note {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }
    .star-picker {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .star-button {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      border: 1px solid var(--border-color);
      border-radius: 999px;
      background: var(--surface-color);
      color: var(--text-secondary);
      padding: 0.55rem 0.8rem;
      cursor: pointer;
    }
    .star-button.active {
      border-color: rgba(245, 158, 11, 0.45);
      background: rgba(245, 158, 11, 0.12);
      color: #d97706;
    }
    .dialog-form {
      display: grid;
      gap: 0.85rem;
    }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }
    @media (max-width: 640px) {
      .dialog-shell {
        min-width: 100%;
      }
      .dialog-actions {
        flex-direction: column-reverse;
      }
    }
  `],
})
export class CollaborationReviewDialogComponent {
  readonly data = inject<CollaborationReviewDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<CollaborationReviewDialogComponent, CollaborationReviewDialogResult | undefined>);
  private readonly fb = inject(FormBuilder);

  readonly rating = signal(0);
  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.maxLength(80)]],
    comment: ['', [Validators.required, Validators.maxLength(400)]],
  });

  submit(): void {
    if (this.rating() < 1 || this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();
    this.dialogRef.close({
      rating: this.rating(),
      title: value.title.trim(),
      comment: value.comment.trim(),
    });
  }
}
