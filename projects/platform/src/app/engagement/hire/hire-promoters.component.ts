import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EngagementService } from '../engagement.service';

@Component({
  selector: 'app-hire-promoters',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatButtonModule, MatIconModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatDialogModule, MatProgressSpinnerModule],
  template: `
    <div class="hire-page">
      <header class="page-header">
        <button mat-icon-button routerLink="/dashboard/stores"><mat-icon>arrow_back</mat-icon></button>
        <div>
          <h1>Hire Promoters</h1>
          <p>Find promoters to boost your social engagement</p>
        </div>
      </header>

      @if (loading()) {
        <div class="loading"><mat-spinner diameter="32"/></div>
      } @else {
        <div class="promoters-grid">
          @for (p of promoters(); track p._id) {
            <mat-card class="promoter-card">
              <div class="p-avatar">{{ p.displayName?.[0] || 'P' }}</div>
              <div class="p-info">
                <h3>{{ p.displayName }}</h3>
                <div class="p-stats">
                  <span class="stat"><mat-icon>star</mat-icon> {{ p.reputation || 'New' }}</span>
                  <span class="stat"><mat-icon>check_circle</mat-icon> {{ p.completedContracts }} jobs</span>
                </div>
              </div>
              <button mat-flat-button color="primary" (click)="startHire(p)">
                <mat-icon>person_add</mat-icon> Hire
              </button>
            </mat-card>
          } @empty {
            <div class="empty">No promoters available yet.</div>
          }
        </div>
      }
    </div>

    @if (hireDialogOpen()) {
      <div class="dialog-backdrop" (click)="closeHire()"></div>
      <div class="hire-dialog">
        <div class="dialog-header">
          <h2>Hire {{ selectedPromoter()?.displayName }}</h2>
          <button mat-icon-button (click)="closeHire()"><mat-icon>close</mat-icon></button>
        </div>
        <div class="dialog-body">
          <h3>Engagement Tasks</h3>
          @for (task of hireTasks; track task.type; let i = $index) {
            <div class="task-row">
              <mat-form-field appearance="outline" class="task-type">
                <mat-select [(ngModel)]="task.type">
                  <mat-option value="like">Likes</mat-option>
                  <mat-option value="comment">Comments</mat-option>
                  <mat-option value="share">Shares</mat-option>
                  <mat-option value="follow">Follows</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="task-target">
                <input matInput type="number" [(ngModel)]="task.target" min="1" placeholder="Count">
              </mat-form-field>
              @if (hireTasks.length > 1) {
                <button mat-icon-button (click)="hireTasks.splice(i, 1)"><mat-icon>delete</mat-icon></button>
              }
            </div>
          }
          <button mat-stroked-button (click)="hireTasks.push({ type: 'like', target: 10 })"><mat-icon>add</mat-icon> Add task</button>

          <mat-form-field appearance="outline" class="full-width" style="margin-top:16px">
            <mat-label>Total Payment (₦)</mat-label>
            <input matInput type="number" [(ngModel)]="hirePayment" min="500">
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Payment Schedule</mat-label>
            <mat-select [(ngModel)]="hireSchedule">
              <mat-option value="on-completion">On Completion</mat-option>
              <mat-option value="milestone">50-50 Milestone</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Contract Terms (optional)</mat-label>
            <textarea matInput [(ngModel)]="hireTerms" rows="2" placeholder="e.g. Must use real accounts, no bots"></textarea>
          </mat-form-field>
        </div>
        <div class="dialog-footer">
          <button mat-stroked-button (click)="closeHire()">Cancel</button>
          <button mat-flat-button color="primary" (click)="submitHire()" [disabled]="submitting()">
            {{ submitting() ? 'Creating...' : 'Create Contract (₦' + hirePayment + ')' }}
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .hire-page { padding: 24px; max-width: 1000px; margin: 0 auto; }
    .page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; h1 { margin: 0; font-size: 1.3rem; } p { margin: 0; color: var(--text-secondary); font-size: 0.85rem; } }
    .promoters-grid { display: grid; gap: 12px; }
    .promoter-card { display: flex; align-items: center; gap: 16px; padding: 16px; flex-direction: row; .p-avatar { width: 48px; height: 48px; border-radius: 50%; background: var(--primary-color); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.2rem; flex-shrink: 0; } .p-info { flex: 1; h3 { margin: 0 0 4px; font-size: 1rem; } .stat { display: inline-flex; align-items: center; gap: 2px; font-size: 0.75rem; color: var(--text-secondary); margin-right: 12px; mat-icon { font-size: 14px; width: 14px; height: 14px; } } } }
    .loading, .empty { text-align: center; padding: 40px; color: var(--text-secondary); }
    .dialog-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100; }
    .hire-dialog { position: fixed; bottom: 0; left: 0; right: 0; max-height: 85vh; overflow-y: auto; background: var(--surface-color); border-radius: 20px 20px 0 0; z-index: 101; padding: 20px; }
    .dialog-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; h2 { margin: 0; font-size: 1.1rem; } }
    .task-row { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; .task-type { width: 140px; } .task-target { width: 100px; } }
    .dialog-footer { display: flex; gap: 12px; margin-top: 20px; button { flex: 1; } }
    .full-width { width: 100%; }
  `]
})
export class HirePromotersComponent implements OnInit {
  private service = inject(EngagementService);
  private snack = inject(MatSnackBar);

  promoters = signal<any[]>([]);
  loading = signal(true);
  hireDialogOpen = signal(false);
  selectedPromoter = signal<any>(null);
  submitting = signal(false);

  hireTasks = [{ type: 'like' as const, target: 10 }];
  hirePayment = 2000;
  hireSchedule = 'on-completion';
  hireTerms = '';

  ngOnInit(): void {
    this.service.browsePromoters().subscribe({
      next: (r: any) => { this.promoters.set(r?.data || []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  startHire(promoter: any): void {
    this.selectedPromoter.set(promoter);
    this.hireDialogOpen.set(true);
  }

  closeHire(): void {
    this.hireDialogOpen.set(false);
    this.hireTasks = [{ type: 'like', target: 10 }];
    this.hirePayment = 2000;
    this.hireSchedule = 'on-completion';
  }

  submitHire(): void {
    const promoter = this.selectedPromoter();
    if (!promoter) return;
    this.submitting.set(true);

    const milestones = this.hireSchedule === 'milestone'
      ? [{ percent: 50, description: '50% of tasks completed' }, { percent: 100, description: 'All tasks completed' }]
      : [];

    this.service.createContract({
      promoterId: promoter._id,
      tasks: this.hireTasks.map(t => ({ type: t.type, target: t.target })),
      payment: { total: this.hirePayment, schedule: this.hireSchedule, milestones },
      contractTerms: this.hireTerms
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.snack.open('Contract created! Promoter notified.', 'OK', { duration: 3000 });
        this.closeHire();
      },
      error: (e) => {
        this.submitting.set(false);
        this.snack.open(e?.error?.message || 'Failed to create contract', 'OK', { duration: 3000 });
      }
    });
  }
}
