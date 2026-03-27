import { Component, OnInit, OnDestroy, inject, signal, computed, ViewChild, Input, TemplateRef, Signal, DestroyRef } from '@angular/core';
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
import { MatExpansionModule } from '@angular/material/expansion';
import { AuthService } from '../../auth/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { DashboardService } from '../dashboard.service';
import { WalletFundingComponent } from '../../wallet/funding/funding.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { UserInterface, DeviceService, CurrencyUtilsPipe } from '../../../../../shared-services/src/public-api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Import new components
import { UserProfileCardComponent } from './components/user-profile-card/user-profile-card.component';
import { SidenavNavigationComponent } from './components/sidenav-navigation/sidenav-navigation.component';
import { QuickActionsComponent } from './components/quick-actions/quick-actions.component';
import { CartDialogComponent } from './components/cart-dialog/cart-dialog.component';
import { NotificationBellComponent } from '../notification/notification.component';

import {
  getMarketerNavigation,
  getPromoterNavigation,
  MARKETING_REP_NAVIGATION,
  ADMIN_NAVIGATION,
  NavigationItem
} from './navigation';
import { interval } from 'rxjs/internal/observable/interval';
import { take } from 'rxjs/internal/operators/take';
import { CountdownOverlayComponent } from '../../common/components/countdown-overlay/countdown-overlay.component';
import { SwitchUserRoleService } from '../../common/services/switch-user-role.service';
import { Subscription } from 'rxjs';

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
    MatExpansionModule,
    UserProfileCardComponent,
    SidenavNavigationComponent,
    QuickActionsComponent,
    CartDialogComponent,
    NotificationBellComponent,
    CurrencyUtilsPipe,
    CountdownOverlayComponent
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
  private switchUserRoleService = inject(SwitchUserRoleService); // Event used to trigger user role switcher method
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

  private subscription: Subscription = new Subscription();

  isMobile = computed(() => {
    return this.deviceService.deviceState().isMobile;
  });

  // Countdown state
  currentCountdown = signal<number | null>(null);
  isSwitchingRole = signal(false);

  navigationItems: Signal<NavigationItem[]> = computed(() => {
    const userRole = this.user()?.role;
    const pendingCampaigns = this.pendingCampaignsCount || 0;
    const pendingPromotions = this.pendingPromotionsCount || 0;
    const activeCampaigns = this.activeCampaignsCount || 0;

    if (userRole === 'marketer') {
      return getMarketerNavigation(pendingCampaigns, activeCampaigns);
    }

    if (userRole === 'promoter') {
      return getPromoterNavigation(pendingPromotions);
    }

    if (userRole === 'marketing_rep') {
      return MARKETING_REP_NAVIGATION;
    }

    return ADMIN_NAVIGATION;
  });

  public ngOnInit(): void {
    this.calculateActiveCampaigns();
    this.calculatePendingCampaigns();
    this.calculatePendingPromotions();

    this.switchUserRoleService.getSwitchRequest$.subscribe((role) => {
      this.switchUser(role);
    });
  }

  ngOnDestroy(): void {
     // Always unsubscribe to prevent memory leaks
    this.subscription.unsubscribe();
  }

  public toggleSidenav(): void {
    this.sidenav?.toggle();
  }

  // Updated getPageTitle method to return formatted role names
  public getPageTitle(): string {
    const role = this.user()?.role;
    let formattedRole = '';

    switch (role) {
      case 'marketer':
        formattedRole = 'Marketer';
        break;
      case 'promoter':
        formattedRole = 'Promoter';
        break;
      case 'marketing_rep':
        formattedRole = 'Marketing Rep';
        break;
      case 'admin':
        formattedRole = 'Admin';
        break;
      default:
        formattedRole = 'User';
    }

    return `${formattedRole} Dashboard`;
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
    if (this.deviceService.deviceState().isMobile) {
      this.dialog.open(WalletFundingComponent, {
        data: this.user(),
        panelClass: 'custom-dialog-container',
        height: '650px',
        disableClose: true
      });
    } else {
      this.dialog.open(WalletFundingComponent, {
        data: this.user(),
        panelClass: 'custom-dialog-container',
        disableClose: true
      });
    }
  }

  public openWallet(): void {
    this.router.navigate(['/dashboard/transactions']);
  }

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
      });
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
    // Prevent multiple simultaneous switches
    if (this.isSwitchingRole()) return;
    this.isSwitchingRole.set(true);

    const roleObject = {
      role,
      userId: this.user()?._id
    };

    this.dashboardService.switchUser(roleObject)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Start countdown instead of immediate reload
            const countdownSeconds = 5; // you can make this configurable
            this.currentCountdown.set(countdownSeconds);
            this.startCountdown(countdownSeconds);
          } else {
            this.isSwitchingRole.set(false);
          }
        },
        error: (error: HttpErrorResponse) => {
          this.isSwitchingRole.set(false);
          let errorMessage = 'Server error occurred, please try again.';
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          }
          this.snackBar.open(errorMessage, 'Ok', { duration: 3000 });
        }
      });
  }

    private startCountdown(seconds: number): void {
    interval(1000)
      .pipe(
        take(seconds),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (count) => {
          const remaining = seconds - count - 1;
          this.currentCountdown.set(remaining);
          if (remaining === 0) {
            setTimeout(() => window.location.reload(), 500);
          }
        },
        complete: () => {
          // Clean up when countdown finishes or is cancelled
          this.currentCountdown.set(null);
          this.isSwitchingRole.set(false);
        }
      });
  }

  public cancelCountdown(): void {
    this.currentCountdown.set(null);
    this.isSwitchingRole.set(false);
    this.snackBar.open('Role switch cancelled. No reload will occur.', 'Ok', {
      duration: 2000,
      panelClass: 'snackbar-info' // optional
    });
  }

  public reloadPage(): void {
    window.location.reload();
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

  public handleModalAction(action: string): void {
    switch (action) {
      case 'fundWallet':
        this.fundWallet();
        break;
      // case 'createCampaign':
      //   this.createCampaign();
      //   break;
      // case 'switchUser':
      //   // You might want to pass a specific role here
      //   // this.switchUser('promoter'); // Example
      //   break;
      // case 'logout':
      //   this.logout();
      //   break;
      default:
        console.warn(`Unknown modal action: ${action}`);
    }
  }

}