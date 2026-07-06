import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../../../shared-services/src/public-api';

@Component({
  selector: 'app-admin-disputes',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule, MatProgressSpinnerModule],
  template: `
    <div class="admin-disputes">
      <header class="page-header">
        <div>
          <h1>Dispute Resolution</h1>
          <p>Review and resolve disputed engagement contracts</p>
        </div>
        <span class="count-badge">{{ disputes().length }} pending</span>
      </header>

      @if (loading()) {
        <div class="loading"><mat-spinner diameter="32"/></div>
      } @else if (disputes().length === 0) {
        <div class="empty">
          <mat-icon>check_circle</mat-icon>
          <h3>No disputes</h3>
          <p>All clear — no pending disputes to review.</p>
        </div>
      } @else {
        <div class="disputes-list">
          @for (d of disputes(); track d._id) {
            <mat-card class="dispute-card">
              <mat-card-content>
                <div class="dispute-header">
                  <div>
                    <strong class="status-disputed">DISPUTED</strong>
                    <span class="date">{{ d.updatedAt | date:'medium' }}</span>
                  </div>
                  <span class="amount">₦{{ d.payment?.total | number }}</span>
                </div>
                <div class="parties">
                  <div class="party"><span class="role">Marketer</span><strong>{{ d.marketerId?.displayName }}</strong><small>{{ d.marketerId?.email }}</small></div>
                  <mat-icon>swap_horiz</mat-icon>
                  <div class="party" style="text-align:right"><span class="role">Promoter</span><strong>{{ d.promoterId?.displayName }}</strong><small>{{ d.promoterId?.email }}</small></div>
                </div>
                <div class="tasks-row">
                  @for (t of d.tasks || []; track t.type) {
                    <span class="task-chip">{{ t.completed }}/{{ t.target }} {{ t.type }}</span>
                  }
                </div>
                <div class="dispute-reason">
                  <strong>Dispute Reason:</strong>
                  <p>{{ d.contractTerms?.split('[DISPUTED').pop()?.split(']')?.[1] || 'No reason provided' }}</p>
                </div>
                <div class="resolve-actions">
                  <button mat-flat-button color="primary" (click)="resolve(d._id, 'release-promoter')">
                    <mat-icon>check</mat-icon> Release to Promoter
                  </button>
                  <button mat-stroked-button color="warn" (click)="resolve(d._id, 'refund-marketer')">
                    <mat-icon>undo</mat-icon> Refund Marketer
                  </button>
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-disputes { padding: 24px; max-width: 800px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; h1 { margin: 0; font-size: 1.3rem; } p { margin: 0; color: var(--text-secondary); font-size: 0.85rem; } }
    .count-badge { padding: 4px 12px; border-radius: 999px; font-size: 0.8rem; font-weight: 700; background: rgba(239,68,68,0.1); color: var(--error-color); }
    .disputes-list { display: flex; flex-direction: column; gap: 14px; }
    .dispute-card { border-left: 3px solid var(--error-color); }
    .dispute-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; .status-disputed { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 0.65rem; font-weight: 700; background: rgba(239,68,68,0.1); color: var(--error-color); } .date { font-size: 0.7rem; color: var(--text-tertiary); display: block; } .amount { font-weight: 800; color: var(--primary-color); font-size: 1.1rem; } }
    .parties { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; padding: 12px; background: var(--background-color); border-radius: 10px; .party { flex: 1; .role { display: block; font-size: 0.65rem; color: var(--text-tertiary); text-transform: uppercase; } strong { display: block; font-size: 0.9rem; } small { display: block; font-size: 0.7rem; color: var(--text-secondary); } } }
    .tasks-row { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; .task-chip { padding: 2px 8px; border-radius: 999px; font-size: 0.7rem; background: rgba(var(--primary-rgb),0.06); color: var(--text-secondary); } }
    .dispute-reason { margin-bottom: 14px; padding: 10px 12px; background: rgba(239,68,68,0.04); border-radius: 8px; strong { font-size: 0.75rem; color: var(--error-color); } p { margin: 4px 0 0; font-size: 0.82rem; color: var(--text-secondary); } }
    .resolve-actions { display: flex; gap: 10px; button { flex: 1; } }
    .loading, .empty { text-align: center; padding: 40px; color: var(--text-secondary); mat-icon { font-size: 3rem; width: 3rem; height: 3rem; opacity: 0.3; } }
  `]
})
export class AdminDisputesComponent implements OnInit {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  disputes = signal<any[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.loadDisputes();
  }

  loadDisputes(): void {
    this.loading.set(true);
    this.api.get<any>('api/v1/social/admin/disputes', undefined, undefined, true).subscribe({
      next: (r: any) => { this.disputes.set(r?.data || []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  resolve(contractId: string, resolution: 'refund-marketer' | 'release-promoter'): void {
    this.api.post<any>(`api/v1/social/admin/disputes/${contractId}/resolve`, { resolution }, undefined, true).subscribe({
      next: () => {
        this.snack.open(`Resolved: ${resolution === 'refund-marketer' ? 'Refunded' : 'Released'}`, 'OK', { duration: 3000 });
        this.loadDisputes();
      },
      error: (e) => this.snack.open(e?.error?.message || 'Error', 'OK', { duration: 3000 })
    });
  }
}
