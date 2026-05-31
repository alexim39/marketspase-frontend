import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CampaignAnalyticsComponent } from '../campaign-analytics.component';

@Component({
  selector: 'app-campaign-analytics-mobile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  providers: [CurrencyPipe, DatePipe, DecimalPipe, TitleCasePipe],
  templateUrl: './campaign-analytics-mobile.component.html',
  styleUrls: ['./campaign-analytics-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignAnalyticsMobileComponent extends CampaignAnalyticsComponent {
  readonly rangeOptions = [
    { value: '7', label: '7 days' },
    { value: '30', label: '30 days' },
    { value: '90', label: '90 days' },
    { value: 'custom', label: 'Custom' },
  ];

  visibleTrendRows() {
    return this.trendBars().slice(-7);
  }
}
