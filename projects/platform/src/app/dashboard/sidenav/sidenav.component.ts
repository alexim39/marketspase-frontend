import { Component, OnInit, OnDestroy, inject, signal, computed, ViewChild, Input, TemplateRef, Signal, DestroyRef } from '@angular/core';
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

export interface NavigationItem {
  icon: string;
  label: string;
  route?: string;
  modalAction?: 'fundWallet' | string; // Add modal action support
  children?: NavigationItem[];
  expanded?: boolean;
  badge?: number;
  badgeColor?: 'primary' | 'accent' | 'warn';
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
    return [
      {
        icon: 'dashboard',
        label: 'Dashboard',
        route: '/dashboard',
        expanded: false
      },
      {
        icon: 'campaign',
        label: 'Campaigns',
        badge: pendingCampaigns,
        badgeColor: 'warn',
        expanded: false,
        children: [
          {
            icon: 'list_alt',
            label: 'All Campaigns',
            route: '/dashboard/campaigns'

            // icon: 'list_alt',
            // label: 'All Campaigns',
            // route: '/dashboard/campaigns',
            // expanded: false,
            // children: [
            //   {
            //     icon: 'play_circle',
            //     label: 'Active Campaigns',
            //     route: '/dashboard/campaigns?status=active',
            //     badge: activeCampaigns,
            //     badgeColor: 'primary'
            //   },
            //   {
            //     icon: 'pending',
            //     label: 'Pending Campaigns',
            //     route: '/dashboard/campaigns?status=pending',
            //     badge: pendingCampaigns,
            //     badgeColor: 'warn'
            //   },
            //   {
            //     icon: 'check_circle',
            //     label: 'Completed Campaigns',
            //     route: '/dashboard/campaigns?status=completed'
            //   },
            //   {
            //     icon: 'cancel',
            //     label: 'Rejected Campaigns',
            //     route: '/dashboard/campaigns?status=rejected'
            //   }
            // ]
          },
          
          {
            icon: 'add_circle',
            label: 'Create Campaign',
            route: '/dashboard/campaigns/create'
          },

          // {
          //   icon: 'insights',
          //   label: 'Campaign Analytics',
          //   route: '/dashboard/campaigns/analytics'
          // },

          // {
          //   icon: 'groups',
          //   label: 'Promoter Management',
          //   expanded: false,
          //   children: [
          //     {
          //       icon: 'person_search',
          //       label: 'Find Promoters',
          //       route: '/dashboard/campaigns/promoters'
          //     },
          //     {
          //       icon: 'history',
          //       label: 'Application History',
          //       route: '/dashboard/campaigns/applications'
          //     },
          //     {
          //       icon: 'rate_review',
          //       label: 'Review Promoters',
          //       route: '/dashboard/campaigns/reviews'
          //     }
          //   ]
          // }

        ]
      },

      // {
      //   icon: 'storefront',
      //   label: 'Storefronts',
      //   expanded: false,
      //   children: [
      //     {
      //       icon: 'store',
      //       label: 'My Stores',
      //       route: '/dashboard/stores'
      //     },
      //     {
      //       icon: 'add_business',
      //       label: 'Add Store',
      //       route: '/dashboard/stores/create'
      //     },
      //     {
      //       icon: 'analytics',
      //       label: 'Store Analytics',
      //       route: '/dashboard/stores/analytics'
      //     },
      //     {
      //       icon: 'inventory',
      //       label: 'Product Management',
      //       expanded: false,
      //       children: [
      //         {
      //           icon: 'inventory_2',
      //           label: 'All Products',
      //           route: '/dashboard/stores/products'
      //         },
      //         {
      //           icon: 'add_shopping_cart',
      //           label: 'Add Product',
      //           route: '/dashboard/stores/products/create'
      //         },
      //         {
      //           icon: 'category',
      //           label: 'Categories',
      //           route: '/dashboard/stores/categories'
      //         }
      //       ]
      //     }
      //   ]
      // },

      {
        icon: 'currency_exchange',
        label: 'Transactions',
        expanded: false,
        children: [
          {
            icon: 'payments',
            label: 'Payment History',
            route: '/dashboard/transactions'
          },

          {
            icon: 'savings',
            label: 'Wallet Management',
            expanded: false,
            children: [

              // {
              //   icon: 'account_balance_wallet',
              //   label: 'Wallet Balance',
              //   route: '/dashboard/wallet'
              // },

              {
                icon: 'add',
                label: 'Fund Wallet',
                // route: '/dashboard/wallet/fund'
                modalAction: 'fundWallet'
              },

              // {
              //   icon: 'money_off',
              //   label: 'Withdraw Funds',
              //   route: '/dashboard/wallet/withdraw'
              // },

              // {
              //   icon: 'receipt_long',
              //   label: 'Wallet Statement',
              //   route: '/dashboard/wallet/statement'
              // }

            ]
          },

          // {
          //   icon: 'request_quote',
          //   label: 'Invoices & Receipts',
          //   route: '/dashboard/transactions/invoices'
          // },

          // {
          //   icon: 'price_check',
          //   label: 'Commission Reports',
          //   route: '/dashboard/transactions/commissions'
          // }
        ]
      },

      {
        icon: 'forum',
        label: 'Forum',
        expanded: false,
        children: [
          {
            icon: 'chat',
            label: 'Discussions',
            route: '/dashboard/forum'
          },

          // {
          //   icon: 'question_answer',
          //   label: 'Q&A',
          //   route: '/dashboard/forum/questions'
          // },

          // {
          //   icon: 'trending_up',
          //   label: 'Trending Topics',
          //   route: '/dashboard/forum/trending'
          // },

          // {
          //   icon: 'group',
          //   label: 'Community',
          //   route: '/dashboard/forum/community'
          // }

        ]
      },
      
      {
        icon: 'settings',
        label: 'Settings',
        expanded: false,
        children: [
          {
            icon: 'person',
            label: 'Profile Settings',
             route: '/dashboard/settings/account'
            // route: '/dashboard/settings/profile'
          },

          {
            icon: 'notifications',
            label: 'Notifications',
            route: '/dashboard/settings/system'
            // route: '/dashboard/settings/notifications'
          },

          // {
          //   icon: 'security',
          //   label: 'Security',
          //   expanded: false,
          //   children: [
          //     {
          //       icon: 'password',
          //       label: 'Change Password',
          //       route: '/dashboard/settings/security/password'
          //     },
          //     {
          //       icon: 'vpn_key',
          //       label: 'Two-Factor Auth',
          //       route: '/dashboard/settings/security/2fa'
          //     },
          //     {
          //       icon: 'devices',
          //       label: 'Device Management',
          //       route: '/dashboard/settings/security/devices'
          //     }
          //   ]
          // },

          // {
          //   icon: 'credit_card',
          //   label: 'Payment Methods',
          //   route: '/dashboard/settings/payments'
          // },

          {
            icon: 'help',
            label: 'Support & Help',
             route: '/dashboard/settings/share'
            // route: '/dashboard/settings/support'
          }
        ]
      }
    ];
  } else if (userRole === 'promoter') {
    return [

      {
        icon: 'dashboard',
        label: 'Dashboard',
        route: '/dashboard',
        expanded: false
      },

      {
        icon: 'work',
        label: 'Promotions',
        badge: pendingPromotions,
        badgeColor: 'warn',
        expanded: false,
        children: [
          {
            icon: 'search',
            label: 'Find Campaigns',
            route: '/dashboard/campaigns'
          },

          {
            icon: 'list_alt',
            label: 'My Promotions',
            route: '/dashboard/campaigns/promotions'
          },

          // {
          //   icon: 'list_alt',
          //   label: 'My Promotions',
          //   expanded: false,
          //   children: [
          //     {
          //       icon: 'pending',
          //       label: 'Pending Promotions',
          //       route: '/dashboard/campaigns/promotions?status=pending',
          //       badge: pendingPromotions,
          //       badgeColor: 'warn'
          //     },
          //     {
          //       icon: 'play_circle',
          //       label: 'Active Promotions',
          //       route: '/dashboard/campaigns/promotions?status=active'
          //     },
          //     {
          //       icon: 'check_circle',
          //       label: 'Completed Promotions',
          //       route: '/dashboard/campaigns/promotions?status=completed'
          //     },
          //     {
          //       icon: 'cancel',
          //       label: 'Rejected Promotions',
          //       route: '/dashboard/campaigns/promotions?status=rejected'
          //     }
          //   ]
          // },

          // {
          //   icon: 'insights',
          //   label: 'Performance Analytics',
          //   route: '/dashboard/campaigns/analytics'
          // },

          // {
          //   icon: 'description',
          //   label: 'Proof Submissions',
          //   route: '/dashboard/campaigns/proofs'
          // }

        ]
      },

      {
        icon: 'currency_exchange',
        label: 'Earnings',
        expanded: false,
        children: [

          // {
          //   icon: 'account_balance_wallet',
          //   label: 'Wallet',
          //   route: '/dashboard/wallet'
          // },

          {
            icon: 'payments',
            label: 'Transactions',
            route: '/dashboard/transactions'
          },

          {
            icon: 'savings',
            label: 'Withdraw Funds',
            route: '/dashboard/transactions/withdrawal'
            // route: '/dashboard/wallet/withdraw'
          },

          // {
          //   icon: 'analytics',
          //   label: 'Earnings Report',
          //   route: '/dashboard/earnings/report'
          // }

        ]
      },

      {
        icon: 'forum',
        label: 'Community',
        expanded: false,
        children: [
          {
            icon: 'chat',
            label: 'Forum',
            route: '/dashboard/forum'
          },

          // {
          //   icon: 'groups',
          //   label: 'Network',
          //   route: '/dashboard/community/network'
          // },

          // {
          //   icon: 'trending_up',
          //   label: 'Trending',
          //   route: '/dashboard/community/trending'
          // },

          {
            icon: 'support_agent',
            label: 'Support',
            route: '/dashboard/settings/share'
          }
        ]
      },

      {
        icon: 'settings',
        label: 'Settings',
        expanded: false,
        children: [
          {
            icon: 'person',
            label: 'Profile',
            route: '/dashboard/settings/account'
            // route: '/dashboard/settings/profile'
          },

          // {
          //   icon: 'monetization_on',
          //   label: 'Payment Settings',
          //   route: '/dashboard/settings/payments'
          // },

          {
            icon: 'notifications',
            label: 'Notifications',
            route: '/dashboard/settings/system'
            // route: '/dashboard/settings/notifications'
          },

          // {
          //   icon: 'help',
          //   label: 'Help Center',
          //   route: '/dashboard/settings/help'
          // }

        ]
      }

    ];
  } else if (userRole === 'marketing_manager') {
    return [
      // {
      //   icon: 'dashboard',
      //   label: 'Dashboard',
      //   route: '/dashboard',
      //   expanded: false
      // },
      // {
      //   icon: 'group',
      //   label: 'Team Management',
      //   expanded: false,
      //   children: [
      //     {
      //       icon: 'people',
      //       label: 'My Marketers',
      //       route: '/dashboard/marketers'
      //     },
      //     {
      //       icon: 'person_add',
      //       label: 'Add Marketer',
      //       route: '/dashboard/marketers/add'
      //     },
      //     {
      //       icon: 'assessment',
      //       label: 'Performance Reports',
      //       route: '/dashboard/marketers/reports'
      //     },
      //     {
      //       icon: 'payments',
      //       label: 'Commission Management',
      //       expanded: false,
      //       children: [
      //         {
      //           icon: 'calculate',
      //           label: 'Calculate Commissions',
      //           route: '/dashboard/commissions/calculate'
      //         },
      //         {
      //           icon: 'receipt_long',
      //           label: 'Commission Reports',
      //           route: '/dashboard/commissions/reports'
      //         },
      //         {
      //           icon: 'payments',
      //           label: 'Payouts',
      //           route: '/dashboard/commissions/payouts'
      //         }
      //       ]
      //     }
      //   ]
      // },
      // {
      //   icon: 'campaign',
      //   label: 'Campaigns Overview',
      //   expanded: false,
      //   children: [
      //     {
      //       icon: 'visibility',
      //       label: 'View All Campaigns',
      //       route: '/dashboard/campaigns/all'
      //     },
      //     {
      //       icon: 'approval',
      //       label: 'Campaign Approvals',
      //       route: '/dashboard/campaigns/approvals'
      //     },
      //     {
      //       icon: 'analytics',
      //       label: 'Performance Dashboard',
      //       route: '/dashboard/analytics/campaigns'
      //     }
      //   ]
      // },
      // {
      //   icon: 'settings',
      //   label: 'Settings',
      //   expanded: false,
      //   children: [
      //     {
      //       icon: 'admin_panel_settings',
      //       label: 'Admin Settings',
      //       route: '/dashboard/settings/admin'
      //     },
      //     {
      //       icon: 'tune',
      //       label: 'Platform Configuration',
      //       route: '/dashboard/settings/platform'
      //     }
      //   ]
      // }
    ];
  } else {
    // Admin or other roles
    return [
      {
        icon: 'dashboard',
        label: 'Dashboard',
        route: '/dashboard',
        expanded: false
      }
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