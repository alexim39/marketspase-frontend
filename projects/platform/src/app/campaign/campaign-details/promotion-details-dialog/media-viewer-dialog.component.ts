import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-media-viewer-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="media-viewer-dialog">
      <div class="dialog-header">
        <h2 mat-dialog-title>Proof Media</h2>
        <button mat-icon-button (click)="onClose()" class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      <mat-dialog-content>
        <div class="media-container">
          <img [src]="data.mediaUrl" [alt]="'Proof media'" class="zoomed-media">
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button (click)="onClose()">Close</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .media-viewer-dialog {
      max-width: 90vw;
      max-height: 90vh;
    }
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px 0;
    }
    .media-container {
      display: flex;
      justify-content: center;
      align-items: center;
      max-width: 100%;
      max-height: 70vh;
    }
    .zoomed-media {
      max-width: 100%;
      max-height: 70vh;
      object-fit: contain;
    }
    .close-button {
      margin-right: -8px;
    }
  `]
})
export class MediaViewerDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<MediaViewerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { mediaUrl: string }
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }
}