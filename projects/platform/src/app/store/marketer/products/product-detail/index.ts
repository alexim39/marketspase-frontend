import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceService } from '@shared/services';
import { MarketerProductDetailComponent } from './marketer-product-detail.component';
import { MarketerProductDetailMobileComponent } from './mobile/marketer-product-detail-mobile.component';

@Component({
  selector: 'app-marketer-product-detail-route',
  standalone: true,
  imports: [CommonModule, MarketerProductDetailComponent, MarketerProductDetailMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-marketer-product-detail-mobile />
    } @else {
      <app-marketer-product-detail />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketerProductDetailIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
