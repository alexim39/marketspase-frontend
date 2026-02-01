import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?: 'primary' | 'accent' | 'warn';
}

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <div class="confirmation-dialog">
      <h2 mat-dialog-title>{{ data.title }}</h2>
      <mat-dialog-content>
        <p class="message">{{ data.message }}</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">
          {{ data.cancelButtonText || 'Cancel' }}
        </button>
        <button mat-raised-button 
                [color]="data.confirmButtonColor || 'warn'" 
                (click)="onConfirm()">
          {{ data.confirmButtonText || 'Confirm' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirmation-dialog {
      min-width: 300px;
      max-width: 500px;
    }
    
    h2.mat-dialog-title {
      margin: 0 0 16px 0;
      padding: 0;
      font-size: 20px;
      font-weight: 500;
      color: #202124;
    }
    
    .message {
      margin: 0;
      line-height: 1.5;
      color: #5f6368;
      font-size: 14px;
    }
    
    mat-dialog-content {
      margin-bottom: 24px;
    }
    
    mat-dialog-actions {
      padding: 8px 0;
      margin: 0;
    }
    
    button {
      min-width: 80px;
    }
  `]
})
export class ConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}