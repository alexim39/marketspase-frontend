import { Component, signal, computed, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { AdminInterface, AdminService } from '../common/services/user.service';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-whatsapp-admin-dashboard',
  standalone: true,
  providers: [AuthService],
  imports: [CommonModule, RouterModule, MatIconModule],
  template: `
    <div class="admin-dashboard">
      <!-- Sidebar -->
      <aside class="sidebar" [class.collapsed]="sidebarCollapsed()">
        <div class="sidebar-header">
          <div class="logo">
            <div class="logo-icon">
              <mat-icon>sync</mat-icon>
            </div>
            <span class="logo-text">MarketSpase Admin</span>
          </div>
          <button class="sidebar-toggle" (click)="toggleSidebar()">
            <mat-icon>{{ sidebarCollapsed() ? 'chevron_right' : 'chevron_left' }}</mat-icon>
          </button>
        </div>
        
        <nav class="nav-menu">
          <a 
            class="nav-item"
            [class.active]="activeNavItem() === 'dashboard'"
            (click)="setActiveNavItem('dashboard')"
            routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}"
          >
            <mat-icon>dashboard</mat-icon>
            <span>Dashboard</span>
          </a>

          <a 
            class="nav-item" 
            [class.active]="activeNavItem() === 'user'"
            (click)="setActiveNavItem('user')"
            routerLink="/dashboard/users" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}"
          >
            <mat-icon>account_circle</mat-icon>
            <span>Users</span>
          </a>

          <a 
            class="nav-item" 
            [class.active]="activeNavItem() === 'campaigns'"
            (click)="setActiveNavItem('campaigns')"
            routerLink="/dashboard/campaigns" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}"
          >
            <mat-icon>campaign</mat-icon>
            <span>Campaigns</span>
          </a>

          <a 
            class="nav-item" 
            [class.active]="activeNavItem() === 'proof'"
            (click)="setActiveNavItem('proof')">
            <mat-icon>approval</mat-icon>
            <span>Proofs</span>
          </a>

          <a 
            class="nav-item" 
            [class.active]="activeNavItem() === 'transactions'"
            (click)="setActiveNavItem('transactions')">
            <mat-icon>checkbook</mat-icon>
            <span>Transactions</span>
          </a>

          <a 
            class="nav-item" 
            [class.active]="activeNavItem() === 'analytics'"
            (click)="setActiveNavItem('analytics')">
            <mat-icon>analytics</mat-icon>
            <span>Analytics</span>
          </a>

          <a 
            class="nav-item" 
            [class.active]="activeNavItem() === 'settings'"
            (click)="setActiveNavItem('settings')">
            <mat-icon>settings</mat-icon>
            <span>Settings</span>
          </a>

          <div 
            class="nav-item" 
            [class.active]="activeNavItem() === 'logout'"
           (click)="logout()">
            <mat-icon>logout</mat-icon>
            <span>Sign out</span>
          </div>

        </nav>
        
        <div class="admin-profile">
          <div class="admin-avatar">
            <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM2NjdFRUEiLz4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI4IiB5PSI4Ij4KPHBhdGggZD0iTTIwIDIxVjE5QTQgNCAwIDAgMCAxNiAxNUg4QTQgNCAwIDAgMCA0IDE5VjIxIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8Y2lyY2xlIGN4PSIxMiIgY3k9IjciIHI9IjQiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo8L3N2Zz4K" alt="Admin">
          </div>
          <div class="admin-info">
            <div class="admin-name">{{ adminService.adminData()?.name || 'Admin' }}</div>
            <div class="admin-role">{{ adminService.adminData()?.role || 'User' }}</div>
          </div>
        </div>
      </aside>
      
      <!-- Main Content -->
      <div class="main-content">
        <!-- Header -->
        <header class="header">
          <div class="header-left">
            <h1 class="page-title">{{ pageTitle() }}</h1>
            <div class="breadcrumb">{{ currentDate }}</div>
          </div>
          
          <div class="header-right">
            <div class="search-container">
              <mat-icon class="search-icon">search</mat-icon>
              <input 
                type="text" 
                placeholder="Search..."
                class="search-input"
                [value]="searchQuery()"
                (input)="onSearchInput($event)">
            </div>
            
            <div class="header-actions">
              <button class="notification-btn" [class.has-notifications]="notificationCount() > 0">
                <mat-icon>notifications</mat-icon>
                @if (notificationCount() > 0) {
                  <span class="notification-badge">{{ notificationCount() }}</span>
                }
              </button>
              
              <button class="message-btn" [class.has-messages]="messageCount() > 0">
                <mat-icon>email</mat-icon>
                @if (messageCount() > 0) {
                  <span class="notification-badge">{{ messageCount() }}</span>
                }
              </button>
            </div>
          </div>
        </header>
        
        <!-- Dynamic Content Area -->
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    * {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #111827;
  line-height: 1.6;
}

.admin-dashboard {
  display: flex;
  min-height: 100vh;
}

/* Sidebar Styles */
.sidebar {
  width: 280px;
  background: linear-gradient(145deg, #060918ff 0%, #111827 100%);
  color: #ffffff;
  display: flex;
  flex-direction: column;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  //position: relative;
  z-index: 10;
  position: fixed; height: 100vh;
}

.sidebar.collapsed {
  width: 80px;
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
}

.collapsed .logo-text {
  opacity: 0;
  width: 0;
  height: 0;
  overflow: hidden;
}

.sidebar-toggle {
  background: none;
  border: none;
  color: #ffffff;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-toggle:hover {
  background: rgba(255, 255, 255, 0.1);
}

.nav-menu {
  flex: 1;
  padding: 20px 0;
}

.nav-item {
  padding: 12px 20px;
  margin: 2px 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

.nav-item mat-icon {
  flex-shrink: 0;
  min-width: 24px;
}

.nav-item span {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
}

.collapsed .nav-item span {
  opacity: 0;
  width: 0;
  height: 0;
  overflow: hidden;
}

.collapsed .nav-item {
  justify-content: center;
  margin: 2px 16px;
  padding: 12px;
}

.admin-profile {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.admin-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.admin-info {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
}

.collapsed .admin-info {
  opacity: 0;
  width: 0;
  height: 0;
  overflow: hidden;
}

.admin-name {
  font-weight: 600;
  font-size: 14px;
}

.admin-role {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

/* Main Content */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-left: 20em; overflow-y: auto;
  @media (max-width: 768px) {
    margin-left: 100px;
  }
}

/* Header */
.header {
  padding: 20px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #444549ff;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
}

.header-left {
  display: flex;
  flex-direction: column;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
}

.breadcrumb {
  font-size: 14px;
  color: #6b7280;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.search-container {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #9ca3af;
}

.search-input {
  border: none;
  border-radius: 8px;
  padding: 10px 12px 10px 40px;
  width: 300px;
  font-size: 14px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.search-input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.notification-btn,
.message-btn {
  position: relative;
  background: none;
  border: none;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  color: #4b5563;
}

.notification-btn:hover,
.message-btn:hover {
  background: #f3f4f6;
}

.notification-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  background: #ef4444;
  color: #ffffff;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

/* Responsive Design */
@media (max-width: 768px) {
  .sidebar {
    width: 80px;
  }
  
  .sidebar .logo-text,
  .sidebar .nav-item span,
  .sidebar .admin-info {
    opacity: 0;
    width: 0;
    height: 0;
    overflow: hidden;
  }
  
  .sidebar .nav-item {
    justify-content: center;
  }
  
  .header {
    padding: 16px 20px;
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .header-right {
    justify-content: space-between;
  }
  
  .search-input {
    width: 200px;
  }
}

@media (max-width: 480px) {
  .search-input {
    display: none;
  }
}
  `]
})
export class AdminDashboardComponent implements OnInit {
  // We expose the service directly to the template for simplicity
  readonly adminService = inject(AdminService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private subscriptions: Subscription[] = [];

  // Define component state using signals
  sidebarCollapsed = signal(false);
  activeNavItem = signal('dashboard');
  searchQuery = signal('');
  notificationCount = signal(5);
  messageCount = signal(12);

  // Use a computed signal for the page title for better performance
  pageTitle = computed(() => {
    const titles: Record<string, string> = {
      dashboard: 'Dashboard Overview',
      user: 'User Management',
      campaigns: 'Campaign Management',
      proof: 'Campaign Proof Management',
      transactions: 'Transaction History',
      analytics: 'Analytics & Reports',
      settings: 'Platform Settings',
      logout: ''
    };
    return titles[this.activeNavItem()] || 'Dashboard';
  });

  // Current date (this can stay as a simple property as it doesn't change)
  currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Call the service method in ngOnInit to trigger data fetch
  ngOnInit() {
    // This is the correct line to trigger the data fetch.
    this.adminService.fetchAdmin();
  }
  
  // No changes needed for these methods as they already use signals
  toggleSidebar() {
    this.sidebarCollapsed.set(!this.sidebarCollapsed());
  }

  setActiveNavItem(item: string) {
    this.activeNavItem.set(item);
  }
  
  onSearchInput(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    this.searchQuery.set(query);
  }

  // Refactored logout to use a one-off subscription
  logout() {
    this.subscriptions.push(
      this.authService.signOut({}).subscribe({
        next: (response) => {
          if (response.success) {
            localStorage.removeItem('isAuthenticated');
            this.router.navigate(['/'], { replaceUrl: true });
          }
        },
        error: (error) => {
          console.error('Error during sign out:', error);
          this.router.navigate(['/'], { replaceUrl: true });
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadDashboard() {
    this.router.navigate(['dashboard']);
  }
  // loadUsers() {
  //   this.router.navigate(['dashboard/users']);
  // }
}