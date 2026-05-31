import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { UserInterface } from '@shared/services';
import { UserService } from '../../../common/services/user.service';
import { NotificationSettingsComponent } from '../notification/notification.component';
import { ThemeSettingsComponent } from '../theme/theme.component';

type SystemSectionId = 'notifications' | 'theme';

interface SystemSection {
  id: SystemSectionId;
  icon: string;
  label: string;
  description: string;
}

@Component({
  selector: 'async-system-setting-mobile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    NotificationSettingsComponent,
    ThemeSettingsComponent,
  ],
  templateUrl: './system-setting-mobile.component.html',
  styleUrls: ['./system-setting-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemSettingMobileComponent {
  private readonly userService = inject(UserService);

  readonly user = this.userService.user;
  readonly activeSection = signal<SystemSectionId>('notifications');

  readonly sections: SystemSection[] = [
    {
      id: 'notifications',
      icon: 'notifications_active',
      label: 'Notifications',
      description: 'Email alerts for campaigns, platform updates, and important messages',
    },
    {
      id: 'theme',
      icon: 'palette',
      label: 'Theme',
      description: 'Light mode, dark mode, system default, and high contrast controls',
    },
  ];

  readonly currentThemeLabel = computed(() => {
    const theme = this.user()?.preferences?.theme;
    if (theme?.systemDefault ?? true) return 'System';
    return theme?.darkMode ? 'Dark' : 'Light';
  });

  readonly summaryStats = computed(() => {
    const user = this.user();
    const theme = user?.preferences?.theme;
    const notificationOn = !!user?.preferences?.notification;
    const systemDefault = theme?.systemDefault ?? true;
    const highContrast = !!theme?.highContrast;

    return [
      {
        icon: notificationOn ? 'notifications_active' : 'notifications_off',
        label: 'Email alerts',
        value: notificationOn ? 'On' : 'Off',
        tone: notificationOn ? 'good' : 'warn',
      },
      {
        icon: systemDefault ? 'auto_mode' : theme?.darkMode ? 'dark_mode' : 'light_mode',
        label: 'Theme',
        value: this.currentThemeLabel(),
        tone: 'neutral',
      },
      {
        icon: 'contrast',
        label: 'Contrast',
        value: highContrast ? 'High' : 'Normal',
        tone: highContrast ? 'good' : 'neutral',
      },
    ];
  });

  readonly systemAdvice = computed(() => {
    const user = this.user();
    const notificationOn = !!user?.preferences?.notification;
    const theme = user?.preferences?.theme;

    if (!notificationOn) {
      return 'Turn on email alerts if you want important campaign, storefront, and wallet updates outside the app.';
    }

    if (theme?.systemDefault ?? true) {
      return 'Your theme follows your device setting, which keeps the app comfortable between day and night use.';
    }

    if (theme?.highContrast) {
      return 'High contrast is enabled, so controls and text should stay easier to read on smaller screens.';
    }

    return 'Your system preferences are ready. Review them whenever your notification or display needs change.';
  });

  selectSection(section: SystemSectionId): void {
    this.activeSection.set(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  sectionStatus(section: SystemSectionId): string {
    const user = this.user();
    if (!user) return 'Pending';

    if (section === 'notifications') {
      return user.preferences?.notification ? 'Enabled' : 'Off';
    }

    return this.currentThemeLabel();
  }
}
