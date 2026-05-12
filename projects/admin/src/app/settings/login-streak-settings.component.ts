import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize, startWith } from 'rxjs';
import {
  LoginStreakAdminConfig,
  LoginStreakLeaderboardConfig,
  LoginStreakRewardRow,
  LoginStreakSettingsService,
} from './login-streak-settings.service';

type LeaderboardMetric = 'streak' | 'points' | 'blended';
type LeaderboardTimeframe = 'daily' | 'weekly' | 'monthly';

@Component({
  selector: 'app-login-streak-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule],
  templateUrl: './login-streak-settings.component.html',
  styleUrls: ['./login-streak-settings.component.scss'],
})
export class LoginStreakSettingsComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly streakSettingsService = inject(LoginStreakSettingsService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly updatedAt = signal<string | null>(null);
  readonly formValue = signal({
    enabled: true,
    timezone: 'Africa/Lagos',
    minimumSessionMinutes: 12,
    cycleLengthDays: 7,
    pointValueNaira: 150,
    dailyRewards: [] as LoginStreakRewardRow[],
    leaderboard: {
      enabled: true,
      defaultMetric: 'blended' as LeaderboardMetric,
      enabledMetrics: ['streak', 'points', 'blended'] as LeaderboardMetric[],
      defaultTimeframe: 'weekly' as LeaderboardTimeframe,
      refreshIntervalMinutes: 60,
      topSize: 10,
    },
  });

  readonly form = this.formBuilder.group({
    enabled: this.formBuilder.nonNullable.control(true),
    timezone: this.formBuilder.nonNullable.control('Africa/Lagos', Validators.required),
    minimumSessionMinutes: this.formBuilder.nonNullable.control(12, [Validators.required, Validators.min(1)]),
    cycleLengthDays: this.formBuilder.nonNullable.control(7, [Validators.required, Validators.min(1), Validators.max(30)]),
    pointValueNaira: this.formBuilder.nonNullable.control(150, [Validators.required, Validators.min(1)]),
    dailyRewards: this.formBuilder.array([]),
    leaderboard: this.formBuilder.group({
      enabled: this.formBuilder.nonNullable.control(true),
      defaultMetric: this.formBuilder.nonNullable.control<LeaderboardMetric>('blended', Validators.required),
      defaultTimeframe: this.formBuilder.nonNullable.control<LeaderboardTimeframe>('weekly', Validators.required),
      refreshIntervalMinutes: this.formBuilder.nonNullable.control(60, [Validators.required, Validators.min(5), Validators.max(1440)]),
      topSize: this.formBuilder.nonNullable.control(10, [Validators.required, Validators.min(3), Validators.max(50)]),
      enabledMetrics: this.formBuilder.group({
        streak: this.formBuilder.nonNullable.control(true),
        points: this.formBuilder.nonNullable.control(true),
        blended: this.formBuilder.nonNullable.control(true),
      }),
    }),
  });

  readonly totalCyclePoints = computed(() => (
    this.formValue().dailyRewards.reduce((total, reward) => total + Number(reward.points || 0), 0)
  ));

  readonly totalCycleNaira = computed(() => (
    this.totalCyclePoints() * Number(this.formValue().pointValueNaira || 0)
  ));

  readonly currentCycleLength = computed(() => Number(this.formValue().cycleLengthDays || 0));
  readonly currentPointValue = computed(() => Number(this.formValue().pointValueNaira || 0));
  readonly leaderboardMetricsLabel = computed(() => (
    this.formValue().leaderboard.enabledMetrics.map((metric) => this.getMetricLabel(metric)).join(', ')
  ));

  private isPatchingForm = false;

  constructor() {
    this.syncRewardRows(7);
    this.updateFormValueSignal();

    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (!this.isPatchingForm) {
          this.ensureMetricSelectionIntegrity();
        }
        this.updateFormValueSignal();
      });

    this.form.controls.cycleLengthDays.valueChanges
      .pipe(
        startWith(this.form.controls.cycleLengthDays.value),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value) => {
        if (this.isPatchingForm) {
          return;
        }

        this.syncRewardRows(Number(value || 1));
        this.updateFormValueSignal();
      });

    this.loadConfig();
  }

  get dailyRewards(): FormArray {
    return this.form.controls.dailyRewards;
  }

  get leaderboardMetricsGroup() {
    return this.form.controls.leaderboard.controls.enabledMetrics.controls;
  }

  loadConfig(): void {
    this.loading.set(true);

    this.streakSettingsService.getConfig()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (response) => {
          if (!response?.success) {
            this.snackBar.open('Unable to load login streak settings right now.', 'Close', { duration: 5000 });
            return;
          }

          this.applyConfig(response.data);
        },
        error: (error) => {
          this.snackBar.open(error?.error?.message || 'Unable to load login streak settings right now.', 'Close', {
            duration: 5000,
          });
        },
      });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Please fix the highlighted streak settings before saving.', 'Close', {
        duration: 5000,
      });
      return;
    }

    const enabledMetrics = this.getEnabledMetrics();
    if (!enabledMetrics.length) {
      this.snackBar.open('Choose at least one leaderboard metric before saving.', 'Close', {
        duration: 5000,
      });
      return;
    }

    const rawValue = this.form.getRawValue();
    const defaultMetric = enabledMetrics.includes(rawValue.leaderboard.defaultMetric)
      ? rawValue.leaderboard.defaultMetric
      : enabledMetrics[0];

    const payload: LoginStreakAdminConfig = {
      enabled: Boolean(rawValue.enabled),
      timezone: String(rawValue.timezone || 'Africa/Lagos').trim() || 'Africa/Lagos',
      minimumSessionMinutes: Math.max(1, Number(rawValue.minimumSessionMinutes || 12)),
      cycleLengthDays: Math.max(1, Math.min(30, Number(rawValue.cycleLengthDays || 7))),
      pointValueNaira: Math.max(1, Number(rawValue.pointValueNaira || 150)),
      dailyRewards: this.dailyRewards.controls.map((control, index) => ({
        day: index + 1,
        points: Math.max(0, Number(control.get('points')?.value || 0)),
      })),
      leaderboard: {
        enabled: Boolean(rawValue.leaderboard.enabled),
        defaultMetric,
        enabledMetrics,
        defaultTimeframe: rawValue.leaderboard.defaultTimeframe,
        refreshIntervalMinutes: Math.max(5, Math.min(1440, Number(rawValue.leaderboard.refreshIntervalMinutes || 60))),
        topSize: Math.max(3, Math.min(50, Number(rawValue.leaderboard.topSize || 10))),
      },
    };

    this.saving.set(true);
    this.streakSettingsService.updateConfig(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (response) => {
          if (!response?.success) {
            this.snackBar.open('Unable to save login streak settings right now.', 'Close', { duration: 5000 });
            return;
          }

          this.applyConfig(response.data);
          this.snackBar.open('Daily login streak and leaderboard settings updated.', 'Close', { duration: 4000 });
        },
        error: (error) => {
          this.snackBar.open(error?.error?.message || 'Unable to save login streak settings right now.', 'Close', {
            duration: 5000,
          });
        },
      });
  }

  trackRewardRow(index: number): number {
    return index;
  }

  getMetricLabel(metric: LeaderboardMetric): string {
    switch (metric) {
      case 'streak':
        return 'Streak';
      case 'points':
        return 'Points';
      default:
        return 'Combined';
    }
  }

  private applyConfig(config: LoginStreakAdminConfig): void {
    this.isPatchingForm = true;
    this.updatedAt.set(config.updatedAt || null);

    this.form.patchValue({
      enabled: config.enabled,
      timezone: config.timezone,
      minimumSessionMinutes: config.minimumSessionMinutes,
      cycleLengthDays: config.cycleLengthDays,
      pointValueNaira: config.pointValueNaira,
      leaderboard: {
        enabled: config.leaderboard?.enabled ?? true,
        defaultMetric: config.leaderboard?.defaultMetric ?? 'blended',
        defaultTimeframe: config.leaderboard?.defaultTimeframe ?? 'weekly',
        refreshIntervalMinutes: config.leaderboard?.refreshIntervalMinutes ?? 60,
        topSize: config.leaderboard?.topSize ?? 10,
        enabledMetrics: {
          streak: config.leaderboard?.enabledMetrics?.includes('streak') ?? true,
          points: config.leaderboard?.enabledMetrics?.includes('points') ?? true,
          blended: config.leaderboard?.enabledMetrics?.includes('blended') ?? true,
        },
      },
    }, { emitEvent: false });

    this.syncRewardRows(config.cycleLengthDays, config.dailyRewards);
    this.ensureMetricSelectionIntegrity();
    this.updateFormValueSignal();
    this.form.markAsPristine();
    this.isPatchingForm = false;
  }

  private syncRewardRows(nextLength: number, rewards?: LoginStreakRewardRow[]): void {
    const normalizedLength = Math.max(1, Math.min(30, Number(nextLength || 1)));
    const currentRewards = rewards?.length
      ? rewards
      : this.dailyRewards.controls.map((control, index) => ({
          day: index + 1,
          points: Number(control.get('points')?.value || 0),
        }));

    while (this.dailyRewards.length > normalizedLength) {
      this.dailyRewards.removeAt(this.dailyRewards.length - 1);
    }

    for (let index = 0; index < normalizedLength; index += 1) {
      const fallbackPoints = currentRewards[currentRewards.length - 1]?.points ?? 1;
      const reward = currentRewards[index] || { day: index + 1, points: fallbackPoints };

      if (this.dailyRewards.at(index)) {
        this.dailyRewards.at(index).patchValue({
          day: index + 1,
          points: Math.max(0, Number(reward.points || 0)),
        }, { emitEvent: false });
        continue;
      }

      this.dailyRewards.push(this.formBuilder.group({
        day: this.formBuilder.nonNullable.control(index + 1, Validators.required),
        points: this.formBuilder.nonNullable.control(
          Math.max(0, Number(reward.points || 0)),
          [Validators.required, Validators.min(0)],
        ),
      }));
    }

    if (this.form.controls.cycleLengthDays.value !== normalizedLength) {
      this.form.controls.cycleLengthDays.setValue(normalizedLength, { emitEvent: false });
    }
  }

  private getEnabledMetrics(): LeaderboardMetric[] {
    const metrics = this.form.controls.leaderboard.controls.enabledMetrics.getRawValue();
    return (['streak', 'points', 'blended'] as LeaderboardMetric[]).filter((metric) => metrics[metric]);
  }

  private ensureMetricSelectionIntegrity(): void {
    const enabledMetrics = this.getEnabledMetrics();
    if (!enabledMetrics.length) {
      this.form.controls.leaderboard.controls.enabledMetrics.controls.blended.setValue(true, { emitEvent: false });
      enabledMetrics.push('blended');
    }

    const currentDefaultMetric = this.form.controls.leaderboard.controls.defaultMetric.value;
    if (!enabledMetrics.includes(currentDefaultMetric)) {
      this.form.controls.leaderboard.controls.defaultMetric.setValue(enabledMetrics[0], { emitEvent: false });
    }
  }

  private updateFormValueSignal(): void {
    const rawValue = this.form.getRawValue();
    const enabledMetrics = this.getEnabledMetrics();
    this.formValue.set({
      enabled: Boolean(rawValue.enabled),
      timezone: String(rawValue.timezone || 'Africa/Lagos'),
      minimumSessionMinutes: Number(rawValue.minimumSessionMinutes || 12),
      cycleLengthDays: Number(rawValue.cycleLengthDays || 7),
      pointValueNaira: Number(rawValue.pointValueNaira || 150),
      dailyRewards: this.dailyRewards.controls.map((control, index) => ({
        day: Number(control.get('day')?.value || index + 1),
        points: Number(control.get('points')?.value || 0),
      })),
      leaderboard: {
        enabled: Boolean(rawValue.leaderboard.enabled),
        defaultMetric: enabledMetrics.includes(rawValue.leaderboard.defaultMetric)
          ? rawValue.leaderboard.defaultMetric
          : enabledMetrics[0],
        enabledMetrics,
        defaultTimeframe: rawValue.leaderboard.defaultTimeframe,
        refreshIntervalMinutes: Number(rawValue.leaderboard.refreshIntervalMinutes || 60),
        topSize: Number(rawValue.leaderboard.topSize || 10),
      },
    });
  }
}
