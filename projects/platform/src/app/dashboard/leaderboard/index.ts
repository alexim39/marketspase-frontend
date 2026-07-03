import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceService } from '@shared/services/device';
import { LeaderboardComponent } from './leaderboard.component';
import { LeaderboardMobileComponent } from './mobile/leaderboard-mobile.component';

@Component({
  selector: 'app-leaderboard-index',
  standalone: true,
  imports: [CommonModule, LeaderboardComponent, LeaderboardMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-leaderboard-mobile />
    } @else {
      <app-leaderboard />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaderboardIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
