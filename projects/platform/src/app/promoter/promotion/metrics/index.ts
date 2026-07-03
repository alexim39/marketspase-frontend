import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services/device';
import { PromoterMetricsComponent } from './promoter-metrics.component';
import { PromoterMetricsMobileComponent } from './mobile/promoter-metrics-mobile.component';

@Component({
  selector: 'app-promoter-metrics-index',
  standalone: true,
  imports: [CommonModule, PromoterMetricsComponent, PromoterMetricsMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-promoter-metrics-mobile />
    } @else {
      <app-promoter-metrics />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromoterMetricsIndexComponent {
  private readonly deviceService = inject(DeviceService);
  protected readonly isMobileExperience = computed(() => {
    const type = this.deviceService.type();
    return type === 'mobile' || type === 'tablet';
  });
}
