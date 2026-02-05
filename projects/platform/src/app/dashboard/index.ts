import {
  Component, 
  inject, 
  OnInit, 
  signal,
  computed,
  DestroyRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DashboardComponent } from './sidenav/sidenav.component';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../common/services/user.service';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DeviceService, LoadingService, UserInterface } from '../../../../shared-services/src/public-api';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MatProgressBarModule } from '@angular/material/progress-bar';

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
  templateUrl: './index.html',
  styleUrls: ['./index.scss'],
})
export class DashboardIndexComponent implements OnInit {

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly deviceService = inject(DeviceService);
  private snackBar = inject(MatSnackBar);
  public loadingService = inject(LoadingService);

  private readonly destroyRef = inject(DestroyRef);
  private userService: UserService = inject(UserService);

  // SIGNALS
  protected readonly authState = signal<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null
  });

  public user = signal<UserInterface | null>(null);

  protected readonly deviceType = computed(() => this.deviceService.type());
  protected readonly isLoading = computed(() => this.authState().isLoading);
  protected readonly isAuthenticated = computed(() => this.authState().isAuthenticated);

  constructor() {

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
                    this.user.set(response.data as UserInterface);

                    //  🚫 THEME REMOVED – AppThemeService applies theme globally.
                    //     DO NOT apply theme here.
                  }
                },
                error: (error: HttpErrorResponse) => {
                  this.snackBar.open(error.error.message, 'Close', { duration: 8000 });
                  this.authState.set({
                    isAuthenticated: false,
                    isLoading: false,
                    user: null
                  });
                  this.user.set(null);
                  this.router.navigate(['/'], { 
                    replaceUrl: true,
                    state: { message: 'Please log in to access the dashboard' }
                  });
                }
              });

          } else {
            // User is not authenticated
            this.authState.set({
              isAuthenticated: false,
              isLoading: false,
              user: null
            });
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
        filter(event =>
          event instanceof NavigationStart ||
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError
        )
      )
      .subscribe(event => {
        if (event instanceof NavigationStart) {
          this.loadingService.show();
        } else if (event instanceof NavigationEnd) {
          this.loadingService.hide();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (event instanceof NavigationCancel || event instanceof NavigationError) {
          this.loadingService.hide();
        }
      });
  }
}
``