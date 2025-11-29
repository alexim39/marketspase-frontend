// shared/confirm-dialog/confirm-dialog.component.ts
import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'accent' | 'warn';
  showCancel?: boolean;
  icon?: string;
  iconColor?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialogComponent {
  private dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
  
  // Inject dialog data
  public data: ConfirmDialogData = inject(MAT_DIALOG_DATA);

  // Default values
  private readonly defaults: ConfirmDialogData = {
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmColor: 'primary',
    showCancel: true,
    icon: 'warning',
    iconColor: 'warn'
  };

  // Merge provided data with defaults
  constructor() {
    this.data = { ...this.defaults, ...this.data };
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onDismiss(): void {
    this.dialogRef.close();
  }

  getIconColor(): string {
    return this.data.iconColor || 'warn';
  }

  getConfirmColor(): string {
    return this.data.confirmColor || 'primary';
  }
}