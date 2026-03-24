// services/chart-data.service.ts
import { Injectable } from '@angular/core';
import { PromotedProduct, ChartTimeRange, OverviewChartDataPoint, TrendsChartData } from '../promoted-products.component';

@Injectable()
export class ChartDataService {
  
  generateOverviewChartData(products: PromotedProduct[], timeRange: ChartTimeRange): OverviewChartDataPoint[] {
    const now = new Date();
    const dataPoints = this.getDataPoints(timeRange);
    const data: OverviewChartDataPoint[] = [];

    for (let i = 0; i < dataPoints; i++) {
      const date = this.getDateForPeriod(now, timeRange, dataPoints, i);
      
      const periodData = products.reduce((acc, product) => {
        acc.views += Math.floor(product.views / dataPoints);
        acc.clicks += Math.floor(product.clicks / dataPoints);
        acc.conversions += Math.floor(product.conversions / dataPoints);
        acc.earnings += product.earnings / dataPoints;
        return acc;
      }, { views: 0, clicks: 0, conversions: 0, earnings: 0 });

      data.push({
        date,
        ...periodData,
        ctr: periodData.clicks > 0 ? (periodData.conversions / periodData.clicks) * 100 : 0
      });
    }

    return data;
  }

  generateTrendsChartData(products: PromotedProduct[], timeRange: ChartTimeRange): TrendsChartData[] {
    return products.slice(0, 5).map(product => ({
      productId: product.productId,
      productName: product.productName,
      data: this.generateProductTrendData(product, timeRange)
    }));
  }

  private generateProductTrendData(product: PromotedProduct, timeRange: ChartTimeRange): any[] {
    const dataPoints = this.getDataPoints(timeRange);
    const data = [];

    for (let i = 0; i < dataPoints; i++) {
      data.push({
        period: i,
        views: Math.floor(product.views / dataPoints),
        clicks: Math.floor(product.clicks / dataPoints),
        conversions: Math.floor(product.conversions / dataPoints),
        earnings: product.earnings / dataPoints
      });
    }

    return data;
  }

  private getDataPoints(timeRange: ChartTimeRange): number {
    switch (timeRange) {
      case 'day': return 24;
      case 'week': return 7;
      case 'month': return 30;
      default: return 7;
    }
  }

  private getDateForPeriod(now: Date, timeRange: ChartTimeRange, dataPoints: number, index: number): Date {
    const date = new Date(now);
    if (timeRange === 'day') {
      date.setHours(date.getHours() - (dataPoints - index - 1));
    } else {
      date.setDate(date.getDate() - (dataPoints - index - 1));
    }
    return date;
  }

  convertToCSV(data: OverviewChartDataPoint[]): string {
    const headers = ['Date', 'Views', 'Clicks', 'Conversions', 'Earnings', 'CTR %'];
    const rows = data.map(item => [
      item.date.toLocaleDateString(),
      item.views,
      item.clicks,
      item.conversions,
      item.earnings.toFixed(2),
      item.ctr.toFixed(2)
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }
}