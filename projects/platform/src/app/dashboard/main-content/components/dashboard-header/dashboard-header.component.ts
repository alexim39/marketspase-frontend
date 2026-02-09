// dashboard-header.component.ts
import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { UserInterface } from '../../../../../../../shared-services/src/public-api';


@Component({
  selector: 'dashboard-header',
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './dashboard-header.component.html',
  styleUrls: ['./dashboard-header.component.scss']
})
export class DashboardHeaderComponent {
  private router = inject(Router);

  user = input<UserInterface | null>();
  communityNotifications = input(0);
  unreadMessages = input(0);
  unreadNotifications = input(0);

  createCampaign = output<void>();
  browseCampaign = output<void>();
  viewCampaigns = output<void>();
  viewPromotions = output<void>();
  withdrawWallet = output<void>();
  logout = output<void>();

  getCommunityGreeting(): string {
    const hour = new Date().getHours();
    const role = this.user()?.role;

    if (hour < 12) {
      return role === 'marketer'
        ? 'Good morning! Ready to grow your business today?'
        : 'Good morning! Ready to earn by promoting great brands today?';
    }

    if (hour < 17) {
      return role === 'marketer'
        ? 'Good afternoon! How are your campaigns performing today?'
        : 'Good afternoon! Any promotions bringing in engagement yet?';
    }

    return role === 'marketer'
      ? 'Good evening! Time to review your sales and performance.'
      : 'Good evening! Check your earnings and completed promotions.';
  }

  getOnlineCount(): string {
    const count = Math.floor(Math.random() * 500) + 100;
    return `${count}+`;
  }

  openCommunityFeed(): void {
    this.router.navigate(['dashboard/community']);
  }

  openMessages(): void {
    this.router.navigate(['dashboard/messages']);
  }

  openNotifications(): void {
    this.router.navigate(['dashboard/notifications']);
  }

  openStorefront(): void {
    this.router.navigate(['dashboard/storefront']);
  }

  openPromoterProfile(): void {
    this.router.navigate(['dashboard/profile']);
  }

  openAdSchool(): void {
    this.router.navigate(['dashboard/learning']);
  }

  openLeaderboard(): void {
    this.router.navigate(['dashboard/leaderboard']);
  }

  openSettings(): void {
    this.router.navigate(['dashboard/settings']);
  }
}