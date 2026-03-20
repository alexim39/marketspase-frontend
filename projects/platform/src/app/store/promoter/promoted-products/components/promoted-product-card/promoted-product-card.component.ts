import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PromotedProduct } from '../../promoted-products.component';

@Component({
  selector: 'promoted-product-card',
  standalone: true,
  imports: [CommonModule, MatTooltipModule],
  templateUrl: './promoted-product-card.component.html',
  styleUrls: ['./promoted-product-card.component.scss']
})
export class PromotedProductCardComponent {
  @Input({ required: true }) product!: PromotedProduct;
  @Input({ required: true }) formatCurrency!: (amount: number) => string;
  @Input({ required: true }) formatNumber!: (num: number) => string;

  @Output() viewDetails = new EventEmitter<PromotedProduct>();
  @Output() viewStats = new EventEmitter<PromotedProduct>();  // New output
  @Output() share = new EventEmitter<PromotedProduct>();
  @Output() edit = new EventEmitter<PromotedProduct>();
  @Output() deactivate = new EventEmitter<PromotedProduct>();
  @Output() copyLink = new EventEmitter<PromotedProduct>();

  isMenuOpen = false;

  getPerformanceColor(): string {
    const colors = {
      high: 'var(--success-color)',
      medium: 'var(--warning-color)',
      low: 'var(--error-color)'
    };
    return colors[this.product.performance];
  }

  getPerformanceText(): string {
    const texts = {
      high: 'High Performing',
      medium: 'Medium Performing',
      low: 'Low Performing'
    };
    return texts[this.product.performance];
  }

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  onAction(action: string, event: MouseEvent): void {
    event.stopPropagation();
    this.closeMenu();
    
    switch (action) {
      case 'view':
        this.viewDetails.emit(this.product);
        break;
      case 'share':
        this.share.emit(this.product);
        break;
      case 'edit':
        this.edit.emit(this.product);
        break;
      case 'deactivate':
        this.deactivate.emit(this.product);
        break;
      case 'copy':
        this.copyLink.emit(this.product);
        break;
    }
  }
}