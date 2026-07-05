import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EngagementContractDetailComponent } from '../contract-detail.component';

@Component({
  selector: 'app-contract-detail-mobile',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatProgressBarModule, MatProgressSpinnerModule],
  template: `
    <main class="mobile-detail">
      <header class="topbar">
        <button mat-icon-button routerLink="/dashboard/contracts"><mat-icon>arrow_back</mat-icon></button>
        <div>
          <span>Contract Details</span>
          <h1>{{ contract()?.status | titlecase }}</h1>
        </div>
        <span class="cc-status" [class]="contract()?.status">{{ contract()?.status }}</span>
      </header>

      @if (loading()) {
        <div class="loader"><mat-spinner diameter="32"/></div>
      } @else if (contract()) {
        <div class="section">
          <div class="party-row">
            <div><span>Marketer</span><strong>{{ contract()?.marketerId?.displayName }}</strong></div>
            <mat-icon>swap_horiz</mat-icon>
            <div style="text-align:right"><span>Promoter</span><strong>{{ contract()?.promoterId?.displayName }}</strong></div>
          </div>
        </div>

        <div class="section">
          <h3>Progress</h3>
          <mat-progress-bar mode="determinate" [value]="contract()?.progress || 0"></mat-progress-bar>
          <p class="prog-text">{{ contract()?.progress || 0 }}% complete</p>
          @for (task of contract()?.tasks || []; track task.type; let i = $index) {
            <div class="task-row">
              <div class="task-info"><strong>{{ task.type }}</strong><span>{{ task.completed }}/{{ task.target }}</span></div>
              <mat-progress-bar mode="determinate" [value]="task.target ? (task.completed/task.target*100) : 0"></mat-progress-bar>
              @if (isPromoter() && contract()?.status === 'active') {
                <button mat-stroked-button class="inc-btn" (click)="incrementTask(i)">+1 {{ task.type }}</button>
              }
            </div>
          }
        </div>

        <div class="section">
          <h3>Payment</h3>
          <div class="pay-row"><span>Total</span><strong>₦{{ contract()?.payment?.total | number }}</strong></div>
          <div class="pay-row"><span>Released</span><strong>₦{{ contract()?.payment?.released | number }}</strong></div>
          <div class="pay-row"><span>Schedule</span><strong>{{ contract()?.payment?.schedule }}</strong></div>
          @if (contract()?.escrow) { <p class="escrow-hint">Funds held in escrow</p> }
        </div>

        <div class="section actions">
          @if (contract()?.status === 'pending' && isPromoter()) {
            <button mat-flat-button color="primary" (click)="respond('accept')">Accept Contract</button>
            <button mat-stroked-button color="warn" (click)="respond('decline')">Decline</button>
          }
          @if (!isPromoter() && contract()?.status === 'active' && contract()?.progress >= 100) {
            <button mat-flat-button color="primary" (click)="approveMilestone()">Approve & Release</button>
          }
          @if (contract()?.status === 'milestone-review' && !isPromoter()) {
            <button mat-flat-button color="primary" (click)="approveMilestone()">Approve Milestone</button>
          }
          @if (contract()?.status === 'active' || contract()?.status === 'milestone-review') {
            <button mat-stroked-button color="warn" (click)="dispute()">
              <mat-icon>flag</mat-icon> Dispute
            </button>
          }
        </div>
      } @else {
        <div class="empty">Contract not found.</div>
      }
    </main>
  `,
  styles: [`
    :host { display: block; min-height: 100dvh; background: var(--background-color); }
    .topbar { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: var(--surface-color); border-bottom: 1px solid var(--border-color); position: sticky; top: 0; z-index: 10; }
    .topbar span { display: block; font-size: 0.68rem; color: var(--text-tertiary); } .topbar h1 { margin: 0; font-size: 1rem; font-weight: 700; flex: 1; }
    .cc-status { padding: 2px 8px; border-radius: 999px; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; &.active { background: rgba(var(--success-rgb),0.1); color: var(--success-color); } &.pending { background: rgba(var(--warning-rgb),0.1); color: var(--warning-color); } &.completed { background: rgba(var(--primary-rgb),0.08); color: var(--primary-color); } }
    .section { padding: 14px; margin: 0 14px 10px; background: var(--surface-color); border-radius: 14px; border: 1px solid var(--border-color); h3 { margin: 0 0 10px; font-size: 0.9rem; font-weight: 700; } }
    .party-row { display: flex; align-items: center; justify-content: space-between; span { display: block; font-size: 0.65rem; color: var(--text-tertiary); text-transform: uppercase; } strong { font-size: 0.92rem; } }
    .prog-text { font-size: 0.8rem; color: var(--text-secondary); margin: 4px 0 12px; }
    .task-row { margin-bottom: 12px; .task-info { display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 0.8rem; strong { text-transform: capitalize; } span { color: var(--text-secondary); } } .inc-btn { font-size: 0.7rem; min-height: 28px; margin-top: 5px; } }
    .pay-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-color); font-size: 0.85rem; &:last-child { border: 0; } span { color: var(--text-secondary); } }
    .escrow-hint { font-size: 0.72rem; color: var(--text-tertiary); margin: 8px 0 0; }
    .actions { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 100px; button { flex: 1; min-height: 48px; font-weight: 700; } }
    .loader, .empty { text-align: center; padding: 40px; color: var(--text-secondary); }
  `]
})
export class EngagementContractDetailMobileComponent extends EngagementContractDetailComponent {}
