import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'payment-processing',
  standalone: true,
  imports: [CommonModule, MatProgressBarModule, MatIconModule],
  templateUrl: './payment-processing.component.html',
  styleUrls: ['./payment-processing.component.scss']
})
export class PaymentProcessingComponent {
  @Input() isProcessing: boolean = false;
  @Input() processingTime: number = 0;
}