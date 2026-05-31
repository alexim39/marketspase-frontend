import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services';
import { GamificationComponent } from './gamification.component';
import { GamificationMobileComponent } from './mobile/gamification-mobile.component';

@Component({
  selector: 'app-gamification-index',
  standalone: true,
  imports: [CommonModule, GamificationComponent, GamificationMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-gamification-mobile />
    } @else {
      <app-gamification-dashboard />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GamificationIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
