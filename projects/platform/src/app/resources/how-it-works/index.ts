import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services';
import { HowItWorksComponent } from './how-it-works.component';
import { HowItWorksMobileComponent } from './mobile/how-it-works-mobile.component';

@Component({
  selector: 'app-how-it-works-index',
  standalone: true,
  imports: [CommonModule, HowItWorksComponent, HowItWorksMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-how-it-works-mobile />
    } @else {
      <app-how-it-works />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HowItWorksIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
