import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CurrencyUtilsPipe } from '../../../../../../../../shared-services/src/public-api';

@Component({
  selector: 'app-product-tabs',
  standalone: true,
  imports: [CommonModule, MatTabsModule, MatIconModule, MatButtonModule, MatProgressBarModule, MatTooltipModule, CurrencyUtilsPipe],
  templateUrl: './product-tabs.component.html',
  styleUrls: ['./product-tabs.component.scss']
})
export class ProductTabsComponent {
  @Input() product: any;
  @Input() performanceStats: any;
  @Input() commissionDetails: any;
  @Input() user: any;
  @Output() copyLink = new EventEmitter<void>();
  @Output() shareProduct = new EventEmitter<string>();

  // These are methods, not outputs
  getPerformanceColor(rate: number): string {
    if (rate >= 30) return 'success';
    if (rate >= 15) return 'warning';
    return 'primary';
  }

  getPerformanceLabel(score: number): string {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Average';
    return 'Low';
  }

  getFormattedDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}