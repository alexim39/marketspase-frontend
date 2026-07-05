import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EngagementContractsComponent } from '../engagement-contracts.component';

@Component({
  selector: 'app-engagement-contracts-mobile',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatProgressBarModule, MatProgressSpinnerModule],
  template: `
    <main class="mobile-contracts">
      <header class="topbar">
        <button mat-icon-button routerLink="/dashboard/stores"><mat-icon>arrow_back</mat-icon></button>
        <div>
          <span>{{ isPromoter() ? 'My Jobs' : 'Engagement' }}</span>
          <h1>{{ isPromoter() ? 'Contracts' : 'My Contracts' }}</h1>
        </div>
      </header>

      <div class="filter-chips">
        <button [class.active]="filter() === 'all'" (click)="filter.set('all')">All</button>
        <button [class.active]="filter() === 'active'" (click)="filter.set('active')">Active</button>
        <button [class.active]="filter() === 'completed'" (click)="filter.set('completed')">Done</button>
      </div>

      @if (loading()) {
        <div class="loader"><mat-spinner diameter="32"/></div>
      } @else if (filteredContracts().length === 0) {
        <div class="empty">
          <mat-icon>description</mat-icon>
          <h3>No contracts</h3>
          @if (!isPromoter()) {
            <button mat-flat-button color="primary" routerLink="/dashboard/marketer/hire">Hire a Promoter</button>
          }
        </div>
      } @else {
        <div class="contract-list">
          @for (c of filteredContracts(); track c._id) {
            <div class="cc-card" [routerLink]="['/dashboard/contracts', c._id]">
              <div class="cc-top">
                <div>
                  <strong>{{ isPromoter() ? (c.marketerId?.displayName || 'Marketer') : (c.promoterId?.displayName || 'Promoter') }}</strong>
                  <span class="cc-status" [class]="c.status">{{ c.status }}</span>
                </div>
                <span class="cc-amount">₦{{ c.payment?.total | number }}</span>
              </div>
              <div class="cc-tasks">
                @for (t of c.tasks || []; track t.type) {
                  <span>{{ t.target }}x {{ t.type }}</span>
                }
              </div>
              <mat-progress-bar mode="determinate" [value]="c.progress || 0"></mat-progress-bar>
            </div>
          }
        </div>
      }
    </main>
  `,
  styles: [`
    :host { display: block; min-height: 100dvh; background: var(--background-color); }
    .topbar { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: var(--surface-color); border-bottom: 1px solid var(--border-color); position: sticky; top: 0; z-index: 10; }
    .topbar span { display: block; font-size: 0.68rem; color: var(--text-tertiary); } .topbar h1 { margin: 0; font-size: 1rem; font-weight: 700; }
    .filter-chips { display: flex; gap: 4px; padding: 10px 14px; button { padding: 5px 12px; border-radius: 999px; border: 1px solid var(--border-color); background: var(--surface-color); font-size: 0.73rem; font-weight: 600; cursor: pointer; &.active { background: var(--primary-color); color: #fff; border-color: var(--primary-color); } } }
    .contract-list { padding: 0 14px 100px; display: flex; flex-direction: column; gap: 10px; }
    .cc-card { padding: 14px; background: var(--surface-color); border-radius: 14px; border: 1px solid var(--border-color); cursor: pointer; .cc-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; strong { font-size: 0.92rem; } .cc-amount { font-weight: 800; color: var(--primary-color); font-size: 1rem; } } .cc-status { padding: 2px 8px; border-radius: 999px; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; &.active { background: rgba(var(--success-rgb),0.1); color: var(--success-color); } &.pending { background: rgba(var(--warning-rgb),0.1); color: var(--warning-color); } &.completed { background: rgba(var(--primary-rgb),0.08); color: var(--primary-color); } } .cc-tasks { display: flex; gap: 6px; font-size: 0.7rem; color: var(--text-tertiary); margin-bottom: 10px; } }
    .loader, .empty { text-align: center; padding: 40px; color: var(--text-secondary); mat-icon { font-size: 3rem; width: 3rem; height: 3rem; opacity: 0.3; } }
  `]
})
export class EngagementContractsMobileComponent extends EngagementContractsComponent {}
