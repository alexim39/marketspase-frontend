import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { DatePipe, CurrencyPipe, PercentPipe } from '@angular/common';
import { Product } from '../../shared/product.model';
import { Store } from '../../shared/store.model';

interface ProductDetailDialogData {
  product: Product;
  store?: Store;
}

@Component({
  selector: 'app-product-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatTabsModule,
    MatExpansionModule,
    MatProgressBarModule,
    MatBadgeModule,
    DatePipe,
    CurrencyPipe,
  ],
  templateUrl: './product-detail-dialog.component.html',
  styleUrls: ['./product-detail-dialog.component.scss']
})
export class ProductDetailDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ProductDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProductDetailDialogData
  ) {}

  getStockColor(): string {
    const product = this.data.product;
    if (!product.manageStock) return 'not-tracking';
    
    const quantity = product.quantity || 0;
    const lowStockAlert = product.lowStockAlert || 5;
    
    if (quantity === 0) return 'out-of-stock';
    if (quantity <= lowStockAlert) return 'low-stock';
    return 'in-stock';
  }

  getStockText(): string {
    const product = this.data.product;
    if (!product.manageStock) return 'No Stock Tracking';
    
    const quantity = product.quantity || 0;
    const lowStockAlert = product.lowStockAlert || 5;
    
    if (quantity === 0) return 'Out of Stock';
    if (quantity <= lowStockAlert) return 'Low Stock';
    return `${quantity} in stock`;
  }

  getStockPercentage(): number {
    const product = this.data.product;
    if (!product.manageStock || product.quantity === undefined) return 0;
    const max = Math.max(product.quantity, product.lowStockAlert || 10);
    return (product.quantity / max) * 100;
  }

  getVariantAttributes(variant: any): Array<{name: string, value: string}> {
    if (!variant.attributes) return [];
    return Object.entries(variant.attributes).map(([key, value]) => ({
      name: key,
      value: value as string
    }));
  }

  getConversionRate(): number {
    const product = this.data.product;
    if (!product.viewCount || product.viewCount === 0) return 0;
    return ((product.purchaseCount || 0) / product.viewCount * 100);
  }

  getInventoryTurnover(): number {
    const product = this.data.product;
    if (!product.purchaseCount || product.purchaseCount === 0) return 0;
    
    // Simplified calculation: purchases per month
    const daysSinceCreation = Math.max(1, Math.floor((new Date().getTime() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
    const monthsSinceCreation = daysSinceCreation / 30;
    
    return (product.purchaseCount || 0) / monthsSinceCreation;
  }

  getStockCoverage(): number {
    const product = this.data.product;
    if (!product.purchaseCount || product.purchaseCount === 0 || !product.quantity) return 0;
    
    // Calculate days of stock coverage based on average daily sales
    const daysSinceCreation = Math.max(1, Math.floor((new Date().getTime() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
    const averageDailySales = (product.purchaseCount || 0) / daysSinceCreation;
    
    if (averageDailySales === 0) return Infinity;
    return Math.floor(product.quantity / averageDailySales);
  }

  onEdit(): void {
    this.dialogRef.close('edit');
  }

  onClose(): void {
    this.dialogRef.close();
  }
}