import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-delete-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>{{ data.title || 'Confirm Delete' }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
      @if (data.detail) { <small>{{ data.detail }}</small> }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="ref.close(false)">Cancel</button>
      <button mat-flat-button color="warn" (click)="ref.close(true)">Delete</button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host { display: block; min-width: 320px; }
    mat-dialog-content p { margin: 0 0 0.5rem; font-size: 0.95rem; color: var(--text-primary); }
    mat-dialog-content small { color: var(--text-secondary); font-size: 0.82rem; }
    mat-dialog-actions { padding: 0 1.5rem 1rem; gap: 0.5rem; }
  `],
})
export class ConfirmDeleteDialogComponent {
  readonly data = inject<{ title?: string; message: string; detail?: string }>(MAT_DIALOG_DATA);
  readonly ref = inject<MatDialogRef<ConfirmDeleteDialogComponent, boolean>>(MatDialogRef);
}
