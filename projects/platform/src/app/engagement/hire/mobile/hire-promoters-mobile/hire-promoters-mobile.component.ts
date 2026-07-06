import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HirePromotersComponent } from '../../hire-promoters.component';

@Component({
  selector: 'app-hire-promoters-mobile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <main class="mobile-hire">
      <header class="topbar">
        <button mat-icon-button class="icon-btn" routerLink="/dashboard/stores" aria-label="Back">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="topbar-copy">
          <span class="eyebrow">Engagement</span>
          <h1>Hire Promoters</h1>
        </div>
        <span class="count-pill">{{ total() }}</span>
      </header>

      <section class="hero-card">
        <div>
          <p class="hero-label">Find trusted Promoters</p>
          <p class="hero-copy">Choose the right promoter promote your campaign with confidence.</p>
        </div>
        <span class="hero-badge">Fast setup</span>
      </section>

      <div class="search-box">
        <mat-icon>search</mat-icon>
        <input type="text" placeholder="Search by name..." (input)="onSearch($any($event.target).value)">
      </div>

      @if (loading() && promoters().length === 0) {
        <div class="loader">
          <mat-spinner diameter="28"></mat-spinner>
          <p>Loading promoters...</p>
        </div>
      } @else if (promoters().length === 0) {
        <div class="empty">
          <mat-icon>person_search</mat-icon>
          <p>No promoters found</p>
        </div>
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
                  <span class="tier-chip">{{ tierLabel(p.tier) }}</span>
                </div>
                <div class="p-meta">
                  <span>{{ p.completedContracts }} jobs</span>
                  @if (p.longestStreak) { <span>🔥{{ p.longestStreak }}d</span> }
                  @if (p.streak >= 7) { <span class="streak-tag">Hot streak</span> }
                </div>
              </div>
              <button mat-stroked-button color="primary" class="hire-btn" (click)="$event.stopPropagation(); startHire(p)">Hire</button>
            </div>
          }
        </div>
      }

      @if (loadingMore()) {
        <div class="loader-more"><mat-spinner diameter="22"></mat-spinner></div>
      }
    </main>

    @if (hireDialogOpen()) {
      <div class="backdrop" (click)="closeHire()"></div>
      <div class="hire-sheet">
        <div class="sheet-handle"></div>
        <div class="sheet-header">
          <div>
            <h2>Hire {{ selectedPromoter()?.displayName }}</h2>
            <span>{{ selectedPromoter()?.completedContracts }} jobs · {{ tierLabel(selectedPromoter()?.tier) }}</span>
          </div>
          <button mat-icon-button class="close-btn" (click)="closeHire()"><mat-icon>close</mat-icon></button>
        </div>
        <div class="sheet-body">
          @for (task of hireTasks; track task.type; let i = $index) {
            <div class="task-row">
              <select [(ngModel)]="task.type" class="field">
                <option value="like">Likes</option><option value="comment">Comments</option><option value="share">Shares</option><option value="follow">Follows</option>
              </select>
              <input type="number" [(ngModel)]="task.target" min="1" class="field" placeholder="Count">
              @if (hireTasks.length > 1) { <button mat-icon-button class="delete-btn" (click)="hireTasks.splice(i,1)"><mat-icon>delete</mat-icon></button> }
            </div>
          }
          <button mat-stroked-button class="add-task-btn" (click)="hireTasks.push({type:'like',target:10})"><mat-icon>add</mat-icon> Add task</button>
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
  styleUrls: ['./hire-promoters-mobile.component.scss']
})
export class HirePromotersMobileComponent extends HirePromotersComponent {}
