// dashboard.component.ts
import { Component, OnInit, OnDestroy, inject, signal, computed, ViewChild, Input, TemplateRef, Signal, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { UserInterface } from '../../common/services/user.service';
import { DashboardService } from '../dashboard.service';
import { WalletFundingComponent } from '../../wallet/funding/funding.component';

// Interfaces
export interface Earning {
  id: string;
  campaignTitle: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid';
  date: Date;
  proofSubmitted: boolean;
  advertiser: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: Date;
  read: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'advertiser' | 'promoter';
  verified: boolean;
  rating: number;
  totalEarnings?: number;
  totalSpent?: number;
  activeCampaigns?: number;
  completedCampaigns?: number;
}

@Component({
  selector: 'app-dashboard',
  providers: [DashboardService],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatMenuModule,
    MatBadgeModule,
    MatChipsModule,
    MatDialogModule,
    MatTooltipModule,
  ],
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private breakpointObserver = inject(BreakpointObserver);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);

  // Add ViewChild for sidenav
  @ViewChild('sidenav') sidenav!: MatSidenav;

  // Required input that expects a signal of type UserInterface or undefined
  @Input({ required: true }) user!: Signal<UserInterface | null>;
  activeTab: 'cart' | 'quick-actions' = 'cart';
  @ViewChild('cartDialogTemplate') cartDialogTemplate!: TemplateRef<any>;
  private cartDialogRef?: MatDialogRef<any>;


  // Signals for reactive state management
  currentUser = signal<UserProfile>({
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    role: 'advertiser',
    verified: true,
    rating: 4.8,
    totalEarnings: 85000,
    totalSpent: 250000,
    activeCampaigns: 5,
    completedCampaigns: 23
  });

  //walletBalance = signal(125000);

  earnings = signal<Earning[]>([
    {
      id: '1',
      campaignTitle: 'Summer Fashion Collection',
      amount: 2500,
      status: 'pending',
      date: new Date(),
      proofSubmitted: true,
      advertiser: 'Fashion Brand Co.'
    },
    {
      id: '2',
      campaignTitle: 'Restaurant Grand Opening',
      amount: 1500,
      status: 'approved',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      proofSubmitted: true,
      advertiser: 'Local Restaurant'
    }
  ]);

  notifications = signal<NotificationItem[]>([
    {
      id: '1',
      title: 'Campaign Approved',
      message: 'Your campaign "Summer Fashion" has been approved and is now live',
      type: 'success',
      timestamp: new Date(),
      read: false
    },
    {
      id: '2',
      title: 'Proof Required',
      message: 'Please upload proof for your campaign participation',
      type: 'warning',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: false
    }
  ]);

  subscriptions: Subscription[] = [];

  // Computed signals
  isMobile = computed(() => {
    return this.breakpointObserver.isMatched('(max-width: 768px)');
  });

  unreadNotifications = computed(() => {
    return this.notifications().filter(n => !n.read).length;
  });

  navigationItems = computed(() => {
    const baseItems = [
      { icon: 'dashboard', label: 'Dashboard', route: '/dashboard' },
      { icon: 'notifications', label: 'Notifications', route: '/notifications', badge: this.unreadNotifications() }
    ];

    if (this.user()?.role === 'advertiser') {
      return [
        ...baseItems,
        { icon: 'campaign', label: 'Campaigns', route: '/campaigns' },
        { icon: 'analytics', label: 'Analytics', route: '/analytics' },
        //{ icon: 'account_balance_wallet', label: 'Wallet', route: '/wallet' },
        //{ icon: 'people', label: 'Promoters', route: '/promoters' },
        { icon: 'help', label: 'Support', route: '/support' }
      ];
    } else {
      return [
        ...baseItems,
        { icon: 'work', label: 'Campaigns', route: '/browse' },
        //{ icon: 'assignment', label: 'My Campaigns', route: '/my-campaigns' },
        { icon: 'monetization_on', label: 'Earnings', route: '/earnings' },
        { icon: 'help', label: 'Support', route: '/support' }
      ];
    }
  });

  public ngOnInit(): void {
    // Subscribe to breakpoint changes
    this.subscriptions.push(
      this.breakpointObserver.observe([Breakpoints.HandsetPortrait]).subscribe()
    );
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  public toggleSidenav(): void {
    this.sidenav?.toggle();
  }

  public getPageTitle(): string {
    return this.user()!.role === 'advertiser' ? 'Advertiser Dashboard' : 'Promoter Dashboard';
  }

  // Campaign Actions
  public createCampaign(): void {
    //this.snackBar.open('Create Campaign feature coming soon!', 'OK', { duration: 3000 });
    this.router.navigate(['dashboard/campaign/new']);
  }

  public viewCampaign(): void {
    //this.snackBar.open('Create Campaign feature coming soon!', 'OK', { duration: 3000 });
    //this.router.navigate(['/campaign/new']);
  }

  // Wallet Actions
  public fundWallet(): void {
    //this.snackBar.open('Fund Wallet feature coming soon!', 'OK', { duration: 3000 });

    this.dialog.open(WalletFundingComponent, {
      data: {
        currentBalance: 5000,
        campaignBudget: 15000
      },
      panelClass: 'custom-dialog-container',
    });
    
  }

  public openWallet(): void {
    this.router.navigate(['/wallet']);
  }

  // Notification Actions
  public markAsRead(notificationId: string): void {
    this.notifications.update(notifications =>
      notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  }

  public markAllAsRead(): void {
    this.notifications.update(notifications =>
      notifications.map(n => ({ ...n, read: true }))
    );
  }

  public viewAllNotifications(): void {
    this.router.navigate(['/notifications']);
  }

  /**
  * Method to handle the sign-out process.
  */
  public logout(): void {
    this.subscriptions.push(
      this.authService.signOut().subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Sign-out failed:', error.error.message);
          this.snackBar.open('Sign-out failed', 'OK', { duration: 3000 });
        }
      })
    )
  }

  public closeCartDialog(): void {
    this.cartDialogRef?.close();
  }

  public setActiveTab(tab: 'cart' | 'quick-actions'): void {
    this.activeTab = tab;
  }

  public openCartDialog(): void {
    this.cartDialogRef = this.dialog.open(this.cartDialogTemplate, {
      position: { 
        top: '72px',
        right: '24px'
      },
      hasBackdrop: true,
      backdropClass: 'cart-dialog-backdrop',
      panelClass: 'cart-dialog-panel',
      autoFocus: false
    });
  }

  public switchUser(role: string) {
    const roleObject = {
      role,
      userId: this.user()?._id
    }
    this.subscriptions.push(
      this.dashboardService.switchUser(roleObject).subscribe({
        next: (response) => {
          if (response.success) {
            window.location.reload()
          }
        },
        error: (error: HttpErrorResponse) => {
          let errorMessage = 'Server error occurred, please try again.';
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          }  
          this.snackBar.open(errorMessage, 'Ok',{duration: 3000});
        }
      })
    )
  }
}