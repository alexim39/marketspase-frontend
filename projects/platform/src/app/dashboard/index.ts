import { 
  Component, 
  inject, 
  OnInit, 
  OnDestroy, 
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DashboardComponent } from './sidenav/sidenav.component';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../common/services/user.service';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DeviceService, LoadingService, UserInterface } from '../../../../shared-services/src/public-api';
import { DashboardMainMobileContainer } from './main-content/mobile/main-content-mobile.component';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { filter } from 'rxjs/operators';
import {MatProgressBarModule} from '@angular/material/progress-bar';


interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user?: any;
}

@Component({
  selector: 'dashboard-index',
  standalone: true,
  providers: [LoadingService],
  imports: [CommonModule, DashboardComponent, MatProgressBarModule],
  template: `

    @if (loadingService.isLoading$ | async) {
        <mat-progress-bar mode="indeterminate"/>
    }

    <div class="dashboard-container">
      <!-- Loading State -->
      @if (authState().isLoading) {
        <div class="loading-overlay" 
             role="status" 
             aria-label="Loading authentication status">
          <div class="loading-content">
            <div class="spinner-container">
              <div class="spinner" aria-hidden="true"></div>
            </div>
            <h2 class="loading-title">Authenticating</h2>
            <p class="loading-subtitle">Please wait while we verify your credentials...</p>
          </div>
        </div>
      }
      
      <!-- Main Content -->
      @else if (authState().isAuthenticated) {
        <div class="dashboard-wrapper" [attr.data-device]="deviceType()">
          <!-- Mobile Notice (Optional) -->
          @if (deviceType() === 'mobile') {
            <!-- Dashboard Content -->
            <main class="dashboard-main" role="main">
              @if (user()) {
                <!-- <app-main-container-mobile/> -->
                 <app-dashboard [user]="user" />
              }              
            </main>
          }
          
          <!-- Tablet Notice (Optional) -->
          @if (deviceType() === 'tablet') {
            <!-- Dashboard Content -->
           <main class="dashboard-main" role="main">
              @if (user()) {
                <app-dashboard [user]="user" />
              }              
            </main>
          }

          <!-- Desktop Notice (Optional) -->
          @if (deviceType() === 'desktop') {
            <!-- Dashboard Content -->
            <main class="dashboard-main" role="main">
              @if (user()) {
                <app-dashboard [user]="user" />
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
    .dashboard-container {
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
    .dashboard-wrapper {
      min-height: 100vh;
      background: #f8fafc;
      transition: all 0.3s ease;
    }

    /* Main Dashboard Content */
    .dashboard-main {
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
      .dashboard-wrapper[data-device="tablet"] {
        padding: 0;
      }
    }

    /* Desktop Styles */
    @media (min-width: 1025px) {
      .dashboard-wrapper[data-device="desktop"] {
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
      
      .dashboard-wrapper {
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
      .dashboard-wrapper {
        background: #1f2937;
      }
      
    }
  `]
})
export class DashboardIndexComponent implements OnInit {
  // Injected services using modern inject function
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly deviceService = inject(DeviceService);
  private snackBar = inject(MatSnackBar);
  public loadingService = inject(LoadingService);

  // Reactive state using signals
  protected readonly authState = signal<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null
  });

  // Computed properties for better performance
  protected readonly deviceType = computed(() => this.deviceService.type());
  protected readonly isLoading = computed(() => this.authState().isLoading);
  protected readonly isAuthenticated = computed(() => this.authState().isAuthenticated);

  private readonly destroyRef = inject(DestroyRef);
  
  private userService: UserService = inject(UserService);
  // CONVERTED TO A SIGNAL: User data is now a signal.
  // It holds the value of the user and allows for reactivity.
  public user = signal<UserInterface | null>(null);

  constructor() {
    // Set up auth state subscription with automatic cleanup
    this.authService.getAuthState()
      .pipe(takeUntilDestroyed())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          if (user) {
            // User is authenticated
            this.authState.set({
              isAuthenticated: true,
              isLoading: false,
              user: user
            });
              this.userService.getUser(user.uid)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: (response) => {
                  if (response.success) {
                    //console.log('Returned User:', response.data);
                   // UPDATED: Use `set()` to update the signal's value.
                    this.user.set(response.data as UserInterface);
                  }
                },
                error: (error: HttpErrorResponse) => {
                   this.snackBar.open(error.error.message, 'Close', {
                    duration: 8000,
                  });
                   // User is not authenticated - redirect to login
                    this.authState.set({
                      isAuthenticated: false,
                      isLoading: false,
                      user: null
                    });
                    // Reset the user signal when not authenticated
                    this.user.set(null);
                    this.router.navigate(['/'], { 
                      replaceUrl: true,
                      state: { message: 'Please log in to access the dashboard' }
                    });
                }    
              })

          } else {
            // User is not authenticated - redirect to login
            this.authState.set({
              isAuthenticated: false,
              isLoading: false,
              user: null
            });
            // Reset the user signal when not authenticated
            this.user.set(null);
            this.router.navigate(['/'], { 
              replaceUrl: true,
              state: { message: 'Please log in to access the dashboard' }
            });
          }
        },
        error: (error) => {
          console.error('Authentication error:', error);
          this.authState.set({
            isAuthenticated: false,
            isLoading: false,
            user: null
          });
          // Reset the user signal on authentication error
          this.user.set(null);
          this.router.navigate(['/'], { 
            replaceUrl: true,
            state: { error: 'Authentication failed. Please try again.' }
          });
        }
      });

  }

  ngOnInit(): void {
     this.router.events
      .pipe(
        // We only care about navigation-related events
        filter(event => event instanceof NavigationStart || 
                       event instanceof NavigationEnd || 
                       event instanceof NavigationCancel || 
                       event instanceof NavigationError)
      )
      .subscribe(event => {
        if (event instanceof NavigationStart) {
          this.loadingService.show();
        } else if (event instanceof NavigationEnd) { // Only successful navigation
          this.loadingService.hide();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (event instanceof NavigationCancel || 
                  event instanceof NavigationError) {
          // Optionally handle cancelled or errored navigation separately
          this.loadingService.hide();
        }
      });
  }

}
