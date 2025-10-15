import { Component, signal, computed, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { filter } from 'rxjs';
import {  AdminService } from '../common/services/user.service';
import { AuthService } from '../auth/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import { LoadingService } from '../../../../shared-services/src/public-api';

@Component({
  selector: 'app-whatsapp-admin-dashboard',
  standalone: true,
  providers: [AuthService, LoadingService],
  imports: [CommonModule, RouterModule, MatIconModule, MatProgressBarModule],
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  // We expose the service directly to the template for simplicity
  readonly adminService = inject(AdminService);
  private authService = inject(AuthService);
  private router = inject(Router);
  public loadingService = inject(LoadingService);
  

  // Define component state using signals
  sidebarCollapsed = signal(false);
  activeNavItem = signal('dashboard');
  searchQuery = signal('');
  notificationCount = signal(5);
  //messageCount = signal(12);

  private readonly destroyRef = inject(DestroyRef);

  // Use a computed signal for the page title for better performance
  pageTitle = computed(() => {
    const titles: Record<string, string> = {
      dashboard: 'Dashboard Overview',
      user: 'User Management',
      campaigns: 'Campaign Management',
      testimonials: 'Testimonial Management',
      //proof: 'Campaign Proof Management',
      //transactions: 'Transaction History',
      analytics: 'Analytics & Reports',
      settings: 'Platform Settings',
      logout: ''
    };
    return titles[this.activeNavItem()] || 'Dashboard';
  });

  // Current date (this can stay as a simple property as it doesn't change)
  currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  ngOnInit(): void {

    // This is the correct line to trigger the data fetch.
    this.adminService.fetchAdmin();

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

  
  // No changes needed for these methods as they already use signals
  toggleSidebar() {
    this.sidebarCollapsed.set(!this.sidebarCollapsed());
  }

  setActiveNavItem(item: string) {
    this.activeNavItem.set(item);
  }
  
  onSearchInput(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    this.searchQuery.set(query);
  }

  // Refactored logout to use a one-off subscription
  logout() {
      this.authService.signOut({})
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            localStorage.removeItem('isAuthenticated');
            this.router.navigate(['/'], { replaceUrl: true });
          }
        },
        error: (error) => {
          console.error('Error during sign out:', error);
          this.router.navigate(['/'], { replaceUrl: true });
        }
      })
  }

 
  ngOnDestroy(): void {
    // this.destroy$.next();
    // this.destroy$.complete();
  }


  loadDashboard() {
    this.router.navigate(['dashboard']);
  }
  // loadUsers() {
  //   this.router.navigate(['dashboard/users']);
  // }
}