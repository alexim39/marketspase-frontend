import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services/device';
import { LegalComponent } from './legal.component';
import { LegalMobileShellComponent } from './mobile/legal-mobile-shell.component';

@Component({
  selector: 'app-legal-index',
  standalone: true,
  imports: [CommonModule, LegalComponent, LegalMobileShellComponent],
  template: `
    @if (isMobileExperience()) {
      <app-legal-mobile-shell />
    } @else {
      <async-legal />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
