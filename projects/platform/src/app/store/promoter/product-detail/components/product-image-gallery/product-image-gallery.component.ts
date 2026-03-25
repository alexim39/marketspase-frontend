import { Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-product-image-gallery',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatMenuModule, MatTooltipModule ],
  templateUrl: './product-image-gallery.component.html',
  styleUrls: ['./product-image-gallery.component.scss']
})
export class ProductImageGalleryComponent {
  @Input() images: any[] = [];
  @Input() commissionRate: number = 0;
  @Input() selectedIndex: number = 0;
  @Output() selectedIndexChange = new EventEmitter<number>();

  constructor(private snackBar: MatSnackBar) {}

  selectImage(index: number): void {
    this.selectedIndexChange.emit(index);
  }

  // Download current image
  async downloadCurrentImage(): Promise<void> {
    const currentImage = this.images[this.selectedIndex];
    if (!currentImage?.url) {
      this.snackBar.open('No image to download', 'Close', { duration: 3000 });
      return;
    }

    try {
      await this.downloadImage(currentImage.url);
      this.snackBar.open('Image downloaded successfully!', 'Close', { duration: 3000 });
    } catch (error) {
      console.error('Failed to download image:', error);
      this.snackBar.open('Failed to download image', 'Close', { duration: 3000 });
    }
  }

  // Download all images as ZIP
  async downloadAllImages(): Promise<void> {
    if (this.images.length === 0) {
      this.snackBar.open('No images to download', 'Close', { duration: 3000 });
      return;
    }

    this.snackBar.open('Preparing images for download...', 'Close', { duration: 2000 });
    
    try {
      // For multiple images, you might want to use JSZip library
      // Here's a simple implementation for individual downloads
      for (let i = 0; i < this.images.length; i++) {
        const image = this.images[i];
        if (image?.url) {
          await this.downloadImage(image.url, `image_${i + 1}`);
          // Small delay between downloads to avoid browser blocking
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      this.snackBar.open('All images downloaded!', 'Close', { duration: 3000 });
    } catch (error) {
      console.error('Failed to download images:', error);
      this.snackBar.open('Failed to download some images', 'Close', { duration: 3000 });
    }
  }

  // Helper method to download a single image
  private async downloadImage(url: string, filename?: string): Promise<void> {
    const response = await fetch(url);
    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || this.getFilenameFromUrl(url);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  }

  // Extract filename from URL or generate one
  private getFilenameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop();
      return filename || `product-image-${Date.now()}.jpg`;
    } catch {
      return `product-image-${Date.now()}.jpg`;
    }
  }

  // Optional: Open image in modal for better viewing
  openZoomModal(): void {
    // You can implement a modal dialog here
    // This could emit an event to parent or open a dialog service
    console.log('Open zoom modal for image:', this.images[this.selectedIndex]);
  }
}