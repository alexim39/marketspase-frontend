import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ApiService } from '@shared/services/api';

@Component({
  selector: 'app-mission-progress-widget',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressBarModule, MatButtonModule, MatCardModule],
  template: `
    @if (mission()) {
      <mat-card class="mission-card">
        <mat-card-content>
          <div class="mission-header">
            <mat-icon>rocket_launch</mat-icon>
            <div>
              <h3>Today's Mission</h3>
              <span>{{ mission().label }}</span>
            </div>
            @if (mission().completed) {
              <span class="done-badge">Done</span>
            } @else if (progress() >= 100) {
              <button mat-flat-button color="primary" (click)="claimReward()">Claim ₦{{ mission().reward }}</button>
            }
          </div>

          <div class="mission-tasks">
            @for (r of mission().requirements; track r.type) {
              <div class="task-item">
                <div class="task-info">
                  <mat-icon>{{ taskIcon(r.type) }}</mat-icon>
                  <span>{{ r.type | titlecase }}</span>
                  <strong>{{ r.completed }}/{{ r.target }}</strong>
                </div>
                <mat-progress-bar mode="determinate" [value]="r.target ? (r.completed / r.target * 100) : 0" [color]="r.completed >= r.target ? 'primary' : 'accent'"></mat-progress-bar>
              </div>
            }
          </div>

          <div class="mission-footer">
            <mat-progress-bar mode="determinate" [value]="progress()"></mat-progress-bar>
            <span>{{ progress() }}% complete · Reward: ₦{{ mission().reward }}</span>
            @if (streak() > 0) {
              <span class="streak">🔥 {{ streak() }}-day streak</span>
            }
          </div>
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: [`
    .mission-card { border-radius: 16px; border: 1px solid rgba(var(--primary-rgb), 0.15); background: linear-gradient(135deg, var(--surface-color) 0%, rgba(var(--primary-rgb), 0.03) 100%); margin: 0 14px 12px; }
    .mission-header { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; mat-icon { color: #f59e0b; font-size: 26px; width: 26px; height: 26px; } h3 { margin: 0; font-size: 0.95rem; font-weight: 700; } span { font-size: 0.72rem; color: var(--text-tertiary); display: block; } .done-badge { padding: 3px 10px; border-radius: 999px; font-size: 0.7rem; font-weight: 700; background: rgba(var(--success-rgb), 0.1); color: var(--success-color); margin-left: auto; } button { flex-shrink: 0; margin-left: auto; min-height: 34px; font-size: 0.75rem; font-weight: 700; } }
    .mission-tasks { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
    .task-item { .task-info { display: flex; align-items: center; gap: 6px; margin-bottom: 3px; font-size: 0.78rem; mat-icon { font-size: 16px; width: 16px; height: 16px; color: var(--primary-color); } strong { margin-left: auto; font-size: 0.72rem; color: var(--text-secondary); } } }
    .mission-footer { text-align: center; span { display: block; font-size: 0.72rem; color: var(--text-tertiary); margin-top: 4px; } .streak { display: inline-block; margin-top: 2px; padding: 2px 8px; border-radius: 999px; font-size: 0.68rem; font-weight: 700; background: rgba(245,158,11,0.12); color: #d97706; } }
  `]
})
export class MissionProgressWidgetComponent implements OnInit {
  private api = inject(ApiService);

  mission = signal<any>(null);
  progress = computed(() => {
    const m = this.mission();
    if (!m?.requirements?.length) return 0;
    const total = m.requirements.reduce((s: number, r: any) => s + r.target, 0);
    const done = m.requirements.reduce((s: number, r: any) => s + Math.min(r.completed, r.target), 0);
    return total > 0 ? Math.round((done / total) * 100) : 0;
  });
  streak = signal(0);

  ngOnInit(): void {
    this.api.get<any>('api/v1/auth/me', undefined, undefined, true).subscribe({
      next: (r: any) => {
        const user = r?.data || r;
        if (user?.dailyMission) this.mission.set(user.dailyMission);
        if (user?.engagementStreak?.current) this.streak.set(user.engagementStreak.current);
      }
    });
  }

  taskIcon(type: string): string {
    const icons: Record<string, string> = { like: 'thumb_up', comment: 'chat', share: 'share', follow: 'person_add' };
    return icons[type] || 'check';
  }

  claimReward(): void {
    if (!this.mission()?.completed) {
      this.api.post('api/v1/social/missions/claim', {}, undefined, true).subscribe({
        next: () => this.mission.set({ ...this.mission(), completed: true }),
        error: () => {}
      });
    }
  }
}
