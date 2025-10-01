import { Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'wallet-balance-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, CurrencyPipe],
  templateUrl: './wallet-balance-card.component.html',
  styleUrls: ['./wallet-balance-card.component.scss']
})
export class WalletBalanceCardComponent {
  @Input() currentBalance: number = 0;
  //@Input() showFundingRequirement: boolean = false;
  @Input() showFundingRequirement: any = false;
  @Input() fundingShortfall: number = 0;
}