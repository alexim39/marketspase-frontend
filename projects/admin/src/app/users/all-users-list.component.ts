import { Component, inject, OnInit, OnDestroy, DestroyRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { AdminService } from '../common/services/user.service';
import { UserService } from './users.service';
import { UserInterface } from '../../../../shared-services/src/public-api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { EditDisplayNameDialogComponent } from './edit-display-name-dialog/edit-display-name-dialog.component';
import { RoleStatisticsComponent } from './statistics/statistics.component';

@Component({
  selector: 'admin-user-mgt',
  standalone: true,
  providers: [UserService],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressBarModule,
    RoleStatisticsComponent
  ],
  templateUrl: './all-users-list.component.html',
  styleUrls: ['./all-users-list.component.scss'],
})
export class AllUsersListComponent implements OnInit, OnDestroy {
  readonly adminService = inject(AdminService);
  readonly userService = inject(UserService);
  readonly router = inject(Router);
  readonly snackBar = inject(MatSnackBar);

  readonly users = signal<UserInterface[]>([]);

  readonly isLoading = signal(true);
  readonly isRefreshing = signal(false);
  readonly showStatistics = signal(false);
  readonly isExporting = signal(false);
  readonly searchTerm = signal('');

  readonly totalUsers = signal(0);
  readonly pageSize = signal(50);
  readonly currentPage = signal(1);
  readonly totalPages = signal(0);

  readonly selectedRole = signal('');
  readonly showActiveOnly = signal<boolean | null>(null);
  readonly showVerifiedOnly = signal<boolean | null>(null);

  readonly sortField = signal<string>('createdAt');
  readonly sortDirection = signal<'asc' | 'desc'>('desc');

  readonly roles = ['marketer', 'promoter', 'admin'];
  readonly pageSizeOptions = [10, 25, 50, 100];

  private readonly destroyRef = inject(DestroyRef);
  private readonly searchSubject = new Subject<string>();
  private readonly destroy$ = new Subject<void>();
  private readonly dialog = inject(MatDialog);

  readonly pageNumbers = computed(() => {
    const total = Math.max(1, this.totalPages());
    const current = this.currentPage();
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });

  readonly totalActiveCount = computed(() => this.users().filter(u => u.isActive && !u.isDeleted).length);
  readonly totalInactiveCount = computed(() => this.users().filter(u => !u.isActive && !u.isDeleted).length);
  readonly totalDeleted = computed(() => this.users().filter(u => u.isDeleted).length);
  readonly totalVerified = computed(() => this.users().filter(u => u.verified).length);

  constructor() {
    const savedStats = localStorage.getItem('showUserStatistics');
    if (savedStats) {
      this.showStatistics.set(JSON.parse(savedStats));
    }
  }

  ngOnInit(): void {
    this.adminService.fetchAdmin();
    this.setupSearchListener();
    this.setupUserServiceSubscription();
    this.loadUsers();
  }

  private setupSearchListener(): void {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(searchTerm => {
      this.applySearch(searchTerm);
    });
  }

  private setupUserServiceSubscription(): void {
    this.userService.getAppUsers().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.users.set(response.data.users);
          this.totalUsers.set(response.data.pagination.total);
          this.currentPage.set(response.data.pagination.page);
          this.pageSize.set(response.data.pagination.limit);
          this.totalPages.set(response.data.pagination.totalPages || Math.ceil(response.data.pagination.total / response.data.pagination.limit));
          this.isLoading.set(false);
          this.isRefreshing.set(false);
        } else {
          this.isLoading.set(false);
          this.isRefreshing.set(false);
        }
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.isLoading.set(false);
        this.isRefreshing.set(false);
        this.showError('Failed to load users');
      }
    });
  }

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
    this.searchSubject.next(value);
  }

  applySearch(searchTerm: string): void {
    this.userService.updateFilters({
      search: searchTerm.trim(),
      page: 1
    });
    this.currentPage.set(1);
    this.loadUsers();
  }

  onRoleChange(role: string): void {
    this.selectedRole.set(role);
    this.userService.updateFilters({
      role: role || undefined,
      page: 1
    });
    this.currentPage.set(1);
    this.loadUsers();
  }

  toggleRoleFilter(role: string): void {
    const current = this.selectedRole();
    this.onRoleChange(current === role ? '' : role);
  }

  onActiveFilterChange(active: boolean | null): void {
    this.showActiveOnly.set(active);
    this.userService.updateFilters({
      isActive: active ?? undefined,
      page: 1
    });
    this.currentPage.set(1);
    this.loadUsers();
  }

  onVerifiedFilterChange(verified: boolean | null): void {
    this.showVerifiedOnly.set(verified);
    this.userService.updateFilters({
      isVerified: verified ?? undefined,
      page: 1
    });
    this.currentPage.set(1);
    this.loadUsers();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedRole.set('');
    this.showActiveOnly.set(null);
    this.showVerifiedOnly.set(null);
    this.userService.clearFilters();
    this.currentPage.set(1);
    this.loadUsers();
  }

  refreshUsers(): void {
    this.isRefreshing.set(true);
    this.currentPage.set(1);
    this.userService.updateFilters({ page: 1 });
    this.loadUsers();
  }

  exportUsers(): void {
    this.isExporting.set(true);
    this.userService.streamUsers().pipe(takeUntil(this.destroy$)).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.isExporting.set(false);
        this.showSuccess('Users exported successfully');
      },
      error: (error) => {
        console.error('Export error:', error);
        this.isExporting.set(false);
        this.showError('Failed to export users');
      }
    });
  }

  toggleStatistics(): void {
    const newValue = !this.showStatistics();
    this.showStatistics.set(newValue);
    localStorage.setItem('showUserStatistics', JSON.stringify(newValue));
  }

  toggleSort(field: string): void {
    if (this.sortField() === field) {
      this.sortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set('desc');
    }
    const direction = this.sortDirection() === 'desc' ? '-' : '';
    this.userService.updateFilters({
      sort: `${direction}${field}`,
      page: 1
    });
    this.currentPage.set(1);
    this.loadUsers();
  }

  getSortIndicator(field: string): string {
    if (this.sortField() !== field) return '';
    return this.sortDirection() === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  viewUserDetails(user: UserInterface): void {
    this.router.navigate(['dashboard/users', user._id]);
  }

  editUser(user: UserInterface): void {
    const dialogRef = this.dialog.open(EditDisplayNameDialogComponent, {
      width: '500px',
      data: {
        user: user,
        currentDisplayName: user.displayName
      },
      disableClose: true
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result?.success) {
        const updatedUsers = this.users().map(u =>
          u._id === result.user._id ? { ...u, displayName: result.displayName } : u
        );
        this.users.set(updatedUsers);
        this.showSuccess('Display name updated successfully');
      }
    });
  }

  activateUser(user: UserInterface): void {
    this.userService.updateUserStatus(user._id, true).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.showSuccess('User activated successfully');
        this.loadUsers();
      },
      error: () => this.showError('Failed to activate user')
    });
  }

  deactivateUser(user: UserInterface): void {
    this.userService.updateUserStatus(user._id, false).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.showSuccess('User deactivated successfully');
        this.loadUsers();
      },
      error: () => this.showError('Failed to deactivate user')
    });
  }

  goToPage(page: number): void {
    const target = Math.max(1, Math.min(page, Math.max(1, this.totalPages())));
    if (target === this.currentPage()) return;
    this.currentPage.set(target);
    this.userService.updateFilters({ page: target });
    this.loadUsers();
  }

  onPageInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const page = parseInt(input.value, 10);
    if (!isNaN(page) && page >= 1 && page <= this.totalPages()) {
      this.goToPage(page);
    }
    input.value = '';
  }

  onPageSizeChange(size: string | number): void {
    const parsed = typeof size === 'string' ? parseInt(size, 10) : size;
    this.pageSize.set(parsed);
    this.currentPage.set(1);
    this.userService.updateFilters({ limit: parsed, page: 1 });
    this.loadUsers();
  }

  private loadUsers(): void {
    this.isLoading.set(true);
    this.userService.loadUsers();
  }

  onAvatarError(event: Event): void {
    (event.target as HTMLImageElement).src = '/img/avatar.png';
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchSubject.complete();
  }
}
