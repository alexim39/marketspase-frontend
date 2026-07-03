import { Component, inject, signal, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '@shared/services/api';
import { UserService } from '../../../common/services/user.service';

export interface OptimizeContentDialogData {
  campaignId: string;
  campaignTitle: string;
}

interface Variation {
  variantTitle: string;
  variantCaption: string;
  rationale: string;
}

@Component({
  selector: 'app-optimize-content-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="optimize-dialog">
      <div class="dialog-header">
        <h2 mat-dialog-title>
          <mat-icon>auto_awesome</mat-icon>
          AI Content Variations
        </h2>
        <button mat-icon-button mat-dialog-close><mat-icon>close</mat-icon></button>
      </div>

      <p class="subtitle">A/B test suggestions for "{{ data.campaignTitle }}"</p>

      <mat-dialog-content>
        @if (loading()) {
          <div class="loading-state">
            <mat-spinner diameter="32"></mat-spinner>
            <span>Analyzing your campaign content...</span>
          </div>
        } @else if (error()) {
          <div class="error-state">
            <mat-icon>error_outline</mat-icon>
            <span>{{ error() }}</span>
            <button mat-stroked-button (click)="loadVariations()">Retry</button>
          </div>
        } @else if (variations().length === 0) {
          <div class="empty-state">
            <mat-icon>lightbulb</mat-icon>
            <span>No variations generated. Try again.</span>
          </div>
        } @else {
          @for (v of variations(); track $index) {
            <div class="variation-card">
              <div class="variant-label">Variant {{ ['A','B','C'][$index] }}</div>

              <div class="variant-field">
                <label>Title</label>
                <p class="variant-text">{{ v.variantTitle }}</p>
              </div>

              <div class="variant-field">
                <label>Caption</label>
                <p class="variant-text caption">{{ v.variantCaption }}</p>
              </div>

              <div class="rationale">
                <mat-icon>tips_and_updates</mat-icon>
                <span>{{ v.rationale }}</span>
              </div>

              <button mat-stroked-button color="primary" (click)="applyVariation(v)" class="apply-btn" [disabled]="saving()">
                <mat-icon>{{ saving() ? 'hourglass_empty' : 'check' }}</mat-icon>
                {{ saving() ? 'Saving...' : 'Apply & Save' }}
              </button>
            </div>
          }
        }
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Close</button>
      </mat-dialog-actions>
    </div>
  `,
  styleUrls: ['./optimize-content-dialog.component.scss'],
})
export class OptimizeContentDialogComponent {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<OptimizeContentDialogComponent>);
  private userService = inject(UserService);
  saving = signal(false);

  loading = signal(true);
  error = signal('');
  variations = signal<Variation[]>([]);

  constructor(@Inject(MAT_DIALOG_DATA) public data: OptimizeContentDialogData) {
    this.loadVariations();
  }

  loadVariations(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.post<any>(`api/v1/campaign/${this.data.campaignId}/optimize`, {}, undefined, true)
      .subscribe({
        next: (resp) => {
          this.variations.set(resp?.data || []);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Failed to generate variations.');
          this.loading.set(false);
        },
      });
  }

  applyVariation(v: Variation): void {
    this.saving.set(true);
    const userId = this.userService.user()?._id;
    this.api.patch(`api/v1/campaign/edit/${this.data.campaignId}/${userId}`, {
      title: v.variantTitle,
      caption: v.variantCaption,
    }, undefined, true).subscribe({
      next: () => {
        this.saving.set(false);
        this.snack.open('Campaign updated! Refresh to see changes.', 'OK', { duration: 3000 });
        this.dialogRef.close(v);
      },
      error: (err) => {
        this.saving.set(false);
        this.snack.open(err?.error?.message || 'Failed to save.', 'OK', { duration: 4000 });
      },
    });
  }
}
