// components/real-time-stats/real-time-stats.component.ts - FIXED VERSION
import { Component, input, computed, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { interval, Subject, takeUntil } from 'rxjs';
import { Store } from '../../../models/store.model';
import { StoreService } from '../../../services/store.service';
import { PerformanceMetric } from '../../../models';

interface RealTimeStat {
  icon: string;
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  format: 'number' | 'currency' | 'percentage';
  color: string;
  description: string;
  maxValue?: number;
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
  private storeService = inject(StoreService);
  private destroy$ = new Subject<void>();

  // Inputs
  store = input<Store | null>(null);
  metrics = input<PerformanceMetric[]>([]);

  // Private
  private updateInterval = 5000; // 5 seconds

  // Real-time data simulation
  private simulatedData = {
    activeVisitors: 0,
    salesToday: 0,
    conversionRate: 0,
    revenue: 0
  };

  // Max values for visualization
  private maxValues: { [key: string]: number } = {
    'Live Visitors': 100,
    'Sales Today': 50,
    'Live Conversion': 100,
    'Revenue Stream': 10000
  };

  // Computed real-time stats - FIXED VERSION
  realTimeStats = computed((): RealTimeStat[] => {
    const store = this.store();
    
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
        description: 'Users currently browsing your store',
        maxValue: this.maxValues['Live Visitors']
      },
      {
        icon: 'shopping_cart',
        label: 'Sales Today',
        value: this.simulatedData.salesToday,
        change: 8,
        trend: 'up',
        format: 'number',
        color: '#4caf50',
        description: 'Completed purchases in the last 24 hours',
        maxValue: this.maxValues['Sales Today']
      },
      {
        icon: 'trending_up',
        label: 'Live Conversion',
        value: this.simulatedData.conversionRate,
        change: 2.5,
        trend: 'up',
        format: 'percentage',
        color: '#ff9800',
        description: 'Real-time conversion rate',
        maxValue: this.maxValues['Live Conversion']
      },
      {
        icon: 'attach_money',
        label: 'Revenue Stream',
        value: this.simulatedData.revenue,
        change: 15,
        trend: 'up',
        format: 'currency',
        color: '#9c27b0',
        description: 'Revenue generated in current session',
        maxValue: this.maxValues['Revenue Stream']
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
        conversionRate: Math.min(100, Math.max(0, 
          store.analytics.conversionRate + (Math.random() * 2 - 1)
        )),
        revenue: Math.floor((store.analytics.salesData?.totalRevenue || 0) * 0.05)
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
    // Simulate real-time fluctuations with realistic patterns
    this.simulatedData.activeVisitors = Math.max(0, 
      Math.min(this.maxValues['Live Visitors'],
        this.simulatedData.activeVisitors + Math.floor(Math.random() * 6) - 2
      )
    );
    
    this.simulatedData.salesToday += Math.floor(Math.random() * 3);
    this.simulatedData.salesToday = Math.min(
      this.maxValues['Sales Today'], 
      this.simulatedData.salesToday
    );
    
    this.simulatedData.conversionRate = Math.max(0, 
      Math.min(100, this.simulatedData.conversionRate + (Math.random() * 0.4 - 0.2))
    );
    
    this.simulatedData.revenue += Math.floor(Math.random() * 500);
    this.simulatedData.revenue = Math.min(
      this.maxValues['Revenue Stream'], 
      this.simulatedData.revenue
    );
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

  // FIXED: Proper implementation for width percentage
  getWidthPercentage(stat: RealTimeStat): number {
    if (!stat.maxValue || stat.maxValue <= 0) return 0;
    return Math.min(100, (stat.value / stat.maxValue) * 100);
  }

  // FIXED: Proper implementation for dot activation
  isDotActive(dotIndex: number, stat: any): boolean {
  // isDotActive(dotIndex: number, stat: RealTimeStat): boolean {
    if (!stat.maxValue || stat.maxValue <= 0) return false;
    
    // Create 5 thresholds (20% each)
    const threshold = (dotIndex / 5) * stat.maxValue;
    return stat.value >= threshold;
  }
}