import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { CurrencyService, CURRENCY_SYMBOLS, CurrencyCode } from '../../services/currency.service';

@Component({
  selector: 'app-currency-selector',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatMenuModule, MatIconModule],
  template: `
    <button mat-button [matMenuTriggerFor]="currencyMenu" class="currency-btn">
      <mat-icon>currency_exchange</mat-icon>
      {{ symbols[currencyService.preferredCurrency()] }} {{ currencyService.preferredCurrency() }}
    </button>
    <mat-menu #currencyMenu="matMenu">
      @for (c of currencies; track c) {
        <button mat-menu-item (click)="select(c)">
          <span>{{ symbols[c] }} {{ c }}</span>
          @if (c === currencyService.preferredCurrency()) { <mat-icon class="check">check</mat-icon> }
        </button>
      }
    </mat-menu>
  `,
  styleUrl: './currency-selector.component.scss',
})
export class CurrencySelectorComponent {
  readonly currencyService = inject(CurrencyService);
  readonly currencies: readonly CurrencyCode[] = ['NGN', 'USD', 'GHS', 'KES', 'ZAR', 'XOF'];
  readonly symbols = CURRENCY_SYMBOLS;
  select(code: CurrencyCode): void { this.currencyService.setPreferredCurrency(code); }
}
