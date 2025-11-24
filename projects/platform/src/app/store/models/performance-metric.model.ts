// models/performance-metric.model.ts
export interface PerformanceMetric {
  label: string;
  current: number;
  previous: number;
  trend: 'up' | 'down' | 'neutral';
  changePercent: number;
  target?: number;
  unit?: string;
  format?: 'number' | 'currency' | 'percentage';
  description?: string;
  icon?: string;
  color?: string;
  progress?: number;
  status?: 'excellent' | 'good' | 'fair' | 'poor';
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
}

export interface PerformanceMetricGroup {
  title: string;
  description: string;
  metrics: PerformanceMetric[];
  timeframe: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  lastUpdated: Date;
}

export interface MetricComparison {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'neutral';
  isPositive: boolean;
}

export interface PerformanceBenchmark {
  metric: string;
  yourValue: number;
  industryAverage: number;
  topPerformers: number;
  percentile: number;
}

// Utility functions for performance metrics
export class PerformanceMetricUtils {
  static calculateTrend(current: number, previous: number): 'up' | 'down' | 'neutral' {
    if (previous === 0) return current > 0 ? 'up' : 'neutral';
    const change = ((current - previous) / previous) * 100;
    return change > 5 ? 'up' : change < -5 ? 'down' : 'neutral';
  }

  static calculateChangePercent(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  static calculateProgress(current: number, target: number): number {
    if (target === 0) return 0;
    return Math.min(100, (current / target) * 100);
  }

  static getStatus(progress: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (progress >= 90) return 'excellent';
    if (progress >= 75) return 'good';
    if (progress >= 50) return 'fair';
    return 'poor';
  }

  static getColorByStatus(status: 'excellent' | 'good' | 'fair' | 'poor'): string {
    const colors = {
      excellent: '#4caf50',
      good: '#8bc34a',
      fair: '#ff9800',
      poor: '#f44336'
    };
    return colors[status];
  }

  static getIconByTrend(trend: 'up' | 'down' | 'neutral'): string {
    const icons = {
      up: 'trending_up',
      down: 'trending_down',
      neutral: 'remove'
    };
    return icons[trend];
  }

  static formatValue(value: number, format?: 'number' | 'currency' | 'percentage'): string {
    switch (format) {
      case 'currency':
        return `₦${value.toLocaleString()}`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      default:
        return value.toLocaleString();
    }
  }

  static generateComparison(current: number, previous: number): MetricComparison {
    const change = current - previous;
    const changePercent = this.calculateChangePercent(current, previous);
    const trend = this.calculateTrend(current, previous);
    const isPositive = trend === 'up';

    return {
      current,
      previous,
      change,
      changePercent,
      trend,
      isPositive
    };
  }

  static createMetric(
    label: string,
    current: number,
    previous: number,
    target?: number,
    unit?: string,
    format?: 'number' | 'currency' | 'percentage',
    description?: string,
    icon?: string
  ): PerformanceMetric {
    const trend = this.calculateTrend(current, previous);
    const changePercent = this.calculateChangePercent(current, previous);
    const progress = target ? this.calculateProgress(current, target) : undefined;
    const status = progress ? this.getStatus(progress) : undefined;
    const color = status ? this.getColorByStatus(status) : undefined;

    return {
      label,
      current,
      previous,
      trend,
      changePercent,
      target,
      unit,
      format,
      description,
      icon,
      color,
      progress,
      status
    };
  }
}

// Default performance metrics configuration
export const DEFAULT_PERFORMANCE_METRICS: PerformanceMetric[] = [
  {
    label: 'Sales Conversion Rate',
    current: 0,
    previous: 0,
    trend: 'neutral',
    changePercent: 0,
    target: 10,
    unit: '%',
    format: 'percentage',
    description: 'Percentage of visitors who make a purchase',
    icon: 'trending_up'
  },
  {
    label: 'Average Order Value',
    current: 0,
    previous: 0,
    trend: 'neutral',
    changePercent: 0,
    target: 5000,
    unit: '₦',
    format: 'currency',
    description: 'Average amount spent per order',
    icon: 'attach_money'
  },
  {
    label: 'Customer Acquisition Cost',
    current: 0,
    previous: 0,
    trend: 'neutral',
    changePercent: 0,
    target: 500,
    unit: '₦',
    format: 'currency',
    description: 'Cost to acquire a new customer',
    icon: 'person_add'
  },
  {
    label: 'Customer Lifetime Value',
    current: 0,
    previous: 0,
    trend: 'neutral',
    changePercent: 0,
    target: 25000,
    unit: '₦',
    format: 'currency',
    description: 'Total value of a customer over time',
    icon: 'loyalty'
  }
];

// Industry benchmarks for different metrics
export const INDUSTRY_BENCHMARKS: { [key: string]: PerformanceBenchmark } = {
  conversionRate: {
    metric: 'Conversion Rate',
    yourValue: 0,
    industryAverage: 3.2,
    topPerformers: 8.5,
    percentile: 0
  },
  averageOrderValue: {
    metric: 'Average Order Value',
    yourValue: 0,
    industryAverage: 4500,
    topPerformers: 12000,
    percentile: 0
  },
  customerAcquisitionCost: {
    metric: 'Customer Acquisition Cost',
    yourValue: 0,
    industryAverage: 750,
    topPerformers: 350,
    percentile: 0
  },
  customerLifetimeValue: {
    metric: 'Customer Lifetime Value',
    yourValue: 0,
    industryAverage: 18000,
    topPerformers: 45000,
    percentile: 0
  }
};