import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit, ViewChild, HostListener, signal, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDialog } from '@angular/material/dialog';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { HelpDialogComponent, UserInterface } from '../../../../shared-services/src/public-api';
import { SettingsService } from './settings.service';
import { UserService } from '../common/services/user.service';
import { RecentActivityComponent } from './components/recent-activity/recent-activity.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DashboardService } from '../dashboard/dashboard.service';

// Define the activity interface based on your user model
interface UserActivity {
  action: string;
  description: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  _id?: string;
}

interface DisplayActivity {
  icon: string;
  title: string;
  time: string;
  timestamp: Date;
}

interface UserWithActivities extends UserInterface {
  activityLog: any[];
  activitySettings: {
    retainPeriod: number;
    enabled: boolean;
  };
}

@Component({
  selector: 'settings-index',
  standalone: true,
  providers: [SettingsService, DashboardService],
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    RouterModule,
    MatListModule,
    MatSidenavModule,
    MatToolbarModule,
    MatBadgeModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatMenuModule,
    MatProgressBarModule,
    MatDividerModule,
    RecentActivityComponent
  ],
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss']
})
export class SettingsIndexComponent implements OnInit {
  readonly dialog = inject(MatDialog);
  // @Input() user!: UserInterface & {
  //   activityLog?: UserActivity[];
  // };
  private userService = inject(UserService);
  public user = this.userService.user;
  @ViewChild('drawer') drawer!: MatSidenav;
  private router = inject(Router);
  private settingsService = inject(SettingsService);
  private readonly snackBar = inject(MatSnackBar);
  private dashboardService = inject(DashboardService);

  // Enhanced Properties
  isMobile = false;
  isOnline = true;
  showSearch = false;
  hasNotifications = true;
  unreadNotifications = 3;
  connectedIntegrations = 5;
  //currentRating = 4;
  securityScore = 85;
  storageUsed = 2.4;
  storageTotal = 15;
  defaultAvatar = '/img/avatar.png';

    // state
  onlineCount = signal<number | null>(null);
  loadingOnlineCount = signal(true);

  // derived state (pure, no side effects)
  onlineCountLabel = computed(() => {
    if (this.loadingOnlineCount()) return '—';

    const count = this.onlineCount();
    if (!count || count <= 0) return '0';

    return `${count}+`;
  });



  loadOnlineCount(): void {
    this.loadingOnlineCount.set(true);

    this.dashboardService
    .getUsersOnlineCount(this.user()?._id ?? '')
    .subscribe({
      next: (res) => {
        //console.log('res ',res)
        this.onlineCount.set(res?.count ?? 0);
        this.loadingOnlineCount.set(false);
      },
      error: () => {
        this.onlineCount.set(0);
        this.loadingOnlineCount.set(false);
      }
    });
  }

  // Completion Status
  completionStatus = {
    profile: 85,
    security: 92,
    billing: 100
  };

  // Expandable Sections
  expandedSections = {
    account: true,
    system: true,
    support: false
  };

  // Recent Activities - Now populated from user model
  recentActivities: DisplayActivity[] = [];

  @HostListener('window:online', ['$event'])
  onOnline(event: Event) {
    this.isOnline = true;
  }

  @HostListener('window:offline', ['$event'])
  onOffline(event: Event) {
    this.isOnline = false;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.isMobile = window.innerWidth <= 768;
  }

  ngOnInit() {
    this.isMobile = window.innerWidth <= 768;
    this.loadRecentActivities();

    this.loadOnlineCount();
  }

  // Load recent activities from user model
  loadRecentActivities() {
  const user = this.user() as UserWithActivities | null;
  
  if (user?.activityLog && user.activityLog.length > 0) {
    const recentUserActivities = user.activityLog
      .slice(0, 10)
      .map(activity => this.mapActivityToDisplay(activity));
    this.recentActivities = recentUserActivities;
  } else {
    this.recentActivities = this.getDefaultActivities();
  }
}

  

  // Map backend activity to display format
  private mapActivityToDisplay(activity: UserActivity): DisplayActivity {
    return {
      icon: this.getActivityIcon(activity.action),
      title: activity.description,
      time: this.formatTimeAgo(activity.timestamp),
      timestamp: activity.timestamp
    };
  }

  // Get appropriate icon for activity type
  private getActivityIcon(action: string): string {
    const iconMap: { [key: string]: string } = {
      // Authentication & Profile
      'login': 'login',
      'logout': 'logout',
      'profile_update': 'person',
      'password_change': 'password',
      'email_verify': 'mark_email_read',
      
      // Wallet & Financial
      'wallet_fund': 'account_balance_wallet',
      'withdrawal_request': 'payments',
      'withdrawal_complete': 'check_circle',
      'transfer': 'swap_horiz',
      
      // Campaign & Promotion
      'campaign_create': 'campaign',
      'campaign_update': 'edit',
      'campaign_delete': 'delete',
      'campaign_pause': 'pause_circle',
      'promotion_submit': 'send',
      'promotion_approve': 'verified',
      'promotion_reject': 'cancel',
      
      // Notification & Settings
      'notification_settings_update': 'notifications',
      'preferences_update': 'tune',
      
      // Account Management
      'device_add': 'devices',
      'device_remove': 'devices_off',
      'payout_account_add': 'account_balance',
      'payout_account_remove': 'account_balance',
      
      // System
      'role_change': 'admin_panel_settings',
      'account_verify': 'verified_user',
      'account_suspend': 'block',
      
      // Default
      'default': 'history'
    };

    return iconMap[action] || iconMap['default'];
  }

  // Format timestamp to relative time
  private formatTimeAgo(timestamp: Date): string {
    const now = new Date();
    const activityDate = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - activityDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return activityDate.toLocaleDateString();
    }
  }

  // Fallback default activities
  private getDefaultActivities(): DisplayActivity[] {
    return [
      {
        icon: 'history',
        title: 'Account history',
        time: 'Just now',
        timestamp: new Date()
      }
    ];
  }

  // Refresh activities (useful if activities are updated)
  refreshActivities() {
    this.loadRecentActivities();
  }

  showDescription() {
    this.dialog.open(HelpDialogComponent, {
      data: { 
        help: 'In this section, you can set up your profile details and manage your account settings with our enhanced interface. The Recent Activity section shows your latest account actions.' 
      },
      panelClass: 'help-dialog'
    });
  }

  toggleSearch() {
    this.showSearch = !this.showSearch;
    if (this.showSearch) {
      setTimeout(() => {
        const searchInput = document.querySelector('.search-input') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }, 300);
    }
  }

  toggleSection(section: string) {
    this.expandedSections = {
      ...this.expandedSections,
      [section]: !this.expandedSections[section as keyof typeof this.expandedSections]
    };
  }

  getCompletionCircle(percentage: number): string {
    const circumference = 2 * Math.PI * 15.9155;
    const offset = circumference - (percentage / 100) * circumference;
    return `${circumference} ${circumference}`;
  }

  getSecurityIcon(): string {
    if (this.securityScore >= 80) return 'shield';
    if (this.securityScore >= 60) return 'verified_user';
    return 'warning';
  }

  contactSupport() {
    console.log('Opening support chat...');
  }

  editProfile() {
    this.router.navigate(['/settings/account']);
    this.closeMobileMenu();
  }

  changeAvatar() {
    console.log('Changing avatar...');
  }

  viewProfile() {
    console.log('Viewing public profile...');
  }

  accountSettings() {
    this.router.navigate(['/settings/account']);
    this.closeMobileMenu();
  }

  closeMobileMenu() {
    if (this.isMobile && this.drawer) {
      this.drawer.close();
    }
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openWhatsAppChannel() {
     const whatsappUrl = 'https://whatsapp.com/channel/0029Vb77xA51NCrKysUMO11D';
    // provide immediate UI feedback
    this.snackBar.open('Opening WhatsApp channel...', 'Close', { duration: 2500 });
    // open in new tab / window
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }
}