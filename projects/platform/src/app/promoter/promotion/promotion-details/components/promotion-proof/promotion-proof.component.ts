// promotion-proof.component.ts (updated)
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PromotionInterface } from '../../../../../../../../shared-services/src/public-api';
import { ImageViewerModalComponent, ImageViewerModalData } from './image-viewer-modal.component';

@Component({
  selector: 'app-promotion-proof',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatDialogModule],
  template: `
    @if (promotion.proofMedia && promotion.proofMedia.length > 0) {
      <div class="proof-section">
        <div class="section-header">
          <h3 class="section-title">Proof of Promotion</h3>
        </div>
        
        <div class="proof-grid">
          @for (media of promotion.proofMedia; track media; let i = $index) {
          <div class="proof-item" (click)="openImageViewer(media)">
            <img [src]="media" alt="Proof media" class="proof-image" (load)="onImageLoad($event)" (error)="onImageError($event)">
            <div class="proof-actions">
              <button class="proof-action-btn">
                <mat-icon>visibility</mat-icon>
              </button>
            </div>
            @if (imageLoadingStates[i]) {
              <div class="image-loading">
                <div class="loading-spinner"></div>
              </div>
            }
          </div>
          }
        </div>
      </div>
    }
  `,
  styleUrls: ['./promotion-proof.component.scss']
})
export class PromotionProofComponent {
  @Input() promotion!: PromotionInterface;
  @Input() apiUrl!: string;
  @Output() viewProof = new EventEmitter<string>();
  
  imageLoadingStates: boolean[] = [];

  constructor(private dialog: MatDialog) {}

  openImageViewer(imageUrl: string): void {
    this.viewProof.emit(imageUrl);
    
    const dialogRef = this.dialog.open(ImageViewerModalComponent, {
      data: {
        imageUrl: imageUrl,
        imageAlt: 'Proof of promotion'
      } as ImageViewerModalData,
      panelClass: 'image-viewer-modal-container',
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '100%',
      width: '100%',
      hasBackdrop: true,
      backdropClass: 'image-viewer-backdrop'
    });
  }

  onImageLoad(event: Event): void {
    const img = event.target as HTMLImageElement;
    const index = Array.from(img.parentElement?.parentElement?.children || []).indexOf(img.parentElement as HTMLElement);
    this.imageLoadingStates[index] = false;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    const index = Array.from(img.parentElement?.parentElement?.children || []).indexOf(img.parentElement as HTMLElement);
    this.imageLoadingStates[index] = false;
    // You could set an error state here if needed
  }
}