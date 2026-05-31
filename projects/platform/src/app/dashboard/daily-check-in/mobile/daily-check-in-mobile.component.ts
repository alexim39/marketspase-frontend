import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { DailyCheckInComponent } from '../daily-check-in.component';

@Component({
  selector: 'app-daily-check-in-mobile',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatSnackBarModule],
  templateUrl: './daily-check-in-mobile.component.html',
  styleUrls: ['./daily-check-in-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyCheckInMobileComponent extends DailyCheckInComponent {
  readonly rewardTone = computed<'building' | 'secured' | 'ready'>(() => {
    const streakStatus = this.status();

    if (!streakStatus) {
      return 'building';
    }

    if (streakStatus.canWithdraw) {
      return 'ready';
    }

    if (streakStatus.qualifiedToday) {
      return 'secured';
    }

    return 'building';
  });

  readonly sessionStateLabel = computed(() => {
    const streakStatus = this.status();

    if (!streakStatus) {
      return 'Preparing check-in';
    }

    if (streakStatus.qualifiedToday) {
      return 'Reward secured';
    }

    return `${this.remainingMinutes} min left`;
  });

  readonly withdrawActionLabel = computed(() => {
    if (this.withdrawInFlight()) {
      return 'Moving reward...';
    }

    return `Withdraw to ${this.currentWalletType()} wallet`;
  });

  readonly pointsUnit = computed(() => {
    const points = this.status()?.withdrawablePoints || 0;
    return points === 1 ? 'point' : 'points';
  });
}
