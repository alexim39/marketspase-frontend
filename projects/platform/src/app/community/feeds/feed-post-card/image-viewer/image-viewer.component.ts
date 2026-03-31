// image-viewer.component.ts
import { Component, Inject, signal, computed, effect, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface ImageViewerData {
  images: { url: string; thumbnail?: string; alt?: string }[];
  initialIndex?: number;
  postId?: string;
}

@Component({
  selector: 'app-image-viewer',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './image-viewer.component.html',
  styleUrls: ['./image-viewer.component.scss']
})
export class ImageViewerComponent {
  images: { url: string; thumbnail?: string; alt?: string }[];
  currentIndex: number;
  
  // State signals
  loading = signal(true);
  error = signal(false);
  uiHidden = signal(false);
  showInfo = signal(false);
  showThumbnails = signal(true);
  
  // Zoom and pan state
  zoomScale = signal(1);
  panX = signal(0);
  panY = signal(0);
  isDragging = signal(false);
  dragStart = { x: 0, y: 0 };
  
  // Touch gestures
  touchStartDistance = 0;
  touchStartScale = 1;
  
  // Image metadata
  imageDimensions = signal({ width: 0, height: 0 });
  imageSize = signal<string | null>(null);
  
  // UI timeout for auto-hide
  private uiTimeout: any;
  
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ImageViewerData,
    private dialogRef: MatDialogRef<ImageViewerComponent>
  ) {
    this.images = data.images;
    this.currentIndex = data.initialIndex || 0;
    
    // Reset UI timeout on interaction
    this.resetUITimer();
  }
  
  // Computed values
  currentImage = computed(() => this.images[this.currentIndex]);
  
  zoomTransform = computed(() => {
    const scale = this.zoomScale();
    const panX = this.panX();
    const panY = this.panY();
    return `translate(${panX}px, ${panY}px) scale(${scale})`;
  });
  
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    switch (event.key) {
      case 'Escape':
        this.close();
        break;
      case 'ArrowLeft':
        this.previousImage();
        break;
      case 'ArrowRight':
        this.nextImage();
        break;
      case '+':
      case '=':
        this.zoomIn();
        break;
      case '-':
        this.zoomOut();
        break;
      case '0':
        this.resetZoom();
        break;
      case 'i':
      case 'I':
        this.toggleInfo();
        break;
      case ' ':
        this.toggleUI();
        break;
    }
  }
  
  onImageLoad() {
    this.loading.set(false);
    this.error.set(false);
    
    // Get image dimensions
    const img = new Image();
    img.onload = () => {
      this.imageDimensions.set({ width: img.width, height: img.height });
    };
    img.src = this.currentImage().url;
  }
  
  onImageError() {
    this.loading.set(false);
    this.error.set(true);
  }
  
  retryLoad() {
    this.loading.set(true);
    this.error.set(false);
    // Force reload by updating URL with timestamp
    const img = new Image();
    img.src = this.currentImage().url + '?t=' + new Date().getTime();
  }
  
  // Navigation
  previousImage() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.resetZoom();
      this.loading.set(true);
      this.resetUITimer();
    }
  }
  
  nextImage() {
    if (this.currentIndex < this.images.length - 1) {
      this.currentIndex++;
      this.resetZoom();
      this.loading.set(true);
      this.resetUITimer();
    }
  }
  
  goToIndex(index: number) {
    if (index >= 0 && index < this.images.length) {
      this.currentIndex = index;
      this.resetZoom();
      this.loading.set(true);
      this.resetUITimer();
    }
  }
  
  // Zoom controls
  zoomIn() {
    if (this.zoomScale() < 3) {
      this.zoomScale.update(scale => Math.min(scale + 0.25, 3));
      this.resetUITimer();
    }
  }
  
  zoomOut() {
    if (this.zoomScale() > 0.5) {
      this.zoomScale.update(scale => Math.max(scale - 0.25, 0.5));
      this.resetUITimer();
    }
  }
  
  resetZoom() {
    this.zoomScale.set(1);
    this.panX.set(0);
    this.panY.set(0);
    this.resetUITimer();
  }
  
  // Pan functionality
  onMouseDown(event: MouseEvent) {
    if (this.zoomScale() > 1) {
      this.isDragging.set(true);
      this.dragStart = { x: event.clientX - this.panX(), y: event.clientY - this.panY() };
      this.resetUITimer();
    }
  }
  
  onMouseMove(event: MouseEvent) {
    if (this.isDragging() && this.zoomScale() > 1) {
      this.panX.set(event.clientX - this.dragStart.x);
      this.panY.set(event.clientY - this.dragStart.y);
    }
  }
  
  onMouseUp(event: MouseEvent) {
    this.isDragging.set(false);
  }
  
  onMouseLeave() {
    this.isDragging.set(false);
  }
  
  // Touch gestures
  onTouchStart(event: TouchEvent) {
    if (event.touches.length === 2) {
      // Pinch gesture
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      this.touchStartDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      this.touchStartScale = this.zoomScale();
    } else if (event.touches.length === 1 && this.zoomScale() > 1) {
      // Pan gesture
      this.isDragging.set(true);
      this.dragStart = {
        x: event.touches[0].clientX - this.panX(),
        y: event.touches[0].clientY - this.panY()
      };
    }
    this.resetUITimer();
  }
  
  onTouchMove(event: TouchEvent) {
    event.preventDefault();
    
    if (event.touches.length === 2) {
      // Handle pinch zoom
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      const scale = (distance / this.touchStartDistance) * this.touchStartScale;
      this.zoomScale.set(Math.min(Math.max(scale, 0.5), 3));
    } else if (event.touches.length === 1 && this.isDragging()) {
      // Handle pan
      this.panX.set(event.touches[0].clientX - this.dragStart.x);
      this.panY.set(event.touches[0].clientY - this.dragStart.y);
    }
  }
  
  onTouchEnd(event: TouchEvent) {
    this.isDragging.set(false);
    
    // Handle swipe for navigation
    if (event.touches.length === 0 && this.zoomScale() === 1) {
      // Implement swipe detection here if needed
    }
  }
  
  // UI controls
  toggleUI() {
    this.uiHidden.update(v => !v);
  }
  
  toggleInfo() {
    this.showInfo.update(v => !v);
    this.resetUITimer();
  }
  
  downloadImage() {
    const link = document.createElement('a');
    link.href = this.currentImage().url;
    link.download = this.getFilename(this.currentImage().url);
    link.click();
    this.resetUITimer();
  }
  
  close() {
    this.dialogRef.close();
  }

    onContainerClick(event: MouseEvent) {
        // Only toggle UI if clicking directly on container (not on image or controls)
        if ((event.target as HTMLElement).classList.contains('image-viewer-container')) {
            this.toggleUI();
        }
    }
  
  // Utilities
  private resetUITimer() {
    if (this.uiTimeout) {
      clearTimeout(this.uiTimeout);
    }
    
    if (!this.uiHidden()) {
      this.uiTimeout = setTimeout(() => {
        if (!this.showInfo()) {
          this.uiHidden.set(true);
        }
      }, 3000);
    }
  }
  
  getFilename(url: string): string {
    const parts = url.split('/');
    return parts[parts.length - 1] || 'image.jpg';
  }
}