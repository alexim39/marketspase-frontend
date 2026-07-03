import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services/device';
import { CareersComponent } from './career.component';
import { CareersMobileComponent } from './mobile/careers-mobile.component';

@Component({
  selector: 'app-careers-index',
  standalone: true,
  imports: [CommonModule, CareersComponent, CareersMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-careers-mobile />
    } @else {
      <app-careers />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CareersIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
