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

import { PromoterProduct } from '../../../models/promoter-product.model';
import { TruncatePipe } from '../../../../shared/pipes/truncate.pipe';
import { ViewMode } from '../../models/filter-state.model';
import { CurrencyUtilsPipe, UserInterface } from '../../../../../../../../shared-services/src/public-api';
import { PromotionTrackingService } from '../../../services/promotion-tracking.service';
import { MatSnackBar } from '@angular/material/snack-bar';

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
    CurrencyUtilsPipe
  ],
  providers: [PromotionTrackingService],
  templateUrl: './products-content-view.component.html',
  styleUrls: ['./products-content-view.component.scss']
})
export class ProductsContentViewComponent implements OnInit, OnChanges {
  @Input({ required: true }) products!: PromoterProduct[];
  @Input({ required: true }) user!: UserInterface | null;
  @Input({ required: true }) loading!: boolean;
  @Input({ required: true }) error!: string | null;
  @Input() totalProducts: number = 0;
  @Input() totalPages: number = 0;
  @Input() currentPage: number = 1;
  @Input() pageSize: number = 12;
  
  @Output() viewProduct = new EventEmitter<PromoterProduct>();
  @Output() shareWhatsApp = new EventEmitter<PromoterProduct>();
  @Output() retry = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  private promotionService = inject(PromotionTrackingService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  // Local UI state
  viewMode = signal<ViewMode>('grid');
  activePromotions = signal<Map<string, any>>(new Map());

  // Remove pagination computed since server handles it
  // The products are already paginated from server

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

  getConversionRate(product: PromoterProduct): number {
    const { clicks, conversions } = product.promotion;
    if (clicks === 0) return 0;
    return (conversions / clicks) * 100;
  }

  getStoreBadgeClass(tier: string): string {
    return tier === 'premium' ? 'premium-badge' : 'basic-badge';
  }

  trackByProductId(index: number, product: PromoterProduct): string {
    return product._id;
  }

  async onPromote(product: PromoterProduct): Promise<void> {
    try {
      const promoterId = this.user?._id;
      if (!promoterId) {
        this.snackBar.open('You must be logged in to promote products', 'Close', { duration: 5000 });
        return;
      }

      const snackBarRef = this.snackBar.open('Creating promotion link...', 'Close', { duration: 3000 });

      const existingPromotion = this.activePromotions().get(product._id);
      
      let trackingCode: string;
      let uniqueId: string;

      if (existingPromotion) {
        trackingCode = existingPromotion.uniqueCode;
        uniqueId = existingPromotion.uniqueId;
        snackBarRef.dismiss();
      } else {
        const response = await this.promotionService.createPromotion({
          productId: product._id,
          promoterId: promoterId,
          storeId: product.store._id,
          commissionRate: product.promotion.commissionRate,
          commissionType: product.promotion.commissionType,
          fixedCommission: product.promotion.fixedCommission
        }).toPromise();

        trackingCode = response.data.uniqueCode;
        uniqueId = response.data.uniqueId;

        this.activePromotions.update(map => {
          map.set(product._id, {
            uniqueCode: trackingCode,
            uniqueId: uniqueId,
            ...response.data
          });
          return new Map(map);
        });

        snackBarRef.dismiss();
        this.snackBar.open('Promotion link created successfully!', 'Close', { duration: 3000 });
      }

      const trackingLink = this.promotionService.getTrackingLink(trackingCode, product._id);
      
      await navigator.clipboard.writeText(trackingLink);
      
      this.showPromotionOptions(product, trackingLink, trackingCode);
      
    } catch (error) {
      console.error('Error creating promotion:', error);
      this.snackBar.open('Failed to create promotion link. Please try again.', 'Close', { duration: 5000 });
    }
  }

  private showPromotionOptions(product: PromoterProduct, link: string, trackingCode: string): void {
    const snackBarRef = this.snackBar.open(
      '✅ Link copied! Share via WhatsApp or View Stats',
      'WhatsApp',
      { duration: 10000 }
    );

    snackBarRef.onAction().subscribe(() => {
      this.shareOnWhatsApp(product, trackingCode);
    });
  }

  shareOnWhatsApp(product: PromoterProduct, trackingCode: string): void {
    const message = this.promotionService.generateWhatsAppMessage(
      product,
      trackingCode,
      product.promotion.commissionRate,
      product.price
    );
    
    window.open(`https://wa.me/?text=${message}`, '_blank');
  }

  async viewPromotionStats(product: PromoterProduct): Promise<void> {
    try {
      const promoterId = this.user?._id;
      if (!promoterId) return;

      const stats = await this.promotionService.getProductPromotionStats(
        product._id,
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

  onPromotion(product: PromoterProduct): void {
    this.onPromote(product);
  }
}