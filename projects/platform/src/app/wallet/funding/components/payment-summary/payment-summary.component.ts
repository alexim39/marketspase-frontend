import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrencyUtilsPipe, UserInterface } from '../../../../../../../shared-services/src/public-api';

@Component({
  selector: 'payment-summary',
  standalone: true,
  imports: [CommonModule, CurrencyUtilsPipe],
  templateUrl: './payment-summary.component.html',
  styleUrls: ['./payment-summary.component.scss']
})
export class PaymentSummaryComponent {
  @Input() amount: number = 0;
  @Input() feeRate: number = 0;
  @Input() processingFee: number = 0;
  @Input() totalAmount: number = 0;
  @Input() newBalance: number = 0;
  @Input({ required: true }) user: UserInterface | null = null;
}