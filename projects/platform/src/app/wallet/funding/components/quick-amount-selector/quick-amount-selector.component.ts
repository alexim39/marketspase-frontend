import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CurrencyUtilsPipe, UserInterface } from '../../../../../../../shared-services/src/public-api';

export interface QuickAmount {
  value: number;
  label: string;
  popular?: boolean;
  description?: string;
}

@Component({
  selector: 'quick-amount-selector',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule, CurrencyUtilsPipe],
  templateUrl: './quick-amount-selector.component.html',
  styleUrls: ['./quick-amount-selector.component.scss']
})
export class QuickAmountSelectorComponent {
  @Input() amounts: QuickAmount[] = [];
  @Input() selectedAmount: number = 0;
  @Input() disabled: boolean = false;
  @Output() amountSelected = new EventEmitter<number>();
  @Input({ required: true }) user: UserInterface | null = null;

  selectAmount(amount: number): void {
    this.amountSelected.emit(amount);
  }
}