import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DeviceService } from '@shared/services/device';
import { ConversationsComponent } from './conversations.component';
import { ConversationsMobileComponent } from './mobile/conversations-mobile.component';

@Component({
  selector: 'app-conversations-index',
  standalone: true,
  imports: [CommonModule, ConversationsComponent, ConversationsMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-conversations-mobile />
    } @else {
      <app-conversations />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversationsIndexComponent {
  private readonly deviceService = inject(DeviceService);
  private readonly deviceType = computed(() => this.deviceService.type());

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceType();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
