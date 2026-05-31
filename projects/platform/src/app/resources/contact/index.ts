import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services';
import { ContactComponent } from './contact.component';
import { ContactMobileComponent } from './mobile/contact-mobile.component';

@Component({
  selector: 'app-contact-index',
  standalone: true,
  imports: [CommonModule, ContactComponent, ContactMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-contact-mobile />
    } @else {
      <app-contact />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
