import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services';
import { CookiesComponent } from './cookies.component';
import { CookiesMobileComponent } from './mobile/cookies-mobile.component';

@Component({
  selector: 'app-cookies-index',
  standalone: true,
  imports: [CommonModule, CookiesComponent, CookiesMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-cookies-mobile />
    } @else {
      <async-cookies />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CookiesIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
