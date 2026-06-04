// dashboard-header.component.ts
import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserInterface } from '@shared/services';


@Component({
  selector: 'dashboard-header',
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './dashboard-header.component.html',
  styleUrls: ['./dashboard-header.component.scss']
})
export class DashboardHeaderComponent {
  user = input<UserInterface | null>(null);
  unreadMessages = input(0);
  unreadNotifications = input(0);

  createCampaign = output<void>();
  browseCampaign = output<void>();
  viewCampaigns = output<void>();
  viewPromotions = output<void>();
  withdrawWallet = output<void>();
  logout = output<void>();


  // state
  // onlineCount = signal<number | null>(null);
  // loadingOnlineCount = signal(true);

  // // derived state (pure, no side effects)
  // onlineCountLabel = computed(() => {
  //   if (this.loadingOnlineCount()) return '—';

  //   const count = this.onlineCount();
  //   if (!count || count <= 0) return '0';

  //   return `${count}+`;
  // });

  // ngOnInit(): void {
  //   this.loadOnlineCount();
  // }

  // loadOnlineCount(): void {
  //   this.loadingOnlineCount.set(true);

  //   this.dashboardService
  //   .getUsersOnlineCount(this.user()?._id ?? '')
  //   .subscribe({
  //     next: (res) => {
  //       //console.log('res ',res)
  //       this.onlineCount.set(res?.count ?? 0);
  //       this.loadingOnlineCount.set(false);
  //     },
  //     error: () => {
  //       this.onlineCount.set(0);
  //       this.loadingOnlineCount.set(false);
  //     }
  //   });
  // }
  

  getDashboardGreeting(): string {
    const hour = new Date().getHours();
    const role = this.user()?.role;

    if (hour < 12) {
      return role === 'marketer'
        ? 'Good morning. Your campaign, wallet, and storefront signals are ready.'
        : 'Good morning. Your earnings, links, and payout signals are ready.';
    }

    if (hour < 17) {
      return role === 'marketer'
        ? 'Good afternoon. Review spend, ROI, and storefront performance.'
        : 'Good afternoon. Review billable clicks and promotion performance.';
    }

    return role === 'marketer'
      ? 'Good evening. Close the day with revenue and conversion clarity.'
      : 'Good evening. Check earnings, payouts, and account health.';
  }
}
