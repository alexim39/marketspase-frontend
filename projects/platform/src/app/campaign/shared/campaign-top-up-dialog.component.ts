import { CommonModule } from '@angular/common';
import { Component, Inject, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

export interface CampaignTopUpDialogData {
  title: string;
  currency: string;
  remainingBudget: number;
  recommendedAmount?: number;
}

@Component({
  selector: 'app-campaign-top-up-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  templateUrl: './campaign-top-up-dialog.component.html',
  styleUrls: ['./campaign-top-up-dialog.component.scss'],
})
export class CampaignTopUpDialogComponent {
  readonly minAmount = 1000;
  readonly isSubmitting = signal(false);
  readonly form;

  readonly headline = computed(() =>
    this.data.remainingBudget > 0
      ? 'Increase budget and keep this campaign running.'
      : 'Add fresh budget and bring this campaign back online.'
  );

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<CampaignTopUpDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly data: CampaignTopUpDialogData,
  ) {
    this.form = this.fb.group({
      amount: [
        this.data.recommendedAmount ?? this.minAmount,
        [Validators.required, Validators.min(this.minAmount)],
      ],
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.dialogRef.close({
      amount: Number(this.form.getRawValue().amount),
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
