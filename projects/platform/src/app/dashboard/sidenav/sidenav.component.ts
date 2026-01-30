import { Component, OnInit, OnDestroy, inject, signal, computed, ViewChild, Input, TemplateRef, Signal, DestroyRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
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
import { UserInterface, DeviceService } from '../../../../../shared-services/src/public-api';
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
    CurrencyPipe,
    UserProfileCardComponent,
    SidenavNavigationComponent,
    QuickActionsComponent,
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

  isMobile = computed(() => {
    return this.deviceService.deviceState().isMobile;
  });


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
  }

  ngOnDestroy(): void { }

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
    //console.log('the role ',role)
    const roleObject = {
      role,
      userId: this.user()?._id
    };
    this.dashboardService.switchUser(roleObject)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            window.location.reload();
          }
        },
        error: (error: HttpErrorResponse) => {
          let errorMessage = 'Server error occurred, please try again.';
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          }
          this.snackBar.open(errorMessage, 'Ok', { duration: 3000 });
        }
      });
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