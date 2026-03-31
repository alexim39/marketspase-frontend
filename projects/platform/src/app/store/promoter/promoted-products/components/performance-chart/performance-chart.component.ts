// components/performance-chart/performance-chart.component.ts
import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PromotionStatsChartComponent } from '../promotion-stats-chart/promotion-stats-chart.component';
import { ChartType, ChartTimeRange } from '../../promoted-products.component';

@Component({
  selector: 'app-performance-chart',
  standalone: true,
  imports: [CommonModule, MatMenuModule, MatTooltipModule,  PromotionStatsChartComponent],
  templateUrl: './performance-chart.component.html',
  styleUrls: ['./performance-chart.component.scss']
})
export class PerformanceChartComponent {
  selectedChartType = input<ChartType>('overview');
  chartTimeRange = input<ChartTimeRange>('week');
  chartMetrics = input<Set<string>>(new Set());
  chartData = input<any>([]);
  totalStats = input<any>({});
  formatNumber = input<(num: number) => string>();
  formatCurrency = input<(amount: number) => string>();

  chartTypeChange = output<ChartType>();
  timeRangeChange = output<ChartTimeRange>();
  metricToggle = output<string>();
  exportChart = output<'png' | 'svg' | 'csv'>();

  // Computed metrics for summary
  metrics = computed(() => this.totalStats());

  toggleMetric(metric: string): void {
    this.metricToggle.emit(metric);
  }

  setChartType(type: ChartType): void {
    this.chartTypeChange.emit(type);
  }

  setTimeRange(range: ChartTimeRange): void {
    this.timeRangeChange.emit(range);
  }

  exportData(format: 'png' | 'svg' | 'csv'): void {
    this.exportChart.emit(format);
  }
}