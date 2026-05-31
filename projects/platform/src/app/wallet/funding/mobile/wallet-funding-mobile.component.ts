import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CurrencyUtilsPipe } from '@shared/services';
import { PaystackService } from '../../../common/services/paystack.service';
import { WalletService } from '../../wallet.service';
import { WalletFundingComponent } from '../funding.component';

type FundingStep = 'amount' | 'review' | 'status';

@Component({
  selector: 'wallet-funding-mobile',
  standalone: true,
  providers: [PaystackService, WalletService],
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, CurrencyUtilsPipe],
  templateUrl: './wallet-funding-mobile.component.html',
  styleUrls: ['./wallet-funding-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WalletFundingMobileComponent extends WalletFundingComponent {
  readonly activeStep = signal<FundingStep>('amount');
  readonly currencySheetOpen = signal(false);
  readonly helpSheetOpen = signal(false);

  readonly stepItems = computed(() => [
    { id: 'amount' as const, label: 'Amount', icon: 'payments' },
    { id: 'review' as const, label: 'Review', icon: 'fact_check' },
    { id: 'status' as const, label: 'Status', icon: 'verified' }
  ]);

  readonly currentStepIndex = computed(() => {
    const order: FundingStep[] = ['amount', 'review', 'status'];
    return Math.max(1, order.indexOf(this.activeStep()) + 1);
  });

  readonly popularAmounts = computed(() => this.quickAmounts.slice(0, 5));

  readonly selectedCurrencyDetails = computed(() => (
    this.supportedFundingCurrencies().find((currency) => currency.code === this.selectedCurrency())
  ));

  readonly amountIsValid = computed(() => (
    this.selectedAmount() >= this.minimumAmountForSelectedCurrency()
      && this.selectedAmount() <= this.maxFundingAmount
      && !!this.fundingForm?.valid
      && !this.isQuoteLoading()
  ));

  readonly balanceAfterFunding = computed(() => this.newBalance());

  openCurrencySheet(): void {
    if (this.isProcessingPayment() || !!this.paymentStatus()) {
      return;
    }
    this.currencySheetOpen.set(true);
  }

  closeCurrencySheet(): void {
    this.currencySheetOpen.set(false);
  }

  selectCurrency(currencyCode: string): void {
    this.onCurrencyChange(currencyCode);
    this.closeCurrencySheet();
  }

  openHelpSheet(): void {
    this.helpSheetOpen.set(true);
  }

  closeHelpSheet(): void {
    this.helpSheetOpen.set(false);
  }

  goToReview(): void {
    if (!this.amountIsValid()) {
      this.fundingForm?.get('amount')?.markAsTouched();
      return;
    }
    this.activeStep.set('review');
  }

  goToAmount(): void {
    if (!this.isProcessingPayment()) {
      this.activeStep.set('amount');
    }
  }

  override resetPayment(): void {
    super.resetPayment();
    this.activeStep.set('amount');
  }

  override async initiatePayment(): Promise<void> {
    this.activeStep.set('status');
    await super.initiatePayment();
    if (!this.paymentStatus() && !this.isProcessingPayment()) {
      this.activeStep.set('review');
    }
  }

  setAmount(amount: number): void {
    this.selectQuickAmount(amount);
  }

  amountInputChanged(event: Event): void {
    this.onCustomAmountChange(event);
  }
}
