// promoted-products/components/promotion-stats-chart/promotion-stats-chart.component.ts
import { Component, Input, OnInit, OnDestroy, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ChartDataPoint {
  date: Date;
  views: number;
  clicks: number;
  conversions: number;
  ctr: number;
  earnings: number;
  [key: string]: any;
}

@Component({
  selector: 'promotion-stats-chart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './promotion-stats-chart.component.html',
  styleUrls: ['./promotion-stats-chart.component.scss']
})
export class PromotionStatsChartComponent implements OnInit, OnDestroy {
  @Input() productId?: string;
  @Input() productName?: string;
  @Input() height: number = 300;
  @Input() width: number = 600;

  // Chart data
  chartData = signal<ChartDataPoint[]>([]);
  timeRange = signal<'day' | 'week' | 'month'>('week');
  chartType = signal<'line' | 'bar'>('line');
  selectedMetrics = signal<Set<string>>(new Set(['views', 'clicks', 'conversions']));

  // Computed properties
  maxValue = signal<number>(0);
  svgWidth = signal<number>(0);
  svgHeight = signal<number>(0);
  padding = { top: 20, right: 30, bottom: 50, left: 60 };

  // Animation
  private animationFrame: number | null = null;
  private resizeObserver: ResizeObserver | null = null;

  // Available metrics
  metrics = [
    { id: 'views', label: 'Views', color: 'var(--info-color)' },
    { id: 'clicks', label: 'Clicks', color: 'var(--warning-color)' },
    { id: 'conversions', label: 'Conversions', color: 'var(--success-color)' },
    { id: 'ctr', label: 'CTR %', color: 'var(--primary-color)' },
    { id: 'earnings', label: 'Earnings', color: 'var(--secondary-color)' }
  ];

  ngOnInit(): void {
    this.generateMockData();
    this.setupResizeObserver();
  }

  ngOnDestroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private setupResizeObserver(): void {
    const container = document.querySelector('.chart-container');
    if (container) {
      this.resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          this.svgWidth.set(entry.contentRect.width - this.padding.left - this.padding.right);
          this.svgHeight.set(this.height - this.padding.top - this.padding.bottom);
        }
      });
      this.resizeObserver.observe(container);
    }
  }

  public generateMockData(): void {
    const data: ChartDataPoint[] = [];
    const now = new Date();
    const days = this.timeRange() === 'day' ? 24 : this.timeRange() === 'week' ? 7 : 30;

    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - (days - i - 1));

      data.push({
        date,
        views: Math.floor(Math.random() * 1000) + 500,
        clicks: Math.floor(Math.random() * 300) + 100,
        conversions: Math.floor(Math.random() * 50) + 10,
        ctr: Math.random() * 15 + 5,
        earnings: Math.floor(Math.random() * 500) + 100
      });
    }

    this.chartData.set(data);
    this.calculateMaxValue();
  }

  private calculateMaxValue(): void {
    const max = Math.max(
      ...this.chartData().flatMap(d => 
        Array.from(this.selectedMetrics()).map(metric => 
          metric === 'ctr' ? d.ctr : d[metric as keyof ChartDataPoint] as number
        )
      )
    );
    this.maxValue.set(max);
  }

  toggleMetric(metricId: string): void {
    this.selectedMetrics.update(metrics => {
      const newMetrics = new Set(metrics);
      if (newMetrics.has(metricId)) {
        newMetrics.delete(metricId);
      } else {
        newMetrics.add(metricId);
      }
      return newMetrics;
    });
    this.calculateMaxValue();
  }

  getXScale(): (index: number) => number {
    const width = this.svgWidth();
    const dataLength = this.chartData().length;
    return (index: number) => (index / (dataLength - 1)) * width;
  }

  getYScale(): (value: number) => number {
    const height = this.svgHeight();
    const max = this.maxValue();
    return (value: number) => height - (value / max) * height;
  }

  getLinePath(metric: string): string {
    const xScale = this.getXScale();
    const yScale = this.getYScale();
    const data = this.chartData();
    
    if (data.length === 0) return '';

    let path = '';
    data.forEach((point, i) => {
      const x = xScale(i) + this.padding.left;
      const y = yScale(point[metric as keyof ChartDataPoint] as number) + this.padding.top;
      
      if (i === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    });

    return path;
  }

  getBarPath(metric: string): string {
    const xScale = this.getXScale();
    const yScale = this.getYScale();
    const data = this.chartData();
    const barWidth = this.svgWidth() / data.length * 0.7;
    
    let path = '';
    data.forEach((point, i) => {
      const x = xScale(i) + this.padding.left - barWidth / 2;
      const y = yScale(point[metric as keyof ChartDataPoint] as number) + this.padding.top;
      const height = this.svgHeight() - y + this.padding.top;
      
      path += `M ${x} ${y} h ${barWidth} v ${height} h -${barWidth} Z`;
    });

    return path;
  }

  formatXAxis(index: number): string {
    const date = this.chartData()[index]?.date;
    if (!date) return '';

    if (this.timeRange() === 'day') {
      return date.getHours() + ':00';
    } else if (this.timeRange() === 'week') {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }

  formatTooltip(value: number, metric: string): string {
    if (metric === 'earnings') {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0
      }).format(value);
    }
    if (metric === 'ctr') {
      return value.toFixed(1) + '%';
    }
    return value.toLocaleString();
  }

  formatNumber(value: number | string): string {
    const num = Number(value);
    
    if (isNaN(num)) return '0';

    // For large analytics values
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }

    // Standard comma formatting for smaller numbers
    return new Intl.NumberFormat('en-US').format(num);
    }

    formatCurrency(value: number | string): string {
    const num = Number(value);
    if (isNaN(num)) return '₦0';

    // 1. Handle Million/Billion for Chart Cleanliness
    if (num >= 1000000) {
        return '₦' + (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    
    // 2. Handle Thousands
    if (num >= 1000) {
        return '₦' + (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }

    // 3. Standard Formatting for smaller numbers (with commas)
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        maximumFractionDigits: 0
    }).format(num);
    }


}

