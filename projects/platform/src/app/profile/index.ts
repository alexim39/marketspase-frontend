import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services/device';
import { ProfileMobileComponent } from './mobile/profile-mobile.component';
import { ProfilePageComponent } from './profile-page.component';

@Component({
  selector: 'app-profile-index',
  standalone: true,
  imports: [CommonModule, ProfilePageComponent, ProfileMobileComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isMobileExperience()) {
      <app-profile-mobile />
    } @else {
      <app-profile-page />
    }
  `,
})
export class ProfileIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
