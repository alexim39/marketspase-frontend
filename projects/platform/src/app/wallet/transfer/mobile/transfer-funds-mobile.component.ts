import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CurrencyUtilsPipe } from '@shared/services';
import { TransferFundsComponent } from '../transfer-funds.component';
import { TransferService } from '../transfert.service';

type MobileTransferStep = 'destination' | 'recipient' | 'amount' | 'review';

@Component({
  selector: 'async-transfer-funds-mobile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, MatProgressBarModule, CurrencyUtilsPipe],
  templateUrl: './transfer-funds-mobile.component.html',
  styleUrls: ['./transfer-funds-mobile.component.scss'],
  providers: [TransferService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransferFundsMobileComponent extends TransferFundsComponent {
  readonly activeStep = signal<MobileTransferStep>('destination');
  readonly helpSheetOpen = signal(false);

  readonly quickAmounts = computed(() => {
    const maxAmount = this.maxTransferAmount();
    const amounts = [this.MIN_TRANSFER_AMOUNT, 500, 1000, 2500, 5000, 10000]
      .filter((amount) => amount <= maxAmount);

    return Array.from(new Set(amounts)).slice(0, 5);
  });

  readonly selectedTransferTypeDescription = computed(() => {
    const selectedType = this.currentTransferType();
    return this.TRANSFER_TYPES.find((type) => type.value === selectedType)?.description || '';
  });

  readonly mobileStepIndex = computed(() => {
    const order: MobileTransferStep[] = this.isOtherTransfer()
      ? ['destination', 'recipient', 'amount', 'review']
      : ['destination', 'amount', 'review'];

    return Math.max(1, order.indexOf(this.activeStep()) + 1);
  });

  readonly mobileStepCount = computed(() => this.isOtherTransfer() ? 4 : 3);

  selectTransferType(type: 'self' | 'other'): void {
    this.transferForm.get('transferType')?.setValue(type);
    this.activeStep.set(type === 'other' ? 'recipient' : 'amount');
  }

  setQuickAmount(amount: number): void {
    this.transferForm.get('amount')?.setValue(amount);
    this.transferForm.get('amount')?.markAsTouched();
  }

  goToStep(step: MobileTransferStep): void {
    if (step === 'recipient' && this.isSelfTransfer()) {
      return;
    }

    this.activeStep.set(step);
  }

  nextStep(): void {
    if (this.activeStep() === 'destination') {
      this.activeStep.set(this.isOtherTransfer() ? 'recipient' : 'amount');
      return;
    }

    if (this.activeStep() === 'recipient') {
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
      this.activeStep.set(this.isOtherTransfer() ? 'recipient' : 'destination');
      return;
    }

    if (this.activeStep() === 'recipient') {
      this.activeStep.set('destination');
    }
  }

  openHelpSheet(): void {
    this.helpSheetOpen.set(true);
  }

  closeHelpSheet(): void {
    this.helpSheetOpen.set(false);
  }

  amountValue(): number {
    return Number(this.transferForm.get('amount')?.value || 0);
  }

  noteLength(): number {
    return Number(this.transferForm.get('note')?.value?.length || 0);
  }
}
