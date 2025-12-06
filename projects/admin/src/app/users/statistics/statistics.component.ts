import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserService, StatisticsResponse } from '../user.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

export interface RoleStatistics {
  role: string;
  counts: {
    total: number | any;
    active: number | any;
    inactive: number;
    verified: number | any;
    unverified: number | any;
    deleted: number | any;
    recent: number | any;
  };
  financial: {
    totalBalance: number;
    averageBalance: number;
    currency: string;
  };
  engagement: {
    averageRating: number;
    totalRatings: number;
    percentageRated: number;
  };
  activity: {
    totalReferrals: number;
    totalEarned: number;
  };
}

@Component({
  selector: 'app-role-statistics',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss']
})
export class RoleStatisticsComponent implements OnInit {
  private userService = inject(UserService);
  private destroyRef = inject(DestroyRef);

  // Signals for state management
  statistics = signal<RoleStatistics[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);
  selectedRole = signal('marketer');

  // Define roles for the UI
  roles = signal([
    { value: 'marketer', label: 'Marketers', icon: 'business_center' },
    { value: 'promoter', label: 'Promoters', icon: 'campaign' },
    { value: 'admin', label: 'Admins', icon: 'admin_panel_settings' }
  ]);

  // Computed values
  currentStats = computed(() => {
    return this.statistics().find(s => s.role === this.selectedRole()) || null;
  });

  currentRoleLabel = computed(() => {
    const role = this.roles().find(r => r.value === this.selectedRole());
    return role ? role.label : 'Unknown';
  });

  selectedIndex = computed(() => {
    const roleValue = this.selectedRole();
    return this.roles().findIndex(r => r.value === roleValue);
  });

  // Helper method to get stats for a specific role
  getStatsForRole(roleValue: string): RoleStatistics | null {
    return this.statistics().find(s => s.role === roleValue) || null;
  }

  // Helper computed properties for each role's stats
  marketerStats = computed(() => this.getStatsForRole('marketer'));
  promoterStats = computed(() => this.getStatsForRole('promoter'));
  adminStats = computed(() => this.getStatsForRole('admin'));

  ngOnInit(): void {
    this.loadStatistics();
  }

  /**
   * Load statistics for the current role
   */
  loadStatistics(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const selectedRole = this.selectedRole();

    this.userService.getStatsByRole(selectedRole)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(err => {
          console.error(`Error loading statistics for ${selectedRole}:`, err);
          this.error.set(`An error occurred while loading ${selectedRole} statistics`);
          return of({ success: false, data: null });
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response: StatisticsResponse) => {
          if (response.success && response.data) {
            this.updateStatistics(response.data);
          } else if (!response.success) {
            this.error.set('Failed to load statistics from server');
          }
        }
      });
  }

  /**
   * Load statistics for a specific role
   */
  loadRoleStatistics(role: string): void {
    // Update selected role first
    this.selectedRole.set(role);
    
    // Then load the statistics if we don't have them
    if (!this.statistics().some(s => s.role === role)) {
      this.isLoading.set(true);
      this.error.set(null);

      this.userService.getStatsByRole(role)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          catchError(err => {
            console.error(`Error loading statistics for ${role}:`, err);
            this.error.set(`An error occurred while loading ${role} statistics`);
            return of({ success: false, data: null });
          }),
          finalize(() => this.isLoading.set(false))
        )
        .subscribe({
          next: (response: StatisticsResponse) => {
            if (response.success && response.data) {
              this.updateStatistics(response.data);
            } else if (!response.success) {
              this.error.set(`Failed to load statistics for ${role}`);
            }
          }
        });
    }
  }

  /**
   * Update statistics for a role
   */
  private updateStatistics(statData: RoleStatistics): void {
    const currentStats = this.statistics();
    const index = currentStats.findIndex(s => s.role === statData.role);
    
    if (index >= 0) {
      // Update existing statistics
      const updatedStats = [...currentStats];
      updatedStats[index] = statData;
      this.statistics.set(updatedStats);
    } else {
      // Add new statistics
      this.statistics.set([...currentStats, statData]);
    }
  }

  /**
   * Refresh all statistics
   */
  refreshAll(): void {
    this.isLoading.set(true);
    this.error.set(null);

    // Clear existing statistics
    this.statistics.set([]);

    // Load all roles in parallel
    const requests = this.roles().map(role => 
      this.userService.getStatsByRole(role.value).pipe(
        catchError(err => {
          console.error(`Error loading statistics for ${role.value}:`, err);
          return of({ success: false, data: null });
        })
      )
    );

    // Load all statistics
    let completed = 0;
    const total = requests.length;
    
    requests.forEach((request) => {
      request
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response: StatisticsResponse) => {
            completed++;
            
            if (response.success && response.data) {
              this.updateStatistics(response.data);
            }
            
            // When all requests are done, set loading to false
            if (completed === total) {
              this.isLoading.set(false);
            }
          },
          error: () => {
            completed++;
            if (completed === total) {
              this.isLoading.set(false);
            }
          }
        });
    });
  }

  /**
   * Handle tab selection change
   */
  onTabSelected(index: number): void {
    const role = this.roles()[index];
    if (role) {
      this.selectedRole.set(role.value);
      
      // Load statistics if we don't have them yet
      if (!this.statistics().some(s => s.role === role.value)) {
        this.loadRoleStatistics(role.value);
      }
    }
  }

  /**
   * Get percentage calculation safely
   */
  calculatePercentage(numerator: number, denominator: number): number {
    if (denominator === 0) return 0;
    return (numerator / denominator) * 100;
  }

  /**
   * Retry loading statistics for current role
   */
  retry(): void {
    this.loadRoleStatistics(this.selectedRole());
  }
}