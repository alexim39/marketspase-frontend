// components/real-time-stats/real-time-stats.component.ts
import { Component, input, computed, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { interval, Subject, takeUntil } from 'rxjs';
import { Store,  } from '../../models/store.model';
import { PerformanceMetric } from '../../models';

interface RealTimeStat {
  icon: string;
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  format: 'number' | 'currency' | 'percentage';
  color: string;
  description: string;
}

@Component({
  selector: 'app-real-time-stats',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule
  ],
  templateUrl: './real-time-stats.component.html',
  styleUrls: ['./real-time-stats.component.scss']
})
export class RealTimeStatsComponent implements OnInit, OnDestroy {
  // Inputs
  store = input<Store | null>(null);
  metrics = input<PerformanceMetric[]>([]);

  // Private
  private destroy$ = new Subject<void>();
  private updateInterval = 5000; // 5 seconds

  // Real-time data simulation
  private simulatedData = {
    activeVisitors: 0,
    salesToday: 0,
    conversionRate: 0,
    revenue: 0
  };

  // Computed real-time stats
  realTimeStats = computed((): RealTimeStat[] => {
    const store = this.store();
    const baseMetrics = this.metrics();
    
    if (!store) return [];

    return [
      {
        icon: 'visibility',
        label: 'Live Visitors',
        value: this.simulatedData.activeVisitors,
        change: 12,
        trend: 'up',
        format: 'number',
        color: '#667eea',
        description: 'Users currently browsing your store'
      },
      {
        icon: 'shopping_cart',
        label: 'Sales Today',
        value: this.simulatedData.salesToday,
        change: 8,
        trend: 'up',
        format: 'number',
        color: '#4caf50',
        description: 'Completed purchases in the last 24 hours'
      },
      {
        icon: 'trending_up',
        label: 'Live Conversion',
        value: this.simulatedData.conversionRate,
        change: 2.5,
        trend: 'up',
        format: 'percentage',
        color: '#ff9800',
        description: 'Real-time conversion rate'
      },
      {
        icon: 'attach_money',
        label: 'Revenue Stream',
        value: this.simulatedData.revenue,
        change: 15,
        trend: 'up',
        format: 'currency',
        color: '#9c27b0',
        description: 'Revenue generated in current session'
      }
    ];
  });

  ngOnInit(): void {
    this.initializeSimulatedData();
    this.startRealTimeUpdates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeSimulatedData(): void {
    const store = this.store();
    if (store) {
      this.simulatedData = {
        activeVisitors: Math.floor(Math.random() * 50) + 10,
        salesToday: Math.floor(store.analytics.totalSales * 0.1),
        conversionRate: store.analytics.conversionRate + (Math.random() * 2 - 1),
        revenue: Math.floor(store.analytics.salesData.totalRevenue * 0.05)
      };
    }
  }

  private startRealTimeUpdates(): void {
    interval(this.updateInterval)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateSimulatedData();
      });
  }

  private updateSimulatedData(): void {
    // Simulate real-time fluctuations
    this.simulatedData.activeVisitors = Math.max(0, 
      this.simulatedData.activeVisitors + Math.floor(Math.random() * 6) - 2
    );
    
    this.simulatedData.salesToday += Math.floor(Math.random() * 3);
    
    this.simulatedData.conversionRate = Math.max(0, 
      Math.min(100, this.simulatedData.conversionRate + (Math.random() * 0.4 - 0.2))
    );
    
    this.simulatedData.revenue += Math.floor(Math.random() * 500);
  }

  formatValue(stat: RealTimeStat): string {
    switch (stat.format) {
      case 'currency':
        return `₦${stat.value.toLocaleString()}`;
      case 'percentage':
        return `${stat.value.toFixed(1)}%`;
      default:
        return stat.value.toLocaleString();
    }
  }

  getTrendIcon(trend: 'up' | 'down' | 'neutral'): string {
    return trend === 'up' ? 'arrow_upward' : 
           trend === 'down' ? 'arrow_downward' : 'remove';
  }

  getTrendColor(trend: 'up' | 'down' | 'neutral'): string {
    return trend === 'up' ? '#4caf50' : 
           trend === 'down' ? '#f44336' : '#ff9800';
  }

  trackByStatLabel(index: number, stat: RealTimeStat): string {
    return stat.label;
  }


  // Add to real-time-stats.component.ts
    getMaxValue(stat: RealTimeStat): number {
        const maxValues: { [key: string]: number } = {
            'Live Visitors': 100,
            'Sales Today': 50,
            'Live Conversion': 100,
            'Revenue Stream': 10000
        };
        return maxValues[stat.label] || 100;
    }

    isDotActive(dotIndex: number, value: number): boolean {
        const maxValue = this.getMaxValue(this.realTimeStats().find(s => s.value === value)!);
        const threshold = (dotIndex / 5) * maxValue;
        return value >= threshold;
    }


    getWidthPercentage(stat: any): number {  // Replace `any` with your actual stat type for better type safety
        return Math.min(100, (stat.value / this.getMaxValue(stat)) * 100);
    }
}