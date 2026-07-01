import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceService } from '@shared/services/device';
import { AiCampaignBuilderComponent } from './ai-campaign-builder.component';
import { AiCampaignBuilderMobileComponent } from './mobile/ai-campaign-builder-mobile.component';

@Component({
  selector: 'app-ai-campaign-builder-index',
  standalone: true,
  imports: [CommonModule, AiCampaignBuilderComponent, AiCampaignBuilderMobileComponent],
  template: `
    @if (isMobile()) {
      <app-ai-campaign-builder-mobile />
    } @else {
      <app-ai-campaign-builder />
    }
  `,
})
export class AiCampaignBuilderIndexComponent {
  private deviceService = inject(DeviceService);
  isMobile = computed(() => this.deviceService.type() === 'mobile' || this.deviceService.type() === 'tablet');
}
