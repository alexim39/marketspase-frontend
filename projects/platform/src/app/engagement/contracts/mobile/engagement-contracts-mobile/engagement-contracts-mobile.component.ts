import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EngagementContractsComponent } from '../../engagement-contracts.component';

@Component({
  selector: 'app-engagement-contracts-mobile',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatProgressBarModule, MatProgressSpinnerModule],
  template: `
    <main class="mobile-contracts">
      <header class="topbar">
        <button mat-icon-button class="icon-btn" routerLink="/dashboard/stores" aria-label="Back">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="topbar-copy">
          <span class="eyebrow">{{ isPromoter() ? 'My Jobs' : 'Engagement' }}</span>
          <h1>{{ isPromoter() ? 'Contracts' : 'My Contracts' }}</h1>
        </div>
      </header>

      <section class="hero-card">
        <div>
          <p class="hero-label">Stay on track</p>
          <p class="hero-copy">Monitor active jobs and milestone progress at a glance.</p>
        </div>
        <span class="hero-pill">{{ filteredContracts().length }} items</span>
      </section>

      <div class="filter-chips">
        <button [class.active]="filter() === 'all'" (click)="filter.set('all')">All</button>
        <button [class.active]="filter() === 'active'" (click)="filter.set('active')">Active</button>
        <button [class.active]="filter() === 'completed'" (click)="filter.set('completed')">Done</button>
      </div>

      @if (loading()) {
        <div class="loader">
          <mat-spinner diameter="28"></mat-spinner>
          <p>Loading contracts...</p>
        </div>
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
                <div class="cc-party">
                  <strong>{{ isPromoter() ? (c.marketerId?.displayName || 'Marketer') : (c.promoterId?.displayName || 'Promoter') }}</strong>
                  <span class="cc-status" [class]="c.status">{{ c.status | titlecase }}</span>
                </div>
                <span class="cc-amount">₦{{ c.payment?.total | number }}</span>
              </div>
              <div class="cc-summary">
                <span class="summary-pill">{{ c.tasks?.length || 0 }} milestones</span>
                <span class="summary-pill">{{ c.progress || 0 }}% done</span>
              </div>
              <div class="cc-tasks">
                @for (t of c.tasks || []; track t.type) {
                  <span>{{ t.target }}x {{ t.type }}</span>
                }
              </div>
              <div class="cc-footer">
                <span>Tap to view details</span>
                <mat-icon>chevron_right</mat-icon>
              </div>
              <mat-progress-bar mode="determinate" [value]="c.progress || 0"></mat-progress-bar>
            </div>
          }
        </div>
      }
    </main>
  `,
  styleUrls: ['./engagement-contracts-mobile.component.scss']
})
export class EngagementContractsMobileComponent extends EngagementContractsComponent {}
