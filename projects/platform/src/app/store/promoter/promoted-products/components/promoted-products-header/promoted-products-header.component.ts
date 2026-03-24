// components/promoted-products-header/promoted-products-header.component.ts
import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-promoted-products-header',
  standalone: true,
  imports: [CommonModule, MatTooltipModule],
  templateUrl: './promoted-products-header.component.html',
  styleUrls: ['./promoted-products-header.component.scss']
})
export class PromotedProductsHeaderComponent {
  refreshing = input<boolean>(false);
  refresh = output<void>();
}