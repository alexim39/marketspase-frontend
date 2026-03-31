// product-image-viewer.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface ProductImageViewerData {
  images: { url: string; thumbnail?: string; alt?: string }[];
  initialIndex: number;
  productName: string;
}

@Component({
  selector: 'app-product-image-viewer',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './product-image-viewer.component.html',
  styleUrls: ['./product-image-viewer.component.scss']
})
export class ProductImageViewerComponent {
  currentIndex: number;
  zoomed = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ProductImageViewerData,
    private dialogRef: MatDialogRef<ProductImageViewerComponent>
  ) {
    this.currentIndex = data.initialIndex;
  }

  get images() {
    return this.data.images;
  }

  get productName() {
    return this.data.productName;
  }

  prevImage() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.zoomed = false;
    }
  }

  nextImage() {
    if (this.currentIndex < this.images.length - 1) {
      this.currentIndex++;
      this.zoomed = false;
    }
  }

  goToImage(index: number) {
    this.currentIndex = index;
    this.zoomed = false;
  }

  toggleZoom() {
    this.zoomed = !this.zoomed;
  }

  close() {
    this.dialogRef.close();
  }

  handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/product-placeholder.jpg';
  }

  handleThumbnailError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/thumbnail-placeholder.jpg';
  }
}