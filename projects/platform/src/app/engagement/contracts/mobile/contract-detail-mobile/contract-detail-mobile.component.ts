import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EngagementContractDetailComponent } from '../../contract-detail/contract-detail.component';

@Component({
  selector: 'app-contract-detail-mobile',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatProgressBarModule, MatProgressSpinnerModule],
  template: `
    <main class="mobile-detail">
      <header class="topbar">
        <button mat-icon-button class="icon-btn" routerLink="/dashboard/contracts" aria-label="Back">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="topbar-copy">
          <span class="eyebrow">Contract</span>
          <h1>{{ contract()?.status | titlecase }}</h1>
        </div>
        <span class="cc-status" [class]="contract()?.status">{{ contract()?.status | titlecase }}</span>
      </header>

      @if (loading()) {
        <div class="loader">
          <mat-spinner diameter="28"></mat-spinner>
          <p>Loading contract details...</p>
        </div>
      } @else if (contract()) {
        <section class="hero-card">
          <div class="party-row">
            <div class="party-block">
              <span>Marketer</span>
              <strong>{{ contract()?.marketerId?.displayName }}</strong>
            </div>
            <div class="party-separator"><mat-icon>sync_alt</mat-icon></div>
            <div class="party-block align-right">
              <span>Promoter</span>
              <strong>{{ contract()?.promoterId?.displayName }}</strong>
            </div>
          </div>
          <div class="hero-footer">
            <p>Track milestones, payments, and next steps in one place.</p>
            <span class="hero-pill">{{ contract()?.progress || 0 }}% done</span>
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <h3>Progress</h3>
            <span class="mini-pill">{{ contract()?.progress || 0 }}%</span>
          </div>
          <mat-progress-bar mode="determinate" [value]="contract()?.progress || 0"></mat-progress-bar>
          <p class="prog-text">{{ contract()?.progress || 0 }}% complete</p>
          @for (task of contract()?.tasks || []; track task.type; let i = $index) {
            <div class="task-row">
              <div class="task-info">
                <strong>{{ task.type }}</strong>
                <span>{{ task.completed }}/{{ task.target }}</span>
              </div>
              <mat-progress-bar mode="determinate" [value]="task.target ? (task.completed/task.target*100) : 0"></mat-progress-bar>
            </div>
          }
        </section>

        <section class="section">
          <div class="section-head">
            <h3>Payment</h3>
          </div>
          <div class="pay-row"><span>Total</span><strong>₦{{ contract()?.payment?.total | number }}</strong></div>
          <div class="pay-row"><span>Released</span><strong>₦{{ contract()?.payment?.released | number }}</strong></div>
          <div class="pay-row"><span>Schedule</span><strong>{{ contract()?.payment?.schedule }}</strong></div>
          @if (contract()?.escrow) {
            <div class="escrow-hint">
              <mat-icon>shield</mat-icon>
              <p>Funds are held in escrow until the next milestone is approved.</p>
            </div>
          }
        </section>

        <section class="section actions">
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
        </section>
      } @else {
        <div class="empty">
          <mat-icon>inventory_2</mat-icon>
          <p>Contract not found.</p>
        </div>
      }
    </main>
  `,
  styleUrls: ['./contract-detail-mobile.component.scss']
})
export class EngagementContractDetailMobileComponent extends EngagementContractDetailComponent {}
