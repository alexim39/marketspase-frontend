import { Component, Input } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export interface PaymentStatusData {
  success: boolean;
  message: string;
  reference?: string;
  amount?: number;
  timestamp?: Date;
}

@Component({
  selector: 'payment-status',
  standalone: true,
  imports: [CommonModule, MatIconModule, DatePipe, CurrencyPipe],
  templateUrl: './payment-status.component.html',
  styleUrls: ['./payment-status.component.scss']
})
export class PaymentStatusComponent {
  @Input() status: PaymentStatusData | null = null;
  @Input() retryCount: number = 0;
  @Input() maxRetries: number = 3;
}