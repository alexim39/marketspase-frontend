import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services';
import { GetStartedMobileComponent } from './mobile/get-started-mobile.component';
import { GetStartedComponent } from './get-started.component';

@Component({
  selector: 'marketspase-get-started-index',
  standalone: true,
  imports: [CommonModule, GetStartedComponent, GetStartedMobileComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isMobileExperience()) {
      <marketspase-get-started-mobile />
    } @else {
      <marketspase-get-started />
    }
  `,
})
export class GetStartedIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
