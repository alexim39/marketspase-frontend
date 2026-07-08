import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, Subject } from 'rxjs';
import { ApiService } from '../../../../shared-services/src/public-api';

@Component({
  selector: 'app-admin-engagements',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatButtonModule, MatIconModule, MatCardModule,
    MatProgressSpinnerModule, MatProgressBarModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatTooltipModule],
  template: `
    <div class="admin-engagements">
      <header class="page-header">
        <div>
          <h1>Engagement Contracts</h1>
          <p>View and manage all marketer-promoter engagement contracts</p>
        </div>
        <div class="header-actions">
          <button mat-stroked-button routerLink="/dashboard/disputes" class="disputes-link">
            <mat-icon>gavel</mat-icon> Dispute Resolution
            @if (stats().disputed > 0) {
              <span class="dispute-count">{{ stats().disputed }}</span>
            }
          </button>
        </div>
      </header>

      <!-- Stats Cards -->
      <div class="stats-row">
        <div class="stat-card" [class.selected]="statusFilter === 'all'" (click)="setFilter('all')">
          <span class="stat-num">{{ stats().total }}</span><span class="stat-label">Total</span>
        </div>
        <div class="stat-card active" [class.selected]="statusFilter === 'active'" (click)="setFilter('active')">
          <span class="stat-num">{{ stats().active }}</span><span class="stat-label">Active</span>
        </div>
        <div class="stat-card completed" [class.selected]="statusFilter === 'completed'" (click)="setFilter('completed')">
          <span class="stat-num">{{ stats().completed }}</span><span class="stat-label">Completed</span>
        </div>
        <div class="stat-card disputed" [class.selected]="statusFilter === 'disputed'" (click)="setFilter('disputed')">
          <span class="stat-num">{{ stats().disputed }}</span><span class="stat-label">Disputed</span>
        </div>
        <div class="stat-card pending" [class.selected]="statusFilter === 'pending'" (click)="setFilter('pending')">
          <span class="stat-num">{{ stats().pending }}</span><span class="stat-label">Pending</span>
        </div>
        <div class="stat-card merged"><span class="stat-num">₦{{ (stats().totalValue || 0) | number:'1.0-0' }}</span><span class="stat-label">Total Value</span></div>
      </div>

      <!-- Search -->
      <div class="search-row">
        <div class="search-box">
          <mat-icon>search</mat-icon>
          <input type="text" placeholder="Search by marketer, promoter, or terms..." [value]="searchQuery" (input)="onSearch($any($event.target).value)">
          @if (searchQuery) {
            <button class="clear-search" (click)="onSearch(''); searchQuery = ''"><mat-icon>close</mat-icon></button>
          }
        </div>
        <button mat-flat-button color="primary" (click)="loadContracts(true)" class="refresh-btn">
          <mat-icon>refresh</mat-icon> Refresh
        </button>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="loading"><mat-spinner diameter="32"/></div>
      } @else if (contracts().length === 0) {
        <div class="empty">
          <mat-icon>description</mat-icon>
          <h3>No contracts found</h3>
          @if (statusFilter !== 'all' || searchQuery) {
            <p>Try adjusting your filters</p>
            <button mat-stroked-button (click)="setFilter('all'); searchQuery = ''; loadContracts(true)">Clear filters</button>
          }
        </div>
      } @else {
        <div class="contracts-table-wrap">
          <table class="contracts-table">
            <thead>
              <tr>
                <th>Marketer</th>
                <th>Promoter</th>
                <th class="col-tasks">Tasks</th>
                <th class="col-progress">Progress</th>
                <th class="col-amount">Amount</th>
                <th class="col-status">Status</th>
                <th class="col-date">Created</th>
              </tr>
            </thead>
            <tbody>
              @for (c of contracts(); track c._id) {
                <tr>
                  <td class="party-cell">
                    <strong>{{ c.marketerId?.displayName || '—' }}</strong>
                    <small>{{ c.marketerId?.email }}</small>
                  </td>
                  <td class="party-cell">
                    <strong>{{ c.promoterId?.displayName || '—' }}</strong>
                    <small>{{ c.promoterId?.email }}</small>
                  </td>
                  <td>
                    <div class="task-chips">
                      @for (t of c.tasks || []; track t.type) {
                        <span class="task-chip">{{ t.completed }}/{{ t.target }} {{ t.type }}</span>
                      }
                    </div>
                  </td>
                  <td>
                    <mat-progress-bar mode="determinate" [value]="c.progress || 0" [color]="c.status === 'disputed' ? 'warn' : 'primary'"></mat-progress-bar>
                    <small>{{ c.progress || 0 }}%</small>
                  </td>
                  <td class="col-amount">₦{{ c.payment?.total | number }}</td>
                  <td>
                    @if (c.status === 'disputed') {
                      <a class="status-link disputed" routerLink="/dashboard/disputes" matTooltip="View in Dispute Resolution">
                        {{ c.status }}
                      </a>
                    } @else {
                      <span class="status-badge" [class]="c.status">{{ c.status }}</span>
                    }
                  </td>
                  <td class="col-date">{{ c.createdAt | date:'mediumDate' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (loadedCount() < stats().total) {
          <button class="load-more-btn" (click)="loadContracts(false)" [disabled]="loadingMore()">
            {{ loadingMore() ? 'Loading...' : 'Load more' }} ({{ loadedCount() }} of {{ stats().total }})
          </button>
        }
      }
    </div>
  `,
  styles: [`
    .admin-engagements { padding: 24px; max-width: 1300px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;
      h1 { margin: 0; font-size: 1.4rem; font-weight: 700; color: var(--text-primary); }
      p { margin: 4px 0 0; font-size: 0.85rem; color: var(--text-secondary); }
    }
    .header-actions { display: flex; gap: 10px; }
    .disputes-link { position: relative; .dispute-count { position: absolute; top: -6px; right: -8px; background: var(--error-color); color: #fff; border-radius: 999px; padding: 1px 6px; font-size: 0.65rem; font-weight: 700; } }

    .stats-row { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 20px; }
    .stat-card { text-align: center; padding: 14px 8px; background: var(--surface-color); border-radius: 12px; border: 2px solid transparent; cursor: pointer; transition: border-color 0.2s;
      &:hover { border-color: var(--border-color); }
      &.selected { border-color: var(--primary-color); background: rgba(var(--primary-rgb), 0.03); }
      .stat-num { display: block; font-size: 1.25rem; font-weight: 800; color: var(--text-primary); }
      .stat-label { display: block; font-size: 0.7rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.04em; margin-top: 2px; }
      &.active .stat-num { color: var(--success-color); }
      &.completed .stat-num { color: var(--primary-color); }
      &.disputed .stat-num { color: var(--error-color); }
      &.pending .stat-num { color: var(--warning-color); }
    }

    .search-row { display: flex; gap: 12px; margin-bottom: 20px; align-items: center;
      .search-box { display: flex; align-items: center; gap: 8px; flex: 1; max-width: 420px; padding: 10px 14px; background: var(--surface-color); border-radius: 12px; border: 1px solid var(--border-color);
        mat-icon { color: var(--text-tertiary); }
        input { border: 0; background: none; flex: 1; font-size: 0.85rem; color: var(--text-primary); outline: none; &::placeholder { color: var(--text-tertiary); } }
        .clear-search { min-width: 28px; height: 28px; border: 0; background: rgba(var(--primary-rgb), 0.1); border-radius: 50%; color: var(--primary-color); cursor: pointer; display: flex; align-items: center; justify-content: center; mat-icon { font-size: 16px; width: 16px; height: 16px; color: var(--primary-color); } }
      }
      .refresh-btn { flex-shrink: 0; }
    }

    .contracts-table-wrap { overflow-x: auto; border-radius: 12px; border: 1px solid var(--border-color); }
    .contracts-table { width: 100%; border-collapse: collapse; font-size: 0.85rem;
      th { text-align: left; padding: 12px 16px; background: var(--surface-color); border-bottom: 2px solid var(--border-color); font-weight: 700; color: var(--text-secondary); white-space: nowrap; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; }
      td { padding: 14px 16px; border-bottom: 1px solid var(--border-color); color: var(--text-primary); vertical-align: middle; }
      tr:last-child td { border-bottom: none; }
      tr:hover td { background: rgba(var(--primary-rgb), 0.02); }
      .col-tasks { min-width: 150px; }
      .col-progress { min-width: 120px; }
      .col-amount { font-weight: 700; white-space: nowrap; }
      .col-status { width: 100px; }
      .col-date { white-space: nowrap; color: var(--text-secondary); font-size: 0.8rem; }
    }

    .party-cell { strong { display: block; font-size: 0.88rem; } small { display: block; font-size: 0.72rem; color: var(--text-tertiary); margin-top: 1px; } }

    .task-chips { display: flex; flex-wrap: wrap; gap: 3px; }
    .task-chip { padding: 2px 8px; border-radius: 999px; font-size: 0.7rem; background: rgba(var(--primary-rgb), 0.06); color: var(--text-secondary); white-space: nowrap; }

    .status-badge { display: inline-block; padding: 3px 12px; border-radius: 999px; font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
      &.active { background: rgba(16, 185, 129, 0.1); color: var(--success-color); }
      &.completed { background: rgba(var(--primary-rgb), 0.08); color: var(--primary-color); }
      &.pending { background: rgba(245, 158, 11, 0.1); color: var(--warning-color); }
      &.cancelled { background: rgba(0,0,0,0.04); color: var(--text-tertiary); }
    }
    .status-link { display: inline-flex; align-items: center; gap: 4px; padding: 3px 12px; border-radius: 999px; font-size: 0.68rem; font-weight: 700; text-transform: uppercase; text-decoration: none; cursor: pointer;
      &.disputed { background: rgba(239, 68, 68, 0.1); color: var(--error-color); border: 1px dashed var(--error-color); &:hover { background: rgba(239, 68, 68, 0.2); } }
    }

    .load-more-btn { width: 100%; padding: 12px; margin-top: 16px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--surface-color); font-weight: 600; color: var(--text-primary); cursor: pointer; &:hover { background: rgba(var(--primary-rgb), 0.04); } }

    .loading, .empty { text-align: center; padding: 60px; color: var(--text-secondary); mat-icon { font-size: 3rem; width: 3rem; height: 3rem; opacity: 0.3; margin-bottom: 8px; } h3 { color: var(--text-primary); margin: 8px 0; } p { font-size: 0.85rem; } }
  `]
})
export class AdminEngagementsComponent implements OnInit {
  private api = inject(ApiService);

  contracts = signal<any[]>([]);
  stats = signal({ total: 0, active: 0, completed: 0, disputed: 0, pending: 0, cancelled: 0, totalValue: 0 });
  loading = signal(true);
  loadingMore = signal(false);
  statusFilter = 'all';
  searchQuery = '';
  page = 1;
  loadedCount = signal(0);

  private searchSubject = new Subject<string>();

  ngOnInit(): void {
    this.searchSubject.pipe(debounceTime(400)).subscribe(() => this.loadContracts(true));
    this.loadContracts(true);
  }

  setFilter(status: string): void {
    this.statusFilter = status;
    this.loadContracts(true);
  }

  onSearch(value: string): void {
    this.searchQuery = value;
    this.searchSubject.next(value);
  }

  loadContracts(reset: boolean): void {
    if (reset) { this.page = 1; this.loading.set(true); }
    else { this.loadingMore.set(true); }

    const params = new URLSearchParams();
    params.set('page', String(this.page));
    params.set('limit', '20');
    if (this.statusFilter !== 'all') params.set('status', this.statusFilter);
    if (this.searchQuery.trim()) params.set('search', this.searchQuery.trim());

    this.api.get<any>(`api/v1/social/admin/contracts?${params.toString()}`, undefined, undefined, true).subscribe({
      next: (r: any) => {
        this.contracts.set(reset ? (r?.data || []) : [...this.contracts(), ...(r?.data || [])]);
        if (r?.stats) this.stats.set(r.stats);
        this.loadedCount.set(reset ? (r?.data?.length || 0) : this.loadedCount() + (r?.data?.length || 0));
        this.page++;
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: () => { this.loading.set(false); this.loadingMore.set(false); }
    });
  }
}
