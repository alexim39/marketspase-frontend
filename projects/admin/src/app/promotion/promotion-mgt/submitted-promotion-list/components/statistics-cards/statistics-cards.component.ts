import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface StatCard {
  label: string;
  value: number | string;
  icon: string;
  iconClass: string;
  tooltip?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

@Component({
  selector: 'app-statistics-cards',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="stats-overview">
      @for (stat of stats; track stat.label) {
        <mat-card class="stat-card" [matTooltip]="stat.tooltip || ''">
          <mat-card-content>
            <div class="stat-content">
              <div class="stat-icon-container">
                <mat-icon 
                  [class]="stat.iconClass"
                  [class.stat-icon]="true">
                  {{ stat.icon }}
                </mat-icon>
                @if (stat.trend) {
                  <div class="trend-indicator" [class.positive]="stat.trend.isPositive">
                    <mat-icon>{{ stat.trend.isPositive ? 'trending_up' : 'trending_down' }}</mat-icon>
                    <span>{{ stat.trend.value }}%</span>
                  </div>
                }
              </div>
              <div class="stat-details">
                <span class="stat-value">{{ stat.value | number }}</span>
                <span class="stat-label">{{ stat.label }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .stats-overview {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      height: 100%;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
    }

    .stat-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-icon-container {
      position: relative;
    }

    .stat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #3f51b5;
      
      &.pending { color: #ff9800; }
      &.submitted { color: #2196f3; }
      &.validated { color: #4caf50; }
      &.paid { color: #9c27b0; }
      &.rejected { color: #f44336; }
      &.total { color: #607d8b; }
    }

    .trend-indicator {
      position: absolute;
      top: -4px;
      right: -4px;
      background: white;
      border-radius: 10px;
      padding: 1px 4px;
      font-size: 10px;
      display: flex;
      align-items: center;
      gap: 1px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      
      &.positive {
        color: #4caf50;
      }
      
      &:not(.positive) {
        color: #f44336;
      }
      
      mat-icon {
        font-size: 12px;
        width: 12px;
        height: 12px;
      }
    }

    .stat-details {
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 600;
      line-height: 1.2;
    }

    .stat-label {
      font-size: 12px;
      color: rgba(197, 194, 194, 0.6);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    @media (max-width: 768px) {
      .stats-overview {
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      
      .stat-content {
        gap: 12px;
      }
      
      .stat-value {
        font-size: 20px;
      }
    }

    @media (max-width: 480px) {
      .stats-overview {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class StatisticsCardsComponent {
  private _stats = signal<StatCard[]>([]);
  
  @Input({ required: true })
  set stats(value: StatCard[]) {
    this._stats.set(value);
  }
  
  get stats() {
    return this._stats();
  }
}