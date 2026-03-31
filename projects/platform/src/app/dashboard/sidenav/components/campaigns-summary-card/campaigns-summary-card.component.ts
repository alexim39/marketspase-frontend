import { Component, Input, Signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { UserInterface } from '../../../../../../../shared-services/src/public-api';
import { CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-campaigns-summary-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    CurrencyPipe,
    RouterModule
  ],
  templateUrl: './campaigns-summary-card.component.html',
  styleUrls: ['./campaigns-summary-card.component.scss']
})
export class CampaignsSummaryCardComponent {
  @Input({ required: true }) user!: Signal<UserInterface | null>;
  @Output() viewAllCampaigns = new EventEmitter<void>();
  @Output() startCampaign = new EventEmitter<void>();
  @Output() viewWithdrawal = new EventEmitter<void>();

  getActiveCampaignCount(): number {
    return this.user()?.campaigns?.filter(c => c.status === 'active')?.length || 0;
  }

  getTotalCampaigns(): number {
    return this.user()?.campaigns?.length || 0;
  }

  getTotalSpent(): number {
    return 4500;
  }

  getTotalRemainingBudget(): number {
    return 3000;
  }
}