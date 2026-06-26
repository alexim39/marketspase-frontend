import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services/device';
import { DashboardMainContainer } from './main-content.component';
import { DashboardMainMobileComponent } from './mobile/dashboard-main-mobile.component';

@Component({
  selector: 'app-dashboard-main-index',
  standalone: true,
  imports: [CommonModule, DashboardMainContainer, DashboardMainMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-dashboard-main-mobile />
    } @else {
      <main-container />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardMainIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
