import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserInterface } from '@shared/services';
import { DailyCheckInService } from './daily-check-in.service';

@Component({
  selector: 'app-daily-check-in',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule],
  templateUrl: './daily-check-in.component.html',
  styleUrls: ['./daily-check-in.component.scss'],
  providers: []
})
export class DailyCheckInComponent {
  readonly user = input<UserInterface | null>(null);

  readonly streakService = inject(DailyCheckInService);
  private readonly snackBar = inject(MatSnackBar);

  readonly status = this.streakService.status;
  readonly promptOpen = this.streakService.promptOpen;
  readonly loading = this.streakService.loading;
  readonly withdrawInFlight = this.streakService.withdrawInFlight;

  readonly currentWalletType = computed<'marketer' | 'promoter'>(() => (
    this.user()?.role === 'promoter' ? 'promoter' : 'marketer'
  ));

  readonly sessionProgressPercent = computed(() => this.streakService.getProgressPercent(this.status()));
  readonly payoutProgressPercent = computed(() => this.streakService.getCycleProgressPercent(this.status()));

  get remainingMinutes(): number {
    const remainingSeconds = this.status()?.remainingActiveSeconds || 0;
    return Math.max(0, Math.ceil(remainingSeconds / 60));
  }

  closePrompt(): void {
    this.streakService.closePrompt();
  }

  reopenPrompt(): void {
    this.streakService.reopenPrompt();
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
