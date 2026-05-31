import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DeviceService } from '@shared/services';
import { FaqsComponent } from './faqs.component';
import { FaqsMobileComponent } from './mobile/faqs-mobile.component';

@Component({
  selector: 'app-faqs-index',
  standalone: true,
  imports: [CommonModule, FaqsComponent, FaqsMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-faqs-mobile />
    } @else {
      <app-faqs />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqsIndexComponent {
  private readonly deviceService = inject(DeviceService);
  private readonly deviceType = computed(() => this.deviceService.type());

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceType();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
