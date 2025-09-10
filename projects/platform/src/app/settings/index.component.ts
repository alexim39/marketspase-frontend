import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit, ViewChild, HostListener } from '@angular/core';
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

@Component({
  selector: 'settings-index',
  standalone: true,
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
    MatDividerModule
  ],
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss']
})
export class SettingsIndexComponent implements OnInit {
  readonly dialog = inject(MatDialog);
  @Input() user!: UserInterface;
  @ViewChild('drawer') drawer!: MatSidenav;
  private router = inject(Router);

  // Enhanced Properties
  isMobile = false;
  isOnline = true;
  showSearch = false;
  //isDarkMode = false;
  //notificationsEnabled = true;
  //isSyncing = false;
  hasNotifications = true;
  unreadNotifications = 3;
  connectedIntegrations = 5;
  currentRating = 4;
  securityScore = 85;
  storageUsed = 2.4;
  storageTotal = 15;
  defaultAvatar = 'assets/images/default-avatar.png';

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

  // Recent Activities
  recentActivities = [
    {
      icon: 'security',
      title: 'Password updated',
      time: '2 hours ago'
    },
    {
      icon: 'notifications',
      title: 'Notifications enabled',
      time: '1 day ago'
    },
    {
      icon: 'payment',
      title: 'Billing updated',
      time: '3 days ago'
    }
  ];

  @HostListener('window:online', ['$event'])
  onOnline(event: Event) {
    this.isOnline = true;
  }

  @HostListener('window:offline', ['$event'])
  onOffline(event: Event) {
    this.isOnline = false;
  }

  // Add this HostListener to your class
  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.isMobile = window.innerWidth <= 768; // Or whatever breakpoint you prefer
  }

  ngOnInit() {
    // Initialize the value on component load
    this.isMobile = window.innerWidth <= 768;
  }

  showDescription() {
    this.dialog.open(HelpDialogComponent, {
      data: { help: 'In this section, you can set up your profile details and manage your account settings with our enhanced interface.' },
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
    // Implement contact support functionality
    console.log('Opening support chat...');
  }

  editProfile() {
    this.router.navigate(['/settings/account']);
    this.closeMobileMenu();
  }

  changeAvatar() {
    // Implement avatar change functionality
    console.log('Changing avatar...');
  }

  viewProfile() {
    // Implement view profile functionality
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
}