import { Component, Input, Output, EventEmitter, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatRippleModule } from '@angular/material/core';
import { CurrencyUtilsPipe, UserInterface } from '../../../../../../../shared-services/src/public-api';
import { CampaignsSummaryCardComponent } from '../campaigns-summary-card/campaigns-summary-card.component';
import { PromotionsSummaryCardComponent } from '../promotions-summary-card/promotions-summary-card.component';

@Component({
  selector: 'app-cart-dialog',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatRippleModule,
    CampaignsSummaryCardComponent,
    PromotionsSummaryCardComponent,
    CurrencyUtilsPipe
  ],
  templateUrl: './cart-dialog.component.html',
  styleUrls: ['./cart-dialog.component.scss']
})
export class CartDialogComponent {
  @Input({ required: true }) user!: Signal<UserInterface | null>;
  @Input({ required: true }) activeTab!: 'cart' | 'quick-actions';
  @Input({ required: true }) pendingCampaignsCount!: number | undefined;
  @Input({ required: true }) pendingPromotionsCount!: number | undefined;
  @Input({ required: true }) activeCampaignsCount!: number | undefined;

  @Output() setActiveTab = new EventEmitter<'cart' | 'quick-actions'>();
  @Output() closeDialog = new EventEmitter<void>();
  @Output() viewAllCampaigns = new EventEmitter<void>();
  @Output() viewAllPromotions = new EventEmitter<void>();
  @Output() viewWithdrawal = new EventEmitter<void>();
  @Output() switchUser = new EventEmitter<string>();



/* 

  ### **Summary of Logic**
1.  **Priority:** The service first checks LocalStorage. If nothing is found, it checks the user's OS System Preference (e.g., "Dark Mode" on Windows/Mac).
2.  **Attribute:** It sets `data-theme="dark"` on the `<body>` tag, which triggers the CSS variables we defined in Step 1.
3.  **Signals:** It uses Angular Signals (`currentTheme()`) so your UI (icons, text) updates instantly without needing `async` pipes or subscriptions.

*/

}