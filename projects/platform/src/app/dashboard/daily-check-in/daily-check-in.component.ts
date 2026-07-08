import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { UserInterface } from '@shared/services';
import { ApiService } from '@shared/services/api';
import { DailyCheckInService } from './daily-check-in.service';

@Component({
  selector: 'app-daily-check-in',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule, MatButtonModule, MatIconModule, MatProgressBarModule],
  templateUrl: './daily-check-in.component.html',
  styleUrls: ['./daily-check-in.component.scss'],
  providers: []
})
export class DailyCheckInComponent {
  readonly user = input<UserInterface | null>(null);

  readonly streakService = inject(DailyCheckInService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly api = inject(ApiService);

  readonly status = this.streakService.status;
  readonly promptOpen = this.streakService.promptOpen;
  readonly loading = this.streakService.loading;
  readonly withdrawInFlight = this.streakService.withdrawInFlight;
  readonly mission = signal<any>(null);

  readonly taskIcons: Record<string, string> = { like: 'thumb_up', comment: 'chat', share: 'share', follow: 'person_add' };

  readonly missionClaimable = computed(() => {
    const m = this.mission();
    if (!m || m.completed) return false;
    return (m.requirements || []).every((r: any) => r.completed >= r.target);
  });

  readonly currentWalletType = computed<'marketer' | 'promoter'>(() => (
    this.user()?.role === 'promoter' ? 'promoter' : 'marketer'
  ));

  readonly sessionProgressPercent = computed(() => this.streakService.getProgressPercent(this.status()));
  readonly payoutProgressPercent = computed(() => this.streakService.getCycleProgressPercent(this.status()));

  constructor() {
    // Fetch mission whenever the dialog opens (click OR auto-open)
    effect(() => {
      if (this.promptOpen()) {
        this.fetchMission();
      }
    });
  }

  private fetchMission(): void {
    console.log('[mission] fetchMission called');
    this.api.get<any>('api/v1/auth/me', undefined, undefined, true).subscribe({
      next: (r: any) => {
        const dm = r?.data?.dailyMission || r?.dailyMission || null;
        console.log('[mission] user/me response — dailyMission:', dm);
        if (!dm) {
          console.log('[mission] no mission found — setting default + calling generate');
          const today = new Date(); today.setHours(0, 0, 0, 0);
          this.mission.set({
            date: today, label: 'Starter Standard', tier: 'starter',
            requirements: [{ type: 'like', target: 10, completed: 0 }, { type: 'comment', target: 3, completed: 0 }],
            reward: 120, completed: false
          });
          this.generateMission();
        } else {
          console.log('[mission] existing mission found — setting:', dm.label, dm.reward);
          this.mission.set(dm);
        }
      },
      error: (err) => console.error('[mission] user/me failed:', err)
    });
  }

  private generateMission(): void {
    console.log('[mission] POST /social/missions/generate');
    this.api.post('api/v1/social/missions/generate', {}, undefined, true).subscribe({
      next: (r: any) => {
        console.log('[mission] generate response:', r?.data);
        if (r?.data) this.mission.set(r.data);
      },
      error: (err) => {
        console.error('[mission] generate failed:', err);
        // keep the default mission
      }
    });
  }

  get remainingMinutes(): number {
    const remainingSeconds = this.status()?.remainingActiveSeconds || 0;
    return Math.max(0, Math.ceil(remainingSeconds / 60));
  }

  closePrompt(): void {
    this.streakService.closePrompt();
  }

  reopenPrompt(): void {
    this.streakService.reopenPrompt();
    this.fetchMission();
  }

  claimMission(): void {
    this.api.post('api/v1/social/missions/claim', {}, undefined, true).subscribe({
      next: (r: any) => {
        this.mission.update(m => m ? { ...m, completed: true } : null);
        this.snackBar.open(`₦${r?.data?.reward || this.mission()?.reward} credited to wallet!`, 'Close', { duration: 4000 });
      },
      error: (e) => this.snackBar.open(e?.error?.message || 'Claim failed', 'Close', { duration: 4000 })
    });
  }

  withdraw(): void {
    const walletType = this.currentWalletType();
    this.streakService.withdrawToWallet(walletType).subscribe({
      next: (response) => {
        this.snackBar.open(response?.message || 'Streak reward moved to wallet.', 'Close', {
          duration: 5000,
        });
      },
      error: (error) => {
        this.snackBar.open(error?.error?.message || 'Unable to withdraw streak rewards right now.', 'Close', {
          duration: 5000,
        });
      },
    });
  }
}
