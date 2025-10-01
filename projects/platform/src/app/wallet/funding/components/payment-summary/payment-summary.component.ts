import { Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';

@Component({
  selector: 'payment-summary',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './payment-summary.component.html',
  styleUrls: ['./payment-summary.component.scss']
})
export class PaymentSummaryComponent {
  @Input() amount: number = 0;
  @Input() feeRate: number = 0;
  @Input() processingFee: number = 0;
  @Input() totalAmount: number = 0;
  @Input() newBalance: number = 0;
}