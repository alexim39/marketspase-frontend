import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import {
  AdminPaymentCurrencyConfig,
  AdminSupportedPaymentCurrency,
  PaymentSettingsService,
} from './payment-settings.service';

@Component({
  selector: 'app-payment-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule],
  templateUrl: './payment-settings.component.html',
  styleUrls: ['./payment-settings.component.scss'],
})
export class PaymentSettingsComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly paymentSettingsService = inject(PaymentSettingsService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly updatedAt = signal<string | null>(null);

  readonly form = this.formBuilder.group({
    baseCurrency: this.formBuilder.nonNullable.control('NGN', Validators.required),
    ratesSource: this.formBuilder.nonNullable.control<'manual' | 'exchangerate_host'>('exchangerate_host', Validators.required),
    refreshIntervalMinutes: this.formBuilder.nonNullable.control(60, [Validators.required, Validators.min(5), Validators.max(1440)]),
    quoteLockMinutes: this.formBuilder.nonNullable.control(30, [Validators.required, Validators.min(5), Validators.max(720)]),
    supportedCurrencies: this.formBuilder.array([]),
  });

  readonly configSummary = computed(() => ({
    enabledForDisplay: this.currencyRows.controls.filter((row) => row.get('display')?.value).length,
    enabledForDeposit: this.currencyRows.controls.filter((row) => row.get('deposit')?.value).length,
    enabledForCheckout: this.currencyRows.controls.filter((row) => row.get('checkout')?.value).length,
    enabledForWithdrawal: this.currencyRows.controls.filter((row) => row.get('withdrawal')?.value).length,
  }));

  constructor() {
    this.loadConfig();
  }

  get currencyRows(): FormArray<FormGroup> {
    return this.form.controls.supportedCurrencies as unknown as FormArray<FormGroup>;
  }

  addCurrencyRow(): void {
    this.currencyRows.push(this.createCurrencyGroup({
      code: '',
      name: '',
      symbol: '',
      sortOrder: this.currencyRows.length,
      paystackChargeSupported: false,
      paystackTransferSupported: false,
      capabilities: {
        display: true,
        deposit: false,
        checkout: false,
        withdrawal: false,
      },
    }, 1));
  }

  removeCurrencyRow(index: number): void {
    this.currencyRows.removeAt(index);
  }

  save(): void {
    if (this.form.invalid || this.currencyRows.length === 0) {
      this.form.markAllAsTouched();
      this.snackBar.open('Please fix the highlighted payment settings before saving.', 'Close', { duration: 5000 });
      return;
    }

    const rawValue = this.form.getRawValue();
    const baseCurrency = String(rawValue.baseCurrency || 'NGN').trim().toUpperCase();
    const supportedCurrencies = this.currencyRows.controls
      .map((control, index) => {
        const code = String(control.get('code')?.value || '').trim().toUpperCase();
        if (!code) {
          return null;
        }

        return {
          code,
          name: String(control.get('name')?.value || code).trim() || code,
          symbol: String(control.get('symbol')?.value || '').trim(),
          sortOrder: index,
          paystackChargeSupported: Boolean(control.get('paystackChargeSupported')?.value),
          paystackTransferSupported: Boolean(control.get('paystackTransferSupported')?.value),
          capabilities: {
            display: Boolean(control.get('display')?.value),
            deposit: Boolean(control.get('deposit')?.value),
            checkout: Boolean(control.get('checkout')?.value),
            withdrawal: Boolean(control.get('withdrawal')?.value),
          },
        } satisfies AdminSupportedPaymentCurrency;
      })
      .filter((currency): currency is AdminSupportedPaymentCurrency => Boolean(currency));

    if (!supportedCurrencies.some((currency) => currency.code === baseCurrency)) {
      supportedCurrencies.unshift({
        code: baseCurrency,
        name: baseCurrency,
        symbol: baseCurrency,
        sortOrder: 0,
        paystackChargeSupported: true,
        paystackTransferSupported: baseCurrency === 'NGN',
        capabilities: {
          display: true,
          deposit: true,
          checkout: true,
          withdrawal: baseCurrency === 'NGN',
        },
      });
    }

    const rates: Record<string, number> = {};
    supportedCurrencies.forEach((currency) => {
      const matchingRow = this.currencyRows.controls.find((control) => (
        String(control.get('code')?.value || '').trim().toUpperCase() === currency.code
      ));
      const rawRate = Number(matchingRow?.get('rate')?.value || 0);
      rates[currency.code] = currency.code === baseCurrency ? 1 : Math.max(0.000001, rawRate || 0);
    });
    rates[baseCurrency] = 1;

    const payload: AdminPaymentCurrencyConfig = {
      baseCurrency,
      ratesSource: rawValue.ratesSource || 'exchangerate_host',
      refreshIntervalMinutes: Math.max(5, Math.min(1440, Number(rawValue.refreshIntervalMinutes || 60))),
      quoteLockMinutes: Math.max(5, Math.min(720, Number(rawValue.quoteLockMinutes || 30))),
      supportedCurrencies,
      rates,
    };

    this.saving.set(true);
    this.paymentSettingsService.updateConfig(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (response) => {
          if (!response?.success) {
            this.snackBar.open('Unable to save payment settings right now.', 'Close', { duration: 5000 });
            return;
          }

          this.applyConfig(response.data);
          this.snackBar.open('Payment settings updated.', 'Close', { duration: 3500 });
        },
        error: (error) => {
          this.snackBar.open(error?.error?.message || 'Unable to save payment settings right now.', 'Close', { duration: 5000 });
        },
      });
  }

  trackCurrencyRow(index: number): number {
    return index;
  }

  private loadConfig(): void {
    this.loading.set(true);

    this.paymentSettingsService.getConfig()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (response) => {
          if (!response?.success) {
            this.snackBar.open('Unable to load payment settings right now.', 'Close', { duration: 5000 });
            return;
          }

          this.applyConfig(response.data);
        },
        error: (error) => {
          this.snackBar.open(error?.error?.message || 'Unable to load payment settings right now.', 'Close', { duration: 5000 });
        },
      });
  }

  private applyConfig(config: AdminPaymentCurrencyConfig): void {
    this.updatedAt.set(config.updatedAt ? new Date(config.updatedAt).toISOString() : null);
    this.form.patchValue({
      baseCurrency: config.baseCurrency || 'NGN',
      ratesSource: (config.ratesSource as 'manual' | 'exchangerate_host') || 'exchangerate_host',
      refreshIntervalMinutes: Number(config.refreshIntervalMinutes || 60),
      quoteLockMinutes: Number(config.quoteLockMinutes || 30),
    }, { emitEvent: false });

    this.currencyRows.clear();
    (config.supportedCurrencies || []).forEach((currency, index) => {
      const rate = Number(config.rates?.[currency.code] || (currency.code === config.baseCurrency ? 1 : 0));
      this.currencyRows.push(this.createCurrencyGroup(currency, rate, index));
    });
  }

  private createCurrencyGroup(currency: Partial<AdminSupportedPaymentCurrency>, rate = 1, sortOrder = 0): FormGroup {
    return this.formBuilder.group({
      code: this.formBuilder.nonNullable.control(String(currency.code || '').toUpperCase(), [Validators.required, Validators.minLength(3)]),
      name: this.formBuilder.nonNullable.control(currency.name || '', Validators.required),
      symbol: this.formBuilder.nonNullable.control(currency.symbol || ''),
      rate: this.formBuilder.nonNullable.control(Number(rate || 1), [Validators.required, Validators.min(0.000001)]),
      sortOrder: this.formBuilder.nonNullable.control(Number(currency.sortOrder ?? sortOrder)),
      display: this.formBuilder.nonNullable.control(Boolean(currency.capabilities?.display ?? true)),
      deposit: this.formBuilder.nonNullable.control(Boolean(currency.capabilities?.deposit)),
      checkout: this.formBuilder.nonNullable.control(Boolean(currency.capabilities?.checkout)),
      withdrawal: this.formBuilder.nonNullable.control(Boolean(currency.capabilities?.withdrawal)),
      paystackChargeSupported: this.formBuilder.nonNullable.control(Boolean(currency.paystackChargeSupported)),
      paystackTransferSupported: this.formBuilder.nonNullable.control(Boolean(currency.paystackTransferSupported)),
    });
  }
}
