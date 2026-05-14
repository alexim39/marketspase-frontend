import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import {
  GamificationActionRule,
  GamificationAdminConfig,
  GamificationAdminPayload,
  GamificationLevelThreshold,
  GamificationSettingsService,
} from './gamification-settings.service';

@Component({
  selector: 'app-gamification-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule],
  templateUrl: './gamification-settings.component.html',
  styleUrls: ['./gamification-settings.component.scss'],
})
export class GamificationSettingsComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly gamificationSettingsService = inject(GamificationSettingsService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly payload = signal<GamificationAdminPayload | null>(null);

  readonly configForm = this.formBuilder.group({
    enabled: this.formBuilder.nonNullable.control(true),
    refreshIntervalMinutes: this.formBuilder.nonNullable.control(15, [Validators.required, Validators.min(1), Validators.max(1440)]),
    celebrationWindowHours: this.formBuilder.nonNullable.control(72, [Validators.required, Validators.min(1), Validators.max(720)]),
    levelThresholds: this.formBuilder.array([]),
    actionRules: this.formBuilder.array([]),
  });

  readonly activeRuleCount = computed(() => this.actionRules.controls.filter((control) => control.get('isActive')?.value).length);
  readonly levelCount = computed(() => this.levelThresholds.length);
  readonly catalog = computed(() => this.payload()?.actionCatalog || []);

  constructor() {
    this.loadConfig();
  }

  get levelThresholds(): FormArray {
    return this.configForm.controls.levelThresholds;
  }

  get actionRules(): FormArray {
    return this.configForm.controls.actionRules;
  }

  trackLevelRow(index: number): number {
    return index;
  }

  trackRuleRow(index: number): number {
    return index;
  }

  loadConfig(): void {
    this.loading.set(true);

    this.gamificationSettingsService.getConfig()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (response) => {
          if (!response?.success) {
            this.snackBar.open('Unable to load gamification settings right now.', 'Close', { duration: 5000 });
            return;
          }

          this.applyPayload(response.data);
        },
        error: (error) => {
          this.snackBar.open(error?.error?.message || 'Unable to load gamification settings right now.', 'Close', { duration: 5000 });
        },
      });
  }

  saveConfig(): void {
    if (this.configForm.invalid) {
      this.configForm.markAllAsTouched();
      this.snackBar.open('Please fix the gamification fields before saving.', 'Close', { duration: 5000 });
      return;
    }

    const rawValue = this.configForm.getRawValue();
    const payload: GamificationAdminConfig = {
      enabled: Boolean(rawValue.enabled),
      refreshIntervalMinutes: Number(rawValue.refreshIntervalMinutes || 15),
      celebrationWindowHours: Number(rawValue.celebrationWindowHours || 72),
      levelThresholds: this.levelThresholds.controls.map((control, index) => ({
        level: index + 1,
        title: String(control.get('title')?.value || `Level ${index + 1}`).trim(),
        minExperiencePoints: Number(control.get('minExperiencePoints')?.value || 0),
        description: String(control.get('description')?.value || '').trim(),
        rewardLabel: String(control.get('rewardLabel')?.value || '').trim(),
        linkedBadgeKey: this.normalizeNullableString(control.get('linkedBadgeKey')?.value),
        featureKey: this.normalizeNullableString(control.get('featureKey')?.value),
        icon: String(control.get('icon')?.value || 'military_tech').trim(),
        accentColor: String(control.get('accentColor')?.value || '#7c3aed').trim(),
      })),
      actionRules: this.actionRules.controls.map((control, index) => ({
        actionKey: String(control.get('actionKey')?.value || '').trim(),
        label: String(control.get('label')?.value || '').trim(),
        description: String(control.get('description')?.value || '').trim(),
        category: String(control.get('category')?.value || 'engagement').trim(),
        roles: this.buildRoles({
          all: Boolean(control.get('roles.all')?.value),
          marketer: Boolean(control.get('roles.marketer')?.value),
          promoter: Boolean(control.get('roles.promoter')?.value),
        }),
        icon: String(control.get('icon')?.value || 'stars').trim(),
        accentColor: String(control.get('accentColor')?.value || '#7c3aed').trim(),
        experiencePoints: Number(control.get('experiencePoints')?.value || 0),
        useMetadataExperiencePoints: Boolean(control.get('useMetadataExperiencePoints')?.value),
        metadataExperiencePointsField: this.normalizeNullableString(control.get('metadataExperiencePointsField')?.value),
        multiplier: Number(control.get('multiplier')?.value || 1),
        maxExperiencePointsPerEvent: this.normalizeNullableNumber(control.get('maxExperiencePointsPerEvent')?.value),
        isActive: Boolean(control.get('isActive')?.value),
        sortOrder: Number(control.get('sortOrder')?.value || index * 10),
      })),
    };

    this.saving.set(true);
    this.gamificationSettingsService.updateConfig(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (response) => {
          if (!response?.success) {
            this.snackBar.open('Unable to save gamification settings right now.', 'Close', { duration: 5000 });
            return;
          }

          this.applyPayload(response.data);
          this.snackBar.open('Gamification settings updated.', 'Close', { duration: 3500 });
        },
        error: (error) => {
          this.snackBar.open(error?.error?.message || 'Unable to save gamification settings right now.', 'Close', { duration: 5000 });
        },
      });
  }

  addLevelThreshold(): void {
    const nextLevel = this.levelThresholds.length + 1;
    const previousPoints = Number(this.levelThresholds.at(this.levelThresholds.length - 1)?.get('minExperiencePoints')?.value || 0);
    this.levelThresholds.push(this.createLevelThresholdGroup({
      level: nextLevel,
      title: `Level ${nextLevel}`,
      minExperiencePoints: previousPoints + 80,
      description: '',
      rewardLabel: '',
      linkedBadgeKey: null,
      featureKey: null,
      icon: 'military_tech',
      accentColor: '#7c3aed',
    }));
  }

  removeLevelThreshold(index: number): void {
    if (this.levelThresholds.length <= 1) {
      return;
    }

    this.levelThresholds.removeAt(index);
    this.reindexLevels();
  }

  private applyPayload(payload: GamificationAdminPayload): void {
    this.payload.set(payload);

    this.configForm.patchValue({
      enabled: payload.config.enabled,
      refreshIntervalMinutes: payload.config.refreshIntervalMinutes,
      celebrationWindowHours: payload.config.celebrationWindowHours,
    }, { emitEvent: false });

    this.syncLevelThresholds(payload.config.levelThresholds);
    this.syncActionRules(payload.config.actionRules);
  }

  private syncLevelThresholds(levelThresholds: GamificationLevelThreshold[]): void {
    while (this.levelThresholds.length > 0) {
      this.levelThresholds.removeAt(this.levelThresholds.length - 1);
    }

    levelThresholds.forEach((threshold) => {
      this.levelThresholds.push(this.createLevelThresholdGroup(threshold));
    });
  }

  private syncActionRules(actionRules: GamificationActionRule[]): void {
    while (this.actionRules.length > 0) {
      this.actionRules.removeAt(this.actionRules.length - 1);
    }

    actionRules.forEach((rule) => {
      this.actionRules.push(this.formBuilder.group({
        actionKey: this.formBuilder.nonNullable.control(rule.actionKey, Validators.required),
        label: this.formBuilder.nonNullable.control(rule.label, Validators.required),
        description: this.formBuilder.nonNullable.control(rule.description || ''),
        category: this.formBuilder.nonNullable.control(rule.category || 'engagement', Validators.required),
        icon: this.formBuilder.nonNullable.control(rule.icon || 'stars', Validators.required),
        accentColor: this.formBuilder.nonNullable.control(rule.accentColor || '#7c3aed', Validators.required),
        experiencePoints: this.formBuilder.nonNullable.control(rule.experiencePoints, [Validators.required, Validators.min(0)]),
        useMetadataExperiencePoints: this.formBuilder.nonNullable.control(Boolean(rule.useMetadataExperiencePoints)),
        metadataExperiencePointsField: this.formBuilder.control(rule.metadataExperiencePointsField || ''),
        multiplier: this.formBuilder.nonNullable.control(rule.multiplier || 1, [Validators.required, Validators.min(0)]),
        maxExperiencePointsPerEvent: this.formBuilder.control(rule.maxExperiencePointsPerEvent),
        isActive: this.formBuilder.nonNullable.control(rule.isActive !== false),
        sortOrder: this.formBuilder.nonNullable.control(rule.sortOrder || 0, [Validators.required, Validators.min(0)]),
        roles: this.formBuilder.group({
          all: this.formBuilder.nonNullable.control(rule.roles.includes('all')),
          marketer: this.formBuilder.nonNullable.control(rule.roles.includes('marketer')),
          promoter: this.formBuilder.nonNullable.control(rule.roles.includes('promoter')),
        }),
      }));
    });
  }

  private createLevelThresholdGroup(threshold: GamificationLevelThreshold) {
    return this.formBuilder.group({
      level: this.formBuilder.nonNullable.control(threshold.level),
      title: this.formBuilder.nonNullable.control(threshold.title, Validators.required),
      minExperiencePoints: this.formBuilder.nonNullable.control(threshold.minExperiencePoints, [Validators.required, Validators.min(0)]),
      description: this.formBuilder.nonNullable.control(threshold.description || ''),
      rewardLabel: this.formBuilder.nonNullable.control(threshold.rewardLabel || ''),
      linkedBadgeKey: this.formBuilder.control(threshold.linkedBadgeKey || ''),
      featureKey: this.formBuilder.control(threshold.featureKey || ''),
      icon: this.formBuilder.nonNullable.control(threshold.icon || 'military_tech', Validators.required),
      accentColor: this.formBuilder.nonNullable.control(threshold.accentColor || '#7c3aed', Validators.required),
    });
  }

  private reindexLevels(): void {
    this.levelThresholds.controls.forEach((control, index) => {
      control.get('level')?.setValue(index + 1, { emitEvent: false });
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

  private normalizeNullableString(value: unknown): string | null {
    const normalized = String(value || '').trim();
    return normalized ? normalized : null;
  }

  private normalizeNullableNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }
}
