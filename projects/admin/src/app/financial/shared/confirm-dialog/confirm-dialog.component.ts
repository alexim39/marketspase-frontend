// shared/confirm-dialog/confirm-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  input?: {
    label: string;
    placeholder?: string;
    required?: boolean;
    type?: 'text' | 'textarea' | 'number';
  };
  warning?: boolean;
  showCancel?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule
  ],
  template: `
    <div class="confirm-dialog">
      <div class="dialog-header" [class.warning]="data.warning">
        <mat-icon class="header-icon">
          {{ data.warning ? 'warning' : 'help_outline' }}
        </mat-icon>
        <h2 mat-dialog-title>{{ data.title }}</h2>
      </div>

      <mat-dialog-content>
        <p class="dialog-message">{{ data.message }}</p>

        @if (data.input) {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>{{ data.input.label }}</mat-label>
            
            @if (data.input.type === 'textarea') {
              <textarea 
                matInput 
                [(ngModel)]="inputValue" 
                [placeholder]="data.input.placeholder || ''"
                rows="4">
              </textarea>
             <!--  <textarea 
                matInput 
                [(ngModel)]="inputValue" 
                [placeholder]="data.input.placeholder || ''"
                [required]="data.input.required"
                rows="4">
              </textarea> -->
            } @else {
              <input 
                matInput 
                [type]="data.input.type || 'text'"
                [(ngModel)]="inputValue" 
                [placeholder]="data.input.placeholder || ''"
               >
              <!-- <input 
                matInput 
                [type]="data.input.type || 'text'"
                [(ngModel)]="inputValue" 
                [placeholder]="data.input.placeholder || ''"
                [required]="data.input.required"> -->
            }

            @if (data.input.required && !inputValue) {
              <mat-error>This field is required</mat-error>
            }
          </mat-form-field>
        }
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        @if (data.showCancel !== false) {
          <button 
            mat-button 
            class="cancel-btn"
            (click)="onCancel()">
            <mat-icon>close</mat-icon>
            {{ data.cancelText || 'Cancel' }}
          </button>
        }
        
        <button 
          mat-raised-button 
          [color]="data.warning ? 'warn' : 'primary'"
          [disabled]="data.input?.required && !inputValue"
          (click)="onConfirm()">
          <mat-icon>{{ data.warning ? 'warning' : 'check' }}</mat-icon>
          {{ data.confirmText || 'Confirm' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      padding: 20px;
      min-width: 400px;
      max-width: 500px;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e5e7eb;

      &.warning {
        .header-icon, h2 {
          color: #f59e0b;
        }
      }

      .header-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: #667eea;
      }

      h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        //color: #1f2937;
      }
    }

    .dialog-message {
      font-size: 16px;
      line-height: 1.6;
      //color: #4b5563;
      margin: 0 0 16px 0;
      white-space: pre-wrap;
    }

    .full-width {
      width: 100%;
      margin-top: 8px;
    }

    mat-dialog-actions {
      padding: 16px 0 0 !important;
      margin-top: 16px;
      border-top: 1px solid #e5e7eb;

      button {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 20px;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }

      .cancel-btn {
        //color: #6b7280;
        
        &:hover {
          background: #f3f4f6;
        }
      }
    }

    // Dark mode support
    :host-context(.dark-theme) {
      .dialog-header {
        //border-bottom-color: #374151;
        
        h2 {
          color: #f3f4f6;
        }
      }

      .dialog-message {
        color: #d1d5db;
      }

      mat-dialog-actions {
       // border-top-color: #374151;
      }
    }
  `]
})
export class ConfirmDialogComponent {
  inputValue: string = '';

  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  onConfirm(): void {
    if (this.data.input?.required && !this.inputValue) {
      return;
    }

    this.dialogRef.close({
      confirmed: true,
      input: this.inputValue
    });
  }

  onCancel(): void {
    this.dialogRef.close({ confirmed: false });
  }
}