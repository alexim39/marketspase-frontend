import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceService } from '@shared/services/device';
import { SettingsComponent } from './settings.component';
import { SettingsMobileComponent } from './mobile/settings-mobile.component';

@Component({
  selector: 'app-assistant-settings-index',
  standalone: true,
  imports: [CommonModule, SettingsComponent, SettingsMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-settings-mobile />
    } @else {
      <app-settings />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssistantSettingsIndexComponent {
  private readonly deviceService = inject(DeviceService);
  private readonly deviceType = computed(() => this.deviceService.type());

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceType();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
