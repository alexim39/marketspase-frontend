import { Component, OnInit, OnDestroy, inject, signal, computed, ViewChild, Input, TemplateRef, Signal, DestroyRef, } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
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
import { AuthService } from '../../auth/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { DashboardService } from '../dashboard.service';
import { WalletFundingComponent } from '../../wallet/funding/funding.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { UserInterface, DeviceService } from '../../../../../shared-services/src/public-api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Import new components
import { UserProfileCardComponent } from './components/user-profile-card/user-profile-card.component';
import { SidenavNavigationComponent } from './components/sidenav-navigation/sidenav-navigation.component';
import { QuickActionsComponent } from './components/quick-actions/quick-actions.component';
import { CartDialogComponent } from './components/cart-dialog/cart-dialog.component';
import { NotificationBellComponent } from '../notification/notification.component';


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
    MatProgressBarModule,
    CurrencyPipe,    
    UserProfileCardComponent,
    SidenavNavigationComponent,
    QuickActionsComponent,
    //NotificationsMenuComponent,
    CartDialogComponent,
    NotificationBellComponent
  ],
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private readonly deviceService = inject(DeviceService);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('sidenav') sidenav!: MatSidenav;
  @ViewChild('notificationMenu') notificationMenu!: TemplateRef<any>;
  @ViewChild('cartDialogTemplate') cartDialogTemplate!: TemplateRef<any>;



  @Input({ required: true }) user!: Signal<UserInterface | null>;
  activeTab: 'cart' | 'quick-actions' = 'cart';
  private cartDialogRef?: MatDialogRef<any>;

  activeCampaignsCount: number | undefined = 0;
  pendingCampaignsCount: number | undefined = 0;
  pendingPromotionsCount: number | undefined = 0;

/*   notifications = signal<NotificationItem[]>([
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
  ]); */

  isMobile = computed(() => {
    return this.deviceService.deviceState().isMobile;
  });

 /*  unreadNotifications = computed(() => {
    return this.notifications().filter(n => !n.read).length;
  }); */

  navigationItems = computed(() => {
    const baseItems = [
      { icon: 'dashboard', label: 'Dashboard', route: '/dashboard' },
    ];

    if (this.user()?.role === 'marketer') {
      return [
        ...baseItems,
        { icon: 'campaign', label: 'Campaigns', route: './campaigns' },
        { icon: 'currency_exchange', label: 'Transactions', route: '/dashboard/transactions' },
        { icon: 'settings', label: 'Settings', route: '/dashboard/settings' },
        { icon: 'help', label: 'Support', route: '/dashboard/settings/share' }
      ];
    } else {
      return [
        ...baseItems,
        { icon: 'work', label: 'Promotions', route: './campaigns' },
        { icon: 'currency_exchange', label: 'Transactions', route: '/dashboard/transactions' },
        { icon: 'settings', label: 'Settings', route: '/dashboard/settings' },
        { icon: 'help', label: 'Support', route: '/dashboard/settings/share' }
      ];
    }
  });

  public ngOnInit(): void {
    this.calculateActiveCampaigns();
    this.calculatePendingCampaigns();
    this.calculatePendingPromotions();
  }

  ngOnDestroy(): void { }

  public toggleSidenav(): void {
    this.sidenav?.toggle();
  }

  public getPageTitle(): string {
    return this.user()!.role === 'marketer' ? 'Marketer Dashboard' : 'Promoter Dashboard';
  }

  public createCampaign(): void {
    this.router.navigate(['dashboard/campaigns/create']);
  }

  public viewPromotion(): void {
    this.router.navigate(['/dashboard/campaigns']);
  }

  public viewMyPromotion(): void {
    this.router.navigate(['/dashboard/campaigns/promotions']);
  }
  
  public viewAllCampaigns(): void {
    this.router.navigate(['/dashboard/campaigns']);
  }

  public viewAllPromotion(): void {
    this.router.navigate(['/dashboard/campaigns']);
  }

  public viewWithdrawl(): void {
    this.router.navigate(['/dashboard/transactions/withdrawal']);
  }

  public fundWallet(): void {
    // const dataToPass = {
    //   amount: 100, // Example data
    //   currency: 'USD'
    // };

    this.dialog.open(WalletFundingComponent, {
      data: this.user(), // Pass the data here
      panelClass: 'custom-dialog-container',
    });
  }

  public openWallet(): void {
    this.router.navigate(['/dashboard/transactions']);
  }

 /*  public markAsRead(notificationId: string): void {
    this.notifications.update(notifications =>
      notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  } */

 /*  public markAllAsRead(): void {
    this.notifications.update(notifications =>
      notifications.map(n => ({ ...n, read: true }))
    );
  } */

  public viewAllNotifications(): void {
    this.router.navigate(['/notifications']);
  }

  public logout(): void {
      this.authService.signOut()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Sign-out failed:', error.error.message);
          this.snackBar.open('Sign-out failed', 'OK', { duration: 3000 });
        }
      })
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

  public switchUser(role: string): void {
    const roleObject = {
      role,
      userId: this.user()?._id
    }
      this.dashboardService.switchUser(roleObject)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
  }

  calculateActiveCampaigns(): void {
    if (this.user()?.campaigns && Array.isArray(this.user()?.campaigns)) {
      this.activeCampaignsCount = this.user()?.campaigns?.filter(
        (campaign: any) => campaign.status === 'active'
      ).length;
    }
  }

  calculatePendingCampaigns(): void {
    if (this.user()?.campaigns && Array.isArray(this.user()?.campaigns)) {
      this.pendingCampaignsCount = this.user()?.campaigns?.filter(
        (campaign: any) => campaign.status === 'pending'
      ).length;
    }
  }

  calculatePendingPromotions(): void {
    const promotions = this.user()?.promotion;
    if (Array.isArray(promotions)) {
      this.pendingPromotionsCount = promotions.filter(
        (p: any) => p.status === 'pending' || p.status === 'submitted'
      ).length;
    } else {
      this.pendingPromotionsCount = 0;
    }
  }
}