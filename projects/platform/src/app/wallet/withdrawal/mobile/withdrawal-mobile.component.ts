import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CurrencyUtilsPipe } from '@shared/services';
import { WithdrawalComponent } from '../withdrawal.component';
import { BankInterface } from '../withdrawal.component';
import { SavedAccountInterface, WithdrawalService } from '../withdrawal.service';

type WithdrawalStep = 'account' | 'amount' | 'review';

@Component({
  selector: 'async-withdrawal-mobile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, MatProgressBarModule, CurrencyUtilsPipe],
  templateUrl: './withdrawal-mobile.component.html',
  styleUrls: ['./withdrawal-mobile.component.scss'],
  providers: [WithdrawalService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WithdrawalMobileComponent extends WithdrawalComponent {
  readonly activeStep = signal<WithdrawalStep>('account');
  readonly bankSheetOpen = signal(false);
  readonly savedAccountSheetOpen = signal(false);
  readonly helpSheetOpen = signal(false);

  readonly stepItems = computed(() => [0, 1, 2]);

  readonly currentStepIndex = computed(() => {
    const order: WithdrawalStep[] = ['account', 'amount', 'review'];
    return Math.max(1, order.indexOf(this.activeStep()) + 1);
  });

  readonly quickAmounts = computed(() => {
    const maxAmount = this.maxWithdrawableAmount();
    const amounts = [this.MIN_WITHDRAWAL_AMOUNT, 500, 1000, 2500, 5000, 10000]
      .filter((amount) => amount <= maxAmount);

    return Array.from(new Set(amounts)).slice(0, 5);
  });

  readonly selectedBankLabel = computed(() => {
    const bankCode = this.withdrawForm?.get('bank')?.value;
    if (this.selectedBankName()) {
      return this.selectedBankName();
    }

    return this.banks().find((bank) => bank.code === bankCode)?.name || '';
  });

  readonly accountResolved = computed(() => Boolean(this.withdrawForm?.get('accountName')?.value));

  readonly bankOptions = computed(() => this.filteredBanks().slice(0, 80));

  openBankSheet(): void {
    this.bankSheetOpen.set(true);
  }

  closeBankSheet(): void {
    this.bankSheetOpen.set(false);
  }

  openSavedAccountSheet(): void {
    this.savedAccountSheetOpen.set(true);
  }

  closeSavedAccountSheet(): void {
    this.savedAccountSheetOpen.set(false);
  }

  openHelpSheet(): void {
    this.helpSheetOpen.set(true);
  }

  closeHelpSheet(): void {
    this.helpSheetOpen.set(false);
  }

  selectBank(bank: BankInterface): void {
    this.withdrawForm.patchValue({
      bank: bank.code,
      accountNumber: '',
      accountName: '',
    });
    this.selectedBankName.set(bank.name);
    this.closeBankSheet();
  }

  selectSavedAccount(account: SavedAccountInterface): void {
    this.populateForm(account.accountNumber);
    this.closeSavedAccountSheet();
    this.activeStep.set('amount');
  }

  setQuickAmount(amount: number): void {
    this.withdrawForm.get('amount')?.setValue(amount);
    this.withdrawForm.get('amount')?.markAsTouched();
  }

  nextStep(): void {
    if (this.activeStep() === 'account') {
      this.activeStep.set('amount');
      return;
    }

    if (this.activeStep() === 'amount') {
      this.activeStep.set('review');
    }
  }

  previousStep(): void {
    if (this.activeStep() === 'review') {
      this.activeStep.set('amount');
      return;
    }

    if (this.activeStep() === 'amount') {
      this.activeStep.set('account');
    }
  }

  amountValue(): number {
    return Number(this.withdrawForm?.get('amount')?.value || 0);
  }

  accountNumberValue(): string {
    return String(this.withdrawForm?.get('accountNumber')?.value || '');
  }

  accountNameValue(): string {
    return String(this.withdrawForm?.get('accountName')?.value || '');
  }
}
