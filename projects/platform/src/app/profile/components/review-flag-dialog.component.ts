import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

export interface ReviewFlagDialogData {
  reviewerName: string;
}

export interface ReviewFlagDialogResult {
  reason: string;
  details?: string;
}

@Component({
  selector: 'app-review-flag-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <div class="dialog-shell">
      <div class="dialog-head">
        <span class="context-chip">Flag Review</span>
        <h2>Report this feedback</h2>
        <p>We’ll send your report to moderation with the reason you choose here.</p>
      </div>

      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline">
          <mat-label>Reason</mat-label>
          <mat-select formControlName="reason">
            <mat-option value="abusive_or_harmful">Abusive or harmful</mat-option>
            <mat-option value="false_claim">False or misleading claim</mat-option>
            <mat-option value="spam">Spam or irrelevant content</mat-option>
            <mat-option value="conflict_of_interest">Conflict of interest</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Extra context</mat-label>
          <textarea matInput rows="4" formControlName="details" maxlength="260" placeholder="Add a little context if it will help moderation act faster."></textarea>
        </mat-form-field>
      </form>

      <div class="dialog-actions">
        <button mat-button type="button" (click)="dialogRef.close()">Cancel</button>
        <button mat-flat-button color="primary" type="button" [disabled]="form.invalid" (click)="submit()">Submit flag</button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-shell {
      display: grid;
      gap: 1rem;
      min-width: min(520px, 92vw);
      padding: 0.25rem;
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
    .dialog-head h2 {
      margin: 0.35rem 0;
    }
    .dialog-head p {
      color: var(--text-secondary);
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
  `],
})
export class ReviewFlagDialogComponent {
  readonly data = inject<ReviewFlagDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<ReviewFlagDialogComponent, ReviewFlagDialogResult | undefined>);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    reason: ['', Validators.required],
    details: [''],
  });

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();
    this.dialogRef.close({
      reason: value.reason,
      details: value.details.trim(),
    });
  }
}
