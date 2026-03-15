// components/products-header/products-header.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-products-header',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './products-header.component.html',
  styleUrls: ['./products-header.component.scss']
})
export class ProductsHeaderComponent {
  @Input({ required: true }) stats!: {
    total: number;
    avgCommission: number;
    stores: number;
    highCommission: number;
  };
}