import { Component, inject, computed, Signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../common/services/user.service';
import { DeviceService } from '@shared/services/device';
import { UserInterface } from '@shared/services';
import { MarketerStoreDashboardComponent } from './marketer/dashboard/store-dashboard/store-dashboard.component';
import { MarketerStoreDashboardMobileComponent } from './marketer/dashboard/store-dashboard/mobile/store-dashboard-mobile.component';
import { StorefrontAnalyticsWidgetComponent } from './marketer/dashboard/storefront-analytics-widget.component';
import { PromoterDashboardWidgetComponent } from './promoter/promoter-dashboard-widget.component';
import { PromoterStoresListComponent } from './promoter/stores-list/promoter-stores-list.component';
import { PromoterStoresListMobileComponent } from './promoter/stores-list/mobile/promoter-stores-list-mobile.component';

@Component({
  selector: 'campaign-index',
  standalone: true,
  imports: [
    CommonModule,
    StorefrontAnalyticsWidgetComponent,
    PromoterDashboardWidgetComponent,
    PromoterStoresListComponent,
    PromoterStoresListMobileComponent,
    MarketerStoreDashboardComponent,
    MarketerStoreDashboardMobileComponent,
  ],
  template: `
    <!-- Main Content -->
    @if (user()?.role === 'marketer') {
      @if (isMobileExperience()) {
        <app-marketer-store-dashboard-mobile [user]="user"/>
      } @else {
        <app-marketer-store-dashboard [user]="user"/>
      }
      <app-storefront-analytics-widget />
    }

    @if (user()?.role === 'promoter') {
      <app-promoter-dashboard-widget />
      @if (isMobileExperience()) {
        <app-promoter-stores-list-mobile/>
      } @else {
        <app-promoter-stores-list/>
      }
    }

    @if (!user()) {
      Redirecting...
    }
  `,
  styles: [` `]
})
export class StoreIndexComponent {
  private readonly deviceService = inject(DeviceService);
  protected readonly deviceType = computed(() => this.deviceService.type());

  private userService = inject(UserService);
  private router = inject(Router);

  public user: Signal<UserInterface | null> = this.userService.user;

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceType();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });

  constructor() {
    effect(() => {
      if (!this.user()) {
        this.router.navigate(['/']);
      }
    });
  }
}
