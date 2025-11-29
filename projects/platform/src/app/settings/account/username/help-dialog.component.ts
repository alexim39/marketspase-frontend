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
  styleUrls: ['./help-dialog.component.scss']
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