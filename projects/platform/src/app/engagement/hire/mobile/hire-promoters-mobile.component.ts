import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HirePromotersComponent } from '../hire-promoters.component';

@Component({
  selector: 'app-hire-promoters-mobile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <main class="mobile-hire">
      <header class="topbar">
        <button mat-icon-button routerLink="/dashboard/stores"><mat-icon>arrow_back</mat-icon></button>
        <div>
          <span>Engagement</span>
          <h1>Hire Promoters</h1>
        </div>
      </header>

      @if (loading()) {
        <div class="loader"><mat-spinner diameter="32"/></div>
      } @else {
        <div class="promoter-list">
          @for (p of promoters(); track p._id) {
            <div class="p-card" (click)="startHire(p)">
              <div class="p-avatar">{{ p.displayName?.[0] || 'P' }}</div>
              <div class="p-info">
                <strong>{{ p.displayName }}</strong>
                <span>{{ p.completedContracts }} jobs · Trust {{ p.reputation || 'New' }}</span>
              </div>
              <button mat-stroked-button color="primary" (click)="$event.stopPropagation(); startHire(p)">
                Hire
              </button>
            </div>
          } @empty {
            <div class="empty">No promoters available yet.</div>
          }
        </div>
      }
    </main>

    @if (hireDialogOpen()) {
      <div class="backdrop" (click)="closeHire()"></div>
      <div class="bottom-sheet">
        <div class="sheet-handle"></div>
        <h2>Hire {{ selectedPromoter()?.displayName }}</h2>

        @for (task of hireTasks; track task.type; let i = $index) {
          <div class="task-row">
            <select [(ngModel)]="task.type" class="field">
              <option value="like">Likes</option>
              <option value="comment">Comments</option>
              <option value="share">Shares</option>
              <option value="follow">Follows</option>
            </select>
            <input type="number" [(ngModel)]="task.target" min="1" class="field" placeholder="Count">
            @if (hireTasks.length > 1) {
              <button mat-icon-button (click)="hireTasks.splice(i,1)"><mat-icon>delete</mat-icon></button>
            }
          </div>
        }
        <button mat-stroked-button (click)="hireTasks.push({type:'like',target:10})"><mat-icon>add</mat-icon> Add task</button>

        <input type="number" [(ngModel)]="hirePayment" min="500" class="field full" placeholder="Total Payment (₦)">
        <select [(ngModel)]="hireSchedule" class="field full">
          <option value="on-completion">Pay on completion</option>
          <option value="milestone">50-50 milestone</option>
        </select>

        <div class="sheet-actions">
          <button mat-stroked-button (click)="closeHire()">Cancel</button>
          <button mat-flat-button color="primary" (click)="submitHire()" [disabled]="submitting()">
            {{ submitting() ? 'Creating...' : 'Pay ₦' + hirePayment }}
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; min-height: 100dvh; background: var(--background-color); }
    .topbar { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: var(--surface-color); border-bottom: 1px solid var(--border-color); position: sticky; top: 0; z-index: 10; }
    .topbar span { display: block; font-size: 0.68rem; color: var(--text-tertiary); } .topbar h1 { margin: 0; font-size: 1rem; font-weight: 700; }
    .promoter-list { padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; padding-bottom: 100px; }
    .p-card { display: flex; align-items: center; gap: 12px; padding: 14px; background: var(--surface-color); border-radius: 14px; border: 1px solid var(--border-color); }
    .p-avatar { width: 44px; height: 44px; border-radius: 50%; background: var(--primary-color); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0; }
    .p-info { flex: 1; strong { display: block; font-size: 0.92rem; } span { font-size: 0.72rem; color: var(--text-tertiary); } }
    .loader, .empty { text-align: center; padding: 40px; color: var(--text-secondary); }
    .backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 90; }
    .bottom-sheet { position: fixed; bottom: 0; left: 0; right: 0; max-height: 85vh; overflow-y: auto; background: var(--surface-color); border-radius: 20px 20px 0 0; z-index: 91; padding: 20px; padding-bottom: calc(20px + env(safe-area-inset-bottom)); }
    .sheet-handle { width: 36px; height: 4px; background: var(--border-color); border-radius: 2px; margin: 0 auto 16px; }
    .bottom-sheet h2 { margin: 0 0 14px; font-size: 1.05rem; }
    .task-row { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
    .field { padding: 10px 12px; border: 1px solid var(--border-color); border-radius: 10px; background: var(--background-color); font-size: 0.85rem; color: var(--text-primary); }
    .field.full { width: 100%; margin-bottom: 10px; box-sizing: border-box; }
    .task-row .field:first-child { width: 130px; } .task-row .field:nth-child(2) { width: 80px; }
    .sheet-actions { display: flex; gap: 10px; margin-top: 16px; button { flex: 1; min-height: 48px; font-weight: 700; } }
  `]
})
export class HirePromotersMobileComponent extends HirePromotersComponent {}
