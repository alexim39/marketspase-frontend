import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'async-username-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule
  ],
  template: `
    <div class="help-dialog-container">
      <div class="dialog-header">
        <h2 mat-dialog-title>
          <mat-icon class="header-icon">help</mat-icon>
          {{ data.title }}
        </h2>
        <button mat-icon-button class="close-button" (click)="onClose()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-divider/>

      <mat-dialog-content class="dialog-content">
        <div [innerHTML]="data.content"></div>
      </mat-dialog-content>

      <mat-divider/>

      <mat-dialog-actions align="end">
        <button mat-flat-button color="primary" (click)="onClose()">Got It</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .help-dialog-container {
      padding: 0;
      max-width: 100%;
      
      .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 24px 0;

        h2 {
          display: flex;
          align-items: center;
          margin: 0;
          font-size: 20px;
          font-weight: 500;

          .header-icon {
            margin-right: 12px;
            color: #667eea;
          }
        }

        .close-button {
          margin-right: -8px;
        }
      }

      .dialog-content {
        padding: 20px 24px;
        font-size: 15px;
        line-height: 1.5;
        color: #333;

        h4 {
          color: #667eea;
          margin: 20px 0 10px;
          font-size: 16px;
        }

        ul {
          padding-left: 20px;
          margin: 10px 0;

          li {
            margin-bottom: 8px;
          }
        }

        p {
          margin: 15px 0 0;
        }
      }

      mat-dialog-actions {
        padding: 10px 24px;
        margin-bottom: 0;
      }
    }
  `]
})
export class UsernameDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<UsernameDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      title: string; 
      content: string 
    }
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }
}