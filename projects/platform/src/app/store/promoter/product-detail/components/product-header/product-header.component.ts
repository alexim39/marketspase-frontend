import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { CurrencyUtilsPipe, TruncatePipe } from '@shared/services';

@Component({
  selector: 'app-product-header',
  standalone: true,
  imports: [CommonModule, MatIconModule, CurrencyUtilsPipe, TruncatePipe],
  templateUrl: './product-header.component.html',
  styleUrls: ['./product-header.component.scss']
})
export class ProductHeaderComponent {
  @Input() product: any;
  @Input() user: any;

  calculateDiscount(price: number, originalPrice: number): number {
    if (!originalPrice || originalPrice <= price) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  }
}