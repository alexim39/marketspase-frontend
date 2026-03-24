import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { LazyImageDirective } from '../../../../shared/directives/lazy-image.directive';

export interface ProductImage {
  url: string;
  altText?: string;
}

@Component({
  selector: 'app-product-gallery',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, LazyImageDirective],
  templateUrl: './product-gallery.component.html',
  styleUrls: ['./product-gallery.component.scss']
})
export class ProductGalleryComponent {
  @Input() images: ProductImage[] = [];
  @Input() productName: string = '';
  @Input() hasDiscount: boolean = false;
  @Input() discountPercentage: number = 0;
  @Input() isFeatured: boolean = false;
  @Input() stockStatus: string = 'in-stock';
  
  @Output() imageSelected = new EventEmitter<number>();

  selectedImageIndex = signal<number>(0);
  
  selectedImage = computed(() => {
    return this.images[this.selectedImageIndex()] || null;
  });
  
  selectImage(index: number): void {
    this.selectedImageIndex.set(index);
    this.imageSelected.emit(index);
  }
  
  nextImage(): void {
    if (this.images.length <= 1) return;
    const nextIndex = (this.selectedImageIndex() + 1) % this.images.length;
    this.selectImage(nextIndex);
  }
  
  prevImage(): void {
    if (this.images.length <= 1) return;
    const prevIndex = (this.selectedImageIndex() - 1 + this.images.length) % this.images.length;
    this.selectImage(prevIndex);
  }
  
  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = 'img/product.png';
  }
  
  getStockBadge(): { type: string; icon: string; text: string } | null {
    if (this.stockStatus === 'low-stock') {
      return { type: 'low-stock', icon: 'warning', text: 'Low Stock' };
    }
    return null;
  }

  // Optional: Handle image click for zoom
  onImageClick(event: MouseEvent): void {
    // You can implement zoom functionality here later
    // For now, just log or do nothing
    console.log('Image clicked - zoom functionality can be added here');
  }
}