import { Component, Input, computed, inject, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { UserInterface } from '@shared/services';
import { CurrencyService } from '../../common/services/currency.service';

@Component({
  selector: 'wallet-balance-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './wallet-balance-card.component.html',
  styleUrls: ['./wallet-balance-card.component.scss'],
})
export class WalletBalanceCardComponent implements OnDestroy {
  private currencyService = inject(CurrencyService);
  @Input({ required: true }) user: UserInterface | null = null;

  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  protected countdownTick = signal(0);

  protected readonly wallet = computed(() => this.user?.wallets?.promoter ?? null);

  protected readonly availableBalance = computed(() => this.wallet()?.balance ?? 0);
  protected readonly reservedBalance = computed(() => this.wallet()?.reserved ?? 0);
  protected readonly totalBalance = computed(() => this.availableBalance() + this.reservedBalance());
  protected readonly currency = computed(() => this.wallet()?.currency ?? 'NGN');

  protected readonly earliestReservedTransaction = computed(() => {
    const transactions = this.wallet()?.transactions ?? [];
    let earliest: (typeof transactions)[0] | null = null;

    for (const tx of transactions) {
      const status = String(tx.status || '').toLowerCase();
      const isPendingOrProcessing = status === 'pending' || status === 'processing' || status === 'reserved';
      if (!isPendingOrProcessing) continue;

      const reservedUntil = (tx as any).reservedUntil ? new Date((tx as any).reservedUntil).getTime() : null;
      if (reservedUntil === null) continue;

      if (!earliest || reservedUntil < new Date((earliest as any).reservedUntil).getTime()) {
        earliest = tx;
      }
    }

    return earliest;
  });

  protected readonly reservedRelativeTime = computed(() => {
    const tx = this.earliestReservedTransaction();
    if (!tx) return null;

    const reservedUntil = (tx as any).reservedUntil as string | Date | undefined;
    if (!reservedUntil) return null;

    // Force reactivity on countdown tick
    void this.countdownTick();

    const target = new Date(reservedUntil).getTime();
    const now = Date.now();
    const diff = target - now;

    if (diff <= 0) return 'available now';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return remainingHours > 0
        ? `releasing in ~${days}d ${remainingHours}h`
        : `releasing in ~${days}d`;
    }

    if (hours > 0) {
      return minutes > 0
        ? `releasing in ~${hours}h ${minutes}m`
        : `releasing in ~${hours}h`;
    }

    return `releasing in ~${minutes}m`;
  });

  protected formatAmount(amount: number): string {
    return this.currencyService.format(amount, this.currency());
  }

  constructor() {
    this.countdownInterval = setInterval(() => {
      this.countdownTick.update((t) => t + 1);
    }, 30000);
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }
}
