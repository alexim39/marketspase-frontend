// components/chart-modal/chart-modal.component.ts
import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PromotionStatsChartComponent } from '../promotion-stats-chart/promotion-stats-chart.component';
import { PromotedProduct } from '../../promoted-products.component';

@Component({
  selector: 'app-chart-modal',
  standalone: true,
  imports: [CommonModule, PromotionStatsChartComponent],
  templateUrl: './chart-modal.component.html',
  styleUrls: ['./chart-modal.component.scss']
})
export class ChartModalComponent {
  showChart = input<boolean>(false);
  selectedProduct = input<PromotedProduct | null>(null);
  close = output<void>();
}