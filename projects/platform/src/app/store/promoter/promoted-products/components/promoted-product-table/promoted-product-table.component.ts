// promoted-products/components/promoted-product-table/promoted-product-table.component.ts
import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PromotedProduct } from '../../promoted-products.component';

@Component({
  selector: 'promoted-product-table',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTooltipModule],
  templateUrl: './promoted-product-table.component.html',
  styleUrls: ['./promoted-product-table.component.scss']
})
export class PromotedProductTableComponent {
  @Input({ required: true }) products!: PromotedProduct[];
  @Input({ required: true }) formatCurrency!: (amount: number) => string;
  @Input({ required: true }) formatNumber!: (num: number) => string;

  @Output() viewDetails = new EventEmitter<PromotedProduct>();
  @Output() viewStats = new EventEmitter<PromotedProduct>();  // New output
  @Output() share = new EventEmitter<PromotedProduct>();
  @Output() edit = new EventEmitter<PromotedProduct>();
  @Output() deactivate = new EventEmitter<PromotedProduct>();
  @Output() copyLink = new EventEmitter<PromotedProduct>();

  sortColumn = signal<string>('earnings');
  sortDirection = signal<'asc' | 'desc'>('desc');
  selectedRows = signal<Set<string>>(new Set());

  get sortedProducts(): PromotedProduct[] {
    const products = [...this.products];
    const direction = this.sortDirection() === 'asc' ? 1 : -1;

    return products.sort((a, b) => {
      let aValue: any = a[this.sortColumn() as keyof PromotedProduct];
      let bValue: any = b[this.sortColumn() as keyof PromotedProduct];

      // Handle nested properties
      if (this.sortColumn() === 'productName') {
        aValue = a.productName;
        bValue = b.productName;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue) * direction;
      }

      return (aValue > bValue ? 1 : -1) * direction;
    });
  }

  get allSelected(): boolean {
    return this.selectedRows().size === this.products.length;
  }

  get someSelected(): boolean {
    return this.selectedRows().size > 0 && this.selectedRows().size < this.products.length;
  }

  sort(column: string): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('desc');
    }
  }

  getSortIcon(column: string): string {
    if (this.sortColumn() !== column) return 'unfold_more';
    return this.sortDirection() === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  toggleRow(productId: string, event: MouseEvent | any): void {
    event.stopPropagation();
    this.selectedRows.update(rows => {
      const newRows = new Set(rows);
      if (newRows.has(productId)) {
        newRows.delete(productId);
      } else {
        newRows.add(productId);
      }
      return newRows;
    });
  }

  toggleAll(event: MouseEvent): void {
    event.stopPropagation();
    if (this.allSelected) {
      this.selectedRows.set(new Set());
    } else {
      this.selectedRows.set(new Set(this.products.map(p => p.trackingId)));
    }
  }

  getPerformanceClass(performance: string): string {
    return performance;
  }

  onRowClick(product: PromotedProduct): void {
    this.viewDetails.emit(product);
  }

  Math = Math;
}