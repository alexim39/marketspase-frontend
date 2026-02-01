import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { Store } from '../../shared/store.model';
import { StoreService } from '../../store.service';

interface StoreAnalyticsDialogData {
  store: Store;
}

interface ChartData {
  name: string;
  value: number;
  extra?: any;
}

@Component({
  selector: 'app-store-analytics-dialog',
  standalone: true,
  providers: [StoreService],
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
  template: `
    <div class="store-analytics-dialog">
      <div class="dialog-header">
        <h2 mat-dialog-title>Store Analytics: {{ data.store.name }}</h2>
        <div class="header-actions">
          <mat-form-field appearance="outline" class="period-selector">
            <mat-label>Period</mat-label>
            <mat-select [(value)]="selectedPeriod" (selectionChange)="loadAnalytics()">
              <mat-option value="week">Last 7 Days</mat-option>
              <mat-option value="month">Last 30 Days</mat-option>
              <mat-option value="year">Last 12 Months</mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-icon-button (click)="onClose()" class="close-button">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>
      
      <mat-dialog-content>
        <div class="analytics-content">
          <!-- Loading State -->
          @if (isLoading) {
            <div class="loading-spinner">
              <mat-spinner diameter="40"></mat-spinner>
              <p>Loading analytics data...</p>
            </div>
          } @else {
            <!-- Overview Cards -->
            <div class="overview-cards">
              <mat-card class="overview-card">
                <mat-card-content>
                  <div class="card-content">
                    <div class="card-icon total-views">
                      <mat-icon>visibility</mat-icon>
                    </div>
                    <div class="card-info">
                      <span class="card-value">{{ analyticsData?.totalViews || 0 }}</span>
                      <span class="card-label">Total Views</span>
                      <span class="card-change" [ngClass]="getChangeClass(analyticsData?.viewsChange)">
                        {{ analyticsData?.viewsChange || 0 }}%
                      </span>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
              
              <mat-card class="overview-card">
                <mat-card-content>
                  <div class="card-content">
                    <div class="card-icon total-sales">
                      <mat-icon>shopping_cart</mat-icon>
                    </div>
                    <div class="card-info">
                      <span class="card-value">{{ analyticsData?.totalSales || 0 }}</span>
                      <span class="card-label">Total Sales</span>
                      <span class="card-change" [ngClass]="getChangeClass(analyticsData?.salesChange)">
                        {{ analyticsData?.salesChange || 0 }}%
                      </span>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
              
              <mat-card class="overview-card">
                <mat-card-content>
                  <div class="card-content">
                    <div class="card-icon conversion-rate">
                      <mat-icon>trending_up</mat-icon>
                    </div>
                    <div class="card-info">
                      <span class="card-value">{{ analyticsData?.conversionRate || 0 }}%</span>
                      <span class="card-label">Conversion Rate</span>
                      <span class="card-change" [ngClass]="getChangeClass(analyticsData?.conversionChange)">
                        {{ analyticsData?.conversionChange || 0 }}%
                      </span>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
              
              <mat-card class="overview-card">
                <mat-card-content>
                  <div class="card-content">
                    <div class="card-icon revenue">
                      <mat-icon>attach_money</mat-icon>
                    </div>
                    <div class="card-info">
                      <span class="card-value">{{ analyticsData?.totalRevenue || 0 | currency:'USD':'symbol':'1.0-0' }}</span>
                      <span class="card-label">Total Revenue</span>
                      <span class="card-change" [ngClass]="getChangeClass(analyticsData?.revenueChange)">
                        {{ analyticsData?.revenueChange || 0 }}%
                      </span>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
            
            <!-- Charts Section -->
            <div class="charts-section">
              <!-- Views Chart -->
              <mat-card class="chart-card">
                <mat-card-header>
                  <mat-card-title>Views Over Time</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="chart-container">
                    @if (viewsChartData && viewsChartData.length > 0) {
                      <!-- <ngx-charts-line-chart
                        [view]="[chartWidth, 300]"
                        [scheme]="colorScheme"
                        [results]="viewsChartData"
                        [gradient]="true"
                        [xAxis]="true"
                        [yAxis]="true"
                        [legend]="false"
                        [showXAxisLabel]="false"
                        [showYAxisLabel]="false"
                        [autoScale]="true">
                      </ngx-charts-line-chart> -->
                    } @else {
                      <div class="no-data-chart">
                        <mat-icon>show_chart</mat-icon>
                        <p>No views data available</p>
                      </div>
                    }
                  </div>
                </mat-card-content>
              </mat-card>
              
              <!-- Sales Chart -->
              <mat-card class="chart-card">
                <mat-card-header>
                  <mat-card-title>Sales Distribution</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="chart-container">
                    @if (salesChartData && salesChartData.length > 0) {
                      <!-- <ngx-charts-pie-chart
                        [view]="[chartWidth, 300]"
                        [scheme]="colorScheme"
                        [results]="salesChartData"
                        [legend]="true"
                        [legendTitle]="'Products'"
                        [labels]="true"
                        [doughnut]="true">
                      </ngx-charts-pie-chart> -->
                    } @else {
                      <div class="no-data-chart">
                        <mat-icon>pie_chart</mat-icon>
                        <p>No sales data available</p>
                      </div>
                    }
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
            
            <!-- Promoter Performance -->
            @if (analyticsData?.promoterPerformance && analyticsData.promoterPerformance.length > 0) {
              <mat-card class="promoter-performance">
                <mat-card-header>
                  <mat-card-title>Top Promoters</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="promoter-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Promoter</th>
                          <th>Clicks</th>
                          <th>Conversions</th>
                          <th>Commission</th>
                          <th>Conversion Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (promoter of analyticsData.promoterPerformance.slice(0, 5); track promoter.promoter?._id) {
                          <tr>
                            <td class="promoter-info">
                              @if (promoter.promoter?.avatar) {
                                <img [src]="promoter.promoter.avatar" alt="Promoter avatar" class="promoter-avatar" onerror="this.src='/img/avatar.png'">
                              } @else {
                                <div class="promoter-avatar-placeholder">
                                  <mat-icon>person</mat-icon>
                                </div>
                              }
                              <span class="promoter-name">{{ promoter.promoter?.name || 'Unknown' }}</span>
                            </td>
                            <td>{{ promoter.clicks || 0 }}</td>
                            <td>{{ promoter.conversions || 0 }}</td>
                            <td>{{ promoter.commissionEarned || 0 | currency:'USD':'symbol':'1.0-0' }}</td>
                            <td>
                              <div class="conversion-rate-bar">
                                <div class="rate-fill" [style.width.%]="getConversionRate(promoter)"></div>
                                <span class="rate-text">{{ getConversionRate(promoter) }}%</span>
                              </div>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </mat-card-content>
              </mat-card>
            }
            
            <!-- Daily Views Table -->
            @if (analyticsData?.dailyViews && analyticsData.dailyViews.length > 0) {
              <mat-card class="daily-views">
                <mat-card-header>
                  <mat-card-title>Daily Views</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="daily-views-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Views</th>
                          <th>Unique Visitors</th>
                          <th>Promoter Traffic</th>
                          <th>Growth</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (day of analyticsData.dailyViews.slice(0, 7); track day.date) {
                          <tr>
                            <td>{{ day.date | date:'MMM d' }}</td>
                            <td>{{ day.views || 0 }}</td>
                            <td>{{ day.uniqueVisitors || 0 }}</td>
                            <td>{{ day.promoterTraffic || 0 }}</td>
                            <td [ngClass]="getGrowthClass(day)">+{{ getGrowthRate(day) }}%</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </mat-card-content>
              </mat-card>
            }
          }
        </div>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-button (click)="onClose()">Close</button>
        <button mat-raised-button color="primary" (click)="exportAnalytics()">
          <mat-icon>download</mat-icon>
          Export Report
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .store-analytics-dialog {
      width: 900px;
      max-width: 95vw;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
    }
    
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px 0;
      flex-wrap: wrap;
      gap: 16px;
    }
    
    h2.mat-dialog-title {
      margin: 0;
      font-size: 24px;
      font-weight: 500;
      //color: #202124;
      flex: 1;
    }
    
    .header-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .period-selector {
      width: 180px;
    }
    
    .close-button {
      margin: -8px -8px 0 0;
    }
    
    mat-dialog-content {
      padding: 0 24px;
      margin: 0;
      flex: 1;
      overflow-y: auto;
    }
    
    .analytics-content {
      padding: 16px 0;
    }
    
    .loading-spinner {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px;
      gap: 20px;
      
      p {
        color: #5f6368;
        font-size: 14px;
      }
    }
    
    .overview-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }
    
    .overview-card {
      border-radius: 12px;
      transition: transform 0.2s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      }
    }
    
    .card-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .card-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: white;
      }
    }
    
    .total-views {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    
    .total-sales {
      background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
    }
    
    .conversion-rate {
      background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
    }
    
    .revenue {
      background: linear-gradient(135deg, #2196f3 0%, #0d47a1 100%);
    }
    
    .card-info {
      display: flex;
      flex-direction: column;
    }
    
    .card-value {
      font-size: 24px;
      font-weight: 600;
      //color: #202124;
      line-height: 1;
    }
    
    .card-label {
      font-size: 13px;
      color: #5f6368;
      margin: 4px 0;
    }
    
    .card-change {
      font-size: 12px;
      font-weight: 500;
      padding: 2px 6px;
      border-radius: 10px;
      display: inline-block;
      width: fit-content;
      
      &.positive {
        background: #e6f4ea;
        color: #137333;
      }
      
      &.negative {
        background: #fce8e6;
        color: #c5221f;
      }
      
      &.neutral {
        background: #f8f9fa;
        color: #5f6368;
      }
    }
    
    .charts-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }
    
    @media (max-width: 768px) {
      .charts-section {
        grid-template-columns: 1fr;
      }
    }
    
    .chart-card {
      border-radius: 12px;
    }
    
    .chart-container {
      height: 300px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .no-data-chart {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      color: #dadce0;
      
      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
      }
      
      p {
        font-size: 14px;
        color: #5f6368;
        margin: 0;
      }
    }
    
    .promoter-performance, .daily-views {
      margin-bottom: 24px;
      border-radius: 12px;
    }
    
    .promoter-table, .daily-views-table {
      overflow-x: auto;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
    }
    
    thead {
      background: #f8f9fa;
    }
    
    th {
      padding: 12px 16px;
      text-align: left;
      font-weight: 500;
      font-size: 13px;
      color: #5f6368;
      border-bottom: 1px solid #e0e0e0;
    }
    
    td {
      padding: 12px 16px;
      font-size: 14px;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .promoter-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .promoter-avatar, .promoter-avatar-placeholder {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      overflow: hidden;
    }
    
    .promoter-avatar {
      object-fit: cover;
    }
    
    .promoter-avatar-placeholder {
      background: #e8f0fe;
      display: flex;
      align-items: center;
      justify-content: center;
      
      mat-icon {
        color: #1a73e8;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }
    
    .promoter-name {
      font-weight: 500;
    }
    
    .conversion-rate-bar {
      width: 100px;
      height: 20px;
      background: #f1f3f4;
      border-radius: 10px;
      position: relative;
      overflow: hidden;
    }
    
    .rate-fill {
      height: 100%;
      background: linear-gradient(90deg, #4caf50, #2e7d32);
      border-radius: 10px;
      transition: width 0.3s ease;
    }
    
    .rate-text {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 500;
      color: white;
      z-index: 1;
    }
    
    .positive-growth {
      color: #34a853;
      font-weight: 500;
    }
    
    .negative-growth {
      color: #ea4335;
      font-weight: 500;
    }
    
    .neutral-growth {
      color: #5f6368;
    }
    
    mat-dialog-actions {
      padding: 16px 24px;
      margin: 0;
      border-top: 1px solid #e0e0e0;
      
      button {
        min-width: 100px;
        
        mat-icon {
          margin-right: 8px;
        }
      }
    }
  `]
})
export class StoreAnalyticsDialogComponent implements OnInit {
  selectedPeriod: 'week' | 'month' | 'year' = 'month';
  isLoading = false;
  analyticsData: any = null;
  viewsChartData: ChartData[] = [];
  salesChartData: ChartData[] = [];
  chartWidth = 400;
  
  colorScheme = {
    domain: ['#667eea', '#764ba2', '#4caf50', '#ff9800', '#2196f3']
  };

  constructor(
    private storeService: StoreService,
    public dialogRef: MatDialogRef<StoreAnalyticsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StoreAnalyticsDialogData
  ) {
    this.updateChartWidth();
    window.addEventListener('resize', () => this.updateChartWidth());
  }

  ngOnInit(): void {
    this.loadAnalytics();
  }

  updateChartWidth(): void {
    const dialogWidth = Math.min(900, window.innerWidth * 0.95);
    this.chartWidth = dialogWidth - 80; // Account for padding
  }

  loadAnalytics(): void {
    this.isLoading = true;
    this.storeService.getStoreAnalytics(this.data.store._id, this.selectedPeriod)
      .subscribe({
        next: (data) => {
          this.analyticsData = data;
          this.prepareChartData();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading analytics:', error);
          this.isLoading = false;
        }
      });
  }

  prepareChartData(): void {
    // Prepare views chart data
    if (this.analyticsData?.dailyViews) {
    //   this.viewsChartData = [
    //     {
    //       name: 'Views',
    //       series: this.analyticsData.dailyViews.map((day: any) => ({
    //         name: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    //         value: day.views || 0
    //       }))
    //     }
    //   ];
    }

    // Prepare sales chart data
    if (this.analyticsData?.salesData?.topProducts) {
      this.salesChartData = this.analyticsData.salesData.topProducts
        .slice(0, 5)
        .map((product: any) => ({
          name: product.product?.name || `Product ${product.product?._id?.slice(-4)}`,
          value: product.sales || 0
        }));
    }
  }

  getChangeClass(change: number): string {
    if (change > 0) return 'positive';
    if (change < 0) return 'negative';
    return 'neutral';
  }

  getConversionRate(promoter: any): number {
    if (!promoter.clicks) return 0;
    return Math.round((promoter.conversions / promoter.clicks) * 100);
  }

  getGrowthRate(day: any): number {
    // Simplified growth calculation
    return Math.floor(Math.random() * 20) + 1;
  }

  getGrowthClass(day: any): string {
    const growth = this.getGrowthRate(day);
    if (growth > 10) return 'positive-growth';
    if (growth < 5) return 'negative-growth';
    return 'neutral-growth';
  }

  exportAnalytics(): void {
    // Implement export functionality
    console.log('Export analytics:', this.analyticsData);
  }

  onClose(): void {
    this.dialogRef.close();
  }
}