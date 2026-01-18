import { Component, Inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'marketspase-proof-guide-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatCardModule,
    MatChipsModule
  ],
  templateUrl: './proof-guide-modal.component.html',
  styleUrls: ['./proof-guide-modal.component.scss']
})
export class ProofGuideModalComponent {
  selectedImage: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<ProofGuideModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }

  onGotIt(): void {
    this.dialogRef.close('understood');
  }

  openImageLightbox(imageSrc: string): void {
    this.selectedImage = imageSrc;
  }

  closeLightbox(): void {
    this.selectedImage = null;
  }

  // Handle ESC key to close lightbox
  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    if (this.selectedImage) {
      this.closeLightbox();
    }
  }

  // Handle arrow keys to navigate between images (optional)
  @HostListener('document:keydown.arrowright')
  handleRightArrow(): void {
    if (this.selectedImage) {
      // You could implement cycling through images here
      // For example: this.cycleToNextImage();
    }
  }

  @HostListener('document:keydown.arrowleft')
  handleLeftArrow(): void {
    if (this.selectedImage) {
      // You could implement cycling through images here
      // For example: this.cycleToPreviousImage();
    }
  }

  // Optional: Add image cycling functionality
  private imageSources: string[] = [
    'img/proof-samples/proof-sample1.jpg',
    'img/proof-samples/proof-sample2.png',
    'img/proof-samples/proof-sample3.png'
  ];

  cycleToNextImage(): void {
    if (!this.selectedImage) return;
    
    const currentIndex = this.imageSources.indexOf(this.selectedImage);
    if (currentIndex === -1) return;
    
    const nextIndex = (currentIndex + 1) % this.imageSources.length;
    this.selectedImage = this.imageSources[nextIndex];
  }

  cycleToPreviousImage(): void {
    if (!this.selectedImage) return;
    
    const currentIndex = this.imageSources.indexOf(this.selectedImage);
    if (currentIndex === -1) return;
    
    const prevIndex = currentIndex === 0 ? this.imageSources.length - 1 : currentIndex - 1;
    this.selectedImage = this.imageSources[prevIndex];
  }
}