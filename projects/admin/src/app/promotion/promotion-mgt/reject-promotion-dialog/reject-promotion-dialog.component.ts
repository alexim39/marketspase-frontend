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
import { MatSelectModule } from '@angular/material/select';
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
    MatSelectModule,
    FormsModule
  ],
  template: `
    <div class="reject-dialog">
      <h2 mat-dialog-title>Reject Promotion</h2>
      <mat-dialog-content>
        <p>Please provide a reason for rejecting this promotion:</p>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Select Rejection Reason</mat-label>
          <mat-select [(ngModel)]="selectedReason" (selectionChange)="onReasonSelected()">
            <mat-option [value]="''">-- Select a reason --</mat-option>
            <mat-option value="Incomplete proof submission. Ensure you provide all three required types of screenshots.">
              Incomplete proof submission. Ensure you provide all three required types of screenshots.
            </mat-option>
            <mat-option value="Inconsistent timeline detected. Ensure you post the campaign no more than 15 minutes after accepting it.">
              Inconsistent timeline detected. Ensure you post the campaign no more than 15 minutes after accepting it.
            </mat-option>
            <mat-option value="Inconsistent view counts. Your screenshot view count does not match the reported data.">
              Inconsistent view counts. Your screenshot view count does not match the reported data.
            </mat-option>
            <mat-option value="Inconsistent promotion ID. Your screenshot promotion ID does not match the submitted details.">
              Inconsistent promotion ID. Your screenshot promotion ID does not match the submitted details.
            </mat-option>
            <mat-option value="Unrecognized image submitted as proof. Please provide only valid screenshot evidence. Submitting incorrect or manipulated proof may result in account suspension.">
              Unrecognized image submitted as proof. Please provide only valid screenshot evidence. Submitting incorrect or manipulated proof may result in account suspension.
            </mat-option>
            <mat-option value="Suspicious or manipulated image submitted as proof. Continued violations may result in permanent account suspension.">
              Suspicious or manipulated image submitted as proof. Continued violations may result in permanent account suspension.
            </mat-option>
            <mat-option value="Policy violation detected. Your submitted proof appears to breach our promotion guidelines and may result in permanent account suspension.">
              Policy violation detected. Your submitted proof appears to breach our promotion guidelines and may result in permanent account suspension.
            </mat-option>
            <mat-option value="other">Other (specify below)</mat-option>
          </mat-select>
        </mat-form-field>
        
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
  selectedReason = '';
  // readonly predefinedReasons = [
  //   'incomplete proof submission',
  //   'inconsistent timeline',
  //   'inconsistent view counts',
  //   'inconsistent promotion ID',
  //   'unrecognized image submitted as proof',
  //   'suspicious image submitted as proof',
  //   'policy violation'
  // ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      promotion: Promotion;
      onReject: (promotion: Promotion, reason: string) => void;
    },
    private dialogRef: MatDialogRef<RejectPromotionDialogComponent>
  ) {}

  onReasonSelected(): void {
    if (this.selectedReason && this.selectedReason !== 'other') {
      // If a predefined reason is selected, set it as the rejection reason
      this.rejectionReason = this.selectedReason;
    } else if (this.selectedReason === 'other') {
      // If "Other" is selected, clear the rejection reason for manual input
      this.rejectionReason = '';
    }
  }

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