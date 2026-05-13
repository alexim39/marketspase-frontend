import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterModule } from '@angular/router';
import { UserService } from '../../common/services/user.service';
import {
  GamificationDashboardPayload,
  GamificationService,
} from '../../common/services/gamification.service';

@Component({
  selector: 'app-gamification-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatProgressBarModule],
  templateUrl: './gamification.component.html',
  styleUrls: ['./gamification.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GamificationComponent {
  private readonly gamificationService = inject(GamificationService);
  private readonly userService = inject(UserService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly state = signal<GamificationDashboardPayload | null>(null);
  readonly currentUser = this.userService.user;

  readonly profile = computed(() => this.state()?.gamificationProfile ?? null);
  readonly actionBreakdown = computed(() => this.state()?.actionBreakdown ?? []);
  readonly upcomingMilestones = computed(() => this.state()?.upcomingMilestones ?? []);
  readonly unlockedMilestones = computed(() => this.state()?.unlockedMilestones ?? []);
  readonly recentEvents = computed(() => this.state()?.recentEvents ?? []);
  readonly recentCelebrations = computed(() => this.state()?.recentCelebrations ?? []);
  readonly streakSummary = computed(() => this.state()?.streakSummary ?? null);
  readonly badgeSummary = computed(() => this.state()?.badgeSummary ?? null);

  constructor() {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);

    this.gamificationService.loadDashboard().subscribe({
      next: (response) => {
        if (!response?.success) {
          this.error.set('We could not load your gamification dashboard right now.');
          this.loading.set(false);
          return;
        }

        this.state.set(response.data);
        this.error.set(null);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('We could not load your gamification dashboard right now.');
        this.loading.set(false);
      },
    });
  }
}
