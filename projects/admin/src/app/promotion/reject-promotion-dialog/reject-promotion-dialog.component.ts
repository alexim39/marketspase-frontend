import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  MAT_DIALOG_DATA, 
  MatDialogModule, 
  MatDialogRef 
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { Promotion } from '../submitted-promotion-list/submitted-promotion-list.component';

@Component({
  selector: 'app-reject-promotion-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  template: `
    <div class="reject-dialog">
      <h2 mat-dialog-title>Reject Promotion</h2>
      <mat-dialog-content>
        <p>Please provide a reason for rejecting this promotion:</p>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Rejection Reason</mat-label>
          <textarea matInput 
                    [(ngModel)]="rejectionReason"
                    placeholder="Enter the reason for rejection..."
                    rows="4"
                    required></textarea>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">Cancel</button>
        <button mat-raised-button 
                color="warn" 
                (click)="onReject()"
                [disabled]="!rejectionReason.trim()">
          Reject Promotion
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styleUrls: ['./reject-promotion-dialog.component.scss']
})
export class RejectPromotionDialogComponent {
  rejectionReason = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      promotion: Promotion;
      onReject: (promotion: Promotion, reason: string) => void;
    },
    private dialogRef: MatDialogRef<RejectPromotionDialogComponent>
  ) {}

  onReject(): void {
    if (this.rejectionReason.trim()) {
      this.data.onReject(this.data.promotion, this.rejectionReason.trim());
      this.dialogRef.close();
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}