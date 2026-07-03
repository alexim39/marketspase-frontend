import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services/device';
import { ForPromotersComponent } from './for-promoters.component';
import { ForPromotersMobileComponent } from './mobile/for-promoters-mobile.component';

@Component({
  selector: 'app-for-promoters-index',
  standalone: true,
  imports: [CommonModule, ForPromotersComponent, ForPromotersMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-for-promoters-mobile />
    } @else {
      <app-for-promoters />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForPromotersIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
