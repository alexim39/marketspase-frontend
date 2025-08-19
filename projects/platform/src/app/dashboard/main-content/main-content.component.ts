import { Component, OnInit, OnDestroy, inject, signal, computed, ViewChild, Input, Signal, TemplateRef, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { User as FirebaseAuthUser } from '@angular/fire/auth'; // Import the Firebase User type
import { UserInterface, UserService } from '../../common/services/user.service';
import { DashboardService } from './../dashboard.service';


// Interfaces
export interface Campaign {
  id: string;
  title: string;
  description: string;
  budget: number;
  spent: number;
  reach: number;
  engagement: number;
  status: 'active' | 'pending' | 'completed' | 'paused';
  category: string;
  deadline: Date;
  imageUrl: string;
  targetAudience: string;
  createdAt: Date;
  promoters: number;
  viewsRequired: number;
  currentViews: number;
}

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



/**
 * @title Dashboard Main content displayer
 */
@Component({
  selector: 'main-container',
    imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatGridListModule,
    MatMenuModule,
    MatBadgeModule,
    MatChipsModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatTableModule,
    MatDialogModule,
    MatTooltipModule
  ],
  templateUrl: './main-content.component.html',
  styleUrls: ['./main-content.component.scss'],
  
})
export class DashboardMainContainer {
  private router = inject(Router);
  private breakpointObserver = inject(BreakpointObserver);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private dashboardService = inject(DashboardService);

  // Add ViewChild for sidenav
  @ViewChild('sidenav') sidenav!: MatSidenav;

  activeTab: 'cart' | 'quick-actions' = 'cart';
  @ViewChild('cartDialogTemplate') cartDialogTemplate!: TemplateRef<any>;
  private cartDialogRef?: MatDialogRef<any>;


  // Expose the signal directly to the template
  public user: Signal<UserInterface | null> = this.userService.user;


  // Signals for reactive state management
  currentUser = signal<UserProfile>({
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    role: 'advertiser', // Change to 'promoter' to test promoter view
    verified: true,
    rating: 4.8,
    totalEarnings: 85000,
    totalSpent: 250000,
    activeCampaigns: 5,
    completedCampaigns: 23
  });

  walletBalance = signal(125000);

  campaigns = signal<Campaign[]>([
    {
      id: '1',
      title: 'Summer Fashion Collection',
      description: 'Promote our latest summer fashion collection with vibrant designs',
      budget: 50000,
      spent: 32000,
      reach: 15000,
      engagement: 2400,
      status: 'active',
      category: 'Fashion',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
      targetAudience: 'Young Adults 18-35',
      createdAt: new Date(),
      promoters: 20,
      viewsRequired: 25000,
      currentViews: 15000
    },
    {
      id: '2',
      title: 'Tech Gadget Launch',
      description: 'Launch announcement for our revolutionary smart device',
      budget: 75000,
      spent: 45000,
      reach: 22000,
      engagement: 3800,
      status: 'active',
      category: 'Technology',
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      imageUrl: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400',
      targetAudience: 'Tech Enthusiasts',
      createdAt: new Date(),
      promoters: 30,
      viewsRequired: 35000,
      currentViews: 22000
    }
  ]);

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

  dashboardStats = computed(() => {
    if (this.currentUser().role === 'advertiser') {
      return [
        {
          icon: 'campaign',
          label: 'Active Campaigns',
          value: this.currentUser().activeCampaigns?.toString() || '0',
          change: '+12',
          trend: 'up' as const,
          color: '#667eea'
        },
        {
          icon: 'visibility',
          label: 'Total Reach',
          value: '37K',
          change: '+25',
          trend: 'up' as const,
          color: '#4caf50'
        },
        {
          icon: 'account_balance_wallet',
          label: 'Total Spent',
          value: `₦${(this.currentUser().totalSpent || 0) / 1000}K`,
          change: '+8',
          trend: 'up' as const,
          color: '#ff9800'
        },
        {
          icon: 'thumb_up',
          label: 'Engagement',
          value: '6.2K',
          change: '+15',
          trend: 'up' as const,
          color: '#e91e63'
        }
      ];
    } else {
      return [
        {
          icon: 'monetization_on',
          label: 'Total Earnings',
          value: `₦${(this.currentUser().totalEarnings || 0) / 1000}K`,
          change: '+18',
          trend: 'up' as const,
          color: '#4caf50'
        },
        {
          icon: 'star',
          label: 'Rating',
          value: this.currentUser().rating?.toString() || '0',
          change: '+0.2',
          trend: 'up' as const,
          color: '#ff9800'
        },
        {
          icon: 'assignment_turned_in',
          label: 'Completed',
          value: this.currentUser().completedCampaigns?.toString() || '0',
          change: '+3',
          trend: 'up' as const,
          color: '#2196f3'
        },
        {
          icon: 'pending_actions',
          label: 'Pending',
          value: this.earnings().filter(e => e.status === 'pending').length.toString(),
          change: '-1',
          trend: 'down' as const,
          color: '#ff5722'
        }
      ];
    }
  });

  navigationItems = computed(() => {
    const baseItems = [
      { icon: 'dashboard', label: 'Dashboard', route: '/dashboard' },
      { icon: 'notifications', label: 'Notifications', route: '/notifications', badge: this.unreadNotifications() }
    ];

    if (this.currentUser().role === 'advertiser') {
      return [
        ...baseItems,
        { icon: 'campaign', label: 'My Campaigns', route: '/campaigns' },
        { icon: 'analytics', label: 'Analytics', route: '/analytics' },
        { icon: 'account_balance_wallet', label: 'Wallet', route: '/wallet' },
        { icon: 'people', label: 'Promoters', route: '/promoters' },
        { icon: 'help', label: 'Support', route: '/support' }
      ];
    } else {
      return [
        ...baseItems,
        { icon: 'work', label: 'Available Campaigns', route: '/browse' },
        { icon: 'assignment', label: 'My Campaigns', route: '/my-campaigns' },
        { icon: 'monetization_on', label: 'Earnings', route: '/earnings' },
        { icon: 'help', label: 'Support', route: '/support' }
      ];
    }
  });

  pendingEarnings = computed(() => {
    return this.earnings()
      .filter(e => e.status === 'pending')
      .reduce((sum, e) => sum + e.amount, 0);
  });

  availableBalance = computed(() => {
    return this.earnings()
      .filter(e => e.status === 'approved')
      .reduce((sum, e) => sum + e.amount, 0);
  });

  ngOnInit(): void {
    // Subscribe to breakpoint changes
    this.subscriptions.push(
      this.breakpointObserver.observe([Breakpoints.HandsetPortrait]).subscribe(() => {
        // Trigger change detection if needed
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  toggleSidenav(): void {
    if (this.sidenav) {
      this.sidenav.toggle();
    }
  }

  getPageTitle(): string {
    return this.user()!.role === 'advertiser' ? 'Advertiser Dashboard' : 'Promoter Dashboard';
  }

  // Campaign Actions
  createCampaign(): void {
    this.snackBar.open('Create Campaign feature coming soon!', 'OK', { duration: 3000 });
  }

  viewCampaign(campaignId: string): void {
    this.router.navigate(['/campaign', campaignId]);
  }

  viewProofs(campaignId: string): void {
    this.router.navigate(['/campaign', campaignId, 'proofs']);
  }

  acceptCampaign(campaignId: string): void {
    this.snackBar.open('Campaign accepted! Check your active campaigns.', 'OK', { duration: 3000 });
  }

  viewCampaignDetails(campaignId: string): void {
    this.router.navigate(['/campaign', campaignId, 'details']);
  }

  uploadProof(earningId: string): void {
    this.snackBar.open('Proof upload feature coming soon!', 'OK', { duration: 3000 });
  }

  // Wallet Actions
  fundWallet(): void {
    this.snackBar.open('Fund Wallet feature coming soon!', 'OK', { duration: 3000 });
  }

  openWallet(): void {
    this.router.navigate(['/wallet']);
  }

  withdraw(): void {
    this.snackBar.open('Withdrawal feature coming soon!', 'OK', { duration: 3000 });
  }

  // Notification Actions
  markAsRead(notificationId: string): void {
    this.notifications.update(notifications =>
      notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  }

  markAllAsRead(): void {
    this.notifications.update(notifications =>
      notifications.map(n => ({ ...n, read: true }))
    );
  }

  viewAllNotifications(): void {
    this.router.navigate(['/notifications']);
  }

  // Profile Actions
  viewProfile(): void {
    this.router.navigate(['/profile']);
  }

  openSettings(): void {
    this.router.navigate(['/settings']);
  }


  /**
  * Method to handle the sign-out process.
  * This is typically called from a button click event.
  */
  logout(): void {
    this.subscriptions.push(
      this.authService.signOut().subscribe({
        next: () => {
          // Handle successful sign-out
          //console.log('Sign-out successful. Navigating to login...');
          // Navigate the user to the login page or home page
          this.router.navigate(['/']); // Change '/login' to your desired route
        },
        error: (error: HttpErrorResponse) => {
          // Handle sign-out error
          console.error('Sign-out failed:', error.error.message);
          // Display an error message to the user, e.g., using a toast or snackbar
          this.snackBar.open('Sign-out failed', 'OK', { duration: 3000 });
        }
      })
    )
  }

  closeCartDialog(): void {
    if (this.cartDialogRef) {
      this.cartDialogRef.close();
    }
  }

  setActiveTab(tab: 'cart' | 'quick-actions'): void {
    this.activeTab = tab;
  }

  openCartDialog(): void {
    // Method 1: Using template reference (after fixing the template)
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

  switchUser(role: string) {
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
          let errorMessage = 'Server error occurred, please try again.'; // default error message.
          if (error.error && error.error.message) {
            errorMessage = error.error.message; // Use backend's error message if available.
          }  
          this.snackBar.open(errorMessage, 'Ok',{duration: 3000});
        }
      })
    )
  }
}
