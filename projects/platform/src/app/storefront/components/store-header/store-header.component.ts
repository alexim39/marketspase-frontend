// store-header.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { LazyImageDirective } from '../../shared/directives/lazy-image.directive';
import { Subject, takeUntil } from 'rxjs';
import { Store } from '../../../store/models';

@Component({
  selector: 'app-store-header',
  standalone: true,
  imports: [
    CommonModule, 
    MatIconModule, 
    MatButtonModule, 
    MatTooltipModule,
    MatBadgeModule,
    LazyImageDirective
  ],
  templateUrl: './store-header.component.html',
  styleUrls: ['./store-header.component.scss']
})
export class StoreHeaderComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @Input() store: Store | null = null;
  @Input() isFavorited = false;
  @Input() storeStats = {
    productCount: 0,
    totalViews: 0,
    totalSales: 0,
    conversionRate: 0
  };

  @Output() toggleFavorite = new EventEmitter<void>();
  @Output() shareStore = new EventEmitter<void>();
  @Output() contactViaWhatsApp = new EventEmitter<void>();
  @Output() reportStore = new EventEmitter<void>();
  @Output() headerTransform = new EventEmitter<number>();

  public isCompactHeader = false;
  public showActions = true;
  private scrollThreshold = 200;

  ngOnInit(): void {
    this.checkInitialScroll();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Emit transform value for parallax
    this.headerTransform.emit(scrollTop * 0.5);
    
    // Update compact mode
    this.isCompactHeader = scrollTop > this.scrollThreshold;
  }

  private checkInitialScroll(): void {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    this.isCompactHeader = scrollTop > this.scrollThreshold;
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

  onReportStore(): void {
    this.reportStore.emit();
  }

  onImageError(event: any): void {
    event.target.src = 'assets/images/store-placeholder.svg';
  }

  get formattedRating(): string {
    const rating = this.store?.analytics?.rating;
    return rating ? rating.toFixed(1) : 'New';
  }

  get hasWhatsApp(): boolean {
    return !!(this.store?.whatsappNumber);
  }

  get verificationLabel(): string {
    if (this.store?.verificationTier === 'premium') return 'Premium';
    if (this.store?.isVerified) return 'Verified';
    return '';
  }

  get verificationIcon(): string {
    if (this.store?.verificationTier === 'premium') return 'verified';
    if (this.store?.isVerified) return 'check_circle';
    return '';
  }
}