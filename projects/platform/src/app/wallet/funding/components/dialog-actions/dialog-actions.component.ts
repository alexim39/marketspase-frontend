import { Component, Input, Output, EventEmitter, inject, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PaymentStatusData } from '../payment-status/payment-status.component';
import { DeviceService } from '../../../../../../../shared-services/src/public-api';

@Component({
  selector: 'dialog-actions',
  standalone: true,
  imports: [
    CommonModule, 
    MatButtonModule, 
    MatIconModule, 
    MatProgressSpinnerModule, 
    MatTooltipModule,
    CurrencyPipe
  ],
  templateUrl: './dialog-actions.component.html',
  styleUrls: ['./dialog-actions.component.scss']
})
export class DialogActionsComponent {
    private readonly deviceService = inject(DeviceService);
  // Computed properties for better performance
  protected readonly deviceType = computed(() => this.deviceService.type());
  
  @Input() paymentStatus: PaymentStatusData | null = null;
  @Input() isProcessing: boolean = false;
  @Input() canProceed: boolean = false;
  @Input() retryCount: number = 0;
  @Input() maxRetries: number = 3;
  @Input() totalAmount: number = 0;
  @Output() close = new EventEmitter<void>();
  @Output() pay = new EventEmitter<void>();
  @Output() retry = new EventEmitter<void>();
  @Output() continue = new EventEmitter<void>();

  getPayButtonTooltip(): string {
    if (!this.canProceed) {
      return 'Please enter a valid amount to proceed';
    }
    return 'Proceed to secure payment';
  }
}