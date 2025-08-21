import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterModule } from '@angular/router';
import { UserInterface } from '../../common/services/user.service';
import { HelpDialogComponent } from '../../common/help-dialog.component';
import { MatListModule } from '@angular/material/list';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDialog } from '@angular/material/dialog';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

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
    MatToolbarModule
  ],
  template: `
    <div class="settings-container">
      <!-- Header Section -->
      <header class="settings-header">
        <nav class="breadcrumb">
          <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" (click)="scrollToTop()">
            <mat-icon>home</mat-icon> Dashboard
          </a>
          <mat-icon>chevron_right</mat-icon>
          <a>Settings</a>
          <mat-icon>chevron_right</mat-icon>
          <span class="current">Account Settings</span>
        </nav>

        <div class="header-content">
          <h1>
            <mat-icon class="header-icon">account_circle</mat-icon>
            Account Settings
            <button mat-icon-button class="help-button" (click)="showDescription()" matTooltip="Help" aria-label="Help">
              <mat-icon>help_outline</mat-icon>
            </button>
          </h1>
          <p>Manage your Davidotv account information</p>
        </div>
      </header>


      <!-- Main Content Area -->
      <div class="settings-wrapper">
        <mat-sidenav-container class="sidenav-container">
          <!-- Mobile Menu Toggle -->
          <mat-toolbar class="mobile-toolbar" *ngIf="isMobile">
            <span class="toolbar-spacer"></span>
            <button mat-stroked-button (click)="drawer.toggle()" class="menu-toggle" aria-label="Toggle menu">
              <mat-icon>menu</mat-icon>
              Menu
            </button>
          </mat-toolbar>

          <!-- Main Content -->
          <main class="main-content">
            <router-outlet/>
          </main>

          <!-- Side Navigation -->
          <mat-sidenav #drawer mode="side" position="end" class="settings-sidenav" 
                     [opened]="!isMobile" [fixedInViewport]="isMobile" 
                     [fixedTopGap]="isMobile ? 56 : 0">
            <div class="sidenav-header">
              <div class="sidenav-title-container">
                <h3>Quick Settings</h3>
                <button mat-icon-button class="close-button" (click)="drawer.toggle()" *ngIf="isMobile" aria-label="Close menu">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
              <!-- <div class="user-profile">
                <div class="avatar">
                  <mat-icon>account_circle</mat-icon>
                </div>
                <div class="user-info">
                  <div class="name">{{'User'}}</div>
                  <div class="email">{{ 'user@example.com'}}</div>
                </div>
              </div> -->
            </div>
            <mat-nav-list>
              <div class="nav-section">
                <div class="nav-section-label">ACCOUNT</div>
                <a mat-list-item routerLink="./account" routerLinkActive="active" (click)="closeMobileMenu()">
                  <div class="nav-item-content">
                    <div class="nav-icon-container">
                      <mat-icon class="nav-icon">manage_accounts</mat-icon>
                    </div>
                    <span class="nav-label">Profile Settings</span>
                  </div>
                  <mat-icon class="nav-chevron">chevron_right</mat-icon>
                </a>
               <!--  <a mat-list-item routerLink="./security" routerLinkActive="active" (click)="closeMobileMenu()">
                  <div class="nav-item-content">
                    <div class="nav-icon-container">
                      <mat-icon class="nav-icon">lock</mat-icon>
                    </div>
                    <span class="nav-label">Security</span>
                  </div>
                  <mat-icon class="nav-chevron">chevron_right</mat-icon>
                </a> -->
              </div>

              <div class="nav-section">
                <div class="nav-section-label">SYSTEM</div>
                <a mat-list-item routerLink="./system" routerLinkActive="active" (click)="closeMobileMenu()">
                  <div class="nav-item-content">
                    <div class="nav-icon-container">
                      <mat-icon class="nav-icon">tune</mat-icon>
                    </div>
                    <span class="nav-label">Preferences</span>
                  </div>
                  <mat-icon class="nav-chevron">chevron_right</mat-icon>
                </a>
                <!-- <a mat-list-item routerLink="./notifications" routerLinkActive="active" (click)="closeMobileMenu()">
                  <div class="nav-item-content">
                    <div class="nav-icon-container">
                      <mat-icon class="nav-icon">notifications</mat-icon>
                    </div>
                    <span class="nav-label">Notifications</span>
                  </div>
                  <mat-icon class="nav-chevron">chevron_right</mat-icon>
                </a> -->
              </div>

              <div class="nav-section">
                <div class="nav-section-label">SUPPORT</div>
                <a mat-list-item routerLink="./share-reviews" routerLinkActive="active" (click)="closeMobileMenu()">
                  <div class="nav-item-content">
                    <div class="nav-icon-container">
                      <mat-icon class="nav-icon">reviews</mat-icon>
                    </div>
                    <span class="nav-label">Share Feedback</span>
                  </div>
                  <mat-icon class="nav-chevron">chevron_right</mat-icon>
                </a>
                <!-- <a mat-list-item routerLink="/privacy" routerLinkActive="active" (click)="closeMobileMenu()">
                  <div class="nav-item-content">
                    <div class="nav-icon-container">
                      <mat-icon class="nav-icon">privacy_tip</mat-icon>
                    </div>
                    <span class="nav-label">Privacy Policy</span>
                  </div>
                  <mat-icon class="nav-chevron">chevron_right</mat-icon>
                </a> -->
                <!-- <a mat-list-item routerLink="/support" routerLinkActive="active" (click)="closeMobileMenu()">
                  <div class="nav-item-content">
                    <div class="nav-icon-container">
                      <mat-icon class="nav-icon">support_agent</mat-icon>
                    </div>
                    <span class="nav-label">Help Center</span>
                  </div>
                  <mat-icon class="nav-chevron">chevron_right</mat-icon>
                </a> -->
              </div>
            </mat-nav-list>
            <div class="sidenav-footer">
              <button mat-stroked-button class="logout-button" (click)="logout()">
                <mat-icon>home</mat-icon>
                <!-- Sign Out -->Home
              </button>
            </div>
          </mat-sidenav>
        </mat-sidenav-container>
      </div>
    </div>
  `,
  styles: [`

.settings-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

 .settings-header {
     //margin-bottom: -50px;
      padding: 16px;
      padding-left: 100px;
  }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      font-size: 14px;
      color: #666;
    }

    .breadcrumb a {
      display: flex;
      align-items: center;
      gap: 4px;
      text-decoration: none;
      color: #8f0045;
      transition: color 0.2s;
    }

    .breadcrumb a:hover {
      color: #8f0045;
    }

    .breadcrumb .current {
      color: #333;
      font-weight: 500;
    }

    .header-main h1 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 600;
      color: #333;
    }

    .transactions-icon {
      color: #8f0045;
      font-size: 32px;
    }

    .help {
      margin-left: auto;
    }

    .header-main p {
      margin: 0;
      color: #666;
      font-size: 16px;
    }

.header-content {
  h1 {
    display: flex;
    align-items: center;
    margin: 0;
    font-size: 28px;
    font-weight: 600;

    .header-icon {
      color: #8f0045;
      margin-right: 16px;
      font-size: 32px;
      height: 32px;
      width: 32px;
    }

    .help-button {
      margin-left: 16px;
      transition: all 0.2s ease;

      &:hover {
        color: #8f0045;
        transform: scale(1.1);
      }
    }
  }

  p {
    margin: 12px 0 0;
    font-size: 16px;
    line-height: 1.5;
  }
}

.settings-wrapper {
  flex: 1;
  max-width: 1600px;
  width: 100%;
  margin: 0 auto;
  padding: 32px;
}

.sidenav-container {
  height: calc(100vh - 180px);
  min-height: 500px;
  background: transparent;
  border-radius: 12px;
}

.mobile-toolbar {
  display: none;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 16px;
  padding: 0 16px;
  border-radius: 8px 8px 0 0;

  .toolbar-spacer {
    flex: 1;
  }

  .menu-toggle {
    color: #8f0045;
    border-color: #e2e8f0;
    font-weight: 500;
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-1px);
    }

    mat-icon {
      margin-right: 8px;
    }
  }
}

.main-content {
  flex: 1;
  padding-right: 32px;
  overflow-y: auto;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  padding: 24px;
}

.settings-sidenav {
  width: 320px;
  border: 1px solid #e2e8f0;
  box-shadow: -2px 0 12px rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
}

.sidenav-header {
  padding: 24px 24px 16px;
  border-bottom: 1px solid #e2e8f0;

  .sidenav-title-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #8f0045;
      letter-spacing: 0.5px;
    }

    .close-button {
      transition: all 0.2s ease;

      &:hover {
        color: #8f0045;
        transform: rotate(90deg);
      }
    }
  }
}

.user-profile {
  display: flex;
  align-items: center;
  padding: 12px 0;
  margin-bottom: 8px;

  .avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background-color: rgba(143, 0, 69, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 16px;

    mat-icon {
      color: #8f0045;
      font-size: 32px;
      width: 32px;
      height: 32px;
    }
  }

  .user-info {
    .name {
      font-weight: 600;
      //color: #2d3748;
      margin-bottom: 4px;
    }

    .email {
      font-size: 13px;
      color: #718096;
    }
  }
}

.mat-nav-list {
  padding: 8px 16px;
  flex: 1;

  a.mat-list-item {
    height: 52px;
    transition: all 0.2s ease;
    margin: 4px 0;
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .nav-item-content {
      display: flex;
      align-items: center;
    }

    .nav-icon {
      margin-right: 16px;
      color: #8f0045;
      font-size: 22px;
      width: 22px;
      height: 22px;
    }

    .nav-label {
      font-size: 15px;
      font-weight: 500;
    }

    .nav-chevron {
      font-size: 20px;
      opacity: 0;
      transition: all 0.2s ease;
    }

    &:hover {
      color: #8f0045;
      transform: translateX(4px);

      .nav-chevron {
        opacity: 1;
        transform: translateX(4px);
      }
    }

    &.active {
      color: #8f0045;
      font-weight: 500;
      box-shadow: inset 4px 0 0 #8f0045;

      .nav-chevron {
        opacity: 1;
      }
    }
  }
}

.nav-divider {
  height: 1px;
  margin: 12px 16px;
}

.sidenav-footer {
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;

  .logout-button {
    width: 100%;
    border-color: #e2e8f0;
    font-weight: 500;
    transition: all 0.2s ease;

    mat-icon {
      margin-right: 8px;
    }

    &:hover {
      color: #8f0045;
      border-color: #8f0045;
    }
  }
}

/* Add these styles to your existing CSS */
.nav-section {
  margin-bottom: 24px;
  
  &:last-child {
    margin-bottom: 16px;
  }
}

.nav-section-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 8px 24px;
  margin-top: 8px;
}

.nav-item-content {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0; /* Prevent overflow */
}

.nav-icon-container {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  
  .nav-icon {
    font-size: 20px;
    width: 20px;
    height: 20px;
    //color: #4a5568;
  }
}

.nav-label {
  font-size: 14px;
  font-weight: 500;
  //color: #2d3748;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-chevron {
  font-size: 18px;
  opacity: 0;
  transition: all 0.2s ease;
  margin-left: 8px;
}

.mat-nav-list {
  padding: 8px 0;
  display: flex;
  flex-direction: column;
  flex: 1;
  
  a.mat-list-item {
    height: 48px;
    padding: 0 16px;
    margin: 2px 8px;
    border-radius: 6px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:hover {
      
      .nav-chevron {
        opacity: 1;
        transform: translateX(2px);
      }
      
      .nav-icon {
        color: #8f0045;
      }
    }
    
    &.active {
      background-color: rgba(143, 0, 69, 0.08);
      
      .nav-label {
        color: #8f0045;
        font-weight: 500;
      }
      
      .nav-icon {
        color: #8f0045;
      }
      
      .nav-chevron {
        opacity: 1;
        color: #8f0045;
      }
    }
  }
}

/* Responsive Styles */
@media (max-width: 1280px) {
  .settings-wrapper {
    padding: 24px;
  }
}

@media (max-width: 1024px) {
  .settings-wrapper {
    padding: 20px;
  }

  .settings-sidenav {
    width: 280px;
  }

  .main-content {
    padding-right: 20px;
  }
}

@media (max-width: 768px) {
  .settings-header {
    padding: 20px;
  }

  .header-content h1 {
    font-size: 24px;
  }

  .settings-wrapper {
    padding: 16px;
  }

  .mobile-toolbar {
    display: flex;
  }

  .main-content {
    padding-right: 0;
    padding: 16px;
  }

  .settings-sidenav {
    width: 85%;
    max-width: 320px;
    border-radius: 0;
    border-left: 1px solid #e2e8f0;
  }

  .nav-section-label {
    padding: 8px 20px;
  }
  
  .mat-nav-list a.mat-list-item {
    padding: 0 12px;
    margin: 2px 4px;
  }
  
  .nav-icon-container {
    margin-right: 12px;
  }
}

@media (max-width: 480px) {
  .settings-header {
    padding: 16px;
  }

  .breadcrumb {
    font-size: 13px;
    
    > mat-icon {
      margin: 0 6px;
    }
  }

  .header-content {
    h1 {
      font-size: 20px;

      .header-icon {
        font-size: 24px;
        height: 24px;
        width: 24px;
        margin-right: 12px;
      }
    }

    p {
      font-size: 14px;
    }
  }

  .settings-wrapper {
    padding: 12px;
  }

  .user-profile {
    .avatar {
      width: 40px;
      height: 40px;
      margin-right: 12px;
    }

    .name {
      font-size: 14px;
    }

    .email {
      font-size: 12px;
    }
  }
}

  `]
})
export class SettingsIndexComponent implements OnInit {
  readonly dialog = inject(MatDialog);
  private breakpointObserver = inject(BreakpointObserver);
  @Input() user!: UserInterface;
  @ViewChild('drawer') drawer!: MatSidenav;
  private router = inject(Router);

  isMobile = false;

  ngOnInit() {
    this.breakpointObserver.observe([
      Breakpoints.Handset,
      Breakpoints.TabletPortrait
    ]).subscribe(result => {
      this.isMobile = result.matches;
    });
  }

  showDescription() {
    this.dialog.open(HelpDialogComponent, {
      data: { help: 'In this section, you can set up your profile details' },
      panelClass: 'help-dialog'
    });
  }

  closeMobileMenu() {
    if (this.isMobile && this.drawer) {
      this.drawer.close();
    }
  }

  logout() {
    // Implement logout functionality
    //console.log('Logout clicked');
    this.router.navigate(['/']);
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}