import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, Subscription, catchError, finalize, of, tap } from 'rxjs';
import { ApiService, UserInterface } from '@shared/services';
import { UserService } from '../../common/services/user.service';
import { BadgeService } from '../../common/services/badge.service';

export interface DailyCheckInStatus {
  sessionId: string | null;
  enabled: boolean;
  timezone: string;
  todayDateKey: string;
  currentStreak: number;
  longestStreak: number;
  qualifiedToday: boolean;
  recentlyQualified: boolean;
  activeSecondsAccumulated: number;
  requiredActiveSeconds: number;
  remainingActiveSeconds: number;
  rewardCycleDayCount: number;
  cycleLengthDays: number;
  nextRewardDay: number;
  todayRewardPoints: number;
  todayRewardNaira: number;
  lastRewardPoints: number;
  lastRewardDateKey: string | null;
  pendingCyclePoints: number;
  pendingCycleNaira: number;
  withdrawablePoints: number;
  withdrawableNaira: number;
  totalPointsEarned: number;
  totalPointsWithdrawn: number;
  totalNairaWithdrawn: number;
  pointValueNaira: number;
  minimumSessionMinutes: number;
  canWithdraw: boolean;
  sessionStartedAt: string | null;
  sessionQualifiedAt: string | null;
  streakMessage: string;
}

interface StreakResponse {
  success: boolean;
  message?: string;
  data: DailyCheckInStatus;
}

@Injectable({ providedIn: 'root' })
export class DailyCheckInService {
  private readonly apiService = inject(ApiService);
  private readonly userService = inject(UserService);
  private readonly badgeService = inject(BadgeService);
  private readonly document = inject(DOCUMENT);

  readonly status = signal<DailyCheckInStatus | null>(null);
  readonly loading = signal(false);
  readonly promptOpen = signal(false);
  readonly pingInFlight = signal(false);
  readonly withdrawInFlight = signal(false);

  private activeUser: UserInterface | null = null;
  private heartbeatSubscription: Subscription | null = null;
  private focusHandler: (() => void) | null = null;
  private visibilityHandler: (() => void) | null = null;
  private quickPingTimeoutId: number | null = null;

  activate(user: UserInterface | null): void {
    if (!user?._id || !user?.uid) {
      this.deactivate();
      return;
    }

    if (this.activeUser?._id !== user._id) {
      this.clearRuntimeState();
    }

    this.activeUser = user;
    const isEligibleRole = user.role === 'marketer' || user.role === 'promoter';

    if (!isEligibleRole) {
      this.activeUser = null;
      this.clearRuntimeState();
      return;
    }

    this.loading.set(true);
    this.apiService.post<StreakResponse>('api/v1/streaks/session/start', {}, undefined, true)
      .pipe(
        tap((response) => {
          if (response?.success) {
            this.applyStatus(response.data);
          }
        }),
        catchError((error) => {
          console.error('Failed to initialize daily check-in session:', error);
          this.clearRuntimeState();
          return of(null);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  deactivate(): void {
    this.activeUser = null;
    this.clearRuntimeState();
  }

  closePrompt(): void {
    this.promptOpen.set(false);
  }

  reopenPrompt(): void {
    if (this.status()) {
      this.promptOpen.set(true);
    }
  }

  pingSession(force = false): void {
    const currentStatus = this.status();
    if (!currentStatus?.enabled || !currentStatus.sessionId || this.pingInFlight()) {
      return;
    }

    if (!force && this.document.visibilityState === 'hidden') {
      return;
    }

    this.pingInFlight.set(true);
    this.apiService.post<StreakResponse>('api/v1/streaks/session/ping', { sessionId: currentStatus.sessionId }, undefined, true)
      .pipe(
        tap((response) => {
          if (response?.success) {
            this.applyStatus(response.data);
          }
        }),
        catchError((error) => {
          console.error('Failed to ping daily check-in session:', error);
          return of(null);
        }),
        finalize(() => this.pingInFlight.set(false)),
      )
      .subscribe();
  }

  withdrawToWallet(walletType: 'marketer' | 'promoter'): Observable<any> {
    if (this.withdrawInFlight()) {
      return of(null);
    }

    this.withdrawInFlight.set(true);
    return this.apiService.post<any>('api/v1/streaks/withdraw', { walletType }, undefined, true).pipe(
      tap((response) => {
        if (response?.success && response?.data?.status) {
          this.applyStatus(response.data.status);
        }

        if (this.activeUser?.uid) {
          this.userService.getUser(this.activeUser.uid).subscribe({ error: () => void 0 });
        }
      }),
      finalize(() => this.withdrawInFlight.set(false)),
    );
  }

  getProgressPercent(status: DailyCheckInStatus | null): number {
    if (!status || status.requiredActiveSeconds <= 0) return 0;
    return Math.min(100, Math.round((status.activeSecondsAccumulated / status.requiredActiveSeconds) * 100));
  }

  getCycleProgressPercent(status: DailyCheckInStatus | null): number {
    if (!status || status.cycleLengthDays <= 0) return 0;
    return Math.min(100, Math.round((status.rewardCycleDayCount / status.cycleLengthDays) * 100));
  }

  private applyStatus(status: DailyCheckInStatus): void {
    this.status.set(status);
    if (status.recentlyQualified) {
      this.badgeService.requestFeedRefresh();
    }
    this.ensurePromptShown(status);
    this.setupHeartbeat(status);
  }

  private ensurePromptShown(status: DailyCheckInStatus): void {
    const userId = this.activeUser?._id;
    if (!userId || !status.enabled) {
      this.promptOpen.set(false);
      return;
    }

    const sessionKey = `marketspase-streak-prompt:${userId}:${status.todayDateKey}`;
    const sessionStorageRef = globalThis.sessionStorage;
    if (!sessionStorageRef?.getItem(sessionKey) || status.recentlyQualified) {
      this.promptOpen.set(true);
      sessionStorageRef?.setItem(sessionKey, 'shown');
    }
  }

  private setupHeartbeat(status: DailyCheckInStatus): void {
    if (!status.enabled) {
      this.teardownHeartbeat();
      return;
    }

    if (status.qualifiedToday) {
      this.teardownHeartbeat(false);
      return;
    }

    if (!this.heartbeatSubscription) {
      this.heartbeatSubscription = new Subscription();
      const intervalId = window.setInterval(() => this.pingSession(false), 60000);
      this.heartbeatSubscription.add(() => window.clearInterval(intervalId));
    }

    if (!this.focusHandler) {
      this.focusHandler = () => this.pingSession(true);
      window.addEventListener('focus', this.focusHandler);
    }

    if (!this.visibilityHandler) {
      this.visibilityHandler = () => {
        if (this.document.visibilityState === 'visible') {
          this.pingSession(true);
        }
      };
      this.document.addEventListener('visibilitychange', this.visibilityHandler);
    }

    if (status.remainingActiveSeconds <= 60 && this.quickPingTimeoutId == null) {
      this.quickPingTimeoutId = window.setTimeout(() => {
        this.quickPingTimeoutId = null;
        this.pingSession(true);
      }, 5000);
    }
  }

  private teardownHeartbeat(closePrompt = false): void {
    this.heartbeatSubscription?.unsubscribe();
    this.heartbeatSubscription = null;

    if (this.focusHandler) {
      window.removeEventListener('focus', this.focusHandler);
      this.focusHandler = null;
    }

    if (this.visibilityHandler) {
      this.document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }

    if (this.quickPingTimeoutId != null) {
      window.clearTimeout(this.quickPingTimeoutId);
      this.quickPingTimeoutId = null;
    }

    if (closePrompt) {
      this.promptOpen.set(false);
    }
  }

  private clearRuntimeState(): void {
    this.teardownHeartbeat(true);
    this.status.set(null);
    this.loading.set(false);
    this.pingInFlight.set(false);
    this.withdrawInFlight.set(false);
  }
}
