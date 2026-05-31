import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DeviceService, UserInterface } from '@shared/services';
import { DailyCheckInComponent } from './daily-check-in.component';
import { DailyCheckInMobileComponent } from './mobile/daily-check-in-mobile.component';

@Component({
  selector: 'app-daily-check-in-index',
  standalone: true,
  imports: [CommonModule, DailyCheckInComponent, DailyCheckInMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-daily-check-in-mobile [user]="user()" />
    } @else {
      <app-daily-check-in [user]="user()" />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyCheckInIndexComponent {
  readonly user = input<UserInterface | null>(null);

  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
