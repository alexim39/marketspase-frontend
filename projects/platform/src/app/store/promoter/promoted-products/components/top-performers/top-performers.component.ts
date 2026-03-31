// components/top-performers/top-performers.component.ts
import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PromotedProduct } from '../../promoted-products.component';

@Component({
  selector: 'app-top-performers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './top-performers.component.html',
  styleUrls: ['./top-performers.component.scss']
})
export class TopPerformersComponent {
  topPerformers = input<PromotedProduct[]>([]);
  formatCurrency = input<(amount: number) => string>();
  
  viewDetails = output<PromotedProduct>();
  viewStats = output<PromotedProduct>();
}