import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceService } from '@shared/services';
import { MarketerProductListComponent } from './marketer-product-list-index.component';
import { MarketerProductListMobileComponent } from './mobile/marketer-product-list-mobile.component';

@Component({
  selector: 'app-marketer-product-list-route',
  standalone: true,
  imports: [CommonModule, MarketerProductListComponent, MarketerProductListMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-marketer-product-list-mobile />
    } @else {
      <app-marketer-product-list-index />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketerProductListIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
