import { Component, inject, computed, Signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../../common/services/user.service';
import { DeviceService, UserInterface } from '../../../../../shared-services/src/public-api';
import { MarketerStoreDashboardComponent } from './store-dashboard/store-dashboard.component';

@Component({
  selector: 'campaign-index',
  standalone: true,
  imports: [CommonModule, MarketerStoreDashboardComponent],
  template: `
    <!-- Main Content -->
    @if (user()?.role === 'marketer') {
      <app-marketer-store-dashboard [user]="user"/>
    }

    @if (user()?.role === 'promoter') {
      promoter
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
