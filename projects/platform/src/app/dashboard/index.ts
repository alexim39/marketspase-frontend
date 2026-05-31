import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DeviceService, LoadingService, UserInterface } from '@shared/services';
import { filter } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../common/services/user.service';
import { DailyCheckInIndexComponent } from './daily-check-in';
import { DailyCheckInService } from './daily-check-in/daily-check-in.service';
import { DashboardComponent } from './sidenav/sidenav.component';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user?: unknown;
}

@Component({
  selector: 'dashboard-index',
  standalone: true,
  providers: [LoadingService],
  imports: [
    CommonModule,
    DashboardComponent,
    DailyCheckInIndexComponent,
    MatProgressBarModule,
  ],
  templateUrl: './index.html',
  styleUrls: ['./index.scss'],
})
export class DashboardIndexComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly deviceService = inject(DeviceService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly userService = inject(UserService);
  private readonly dailyCheckInService = inject(DailyCheckInService);

  readonly loadingService = inject(LoadingService);

  protected readonly authState = signal<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
  });

  readonly user = signal<UserInterface | null>(null);
  private readonly currentRoute = signal(this.router.url);
  protected readonly deviceType = computed(() => this.deviceService.type());
  protected readonly isLoading = computed(() => this.authState().isLoading);
  protected readonly isAuthenticated = computed(() => this.authState().isAuthenticated);
  protected readonly showDailyCheckIn = computed(() => {
    if (this.deviceType() !== 'mobile') {
      return true;
    }

    return this.isDashboardHomeRoute(this.currentRoute());
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.dailyCheckInService.deactivate());

    this.authService.getAuthState()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (authUser) => {
          if (authUser) {
            this.authState.set({
              isAuthenticated: true,
              isLoading: false,
              user: authUser,
            });

            this.loadDashboardUser(authUser.uid);
            return;
          }

          this.handleUnauthorizedState('Please log in to access the dashboard');
        },
        error: (error) => {
          console.error('Authentication error:', error);
          this.handleUnauthorizedState('Authentication failed. Please try again.');
        },
      });

    this.router.events
      .pipe(
        filter((event) =>
          event instanceof NavigationStart ||
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        if (event instanceof NavigationStart) {
          this.loadingService.show();
          return;
        }

        this.loadingService.hide();
        if (event instanceof NavigationEnd) {
          this.currentRoute.set(event.urlAfterRedirects || event.url);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
  }

  private isDashboardHomeRoute(url: string): boolean {
    const normalized = (url || '')
      .split('?')[0]
      .split('#')[0]
      .replace(/\/+$/, '');

    return normalized === '/dashboard' || normalized === '';
  }

  private loadDashboardUser(uid: string): void {
    this.userService.getUser(uid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (!response?.success) {
            this.handleUnauthorizedState('We could not load your dashboard right now.');
            return;
          }

          const resolvedUser = response.data as UserInterface;
          this.user.set(resolvedUser);

          // Let the dashboard shell finish its initial render before streak state
          // starts toggling prompt/session signals.
          queueMicrotask(() => {
            if (this.user()?._id === resolvedUser._id) {
              this.dailyCheckInService.activate(resolvedUser);
            }
          });
        },
        error: (error: HttpErrorResponse) => {
          const message = error.error?.message || 'We could not load your dashboard.';
          this.snackBar.open(message, 'Close', { duration: 8000 });
          this.handleUnauthorizedState('Please log in to access the dashboard');
        },
      });
  }

  private handleUnauthorizedState(message: string): void {
    this.authState.set({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });
    this.user.set(null);
    this.dailyCheckInService.deactivate();

    this.router.navigate(['/'], {
      replaceUrl: true,
      state: { message },
    });
  }
}
