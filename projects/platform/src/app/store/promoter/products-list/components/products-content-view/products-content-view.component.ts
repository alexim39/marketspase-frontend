// components/products-content-view/products-content-view.component.ts
import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
    TruncatePipe
  ],
  templateUrl: './products-content-view.component.html',
  styleUrls: ['./products-content-view.component.scss']
})
export class ProductsContentViewComponent {
  @Input({ required: true }) products!: PromoterProduct[];
  @Input({ required: true }) filteredProducts!: PromoterProduct[];
  @Input({ required: true }) loading!: boolean;
  @Input({ required: true }) error!: string | null;
  
  @Output() viewProduct = new EventEmitter<PromoterProduct>();
  @Output() copyLink = new EventEmitter<PromoterProduct>();
  @Output() shareWhatsApp = new EventEmitter<PromoterProduct>();
  @Output() retry = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();

  // Local UI state
  viewMode = signal<ViewMode>('grid');
  pageSize = signal<number>(12);
  currentPage = signal<number>(0);

  // Computed
  paginatedProducts = computed(() => {
    const start = this.currentPage() * this.pageSize();
    return this.filteredProducts.slice(start, start + this.pageSize());
  });

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  setGridView(): void {
    this.viewMode.set('grid');
  }

  setListView(): void {
    this.viewMode.set('list');
  }

  getPerformanceColor(rate: number): string {
    if (rate >= 30) return 'success';
    if (rate >= 15) return 'warning';
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
}