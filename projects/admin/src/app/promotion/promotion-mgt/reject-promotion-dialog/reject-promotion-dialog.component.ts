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
  templateUrl: './reject-promotion-dialog.component.html',
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