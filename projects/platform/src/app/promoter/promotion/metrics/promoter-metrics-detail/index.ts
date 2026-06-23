import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services';
import { PromoterMetricsDetailComponent } from './promoter-metrics-detail.component';
import { PromoterMetricsDetailMobileComponent } from './mobile/promoter-metrics-detail-mobile.component';

@Component({
  selector: 'app-promoter-metrics-detail-index',
  standalone: true,
  imports: [CommonModule, PromoterMetricsDetailComponent, PromoterMetricsDetailMobileComponent],
  template: `@if (isMobileExperience()) { <app-promoter-metrics-detail-mobile /> } @else { <app-promoter-metrics-detail /> }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromoterMetricsDetailIndexComponent {
  private readonly deviceService = inject(DeviceService);
  protected readonly isMobileExperience = computed(() => { const t = this.deviceService.type(); return t === 'mobile' || t === 'tablet'; });
}
