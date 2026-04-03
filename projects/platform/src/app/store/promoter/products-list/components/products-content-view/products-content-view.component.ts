// components/products-content-view/products-content-view.component.ts
import { Component, Input, Output, EventEmitter, signal, computed, inject, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';

//import { PromoterProduct } from '../../../models/promoter-product.model';
import { TruncatePipe } from '../../../../shared/pipes/truncate.pipe';
import { ViewMode } from '../../models/filter-state.model';
import { CurrencyUtilsPipe, DeviceService, UserInterface } from '../../../../../../../../shared-services/src/public-api';
import { PromotionService } from '../../../services/promotion.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Product } from '../../../../models';
import { LoadingStateComponent } from '../loading-state/loading-state.component';
import { LoadingStateMobileComponent } from '../loading-state/mobile/loading-state-mobile.component';

@Component({
  selector: 'app-products-content-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatTableModule,
    TruncatePipe,
    CurrencyUtilsPipe,
    LoadingStateComponent,
    LoadingStateMobileComponent
  ],
  providers: [PromotionService],
  templateUrl: './products-content-view.component.html',
  styleUrls: ['./products-content-view.component.scss']
})
export class ProductsContentViewComponent implements OnInit, OnChanges {
  @Input({ required: true }) products!: Product[];
  @Input({ required: true }) user!: UserInterface | null;
  @Input({ required: true }) loading!: boolean;
  @Input({ required: true }) error!: string | null;
  @Input() totalProducts: number = 0;
  @Input() totalPages: number = 0;
  @Input() currentPage: number = 1;
  @Input() pageSize: number = 12;
  
  @Output() viewProduct = new EventEmitter<Product>();
  @Output() shareWhatsApp = new EventEmitter<Product>();
  @Output() retry = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  private promotionService = inject(PromotionService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  private deviceService = inject(DeviceService);
  deviceType = computed(() => this.deviceService.type())

  // Local UI state
  viewMode = signal<ViewMode>('grid');
  activePromotions = signal<Map<string, any>>(new Map());

  ngOnInit(): void {
    this.loadActivePromotions();
  }
  ngOnChanges(changes: SimpleChanges): void {
    // Reset to first page when products change
    if (changes['products'] && !changes['products'].firstChange) {
      // Any additional logic when products change
    }
  }

  onPageChange(event: PageEvent): void {
    this.pageSizeChange.emit(event.pageSize);
    this.pageChange.emit(event.pageIndex + 1); // Convert to 1-based index
  }

  setGridView(): void {
    this.viewMode.set('grid');
  }

  setListView(): void {
    this.viewMode.set('list');
  }

  getPerformanceColor(rate: number): string {
    if (rate >= 20) return 'success';
    if (rate >= 10) return 'warning';
    return 'primary';
  }

  getConversionRate(product: Product): number {
    const { clickCount, conversions } = product.promotion;
    if (clickCount === 0) return 0;
    return (conversions / clickCount) * 100;
  }

  getStoreBadgeClass(tier: string): string {
    return tier === 'premium' ? 'premium-badge' : 'basic-badge';
  }

  trackByProductId(index: number, product: Product): string {
    return product._id || '';
  }

  async onPromote(product: Product): Promise<void> {
    try {
      const promoterId = this.user?._id;
      if (!promoterId) {
        this.snackBar.open('You must be logged in to promote products', 'Close', { duration: 5000 });
        return;
      }

      const snackBarRef = this.snackBar.open('Creating promotion link...', 'Close', { duration: 3000 });

      const existingPromotion = this.activePromotions().get(product._id ?? '');
      
      let trackingCode: string;
      let uniqueId: string;

      if (existingPromotion) {
        trackingCode = existingPromotion.uniqueCode;
        uniqueId = existingPromotion.uniqueId;
        snackBarRef.dismiss();
      } else {
        const response = await this.promotionService.createPromotion({
          productId: product._id ?? '',
          promoterId: promoterId,
          storeId: product.store._id,
          commissionRate: product.promotion.commissionRate,
          commissionType: product.promotion.commissionType,
          fixedCommission: product.promotion.fixedCommission
        }).toPromise();

        trackingCode = response.data.uniqueCode;
        uniqueId = response.data.uniqueId;

        this.activePromotions.update(map => {
          map.set(product._id ?? '', {
            uniqueCode: trackingCode,
            uniqueId: uniqueId,
            ...response.data
          });
          return new Map(map);
        });

        snackBarRef.dismiss();
        this.snackBar.open('Promotion link created successfully!', 'Close', { duration: 3000 });
      }

      const trackingLink = this.promotionService.getTrackingLink(trackingCode, product._id ?? '');
      
      await navigator.clipboard.writeText(trackingLink);
      
      this.showPromotionOptions(product, trackingLink, trackingCode);
      
    } catch (error) {
      console.error('Error creating promotion:', error);
      this.snackBar.open('Failed to create promotion link. Please try again.', 'Close', { duration: 5000 });
    }
  }

  copyUrl(product: Product) {
    try {
      // 1. Get the existing promotion data from your signal/state
      const existingPromotion = this.activePromotions().get(product._id ?? '');

      if (!existingPromotion) {
        this.snackBar.open('Please click "Share Button" first to generate your link.', 'Close', { duration: 3000 });
        return;
      }

      // 2. Generate the tracking link using the existing uniqueCode
      const trackingLink = this.promotionService.getTrackingLink(
        existingPromotion.uniqueCode, 
        product._id ?? ''
      );

      // 3. Copy to clipboard
      navigator.clipboard.writeText(trackingLink);
      
      this.snackBar.open('Link copied to clipboard!', 'Close', { duration: 2000 });
    } catch (error) {
      console.error('Copy failed', error);
      this.snackBar.open('Failed to copy link.', 'Close', { duration: 3000 });
    }
  }

  private showPromotionOptions(product: Product, link: string, trackingCode: string): void {
    // const snackBarRef = this.snackBar.open(
    //   '✅ Link copied! Share via WhatsApp or View Stats',
    //   'WhatsApp',
    //   { duration: 10000 }
    // );

    // snackBarRef.onAction().subscribe(() => {
    //   this.shareOnWhatsApp(product, trackingCode);
    // });
    this.shareOnWhatsApp(product, trackingCode);
  }

  shareOnWhatsApp(product: Product, trackingCode: string): void {
    const message = this.promotionService.generateWhatsAppMessage(
      product,
      trackingCode,
      product.promotion.commissionRate,
      product.price
    );
    
    window.open(`https://wa.me/?text=${message}`, '_blank');
  }

  async viewPromotionStats(product: Product): Promise<void> {
    try {
      const promoterId = this.user?._id;
      if (!promoterId) return;

      const stats = await this.promotionService.getProductPromotionStats(
        product._id ?? '',
        promoterId
      ).toPromise();

      this.router.navigate(['dashboard/promotions/stats', product._id], {
        state: { stats: stats.data }
      });
      
    } catch (error) {
      console.error('Error loading promotion stats:', error);
      this.snackBar.open('Failed to load promotion statistics', 'Close', { duration: 5000 });
    }
  }

  async loadActivePromotions(): Promise<void> {
    try {
      const promoterId = this.user?._id;
      if (!promoterId) return;

      const response = await this.promotionService.getPromoterPromotions(promoterId).toPromise();
      
      const promotionMap = new Map();
      response.data.forEach((promo: any) => {
        promotionMap.set(promo.product._id || promo.product, promo);
      });
      
      this.activePromotions.set(promotionMap);
      
    } catch (error) {
      console.error('Error loading active promotions:', error);
    }
  }

  onPromotion(product: Product): void {
    this.onPromote(product);
  }
}