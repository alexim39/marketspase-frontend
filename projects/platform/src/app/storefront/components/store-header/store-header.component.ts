// store-header.component.ts
import { Component, Input, Output, EventEmitter, ElementRef, Renderer2, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { LazyImageDirective } from '../../shared/directives/lazy-image.directive';
import { Subject, takeUntil } from 'rxjs';
import { Store } from '../../../store/models';

@Component({
  selector: 'app-store-header',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, LazyImageDirective],
  templateUrl: './store-header.component.html',
  styleUrls: ['./store-header.component.scss']
})
export class StoreHeaderComponent implements OnInit, OnDestroy {
  private renderer = inject(Renderer2);
  private destroy$ = new Subject<void>();

  @Input() store: Store | null = null;
  @Input() isFavorited = false;
  @Input() isScrolled = false;
  @Input() storeStats = {
    productCount: 0,
    totalViews: 0,
    totalSales: 0,
    conversionRate: 0
  };

  @Output() toggleFavorite = new EventEmitter<void>();
  @Output() shareStore = new EventEmitter<void>();
  @Output() contactViaWhatsApp = new EventEmitter<void>();
  @Output() headerTransform = new EventEmitter<number>();

  private lastScrollTop = 0;
  public headerVisible = true;

  ngOnInit(): void {
    this.setupScrollListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupScrollListener(): void {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // Emit transform value for parallax
      this.headerTransform.emit(scrollTop * 0.5);
      
      // Header show/hide logic
      if (scrollTop > this.lastScrollTop && scrollTop > 100) {
        this.headerVisible = false;
      } else {
        this.headerVisible = true;
      }
      this.lastScrollTop = scrollTop;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    this.destroy$.subscribe(() => {
      window.removeEventListener('scroll', handleScroll);
    });
  }

  onToggleFavorite(): void {
    this.toggleFavorite.emit();
  }

  onShareStore(): void {
    this.shareStore.emit();
  }

  onContactViaWhatsApp(): void {
    this.contactViaWhatsApp.emit();
  }

  onImageError(event: any): void {
    event.target.src = 'assets/images/store-placeholder.svg';
  }
}