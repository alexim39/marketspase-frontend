import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { UserInterface } from '@shared/services';
import { UserService } from '../../common/services/user.service';
import {
  LeaderboardMetric,
  LeaderboardService,
  LeaderboardState,
  LeaderboardTimeframe,
} from './leaderboard.service';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaderboardComponent {
  private readonly leaderboardService = inject(LeaderboardService);
  private readonly userService = inject(UserService);

  readonly state = this.leaderboardService.state;
  readonly loading = this.leaderboardService.loading;
  readonly currentUser = this.userService.user;

  readonly selectedTimeframe = signal<LeaderboardTimeframe>('weekly');
  readonly selectedMetric = signal<LeaderboardMetric>('blended');
  readonly timeframeOptions: LeaderboardTimeframe[] = ['daily', 'weekly', 'monthly'];

  readonly entries = computed(() => this.state()?.entries || []);
  readonly podiumEntries = computed(() => this.entries().slice(0, 3));
  readonly otherEntries = computed(() => this.entries().slice(3));

  readonly availableMetrics = computed(() => this.state()?.availableMetrics || ['streak', 'points', 'blended']);
  readonly periodSummary = computed(() => this.state()?.periodRangeLabel || this.state()?.periodLabel || 'Current period');
  readonly leaderboardEnabled = computed(() => this.state()?.enabled !== false);

  readonly currentUserStats = computed(() => {
    const user = this.currentUser();
    return {
      currentStreak: Number(user?.loginStreak?.currentStreak || 0),
      totalPointsEarned: Number(user?.loginStreak?.totalPointsEarned || 0),
      withdrawablePoints: Number(user?.loginStreak?.withdrawablePoints || 0),
      role: user?.role || null,
    };
  });

  constructor() {
    this.refresh();
  }

  setTimeframe(timeframe: string): void {
    if (!this.timeframeOptions.includes(timeframe as LeaderboardTimeframe)) {
      return;
    }

    const nextTimeframe = timeframe as LeaderboardTimeframe;
    if (this.selectedTimeframe() === nextTimeframe) {
      return;
    }

    this.selectedTimeframe.set(nextTimeframe);
    this.refresh();
  }

  setMetric(metric: string): void {
    if (!this.availableMetrics().includes(metric as LeaderboardMetric)) {
      return;
    }

    const nextMetric = metric as LeaderboardMetric;
    if (this.selectedMetric() === nextMetric) {
      return;
    }

    this.selectedMetric.set(nextMetric);
    this.refresh();
  }

  refresh(): void {
    this.leaderboardService.loadLeaderboard(
      this.selectedTimeframe(),
      this.selectedMetric(),
      10,
    );
  }

  getMetricLabel(metric: string): string {
    switch (metric) {
      case 'streak':
        return 'Streak';
      case 'points':
        return 'Points';
      default:
        return 'Combined';
    }
  }

  getMetricValue(entry: LeaderboardState['entries'][number] | undefined): string {
    if (!entry) {
      return '-';
    }

    if (this.selectedMetric() === 'points') {
      return `${entry.timeframePoints} pts`;
    }

    if (this.selectedMetric() === 'streak') {
      const streakValue = this.selectedTimeframe() === 'daily'
        ? entry.currentStreak
        : entry.timeframeBestStreak;
      return `${streakValue} day${streakValue === 1 ? '' : 's'}`;
    }

    return `${entry.timeframePoints} pts + ${this.selectedTimeframe() === 'daily' ? entry.currentStreak : entry.timeframeBestStreak} streak`;
  }

  getRoleLabel(role: UserInterface['role'] | null): string {
    if (role === 'promoter') {
      return 'Promoter';
    }

    if (role === 'marketer') {
      return 'Marketer';
    }

    return 'User';
  }
}
