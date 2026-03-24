// models/promoted-product.models.ts
export interface DeviceTypeStats {
  mobile: number;
  desktop: number;
  tablet: number;
}

export interface ReferralSource {
  source: string;
  count: number;
  conversions: number;
  earnings: number;
}

export interface PromotionStats {
  trackingId: string;
  productId: string;
  productName: string;
  productPrice?: number;
  productImage?: string;
  uniqueCode: string;
  uniqueId?: string;
  views: number;
  clicks: number;
  conversions: number;
  earnings: number;
  clickThroughRate: number;
  conversionRate: number;
  deviceTypes: DeviceTypeStats;
  referralSources: ReferralSource[];
  createdAt: Date | string;
  lastActivityAt: Date | string;
}

export type PerformanceRating = 'high' | 'medium' | 'low';

export interface PromotedProduct extends PromotionStats {
  shareLink: string;
  performance: PerformanceRating;
  isActive: boolean;
  commissionRate: number;
}

export type ViewMode = 'grid' | 'table';
export type DateRange = 'today' | 'week' | 'month' | 'all';
export type ChartTimeRange = 'day' | 'week' | 'month';
export type ChartType = 'overview' | 'trends';
export type ChartMetric = 'views' | 'clicks' | 'conversions' | 'earnings' | 'ctr';
export type ExportFormat = 'png' | 'svg' | 'csv';

export interface TotalStats {
  totalEarnings: number;
  totalClicks: number;
  totalConversions: number;
  totalViews: number;
  activeProducts: number;
  avgConversionRate: number;
  avgClickThroughRate: number;
}

export interface PerformanceBreakdown {
  high: number;
  medium: number;
  low: number;
}

export interface OverviewChartDataPoint {
  date: Date;
  views: number;
  clicks: number;
  conversions: number;
  earnings: number;
  ctr: number;
}

export interface ProductTrendData {
  period: number;
  views: number;
  clicks: number;
  conversions: number;
  earnings: number;
}

export interface TrendsChartData {
  productId: string;
  productName: string;
  data: ProductTrendData[];
}