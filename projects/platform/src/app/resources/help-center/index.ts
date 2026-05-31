import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services';
import { HelpCenterComponent } from './help-center.component';
import { HelpCenterMobileComponent } from './mobile/help-center-mobile.component';

@Component({
  selector: 'app-help-center-index',
  standalone: true,
  imports: [CommonModule, HelpCenterComponent, HelpCenterMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-help-center-mobile />
    } @else {
      <app-help-center />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpCenterIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
