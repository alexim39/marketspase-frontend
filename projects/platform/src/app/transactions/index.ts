import { Component, inject, computed, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../common/services/user.service';
import { DeviceService, UserInterface } from '../../../../shared-services/src/public-api';
import { TransactionComponent } from './transactions.component';


@Component({
  selector: 'index',
  standalone: true,
  imports: [CommonModule, TransactionComponent],
  template: `
    <div class="page-container">
      
      <!-- Main Content -->
      @if (user()) {
        <div class="page-wrapper" [attr.data-device]="deviceType()">
          <!-- Mobile Notice (Optional) -->
          @if (deviceType() === 'mobile') {
            <!-- Dashboard Content -->
            <main class="page-main" role="main">
              @if (user()) {
                <app-transactions [user]="user"/>
              }              
            </main>
          }
          
          <!-- Tablet Notice (Optional) -->
          @if (deviceType() === 'tablet') {
            <!-- Dashboard Content -->
             <main class="page-main" role="main">
              @if (user()) {
                <app-transactions [user]="user"/>
              }              
            </main>
          }

          <!-- Desktop Notice (Optional) -->
          @if (deviceType() === 'desktop') {
            <!-- Dashboard Content -->
            <main class="page-main" role="main">
              @if (user()) {
                <app-transactions [user]="user"/>
              }              
            </main>
          }
          
        </div>
      }
      
      <!-- Fallback for unauthenticated users (shouldn't normally show due to redirect) -->
      @else {
        <div class="error-state" role="alert">
          <div class="error-content">
            <h2 class="error-title">Access Denied</h2>
            <p class="error-subtitle">Redirecting to login page...</p>
          </div>
        </div>
      }
    </div>
  `,
  styleUrls: ['./index.scss'],
})
export class TransactionsIndexComponent {
  private readonly deviceService = inject(DeviceService);
  // Computed properties for better performance
  protected readonly deviceType = computed(() => this.deviceService.type());

  private userService: UserService = inject(UserService);
  // Expose the signal directly to the template
  public user: Signal<UserInterface | null> = this.userService.user;
}
