import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../../common/services/user.service';
import { EngagementService } from '../engagement.service';

@Component({
  selector: 'app-engagement-contracts',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatButtonModule, MatIconModule, MatCardModule,
    MatProgressBarModule, MatProgressSpinnerModule],
  template: `
    <div class="contracts-page">
      <header class="page-header">
        <button mat-icon-button routerLink="/dashboard/stores"><mat-icon>arrow_back</mat-icon></button>
        <div>
          <h1>{{ isPromoter() ? 'My Jobs' : 'My Contracts' }}</h1>
          <p>{{ isPromoter() ? 'Engagement contracts from marketers' : 'Manage your promoter engagements' }}</p>
        </div>
        <div class="header-tabs">
          <button [class.active]="filter() === 'all'" (click)="filter.set('all')">All</button>
          <button [class.active]="filter() === 'active'" (click)="filter.set('active')">Active</button>
          <button [class.active]="filter() === 'completed'" (click)="filter.set('completed')">Completed</button>
        </div>
      </header>

      @if (loading()) {
        <div class="loading"><mat-spinner diameter="32"/></div>
      } @else if (filteredContracts().length === 0) {
        <div class="empty">
          <mat-icon>description</mat-icon>
          <h3>No contracts</h3>
          <p>{{ isPromoter() ? 'No engagement jobs yet.' : 'No contracts yet.' }}</p>
          @if (!isPromoter()) {
            <button mat-flat-button color="primary" routerLink="/dashboard/marketer/hire">Hire a Promoter</button>
          }
        </div>
      } @else {
        <div class="contracts-list">
          @for (c of filteredContracts(); track c._id) {
            <mat-card class="contract-card" [routerLink]="['/dashboard/contracts', c._id]">
              <div class="cc-header">
                <div class="cc-party">
                  <strong>{{ isPromoter() ? c.marketerId?.displayName : c.promoterId?.displayName }}</strong>
                  <span class="cc-status" [class]="c.status">{{ c.status }}</span>
                </div>
                <span class="cc-amount">₦{{ c.payment?.total | number }}</span>
              </div>
              <div class="cc-tasks">
                @for (t of c.tasks || []; track t.type) {
                  <span class="task-chip">{{ t.target }}x {{ t.type }}</span>
                }
              </div>
              <mat-progress-bar mode="determinate" [value]="c.progress || 0"></mat-progress-bar>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .contracts-page { padding: 24px; max-width: 800px; margin: 0 auto; }
    .page-header { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; h1 { margin: 0 0 4px; font-size: 1.3rem; } p { margin: 0; color: var(--text-secondary); font-size: 0.85rem; } }
    .header-tabs { display: flex; gap: 4px; margin-left: auto; button { padding: 6px 14px; border-radius: 999px; border: 1px solid var(--border-color); background: var(--surface-color); font-size: 0.78rem; font-weight: 600; cursor: pointer; &.active { background: var(--primary-color); color: #fff; border-color: var(--primary-color); } } }
    .contracts-list { display: flex; flex-direction: column; gap: 12px; }
    .contract-card { padding: 16px; cursor: pointer; transition: transform 0.15s; &:hover { transform: translateY(-1px); } .cc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; .cc-party strong { font-size: 1rem; } .cc-amount { font-weight: 800; color: var(--primary-color); font-size: 1.1rem; } } .cc-status { padding: 2px 8px; border-radius: 999px; font-size: 0.68rem; font-weight: 700; text-transform: uppercase; &.active { background: rgba(var(--success-rgb), 0.1); color: var(--success-color); } &.pending { background: rgba(var(--warning-rgb), 0.1); color: var(--warning-color); } &.completed { background: rgba(var(--primary-rgb), 0.08); color: var(--primary-color); } &.cancelled { background: rgba(var(--error-rgb), 0.08); color: var(--error-color); } } }
    .cc-tasks { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; .task-chip { padding: 2px 8px; border-radius: 999px; font-size: 0.7rem; background: rgba(var(--primary-rgb), 0.06); color: var(--text-secondary); } }
    .loading, .empty { text-align: center; padding: 40px; color: var(--text-secondary); mat-icon { font-size: 3rem; width: 3rem; height: 3rem; opacity: 0.3; } }
  `]
})
export class EngagementContractsComponent implements OnInit {
  private service = inject(EngagementService);
  private userService = inject(UserService);

  contracts = signal<any[]>([]);
  loading = signal(true);
  filter = signal<'all' | 'active' | 'completed'>('all');

  isPromoter = computed(() => this.userService.user()?.role === 'promoter');
  filteredContracts = computed(() => {
    const f = this.filter();
    const all = this.contracts();
    if (f === 'all') return all;
    return all.filter(c => c.status === f);
  });

  ngOnInit(): void {
    const role = this.isPromoter() ? 'promoter' : 'marketer';
    this.service.listContracts(role).subscribe({
      next: (r: any) => { this.contracts.set(r?.data || []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
