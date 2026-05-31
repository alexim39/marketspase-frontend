import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services';
import { PromoterProductDetailsComponent } from './promoter-product-details.component';
import { PromoterProductDetailsMobileComponent } from './mobile/promoter-product-details-mobile.component';

@Component({
  selector: 'app-promoter-product-detail-index',
  standalone: true,
  imports: [CommonModule, PromoterProductDetailsComponent, PromoterProductDetailsMobileComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isMobileExperience()) {
      <app-promoter-product-details-mobile />
    } @else {
      <app-promoter-product-details />
    }
  `,
})
export class PromoterProductDetailIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
