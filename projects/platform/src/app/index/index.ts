import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceService } from '../../../../shared-services/src/public-api';
import { MobileIndexComponent } from './mobile/index.component';
import { DesktopIndexComponent } from './desktop/index.component';

@Component({
  selector: 'app-landing-index',
  standalone: true,
  imports: [CommonModule, MobileIndexComponent, DesktopIndexComponent],
  template: `
    <!-- Mobile Notice (Optional) -->
    @if (deviceType() === 'mobile') {
      <app-mobile-index />
    }
    
    <!-- Tablet Notice (Optional) -->
    @if (deviceType() === 'tablet') {
      <app-mobile-index />
    }

    <!-- Desktop Notice (Optional) -->
    @if (deviceType() === 'desktop') {
      <app-desktop-index />
    }
  `,
})
export class AppLandingIndexComponent{
  private readonly deviceService = inject(DeviceService);
  // Computed properties for better performance
  protected readonly deviceType = computed(() => this.deviceService.type());
}
