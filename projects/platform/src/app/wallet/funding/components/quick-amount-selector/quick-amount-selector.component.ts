import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface QuickAmount {
  value: number;
  label: string;
  popular?: boolean;
  description?: string;
}

@Component({
  selector: 'quick-amount-selector',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule, CurrencyPipe],
  templateUrl: './quick-amount-selector.component.html',
  styleUrls: ['./quick-amount-selector.component.scss']
})
export class QuickAmountSelectorComponent {
  @Input() amounts: QuickAmount[] = [];
  @Input() selectedAmount: number = 0;
  @Input() disabled: boolean = false;
  @Output() amountSelected = new EventEmitter<number>();

  selectAmount(amount: number): void {
    this.amountSelected.emit(amount);
  }
}