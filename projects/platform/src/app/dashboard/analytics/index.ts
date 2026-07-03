import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceService } from '@shared/services/device';
import { UnifiedAnalyticsComponent } from './unified-analytics.component';
import { UnifiedAnalyticsMobileComponent } from './mobile/unified-analytics-mobile.component';

@Component({
  selector: 'app-unified-analytics-index',
  standalone: true,
  imports: [CommonModule, UnifiedAnalyticsComponent, UnifiedAnalyticsMobileComponent],
  template: `@if (isMobile()) { <app-unified-analytics-mobile /> } @else { <app-unified-analytics /> }`,
})
export class UnifiedAnalyticsIndexComponent {
  private ds = inject(DeviceService);
  isMobile = computed(() => this.ds.type() === 'mobile' || this.ds.type() === 'tablet');
}
