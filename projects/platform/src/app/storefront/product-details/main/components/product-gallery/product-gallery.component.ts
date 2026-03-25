import { Component, Input, Output, EventEmitter, signal, OnChanges, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
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
  styleUrls: ['./product-gallery.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductGalleryComponent implements OnChanges, AfterViewInit {
  @Input() images: ProductImage[] = [];
  @Input() productName: string = '';
  @Input() hasDiscount: boolean = false;
  @Input() discountPercentage: number = 0;
  @Input() isFeatured: boolean = false;
  @Input() stockStatus: string = 'in-stock';
  
  @Output() imageSelected = new EventEmitter<number>();
  
  @ViewChild('mainImage') mainImageElement!: ElementRef<HTMLImageElement>;

  selectedImageIndex = signal<number>(0);
  currentImageUrl = signal<string>('');
  
  ngAfterViewInit(): void {
    // Initialize with first image
    if (this.images && this.images.length > 0) {
      this.currentImageUrl.set(this.images[0].url);
    }
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['images'] && this.images && this.images.length > 0) {
      this.selectedImageIndex.set(0);
      this.currentImageUrl.set(this.images[0].url);
      this.updateImageElement();
    }
  }
  
  selectImage(index: number): void {
    if (index >= 0 && index < this.images.length) {
      
      this.selectedImageIndex.set(index);
      this.currentImageUrl.set(this.images[index].url);
      
      // Force update the image element directly
      this.updateImageElement();
      
      this.imageSelected.emit(index);
      
      // Force change detection
      this.cdr.detectChanges();
    }
  }
  
  private updateImageElement(): void {
    // Direct DOM manipulation as a fallback
    if (this.mainImageElement && this.mainImageElement.nativeElement) {
      const imgElement = this.mainImageElement.nativeElement;
      const newUrl = this.currentImageUrl();
      
      
      // Force image reload by creating a new image object
      const tempImage = new Image();
      tempImage.onload = () => {
        imgElement.src = newUrl;
      };
      tempImage.onerror = () => {
        console.error('Failed to load image:', newUrl);
        imgElement.src = 'img/product.png';
      };
      tempImage.src = newUrl;
    }
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
    //console.error('Image load error:', target.src);
    target.src = 'img/product.png';
  }
  
  getStockBadge(): { type: string; icon: string; text: string } | null {
    if (this.stockStatus === 'low-stock') {
      return { type: 'low-stock', icon: 'warning', text: 'Low Stock' };
    }
    return null;
  }

  onImageClick(event: MouseEvent): void {
    console.log('Image clicked - zoom functionality can be added here');
  }

  constructor(private cdr: ChangeDetectorRef) {}
}