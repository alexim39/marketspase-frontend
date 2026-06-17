import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { PpcPricingConfig, PpcPricingSettingsService } from './ppc-pricing-settings.service';

@Component({
  selector: 'app-ppc-pricing-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, MatSnackBarModule],
  templateUrl: './ppc-pricing-settings.component.html',
  styleUrls: ['./ppc-pricing-settings.component.scss'],
})
export class PpcPricingSettingsComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly pricingService = inject(PpcPricingSettingsService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly updatedAt = signal<string | null>(null);

  readonly form = this.formBuilder.group({
    enabled: this.formBuilder.nonNullable.control(true),
    currency: this.formBuilder.nonNullable.control('NGN', [Validators.required, Validators.minLength(3), Validators.maxLength(3)]),
    defaultCostPerClick: this.formBuilder.nonNullable.control(80, [Validators.required, Validators.min(1), Validators.max(100000)]),
    minCostPerClick: this.formBuilder.nonNullable.control(20, [Validators.required, Validators.min(1), Validators.max(100000)]),
    maxCostPerClick: this.formBuilder.nonNullable.control(500, [Validators.required, Validators.min(1), Validators.max(100000)]),
    allowMarketerOverride: this.formBuilder.nonNullable.control(false),
    changeReason: this.formBuilder.nonNullable.control('', [Validators.maxLength(500)]),
  });

  readonly formValue = signal(this.form.getRawValue());

  readonly pricingSummary = computed(() => {
    const value = this.formValue();
    const defaultCost = Number(value.defaultCostPerClick || 0);
    const minCost = Number(value.minCostPerClick || 0);
    const maxCost = Number(value.maxCostPerClick || 0);
    const sampleBudget = 10000;

    return {
      state: value.enabled ? 'Active' : 'Using fallback',
      defaultCost,
      range: `${this.formatNaira(minCost)} - ${this.formatNaira(maxCost)}`,
      estimatedClicks: defaultCost > 0 ? Math.floor(sampleBudget / defaultCost) : 0,
      overrideLabel: value.allowMarketerOverride ? 'Marketer override allowed' : 'Admin fixed pricing',
    };
  });

  constructor() {
    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.formValue.set(this.form.getRawValue()));

    this.loadConfig();
  }

  save(): void {
    const rawValue = this.form.getRawValue();
    const minCost = Number(rawValue.minCostPerClick || 0);
    const maxCost = Number(rawValue.maxCostPerClick || 0);
    const defaultCost = Number(rawValue.defaultCostPerClick || 0);

    if (this.form.invalid || minCost > maxCost || defaultCost < minCost || defaultCost > maxCost) {
      this.form.markAllAsTouched();
      this.snackBar.open('Please keep the default CPC inside the configured min/max range.', 'Close', { duration: 5000 });
      return;
    }

    const payload: PpcPricingConfig = {
      enabled: Boolean(rawValue.enabled),
      currency: String(rawValue.currency || 'NGN').trim().toUpperCase(),
      defaultCostPerClick: this.roundCurrency(defaultCost),
      minCostPerClick: this.roundCurrency(minCost),
      maxCostPerClick: this.roundCurrency(maxCost),
      allowMarketerOverride: Boolean(rawValue.allowMarketerOverride),
      changeReason: String(rawValue.changeReason || '').trim(),
    };

    this.saving.set(true);
    this.pricingService.updateConfig(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (response) => {
          if (!response?.success) {
            this.snackBar.open('Unable to save PPC pricing settings right now.', 'Close', { duration: 5000 });
            return;
          }

          this.applyConfig(response.data);
          this.snackBar.open(response.message || 'PPC pricing settings updated.', 'Close', { duration: 3500 });
        },
        error: (error) => {
          this.snackBar.open(error?.error?.message || 'Unable to save PPC pricing settings right now.', 'Close', { duration: 5000 });
        },
      });
  }

  resetToRecommended(): void {
    this.form.patchValue({
      enabled: true,
      currency: 'NGN',
      defaultCostPerClick: 80,
      minCostPerClick: 20,
      maxCostPerClick: 500,
      allowMarketerOverride: false,
      changeReason: 'Reset to MarketSpase recommended PPC pricing.',
    });
  }

  private loadConfig(): void {
    this.loading.set(true);
    this.pricingService.getConfig()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (response) => {
          if (!response?.success) {
            this.snackBar.open('Unable to load PPC pricing settings right now.', 'Close', { duration: 5000 });
            return;
          }

          this.applyConfig(response.data);
        },
        error: (error) => {
          this.snackBar.open(error?.error?.message || 'Unable to load PPC pricing settings right now.', 'Close', { duration: 5000 });
        },
      });
  }

  private applyConfig(config: PpcPricingConfig): void {
    this.updatedAt.set(config.updatedAt ? new Date(config.updatedAt).toISOString() : null);
    this.form.patchValue({
      enabled: config.enabled !== false,
      currency: config.currency || 'NGN',
      defaultCostPerClick: Number(config.defaultCostPerClick || 80),
      minCostPerClick: Number(config.minCostPerClick || 20),
      maxCostPerClick: Number(config.maxCostPerClick || 500),
      allowMarketerOverride: Boolean(config.allowMarketerOverride),
      changeReason: config.changeReason || '',
    }, { emitEvent: false });
    this.formValue.set(this.form.getRawValue());
  }

  private roundCurrency(value: number): number {
    return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
  }

  private formatNaira(value: number): string {
    return `NGN ${this.roundCurrency(value).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
  }
}
