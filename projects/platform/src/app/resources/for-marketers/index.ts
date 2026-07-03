import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services/device';
import { ForMarketersComponent } from './for-marketers.component';
import { ForMarketersMobileComponent } from './mobile/for-marketers-mobile.component';

@Component({
  selector: 'app-for-marketers-index',
  standalone: true,
  imports: [CommonModule, ForMarketersComponent, ForMarketersMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-for-marketers-mobile />
    } @else {
      <app-for-marketers />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForMarketersIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
