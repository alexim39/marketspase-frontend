import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceService } from '@shared/services/device';
import { PromotionComponent } from './promotion.component';
import { PromotionMobileComponent } from './mobile/promotion-mobile.component';

@Component({
  selector: 'app-promotion-index',
  standalone: true,
  imports: [CommonModule, PromotionComponent, PromotionMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-promotion-mobile />
    } @else {
      <app-promotion />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromotionIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
