import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { GamificationComponent } from '../gamification.component';

@Component({
  selector: 'app-gamification-mobile',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './gamification-mobile.component.html',
  styleUrls: ['./gamification-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GamificationMobileComponent extends GamificationComponent {
  readonly primaryMilestone = computed(() => this.upcomingMilestones()[0] ?? null);
  readonly milestoneRail = computed(() => this.upcomingMilestones().slice(0, 4));
  readonly actionRail = computed(() => this.actionBreakdown().slice(0, 6));
  readonly celebrationRail = computed(() => this.recentCelebrations().slice(0, 5));
  readonly activityFeed = computed(() => this.recentEvents().slice(0, 6));
  readonly unlockedRail = computed(() => this.unlockedMilestones().slice(0, 5));

  readonly levelProgress = computed(() => {
    const percent = Number(this.profile()?.progressPercent || 0);
    return Math.max(0, Math.min(100, percent));
  });

  readonly refreshLabel = computed(() => {
    if (this.isRefreshing()) return 'Refreshing';
    if (this.showInitialLoader()) return 'Loading';
    return 'Refresh';
  });
}
