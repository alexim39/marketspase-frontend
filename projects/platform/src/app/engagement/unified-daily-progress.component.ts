import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '@shared/services/api';

@Component({
  selector: 'app-unified-daily-progress',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatCardModule, MatProgressBarModule, MatProgressSpinnerModule],
  template: `
    <mat-card class="daily-progress-card">
      <mat-card-content>
        <!-- Header: Streak + Session -->
        <div class="card-header">
          <div class="streak-section">
            <mat-icon class="streak-icon">local_fire_department</mat-icon>
            <div>
              <strong>{{ streakStatus() }}</strong>
              <span>{{ sessionStatus() }}</span>
            </div>
          </div>
          @if (claimable()) {
            <button mat-flat-button color="primary" (click)="claimMission()">
              Claim ₦{{ mission()?.reward }}
            </button>
          }
        </div>

        <!-- Session progress bar -->
        <div class="progress-row">
          <span class="progress-label">Session</span>
          <mat-progress-bar mode="determinate" [value]="sessionPercent()"></mat-progress-bar>
          <span class="progress-text">{{ sessionPercent() | number:'1.0-0' }}%</span>
        </div>

        <!-- Mission tasks (if available) -->
        @if (mission() && !mission()?.completed) {
          <div class="mission-section">
            <span class="section-label">Today's Mission · {{ mission().label || 'Standard Day' }}</span>
            @for (r of mission().requirements || []; track r.type) {
              <div class="mission-task">
                <mat-icon>{{ taskIcons[r.type] || 'check' }}</mat-icon>
                <span class="task-type">{{ r.type }}</span>
                <div class="task-bar-wrap">
                  <mat-progress-bar mode="determinate" [value]="r.target ? (r.completed / r.target * 100) : 0" [color]="r.completed >= r.target ? 'primary' : 'accent'"></mat-progress-bar>
                </div>
                <span class="task-count">{{ r.completed }}/{{ r.target }}</span>
              </div>
            }
          </div>
        } @else if (!loadingData()) {
          <div class="empty-mission">
            <mat-icon>nightlight_round</mat-icon>
            <p>New mission at midnight. Engage with posts to earn rewards.</p>
          </div>
        }

        @if (loadingData()) {
          <div class="loader"><mat-spinner diameter="20"/></div>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .daily-progress-card { border-radius: 16px; border: 1px solid rgba(var(--primary-rgb), 0.12); background: linear-gradient(135deg, var(--surface-color) 0%, rgba(var(--primary-rgb), 0.02) 100%); }
    .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
    .streak-section { display: flex; align-items: center; gap: 10px; strong { display: block; font-size: 0.95rem; font-weight: 700; color: var(--text-primary); } span { display: block; font-size: 0.72rem; color: var(--text-tertiary); } .streak-icon { color: #f59e0b; font-size: 28px; width: 28px; height: 28px; } }
    .progress-row { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; .progress-label { font-size: 0.7rem; color: var(--text-tertiary); text-transform: uppercase; min-width: 50px; } mat-progress-bar { flex: 1; } .progress-text { font-size: 0.72rem; font-weight: 700; color: var(--text-secondary); min-width: 32px; text-align: right; } }
    .mission-section { margin-top: 6px; }
    .section-label { display: block; font-size: 0.68rem; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px; }
    .mission-task { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; mat-icon { font-size: 16px; width: 16px; height: 16px; color: var(--primary-color); } .task-type { font-size: 0.75rem; color: var(--text-secondary); text-transform: capitalize; min-width: 50px; } .task-bar-wrap { flex: 1; } .task-count { font-size: 0.72rem; font-weight: 700; color: var(--text-primary); min-width: 36px; text-align: right; } }
    .empty-mission { text-align: center; padding: 12px 0; color: var(--text-tertiary); mat-icon { font-size: 20px; width: 20px; height: 20px; opacity: 0.4; } p { font-size: 0.75rem; margin: 4px 0 0; } }
    .loader { text-align: center; padding: 10px; }
  `]
})
export class UnifiedDailyProgressComponent implements OnInit {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);

  mission = signal<any>(null);
  streak = signal<any>({ currentStreak: 0, longestStreak: 0 });
  sessionPercent = signal(0);
  loadingData = signal(true);

  readonly taskIcons: Record<string, string> = { like: 'thumb_up', comment: 'chat', share: 'share', follow: 'person_add' };

  claimable = computed(() => {
    const m = this.mission();
    if (!m || m.completed) return false;
    return (m.requirements || []).every((r: any) => r.completed >= r.target);
  });

  streakStatus = computed(() => {
    const s = this.streak();
    return s.currentStreak > 0 ? `${s.currentStreak}-day streak` : 'No streak yet';
  });

  sessionStatus = computed(() => {
    const p = this.sessionPercent();
    if (p >= 100) return 'Session complete ✅';
    return `Session: ${Math.round(p)}%`;
  });

  ngOnInit(): void {
    this.loadData();
    // Poll every 60s for session progress
    setInterval(() => this.refreshStreak(), 60000);
  }

  async loadData() {
    try {
      const [userRes, streakRes] = await Promise.all([
        this.api.get<any>('api/v1/user/me', undefined, undefined, true).toPromise(),
        this.api.get<any>('api/v1/streaks/status', undefined, undefined, true).toPromise()
      ]);
      this.mission.set(userRes?.data?.dailyMission || null);
      const ls = streakRes?.data?.loginStreak || streakRes?.data?.streak || {};
      this.streak.set(ls);
      this.sessionPercent.set(streakRes?.data?.sessionProgress || 0);
    } catch (e) {} finally {
      this.loadingData.set(false);
    }
  }

  refreshStreak() {
    this.api.get<any>('api/v1/streaks/status', undefined, undefined, true).subscribe({
      next: (r: any) => this.sessionPercent.set(r?.data?.sessionProgress || 0)
    });
  }

  claimMission(): void {
    this.api.post('api/v1/social/missions/claim', {}, undefined, true).subscribe({
      next: (r: any) => {
        this.mission.update(m => m ? { ...m, completed: true } : null);
        this.snack.open(`₦${r?.data?.reward || this.mission()?.reward} credited!`, 'OK', { duration: 3000 });
      },
      error: (e) => this.snack.open(e?.error?.message || 'Claim failed', 'OK', { duration: 3000 })
    });
  }
}
