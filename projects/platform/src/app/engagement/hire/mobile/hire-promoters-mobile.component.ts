import { Component, HostListener } from '@angular/core';
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
        <span class="count-pill">{{ total() }}</span>
      </header>

      <div class="search-box">
        <mat-icon>search</mat-icon>
        <input type="text" placeholder="Search by name..." (input)="onSearch($any($event.target).value)">
      </div>

      @if (loading() && promoters().length === 0) {
        <div class="loader"><mat-spinner diameter="32"/></div>
      } @else if (promoters().length === 0) {
        <div class="empty">No promoters found</div>
      } @else {
        <div class="promoter-list">
          @for (p of promoters(); track p._id) {
            <div class="p-card" (click)="startHire(p)">
              <div class="p-avatar" [style.background]="tierColor(p.tier)">
                {{ p.displayName?.[0] || 'P' }}
                @if (p.streak >= 7) { <span class="streak-badge">🔥</span> }
              </div>
              <div class="p-info">
                <div class="p-name-row">
                  <strong>{{ p.displayName }}</strong>
                  <span class="tier-dot" [style.background]="tierColor(p.tier)"></span>
                </div>
                <span class="p-meta">
                  {{ tierLabel(p.tier) }} · {{ p.completedContracts }} jobs
                  @if (p.longestStreak) { · 🔥{{ p.longestStreak }}d }
                </span>
              </div>
              <button mat-stroked-button color="primary" (click)="$event.stopPropagation(); startHire(p)">Hire</button>
            </div>
          }
        </div>
      }

      @if (loadingMore()) {
        <div class="loader-more"><mat-spinner diameter="22"/></div>
      }
    </main>

    @if (hireDialogOpen()) {
      <div class="backdrop" (click)="closeHire()"></div>
      <div class="hire-sheet">
        <div class="sheet-handle"></div>
        <div class="sheet-header">
          <h2>Hire {{ selectedPromoter()?.displayName }}</h2>
          <span>{{ selectedPromoter()?.completedContracts }} jobs · {{ tierLabel(selectedPromoter()?.tier) }}</span>
          <button mat-icon-button (click)="closeHire()"><mat-icon>close</mat-icon></button>
        </div>
        <div class="sheet-body">
          @for (task of hireTasks; track task.type; let i = $index) {
            <div class="task-row">
              <select [(ngModel)]="task.type" class="field">
                <option value="like">Likes</option><option value="comment">Comments</option><option value="share">Shares</option><option value="follow">Follows</option>
              </select>
              <input type="number" [(ngModel)]="task.target" min="1" class="field" placeholder="Count">
              @if (hireTasks.length > 1) { <button mat-icon-button (click)="hireTasks.splice(i,1)"><mat-icon>delete</mat-icon></button> }
            </div>
          }
          <button mat-stroked-button (click)="hireTasks.push({type:'like',target:10})"><mat-icon>add</mat-icon> Add task</button>
          <input type="number" [(ngModel)]="hirePayment" min="500" class="field full" placeholder="Total Payment (₦)">
          <select [(ngModel)]="hireSchedule" class="field full">
            <option value="on-completion">On Completion</option><option value="milestone">50-50 Milestone</option>
          </select>
          <div class="sheet-actions">
            <button mat-stroked-button (click)="closeHire()">Cancel</button>
            <button mat-flat-button color="primary" (click)="submitHire()" [disabled]="submitting()">
              {{ submitting() ? 'Creating...' : 'Pay ₦' + hirePayment }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; min-height: 100dvh; background: var(--background-color); }
    .topbar { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: var(--surface-color); border-bottom: 1px solid var(--border-color); position: sticky; top: 0; z-index: 10; }
    .topbar span { display: block; font-size: 0.68rem; color: var(--text-tertiary); }
    .topbar h1 { margin: 0; font-size: 1rem; font-weight: 700; }
    .count-pill { padding: 2px 10px; border-radius: 999px; font-size: 0.7rem; font-weight: 700; background: rgba(var(--primary-rgb),0.08); color: var(--primary-color); }
    .search-box { display: flex; align-items: center; gap: 8px; margin: 10px 14px; padding: 10px 14px; background: var(--surface-color); border-radius: 12px; border: 1px solid var(--border-color); }
    .search-box input { border: 0; background: none; flex: 1; font-size: 0.85rem; color: var(--text-primary); outline: none; }
    .search-box mat-icon { color: var(--text-tertiary); }
    .promoter-list { padding: 0 14px 120px; display: flex; flex-direction: column; gap: 8px; }
    .p-card { display: flex; align-items: center; gap: 10px; padding: 12px; background: var(--surface-color); border-radius: 14px; border: 1px solid var(--border-color); }
    .p-avatar { width: 44px; height: 44px; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0; position: relative; }
    .p-avatar .streak-badge { position: absolute; bottom: -2px; right: -4px; font-size: 12px; }
    .p-info { flex: 1; min-width: 0; }
    .p-info .p-name-row { display: flex; align-items: center; gap: 6px; }
    .p-info .p-name-row strong { font-size: 0.9rem; color: var(--text-primary); }
    .p-info .p-name-row .tier-dot { width: 8px; height: 8px; border-radius: 50%; }
    .p-info .p-meta { font-size: 0.7rem; color: var(--text-tertiary); }
    .loader, .empty, .loader-more { text-align: center; padding: 40px; color: var(--text-secondary); }
    .backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 90; }
    .hire-sheet { position: fixed; bottom: 0; left: 0; right: 0; max-height: 85vh; overflow-y: auto; background: var(--surface-color); border-radius: 20px 20px 0 0; z-index: 91; padding: 20px; padding-bottom: calc(20px + env(safe-area-inset-bottom)); }
    .sheet-handle { width: 36px; height: 4px; background: var(--border-color); border-radius: 2px; margin: 0 auto 16px; }
    .sheet-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
    .sheet-header h2 { flex: 1; margin: 0; font-size: 1.05rem; }
    .sheet-header span { font-size: 0.72rem; color: var(--text-tertiary); }
    .task-row { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
    .field { padding: 10px 12px; border: 1px solid var(--border-color); border-radius: 10px; background: var(--background-color); font-size: 0.85rem; color: var(--text-primary); }
    .field.full { width: 100%; margin-bottom: 10px; box-sizing: border-box; }
    .task-row .field:first-child { width: 130px; }
    .task-row .field:nth-child(2) { width: 80px; }
    .sheet-actions { display: flex; gap: 10px; margin-top: 16px; }
    .sheet-actions button { flex: 1; min-height: 48px; font-weight: 700; }
  `]
})
export class HirePromotersMobileComponent extends HirePromotersComponent {}
