import { Component, inject, computed, Signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../common/services/user.service';
import { DeviceService, UserInterface } from '../../../../shared-services/src/public-api';
import { MarketerStoreDashboardComponent } from './marketer/dashboard/store-dashboard/store-dashboard.component';
import { PromoterStoresListComponent } from './promoter/stores-list/promoter-stores-list.component';

@Component({
  selector: 'campaign-index',
  standalone: true,
  imports: [CommonModule, PromoterStoresListComponent, MarketerStoreDashboardComponent],
  template: `
    <!-- Main Content -->
    @if (user()?.role === 'marketer') {
      <app-marketer-store-dashboard [user]="user"/>
    }

    @if (user()?.role === 'promoter') {
      <app-promoter-stores-list/>
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

  constructor() {
    effect(() => {
      if (!this.user()) {
        this.router.navigate(['/']);
      }
    });
  }
}
