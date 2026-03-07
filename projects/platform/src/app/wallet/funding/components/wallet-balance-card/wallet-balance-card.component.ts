import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { CurrencyUtilsPipe, UserInterface } from '../../../../../../../shared-services/src/public-api';

@Component({
  selector: 'wallet-balance-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, CurrencyUtilsPipe],
  templateUrl: './wallet-balance-card.component.html',
  styleUrls: ['./wallet-balance-card.component.scss']
})
export class WalletBalanceCardComponent {
  @Input() currentBalance: number = 0;
  //@Input() showFundingRequirement: boolean = false;
  @Input() showFundingRequirement: boolean = false;
  @Input() fundingShortfall: number = 0;
  @Input({ required: true }) user: UserInterface | null = null;
}