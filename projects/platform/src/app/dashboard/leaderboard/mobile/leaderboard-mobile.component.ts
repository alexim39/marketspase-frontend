import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { LeaderboardComponent } from '../leaderboard.component';
import { LeaderboardEntry } from '../leaderboard.service';

@Component({
  selector: 'app-leaderboard-mobile',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './leaderboard-mobile.component.html',
  styleUrls: ['./leaderboard-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaderboardMobileComponent extends LeaderboardComponent {
  readonly filtersOpen = signal(false);

  readonly champion = computed(() => this.entries()[0] ?? null);
  readonly podiumTrail = computed(() => this.entries().slice(1, 3));
  readonly rankingCards = computed(() => this.entries().slice(3));

  readonly selectedSummary = computed(() => {
    const timeframe = this.selectedTimeframe();
    const metric = this.getMetricLabel(this.selectedMetric()).toLowerCase();
    return `${timeframe.charAt(0).toUpperCase()}${timeframe.slice(1)} by ${metric}`;
  });

  readonly userRewardValue = computed(() => {
    const pointValue = this.state()?.pointValueNaira || 150;
    return this.currentUserStats().withdrawablePoints * pointValue;
  });

  openFilters(): void {
    this.filtersOpen.set(true);
  }

  closeFilters(): void {
    this.filtersOpen.set(false);
  }

  setMobileTimeframe(timeframe: string): void {
    this.setTimeframe(timeframe);
    this.filtersOpen.set(false);
  }

  setMobileMetric(metric: string): void {
    this.setMetric(metric);
    this.filtersOpen.set(false);
  }

  rankTone(entry: LeaderboardEntry): string {
    if (entry.rank === 1) return 'gold';
    if (entry.rank === 2) return 'silver';
    if (entry.rank === 3) return 'bronze';
    return 'standard';
  }
}
