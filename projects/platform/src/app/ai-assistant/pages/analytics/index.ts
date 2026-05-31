import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceService } from '@shared/services';
import { AnalyticsComponent } from './analytics.component';
import { AnalyticsMobileComponent } from './mobile/analytics-mobile.component';

@Component({
  selector: 'app-analytics-index',
  standalone: true,
  imports: [CommonModule, AnalyticsComponent, AnalyticsMobileComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isMobileExperience()) {
      <app-analytics-mobile />
    } @else {
      <app-analytics />
    }
  `,
})
export class AnalyticsIndexComponent {
  private readonly deviceService = inject(DeviceService);
  private readonly deviceType = computed(() => this.deviceService.type());

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceType();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
