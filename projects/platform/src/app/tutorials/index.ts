import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DeviceService } from '@shared/services';
import { TutorialsComponent } from './tutorials.component';
import { TutorialsMobileComponent } from './mobile/tutorials-mobile.component';

@Component({
  selector: 'app-tutorials-index',
  standalone: true,
  imports: [CommonModule, TutorialsComponent, TutorialsMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-tutorials-mobile />
    } @else {
      <app-tutorials />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TutorialsIndexComponent {
  private readonly deviceService = inject(DeviceService);
  private readonly deviceType = computed(() => this.deviceService.type());

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceType();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
