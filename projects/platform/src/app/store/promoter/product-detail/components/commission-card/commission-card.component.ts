import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CurrencyUtilsPipe } from '../../../../../../../../shared-services/src/public-api';

@Component({
  selector: 'app-commission-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, CurrencyUtilsPipe],
  templateUrl: './commission-card.component.html',
  styleUrls: ['./commission-card.component.scss']
})
export class CommissionCardComponent {
  @Input() product: any;
  @Input() commissionDetails: any;
  @Input() user: any;
  @Output() copyLink = new EventEmitter<void>();
  @Output() shareWhatsApp = new EventEmitter<void>();
}