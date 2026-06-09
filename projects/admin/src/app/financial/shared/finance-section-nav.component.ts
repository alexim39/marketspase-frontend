import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-finance-section-nav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, MatIconModule],
  template: `
    <nav class="finance-section-nav" aria-label="Finance navigation">
      <a
        routerLink="/dashboard/financial"
        routerLinkActive="active"
        [routerLinkActiveOptions]="{ exact: true }"
        class="finance-link">
        <mat-icon>payments</mat-icon>
        <span>Operations</span>
      </a>

      <a
        routerLink="/dashboard/financial/analytics"
        routerLinkActive="active"
        [routerLinkActiveOptions]="{ exact: true }"
        class="finance-link">
        <mat-icon>query_stats</mat-icon>
        <span>Analytics</span>
      </a>

      <a
        routerLink="/dashboard/financial/deposits"
        routerLinkActive="active"
        [routerLinkActiveOptions]="{ exact: true }"
        class="finance-link">
        <mat-icon>account_balance_wallet</mat-icon>
        <span>Deposits</span>
      </a>

      <a
        routerLink="/dashboard/financial/transfers"
        routerLinkActive="active"
        [routerLinkActiveOptions]="{ exact: true }"
        class="finance-link">
        <mat-icon>swap_horiz</mat-icon>
        <span>Transfers</span>
      </a>

      <a
        routerLink="/dashboard/financial/refunds"
        routerLinkActive="active"
        [routerLinkActiveOptions]="{ exact: true }"
        class="finance-link">
        <mat-icon>currency_exchange</mat-icon>
        <span>Refunds</span>
      </a>

      <a
        routerLink="/dashboard/financial/recovery"
        routerLinkActive="active"
        [routerLinkActiveOptions]="{ exact: true }"
        class="finance-link">
        <mat-icon>playlist_remove</mat-icon>
        <span>Recovery</span>
      </a>
    </nav>
  `,
  styleUrl: './finance-section-nav.component.scss',
})
export class FinanceSectionNavComponent {}

