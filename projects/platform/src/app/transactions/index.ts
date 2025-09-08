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
  styles: [`
    .page-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      position: relative;
      overflow-x: hidden;
    }

    /* Loading State Styles */
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }

    .loading-content {
      text-align: center;
      color: white;
      padding: 2rem;
      animation: fadeInUp 0.6s ease-out;
    }

    .spinner-container {
      margin-bottom: 2rem;
      display: flex;
      justify-content: center;
    }

    .spinner {
      width: 3rem;
      height: 3rem;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-top: 3px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .loading-title {
      font-size: 1.75rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
      letter-spacing: -0.025em;
    }

    .loading-subtitle {
      font-size: 1rem;
      opacity: 0.9;
      margin: 0;
      font-weight: 400;
    }

    /* Dashboard Wrapper */
    .page-wrapper {
      min-height: 100vh;
      background: #f8fafc;
      transition: all 0.3s ease;
    }

    /* Main Dashboard Content */
    .page-main {
      position: relative;
      z-index: 1;
    }

    /* Error State */
    .error-state {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .error-content {
      text-align: center;
      color: white;
      padding: 2rem;
    }

    .error-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    .error-subtitle {
      font-size: 1rem;
      opacity: 0.9;
      margin: 0;
    }

    /* Animations */
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes fadeInUp {
      0% {
        opacity: 0;
        transform: translateY(2rem);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Responsive Design */
    
    /* Mobile Styles */
    @media (max-width: 768px) {
      .loading-content {
        padding: 1.5rem;
      }
      
      .loading-title {
        font-size: 1.5rem;
      }
      
      .loading-subtitle {
        font-size: 0.9rem;
      }
      
      .spinner {
        width: 2.5rem;
        height: 2.5rem;
      }
      
    }

    /* Tablet Styles */
    @media (min-width: 769px) and (max-width: 1024px) {
      .page-wrapper[data-device="tablet"] {
        padding: 0;
      }
    }

    /* Desktop Styles */
    @media (min-width: 1025px) {
      .page-wrapper[data-device="desktop"] {
        background: #ffffff;
      }
    }

    /* Accessibility Improvements */
    @media (prefers-reduced-motion: reduce) {
      .spinner {
        animation: none;
      }
      
      .loading-content {
        animation: none;
      }
      
      .page-wrapper {
        transition: none;
      }
    }

    /* High contrast mode support */
    @media (prefers-contrast: high) {
      .loading-overlay {
        background: #000;
        color: #fff;
      }
      
      .spinner {
        border-color: #fff;
        border-top-color: #000;
      }
      
     
    }

    /* Dark mode support (if needed) */
    @media (prefers-color-scheme: dark) {
      .page-wrapper {
        background: #1f2937;
      }
      
    }
  `]
})
export class TransactionsIndexComponent {
  private readonly deviceService = inject(DeviceService);
  // Computed properties for better performance
  protected readonly deviceType = computed(() => this.deviceService.type());

  private userService: UserService = inject(UserService);
  // Expose the signal directly to the template
  public user: Signal<UserInterface | null> = this.userService.user;
}
