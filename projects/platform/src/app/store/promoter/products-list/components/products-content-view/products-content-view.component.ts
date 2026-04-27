// components/products-content-view/products-content-view.component.ts
import { Component, Input, Output, EventEmitter, signal, computed, inject, OnChanges, SimpleChanges } from '@angular/core';
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

import { TruncatePipe } from '../../../../shared/pipes/truncate.pipe';
import { ViewMode } from '../../models/filter-state.model';
import { CurrencyUtilsPipe, DeviceService, UserInterface } from '../../../../../../../../shared-services/src/public-api';
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
  templateUrl: './products-content-view.component.html',
  styleUrls: ['./products-content-view.component.scss']
})
export class ProductsContentViewComponent implements OnChanges {
  @Input({ required: true }) products!: Product[];
  @Input({ required: true }) user!: UserInterface | null;
  @Input({ required: true }) loading!: boolean;
  @Input({ required: true }) error!: string | null;
  @Input() totalProducts: number = 0;
  @Input() totalPages: number = 0;
  @Input() currentPage: number = 1;
  @Input() pageSize: number = 12;
  @Input() activePromotions: Map<string, any> = new Map();
  
  @Output() viewProduct = new EventEmitter<Product>();
  @Output() shareWhatsApp = new EventEmitter<Product>();
  @Output() promoteProduct = new EventEmitter<Product>();
  @Output() copyProductUrl = new EventEmitter<Product>();
  @Output() retry = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  private deviceService = inject(DeviceService);
  deviceType = computed(() => this.deviceService.type())

  // Local UI state
  viewMode = signal<ViewMode>('grid');

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
    if (rate >= 10) return 'success';
    if (rate >= 5) return 'warning';
    return 'primary';
  }

  getConversionRate(product: Product): number {
    const { clickCount, conversions } = product.promotion;
    if (clickCount === 0) return 0;
    return (conversions / clickCount) * 100 | 0;
  }

  getStoreBadgeClass(tier: string): string {
    return tier === 'premium' ? 'premium-badge' : 'basic-badge';
  }

  trackByProductId(index: number, product: Product): string {
    return product._id || '';
  }

  // These methods now just emit events to parent
  onPromote(product: Product): void {
    this.promoteProduct.emit(product);
  }

  onCopyUrl(product: Product): void {
    this.copyProductUrl.emit(product);
  }

  onShareWhatsApp(product: Product): void {
    this.shareWhatsApp.emit(product);
  }
}