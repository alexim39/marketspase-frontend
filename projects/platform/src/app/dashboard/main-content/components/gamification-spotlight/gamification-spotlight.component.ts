import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  GamificationCelebration,
  GamificationFeedPayload,
  GamificationService,
} from '../../../../common/services/gamification.service';

interface SpotlightSummary {
  level: number;
  levelTitle: string;
  totalExperiencePoints: number;
  nextLevel: number | null;
  experiencePointsToNextLevel: number;
  progressPercent: number;
  milestonesUnlocked: number;
  badgesUnlocked: number;
}

@Component({
  selector: 'app-gamification-spotlight',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatProgressBarModule],
  templateUrl: './gamification-spotlight.component.html',
  styleUrls: ['./gamification-spotlight.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GamificationSpotlightComponent implements OnInit, OnDestroy {
  private readonly gamificationService = inject(GamificationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly seenCelebrationsStorageKey = 'marketspase.gamification.seenCelebrations';

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly state = signal<GamificationFeedPayload | null>(null);
  readonly activeCelebration = signal<GamificationCelebration | null>(null);

  readonly summary = computed<SpotlightSummary | null>(() => {
    const profile = this.state()?.gamificationProfile;
    if (!profile) {
      return null;
    }

    return {
      level: profile.currentLevel,
      levelTitle: profile.currentLevelTitle,
      totalExperiencePoints: profile.totalExperiencePoints,
      nextLevel: profile.nextLevel,
      experiencePointsToNextLevel: profile.experiencePointsToNextLevel,
      progressPercent: profile.progressPercent,
      milestonesUnlocked: profile.milestonesUnlocked,
      badgesUnlocked: profile.badgesUnlocked,
    };
  });

  readonly streakSummary = computed(() => this.state()?.streakSummary ?? null);
  readonly badgeSummary = computed(() => this.state()?.badgeSummary ?? null);
  readonly upcomingMilestones = computed(() => this.state()?.upcomingMilestones ?? []);
  readonly confettiPieces = Array.from({ length: 16 }, (_, index) => index);

  private pollTimeoutId: number | null = null;
  private celebrationTimeoutId: number | null = null;
  private seenCelebrationKeys = new Set<string>();

  ngOnInit(): void {
    this.restoreSeenCelebrations();

    this.gamificationService.refreshRequests$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadFeed(false));

    this.loadFeed(true);
  }

  ngOnDestroy(): void {
    if (this.pollTimeoutId != null) {
      window.clearTimeout(this.pollTimeoutId);
      this.pollTimeoutId = null;
    }

    if (this.celebrationTimeoutId != null) {
      window.clearTimeout(this.celebrationTimeoutId);
      this.celebrationTimeoutId = null;
    }
  }

  retry(): void {
    this.loadFeed(true);
  }

  dismissCelebration(): void {
    const celebration = this.activeCelebration();
    if (!celebration) {
      return;
    }

    this.seenCelebrationKeys.add(celebration.key);
    this.persistSeenCelebrations();
    this.activeCelebration.set(null);
  }

  private loadFeed(showLoader: boolean): void {
    if (showLoader) {
      this.loading.set(true);
    }

    this.gamificationService.loadFeed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (!response?.success) {
            this.error.set('We could not load your progress right now.');
            this.loading.set(false);
            this.scheduleNextRefresh(15);
            return;
          }

          const payload = response.data;
          this.state.set(payload);
          this.error.set(null);
          this.loading.set(false);
          this.showNextCelebration(payload.recentCelebrations || []);
          this.scheduleNextRefresh(payload.refreshIntervalMinutes || 15);
        },
        error: () => {
          this.error.set('We could not load your progress right now.');
          this.loading.set(false);
          this.scheduleNextRefresh(15);
        },
      });
  }

  private scheduleNextRefresh(minutes: number): void {
    if (this.pollTimeoutId != null) {
      window.clearTimeout(this.pollTimeoutId);
    }

    const delay = Math.max(1, Number(minutes || 15)) * 60000;
    this.pollTimeoutId = window.setTimeout(() => this.loadFeed(false), delay);
  }

  private showNextCelebration(celebrations: GamificationCelebration[]): void {
    if (this.activeCelebration()) {
      return;
    }

    const nextCelebration = celebrations.find((celebration) => !this.seenCelebrationKeys.has(celebration.key));
    if (!nextCelebration) {
      return;
    }

    this.activeCelebration.set(nextCelebration);

    if (this.celebrationTimeoutId != null) {
      window.clearTimeout(this.celebrationTimeoutId);
    }

    this.celebrationTimeoutId = window.setTimeout(() => this.dismissCelebration(), 5200);
  }

  private restoreSeenCelebrations(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const raw = window.sessionStorage.getItem(this.seenCelebrationsStorageKey);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        this.seenCelebrationKeys = new Set(parsed.map((entry) => String(entry)));
      }
    } catch {
      this.seenCelebrationKeys = new Set<string>();
    }
  }

  private persistSeenCelebrations(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.sessionStorage.setItem(
      this.seenCelebrationsStorageKey,
      JSON.stringify([...this.seenCelebrationKeys]),
    );
  }
}
