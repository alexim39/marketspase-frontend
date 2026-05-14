import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import {
  BadgeAdminConfig,
  BadgeAdminPayload,
  BadgeDefinition,
  BadgeDefinitionMutationPayload,
  BadgeLevelThreshold,
  BadgeSettingsService,
} from './badge-settings.service';

@Component({
  selector: 'app-badge-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule],
  templateUrl: './badge-settings.component.html',
  styleUrls: ['./badge-settings.component.scss'],
})
export class BadgeSettingsComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly badgeSettingsService = inject(BadgeSettingsService);

  readonly loading = signal(true);
  readonly savingConfig = signal(false);
  readonly savingBadge = signal(false);
  readonly deletingBadge = signal(false);
  readonly payload = signal<BadgeAdminPayload | null>(null);
  readonly selectedBadgeId = signal<string | null>(null);

  readonly configForm = this.formBuilder.group({
    enabled: this.formBuilder.nonNullable.control(true),
    feedRefreshMinutes: this.formBuilder.nonNullable.control(15, [Validators.required, Validators.min(1), Validators.max(1440)]),
    evaluationCooldownMinutes: this.formBuilder.nonNullable.control(10, [Validators.required, Validators.min(1), Validators.max(1440)]),
    celebrationWindowHours: this.formBuilder.nonNullable.control(72, [Validators.required, Validators.min(1), Validators.max(720)]),
    levelThresholds: this.formBuilder.array([]),
  });

  readonly badgeForm = this.formBuilder.group({
    key: this.formBuilder.nonNullable.control('', Validators.required),
    title: this.formBuilder.nonNullable.control('', Validators.required),
    description: this.formBuilder.nonNullable.control('', Validators.required),
    shortDescription: this.formBuilder.nonNullable.control(''),
    icon: this.formBuilder.nonNullable.control('military_tech', Validators.required),
    accentColor: this.formBuilder.nonNullable.control('#7c3aed', Validators.required),
    category: this.formBuilder.nonNullable.control('engagement', Validators.required),
    metric: this.formBuilder.nonNullable.control('login_streak_current', Validators.required),
    targetValue: this.formBuilder.nonNullable.control(1, [Validators.required, Validators.min(1)]),
    experiencePoints: this.formBuilder.nonNullable.control(10, [Validators.required, Validators.min(0)]),
    rewardLabel: this.formBuilder.nonNullable.control('10 XP'),
    isActive: this.formBuilder.nonNullable.control(true),
    isFeatured: this.formBuilder.nonNullable.control(true),
    sortOrder: this.formBuilder.nonNullable.control(0, [Validators.required, Validators.min(0)]),
    roles: this.formBuilder.group({
      all: this.formBuilder.nonNullable.control(true),
      marketer: this.formBuilder.nonNullable.control(false),
      promoter: this.formBuilder.nonNullable.control(false),
    }),
  });

  readonly definitions = computed(() => this.payload()?.definitions || []);
  readonly metricCatalog = computed(() => this.payload()?.metricCatalog || []);
  readonly categories = computed(() => this.payload()?.categories || []);
  readonly activeCount = computed(() => this.definitions().filter((badge) => badge.isActive).length);
  readonly selectedBadge = computed(() => (
    this.definitions().find((badge) => badge.id === this.selectedBadgeId()) || null
  ));
  readonly configSummary = computed(() => this.payload()?.config || null);

  constructor() {
    this.loadConfig();
  }

  get levelThresholds(): FormArray {
    return this.configForm.controls.levelThresholds;
  }

  trackBadge(_: number, badge: BadgeDefinition): string {
    return badge.id;
  }

  trackLevelRow(index: number): number {
    return index;
  }

  loadConfig(): void {
    this.loading.set(true);

    this.badgeSettingsService.getConfig()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (response) => {
          if (!response?.success) {
            this.snackBar.open('Unable to load badge settings right now.', 'Close', { duration: 5000 });
            return;
          }

          this.applyPayload(response.data);
        },
        error: (error) => {
          this.snackBar.open(error?.error?.message || 'Unable to load badge settings right now.', 'Close', { duration: 5000 });
        },
      });
  }

  saveConfig(): void {
    if (this.configForm.invalid) {
      this.configForm.markAllAsTouched();
      this.snackBar.open('Please fix the badge configuration fields before saving.', 'Close', { duration: 5000 });
      return;
    }

    const rawValue = this.configForm.getRawValue();
    const payload: BadgeAdminConfig = {
      enabled: Boolean(rawValue.enabled),
      feedRefreshMinutes: Number(rawValue.feedRefreshMinutes || 15),
      evaluationCooldownMinutes: Number(rawValue.evaluationCooldownMinutes || 10),
      celebrationWindowHours: Number(rawValue.celebrationWindowHours || 72),
      levelThresholds: this.levelThresholds.controls.map((control, index) => ({
        level: index + 1,
        title: String(control.get('title')?.value || `Level ${index + 1}`).trim(),
        minExperiencePoints: Number(control.get('minExperiencePoints')?.value || 0),
      })),
    };

    this.savingConfig.set(true);
    this.badgeSettingsService.updateConfig(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.savingConfig.set(false)),
      )
      .subscribe({
        next: (response) => {
          if (!response?.success) {
            this.snackBar.open('Unable to save badge configuration right now.', 'Close', { duration: 5000 });
            return;
          }

          this.applyPayload(response.data);
          this.snackBar.open('Badge configuration updated.', 'Close', { duration: 3500 });
        },
        error: (error) => {
          this.snackBar.open(error?.error?.message || 'Unable to save badge configuration right now.', 'Close', { duration: 5000 });
        },
      });
  }

  selectBadge(badgeId: string): void {
    const badge = this.definitions().find((entry) => entry.id === badgeId);
    if (!badge) {
      return;
    }

    this.selectedBadgeId.set(badge.id);
    this.badgeForm.patchValue({
      key: badge.key,
      title: badge.title,
      description: badge.description,
      shortDescription: badge.shortDescription || '',
      icon: badge.icon,
      accentColor: badge.accentColor,
      category: badge.category,
      metric: badge.criteria.metric,
      targetValue: badge.criteria.targetValue,
      experiencePoints: badge.reward.experiencePoints,
      rewardLabel: badge.reward.label || '',
      isActive: badge.isActive,
      isFeatured: badge.isFeatured,
      sortOrder: badge.sortOrder,
      roles: {
        all: badge.roles.includes('all'),
        marketer: badge.roles.includes('marketer'),
        promoter: badge.roles.includes('promoter'),
      },
    });
  }

  startNewBadge(): void {
    this.selectedBadgeId.set(null);
    this.badgeForm.reset({
      key: '',
      title: '',
      description: '',
      shortDescription: '',
      icon: 'military_tech',
      accentColor: '#7c3aed',
      category: this.categories()[0] || 'engagement',
      metric: this.metricCatalog()[0]?.value || 'login_streak_current',
      targetValue: 1,
      experiencePoints: 10,
      rewardLabel: '10 XP',
      isActive: true,
      isFeatured: true,
      sortOrder: this.definitions().length ? Math.max(...this.definitions().map((badge) => badge.sortOrder)) + 10 : 0,
      roles: {
        all: true,
        marketer: false,
        promoter: false,
      },
    });
  }

  saveBadge(): void {
    if (this.badgeForm.invalid) {
      this.badgeForm.markAllAsTouched();
      this.snackBar.open('Please fix the badge fields before saving.', 'Close', { duration: 5000 });
      return;
    }

    const rawValue = this.badgeForm.getRawValue();
    const roles = this.buildRoles(rawValue.roles);
    const payload: BadgeDefinitionMutationPayload = {
      key: String(rawValue.key || '').trim(),
      title: String(rawValue.title || '').trim(),
      description: String(rawValue.description || '').trim(),
      shortDescription: String(rawValue.shortDescription || '').trim(),
      icon: String(rawValue.icon || 'military_tech').trim(),
      accentColor: String(rawValue.accentColor || '#7c3aed').trim(),
      category: String(rawValue.category || 'engagement').trim(),
      roles,
      criteria: {
        metric: String(rawValue.metric || '').trim(),
        targetValue: Number(rawValue.targetValue || 1),
      },
      reward: {
        experiencePoints: Number(rawValue.experiencePoints || 0),
        label: String(rawValue.rewardLabel || '').trim(),
      },
      isActive: Boolean(rawValue.isActive),
      isFeatured: Boolean(rawValue.isFeatured),
      sortOrder: Number(rawValue.sortOrder || 0),
    };

    const request$ = this.selectedBadgeId()
      ? this.badgeSettingsService.updateDefinition(this.selectedBadgeId()!, payload)
      : this.badgeSettingsService.createDefinition(payload);

    this.savingBadge.set(true);
    request$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.savingBadge.set(false)),
      )
      .subscribe({
        next: (response) => {
          if (!response?.success) {
            this.snackBar.open('Unable to save this badge right now.', 'Close', { duration: 5000 });
            return;
          }

          this.snackBar.open(response.message || 'Badge saved successfully.', 'Close', { duration: 3500 });
          this.loadConfig();
        },
        error: (error) => {
          this.snackBar.open(error?.error?.message || 'Unable to save this badge right now.', 'Close', { duration: 5000 });
        },
      });
  }

  deleteBadge(): void {
    const badgeId = this.selectedBadgeId();
    if (!badgeId) {
      return;
    }

    this.deletingBadge.set(true);
    this.badgeSettingsService.deleteDefinition(badgeId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.deletingBadge.set(false)),
      )
      .subscribe({
        next: (response) => {
          if (!response?.success) {
            this.snackBar.open('Unable to remove this badge right now.', 'Close', { duration: 5000 });
            return;
          }

          this.snackBar.open(response.message || 'Badge removed.', 'Close', { duration: 4000 });
          this.startNewBadge();
          this.loadConfig();
        },
        error: (error) => {
          this.snackBar.open(error?.error?.message || 'Unable to remove this badge right now.', 'Close', { duration: 5000 });
        }
      });
  }

  addLevelThreshold(): void {
    const nextLevel = this.levelThresholds.length + 1;
    const previousPoints = Number(this.levelThresholds.at(this.levelThresholds.length - 1)?.get('minExperiencePoints')?.value || 0);
    this.levelThresholds.push(this.formBuilder.group({
      level: this.formBuilder.nonNullable.control(nextLevel),
      title: this.formBuilder.nonNullable.control(`Level ${nextLevel}`, Validators.required),
      minExperiencePoints: this.formBuilder.nonNullable.control(previousPoints + 50, [Validators.required, Validators.min(0)]),
    }));
  }

  removeLevelThreshold(index: number): void {
    if (this.levelThresholds.length <= 1) {
      return;
    }
    this.levelThresholds.removeAt(index);
    this.reindexLevels();
  }

  private reindexLevels(): void {
    this.levelThresholds.controls.forEach((control, index) => {
      control.get('level')?.setValue(index + 1, { emitEvent: false });
    });
  }

  private applyPayload(payload: BadgeAdminPayload): void {
    this.payload.set(payload);

    this.configForm.patchValue({
      enabled: payload.config.enabled,
      feedRefreshMinutes: payload.config.feedRefreshMinutes,
      evaluationCooldownMinutes: payload.config.evaluationCooldownMinutes,
      celebrationWindowHours: payload.config.celebrationWindowHours,
    }, { emitEvent: false });

    this.syncLevelThresholds(payload.config.levelThresholds);

    if (this.selectedBadgeId()) {
      this.selectBadge(this.selectedBadgeId()!);
    } else if (payload.definitions.length) {
      this.selectBadge(payload.definitions[0].id);
    } else {
      this.startNewBadge();
    }
  }

  private syncLevelThresholds(levelThresholds: BadgeLevelThreshold[]): void {
    while (this.levelThresholds.length > 0) {
      this.levelThresholds.removeAt(this.levelThresholds.length - 1);
    }

    levelThresholds.forEach((threshold) => {
      this.levelThresholds.push(this.formBuilder.group({
        level: this.formBuilder.nonNullable.control(threshold.level),
        title: this.formBuilder.nonNullable.control(threshold.title, Validators.required),
        minExperiencePoints: this.formBuilder.nonNullable.control(threshold.minExperiencePoints, [Validators.required, Validators.min(0)]),
      }));
    });
  }

  private buildRoles(rawRoles: { all: boolean; marketer: boolean; promoter: boolean }): string[] {
    const roles = [
      rawRoles.all ? 'all' : null,
      rawRoles.marketer ? 'marketer' : null,
      rawRoles.promoter ? 'promoter' : null,
    ].filter(Boolean) as string[];

    return roles.length ? roles : ['all'];
  }
}
