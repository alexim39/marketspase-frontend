import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dispute-dialog',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatDialogModule, MatIconModule],
  template: `
    <div class="dispute-dialog">
      <h2 mat-dialog-title>Dispute Contract</h2>
      <mat-dialog-content>
        <p class="dispute-hint">Please explain why you're disputing this contract. This will be reviewed by MarketSpase support.</p>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Reason for dispute</mat-label>
          <textarea matInput [(ngModel)]="reason" rows="4" maxlength="500" placeholder="Describe the issue..."></textarea>
          <mat-hint align="end">{{ reason.length }}/500</mat-hint>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button (click)="close()">Cancel</button>
        <button mat-flat-button color="warn" [disabled]="!reason.trim()" (click)="submit()">
          <mat-icon>flag</mat-icon> File Dispute
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styleUrls: ['./dispute-dialog.component.scss']
})
export class DisputeDialogComponent {
  private dialogRef = inject(MatDialogRef<DisputeDialogComponent>);
  reason = '';

  close(): void { this.dialogRef.close(); }
  submit(): void { this.dialogRef.close(this.reason.trim()); }
}
