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
import { DOCUMENT } from '@angular/common';

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
  styleUrls: ['./index.scss'],
})
export class DashboardIndexComponent implements OnInit {
  // Injected services using modern inject function
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly deviceService = inject(DeviceService);
  private snackBar = inject(MatSnackBar);
  public loadingService = inject(LoadingService);
  private readonly document = inject(DOCUMENT);

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

  // --- NEW METHOD TO APPLY THEME ---
  private applyThemeGlobally(user: UserInterface): void {
    const body = this.document.body;
    const html = this.document.documentElement;
    const themePrefs = user.preferences?.theme;

    // Default to system-based detection if preferences are missing or systemDefault is true
    const systemThemeIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Determine effective theme: system default (if enabled) OR user selection
    const useSystemDefault = themePrefs?.systemDefault ?? true;
    const effectiveDarkMode = useSystemDefault 
      ? systemThemeIsDark 
      : (themePrefs?.darkMode ?? false);

    const highContrastMode = themePrefs?.highContrast ?? false;
    
    // Remove all theme classes first (using your existing class structure)
    // Note: If you switched to Option 2 in the previous answer, you'd use setAttribute here.
    // Assuming you stick to classes/attributes as is:
    
    // 1. Theme Mode (Using the `data-theme` attribute you had in SCSS)
    // NOTE: We are using the `data-theme` attribute here as per your SCSS example: body[data-theme="dark"]
    if (effectiveDarkMode) {
      body.setAttribute('data-theme', 'dark');
      // Set a class as a fallback/for other styling if needed
      html.classList.add('dark-theme');
      body.classList.add('dark-theme');
    } else {
      body.setAttribute('data-theme', 'light');
      html.classList.remove('dark-theme');
      body.classList.remove('dark-theme');
    }

    // 2. High Contrast Mode
    if (highContrastMode) {
      body.classList.add('high-contrast');
      html.classList.add('high-contrast');
    } else {
      body.classList.remove('high-contrast');
      html.classList.remove('high-contrast');
    }

    // 3. Update color-scheme and meta tag
    html.style.colorScheme = effectiveDarkMode ? 'dark light' : 'light dark';
    this.updateThemeColorMeta(effectiveDarkMode);
  }

  private updateThemeColorMeta(isDark: boolean): void {
    let themeColor = isDark ? '#1a1a1a' : '#ffffff';
    let metaThemeColor = this.document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = this.document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      this.document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', themeColor);
  }

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

                    // --- NEW LINE: APPLY THEME HERE! ---
                    this.applyThemeGlobally(response.data as UserInterface);
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
