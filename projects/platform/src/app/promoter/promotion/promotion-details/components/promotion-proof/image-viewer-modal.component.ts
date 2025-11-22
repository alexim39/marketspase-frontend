// image-viewer-modal.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';

export interface ImageViewerModalData {
  imageUrl: string;
  imageAlt?: string;
}

@Component({
  selector: 'app-image-viewer-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatDialogModule],
  template: `
    <div class="image-viewer-modal">
      <div class="modal-header">
        <button class="close-btn" (click)="onClose()" aria-label="Close modal">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <div class="modal-content">
        <div class="image-container">
          <img 
            [src]="data.imageUrl" 
            [alt]="data.imageAlt || 'Proof image'" 
            class="modal-image"
            (load)="onImageLoad()"
            (error)="onImageError()"
          >
          
          @if (isLoading) {
            <div class="loading-spinner">
              <div class="spinner"></div>
            </div>
          }
          
          @if (hasError) {
            <div class="error-state">
              <mat-icon class="error-icon">broken_image</mat-icon>
              <p>Failed to load image</p>
            </div>
          }
        </div>
        
        <!-- <div class="modal-actions">
          <button class="action-btn" (click)="zoomOut()" [disabled]="zoomLevel <= minZoom">
            <mat-icon>zoom_out</mat-icon>
          </button>
          
          <button class="action-btn" (click)="resetZoom()">
            <mat-icon>refresh</mat-icon>
          </button>
          
          <button class="action-btn" (click)="zoomIn()" [disabled]="zoomLevel >= maxZoom">
            <mat-icon>zoom_in</mat-icon>
          </button>
          
          <button class="action-btn" (click)="downloadImage()">
            <mat-icon>download</mat-icon>
          </button>
        </div> -->
      </div>
    </div>
  `,
  styleUrls: ['./image-viewer-modal.component.scss']
})
export class ImageViewerModalComponent {
  isLoading = true;
  hasError = false;
  zoomLevel = 1;
  minZoom = 0.5;
  maxZoom = 3;
  zoomStep = 0.25;

  constructor(
    public dialogRef: MatDialogRef<ImageViewerModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ImageViewerModalData
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }

  onImageLoad(): void {
    this.isLoading = false;
    this.hasError = false;
  }

  onImageError(): void {
    this.isLoading = false;
    this.hasError = true;
  }

  zoomIn(): void {
    if (this.zoomLevel < this.maxZoom) {
      this.zoomLevel = Math.min(this.zoomLevel + this.zoomStep, this.maxZoom);
    }
  }

  zoomOut(): void {
    if (this.zoomLevel > this.minZoom) {
      this.zoomLevel = Math.max(this.zoomLevel - this.zoomStep, this.minZoom);
    }
  }

  resetZoom(): void {
    this.zoomLevel = 1;
  }

  downloadImage(): void {
    const link = document.createElement('a');
    link.href = this.data.imageUrl;
    link.download = `proof-image-${Date.now()}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}