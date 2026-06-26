import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceService } from '@shared/services/device';
import { MarketerPromotedProductsAnalyticsComponent } from './marketer-promoted-products-analytics.component';
import { MarketerPromotedProductsAnalyticsMobileComponent } from './mobile/marketer-promoted-products-analytics-mobile.component';

@Component({
  selector: 'app-marketer-promoted-products-analytics-index',
  standalone: true,
  imports: [
    CommonModule,
    MarketerPromotedProductsAnalyticsComponent,
    MarketerPromotedProductsAnalyticsMobileComponent,
  ],
  template: `
    @if (isMobileExperience()) {
      <app-marketer-promoted-products-analytics-mobile />
    } @else {
      <app-marketer-promoted-products-analytics />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketerPromotedProductsAnalyticsIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
