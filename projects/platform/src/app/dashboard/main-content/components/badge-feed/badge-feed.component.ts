import { ChangeDetectionStrategy, Component, DestroyRef, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BadgeFeedPayload, BadgeService, UserBadge } from '../../../../common/services/badge.service';

@Component({
  selector: 'app-badge-feed',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatProgressBarModule],
  templateUrl: './badge-feed.component.html',
  styleUrls: ['./badge-feed.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeFeedComponent implements OnInit, OnDestroy {
  private readonly badgeService = inject(BadgeService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly state = signal<BadgeFeedPayload | null>(null);
  readonly highlightKeys = signal<string[]>([]);

  readonly levelSummary = computed(() => {
    const gamificationProfile = this.state()?.gamificationProfile;
    if (gamificationProfile) {
      return {
        level: gamificationProfile.currentLevel,
        levelTitle: gamificationProfile.currentLevelTitle,
        experiencePoints: gamificationProfile.totalExperiencePoints,
        badgesEarned: gamificationProfile.badgesUnlocked,
        nextLevel: gamificationProfile.nextLevel,
        experiencePointsToNextLevel: gamificationProfile.experiencePointsToNextLevel,
        progressPercent: gamificationProfile.progressPercent,
      };
    }

    return this.state()?.badgeProfile ?? null;
  });
  readonly recentUnlocks = computed(() => this.state()?.recentUnlocks ?? []);
  readonly nextBadges = computed(() => this.state()?.nextBadges ?? []);
  readonly recentlyUnlocked = computed(() => this.state()?.recentlyUnlocked ?? []);

  private pollTimeoutId: number | null = null;

  ngOnInit(): void {
    this.badgeService.refreshRequests$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadFeed(false));

    this.loadFeed(true);
  }

  ngOnDestroy(): void {
    if (this.pollTimeoutId != null) {
      window.clearTimeout(this.pollTimeoutId);
      this.pollTimeoutId = null;
    }
  }

  trackBadge(_: number, badge: UserBadge): string {
    return badge.id;
  }

  retry(): void {
    this.loadFeed(true);
  }

  private loadFeed(showLoader: boolean): void {
    if (showLoader) {
      this.loading.set(true);
    }

    this.badgeService.loadFeed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (!response?.success) {
            this.error.set('We could not load your badge feed right now.');
            this.loading.set(false);
            this.scheduleNextRefresh(15);
            return;
          }

          const payload = response.data;
          this.state.set(payload);
          this.error.set(null);
          this.loading.set(false);
          this.highlightKeys.set((payload.recentlyUnlocked || []).map((badge) => badge.key));
          this.scheduleNextRefresh(payload.feedRefreshMinutes || 15);
        },
        error: () => {
          this.error.set('We could not load your badge feed right now.');
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
}
