import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services';
import { AiAssistantComponent } from './ai-assistant.component';
import { AiAssistantMobileShellComponent } from './mobile/ai-assistant-mobile-shell.component';

@Component({
  selector: 'marketspase-ai-assistant-index',
  standalone: true,
  imports: [CommonModule, AiAssistantComponent, AiAssistantMobileShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isMobileExperience()) {
      <marketspase-ai-assistant-mobile-shell />
    } @else {
      <app-ai-assistant />
    }
  `,
})
export class AiAssistantIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
