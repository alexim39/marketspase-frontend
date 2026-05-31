import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { UserInterface } from '@shared/services';
import { RecentActivityComponent } from '../components/recent-activity/recent-activity.component';

interface SettingsActivity {
  icon: string;
  title: string;
  time: string;
  timestamp: Date;
}

interface SettingsShortcut {
  title: string;
  description: string;
  icon: string;
  route: string;
  accent: 'primary' | 'success' | 'warning' | 'info';
  meta: string;
}

@Component({
  selector: 'app-settings-mobile-index',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, RecentActivityComponent],
  templateUrl: './settings-mobile-index.component.html',
  styleUrls: ['./settings-mobile-index.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsMobileIndexComponent {
  readonly user = input<UserInterface | null>(null);
  readonly isOnline = input(true);
  readonly onlineCountLabel = input('0');
  readonly recentActivities = input<SettingsActivity[]>([]);

  readonly helpRequested = output<void>();
  readonly joinChannelRequested = output<void>();

  readonly shortcuts: SettingsShortcut[] = [
    {
      title: 'Account',
      description: 'Profile, username, business details',
      icon: 'account_circle',
      route: './account',
      accent: 'primary',
      meta: 'Identity',
    },
    {
      title: 'System',
      description: 'Theme, notification preferences',
      icon: 'tune',
      route: './system',
      accent: 'info',
      meta: 'Experience',
    },
    {
      title: 'Support',
      description: 'Help, contact, testimonial',
      icon: 'support_agent',
      route: './support',
      accent: 'success',
      meta: 'Care',
    },
    {
      title: 'Ad preferences',
      description: 'Category and location signals',
      icon: 'ads_click',
      route: './ads/preferences',
      accent: 'warning',
      meta: 'Ads',
    },
  ];

  readonly profileCompletion = computed(() => {
    const user = this.user();
    if (!user) {
      return 0;
    }

    const checks = [
      Boolean(user.displayName),
      Boolean(user.email),
      Boolean(user.username),
      Boolean(user.avatar),
      Boolean(user.personalInfo?.phoneDetails?.fullNumber || user.personalInfo?.phone),
      Boolean(user.personalInfo?.address?.state),
      Boolean(user.professionalInfo?.jobTitle),
      Boolean(user.professionalInfo?.profileHeadline || user.biography || user.personalInfo?.biography),
    ];

    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  });

  readonly primaryWallet = computed(() => {
    const user = this.user();
    if (!user?.wallets) {
      return null;
    }

    const role = user.role === 'marketer' ? 'marketer' : 'promoter';
    return user.wallets[role] || null;
  });

  readonly profileInitials = computed(() => {
    const user = this.user();
    const name = user?.displayName || user?.username || 'MarketSpase';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('');
  });

  readonly roleLabel = computed(() => {
    const role = this.user()?.role || 'user';
    return role.replace('_', ' ');
  });

  emitHelp(): void {
    this.helpRequested.emit();
  }

  emitJoinChannel(): void {
    this.joinChannelRequested.emit();
  }

  trackShortcut(index: number, shortcut: SettingsShortcut): string {
    return shortcut.route || String(index);
  }
}
