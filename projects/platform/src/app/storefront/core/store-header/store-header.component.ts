// store-header.component.ts
import { 
  Component, Input, Output, EventEmitter, OnInit, OnDestroy, 
  HostListener, inject, signal, computed 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { LazyImageDirective } from '../../shared/directives/lazy-image.directive';
import { Subject } from 'rxjs';
import { MatDividerModule } from '@angular/material/divider';
import { DeviceService } from '../../../../../../shared-services/src/public-api';

export interface StoreStats {
  productCount: number;
  followerCount: number;
  totalViews: number;
  totalSales: number;
  conversionRate: number;
  responseRate?: number;
  responseTime?: string;
  memberSince?: Date;
}

@Component({
  selector: 'app-store-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatBadgeModule,
    MatMenuModule,
    LazyImageDirective,
    MatDividerModule
  ],
  templateUrl: './store-header.component.html',
  styleUrls: ['./store-header.component.scss']
})
export class StoreHeaderComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private deviceService = inject(DeviceService);
  deviceType = computed(() => this.deviceService.type());

  @Input() store: any | null = null;
  @Input() isFavorited = false;
  @Input() followerCount = 0;
  @Input() storeStats: StoreStats = {
    productCount: 0,
    followerCount: 0,
    totalViews: 0,
    totalSales: 0,
    conversionRate: 0,
    responseRate: 100,
    responseTime: '< 1 hour'
  };
  @Input() activeTab = 'products';

  @Output() toggleFavorite = new EventEmitter<void>();
  @Output() shareStore = new EventEmitter<void>();
  @Output() contactStore = new EventEmitter<'whatsapp' | 'email' | 'chat'>();
  @Output() reportStore = new EventEmitter<void>();
  @Output() tabChange = new EventEmitter<string>();
  @Output() viewAllProducts = new EventEmitter<void>();

  // Signals for reactive state
  isScrolled = signal<boolean>(false);
  showFullDescription = signal<boolean>(false);
  currentYear = new Date().getFullYear();

  // Computed values
  memberSinceYear = computed(() => {
    if (this.store?.createdAt) {
      return new Date(this.store.createdAt).getFullYear();
    }
    return this.currentYear;
  });

  formattedRating = computed(() => {
    const rating = this.store?.analytics?.rating;
    return rating ? rating.toFixed(1) : '0.0';
  });

  hasWhatsApp = computed(() => !!(this.store?.whatsappNumber));
  hasEmail = computed(() => !!(this.store?.email));
  hasPhone = computed(() => !!(this.store?.phoneNumber));

  // Navigation tabs
  navTabs = [
    { id: 'products', label: 'Products', icon: 'inventory_2' },
    { id: 'about', label: 'About', icon: 'info' },
    { id: 'reviews', label: 'Reviews', icon: 'star' },
    { id: 'policies', label: 'Policies', icon: 'description' }
  ];

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
    this.isScrolled.set(scrollTop > 100);
  }

  private checkInitialScroll(): void {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    this.isScrolled.set(scrollTop > 100);
  }

  onToggleFavorite(): void {
    this.toggleFavorite.emit();
  }

  onShareStore(): void {
    this.shareStore.emit();
  }

  onContact(method: 'whatsapp' | 'email' | 'chat'): void {
    this.contactStore.emit(method);
  }

  onReportStore(): void {
    this.reportStore.emit();
  }

  onTabChange(tabId: string): void {
    this.activeTab = tabId;
    this.tabChange.emit(tabId);
  }

  onViewAllProducts(): void {
    this.viewAllProducts.emit();
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = 'assets/images/store-placeholder.svg';
  }

  toggleDescription(): void {
    this.showFullDescription.update(value => !value);
  }

  getInitials(name: string): string {
    if (!name) return 'ST';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  get verificationIcon(): string {
    if (this.store?.verificationTier === 'premium') return 'verified';
    if (this.store?.isVerified) return 'check_circle';
    return '';
  }

  get verificationTooltip(): string {
    if (this.store?.verificationTier === 'premium') return 'Premium Verified Store';
    if (this.store?.isVerified) return 'Verified Store';
    return 'Unverified Store';
  }
}