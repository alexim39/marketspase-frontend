import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DeviceService } from '@shared/services';
import { AutomationComponent } from './automation.component';
import { AutomationMobileComponent } from './mobile/automation-mobile.component';

@Component({
  selector: 'app-automation-index',
  standalone: true,
  imports: [CommonModule, AutomationComponent, AutomationMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-automation-mobile />
    } @else {
      <app-automation />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutomationIndexComponent {
  private readonly deviceService = inject(DeviceService);
  private readonly deviceType = computed(() => this.deviceService.type());

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceType();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
