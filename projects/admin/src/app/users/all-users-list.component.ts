import { Component, inject, OnInit, OnDestroy, ViewChild, DestroyRef, AfterViewInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

// Angular Material imports
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';

// Services
import { AdminService } from '../common/services/user.service';
import { UserService } from './users.service';
import { UserInterface } from '../../../../shared-services/src/public-api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RoleStatisticsComponent } from './statistics/statistics.component';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'admin-user-mgt',
  standalone: true,
  providers: [UserService],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    // Material Modules
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTooltipModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatSelectModule,
    MatCheckboxModule,
    MatMenuModule,
    MatProgressBarModule,
    RoleStatisticsComponent
  ],
  templateUrl: './all-users-list.component.html',
  styleUrls: ['./all-users-list.component.scss'],
})
export class AllUsersListComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly adminService = inject(AdminService);
  readonly userService = inject(UserService);
  readonly router = inject(Router);
  readonly snackBar = inject(MatSnackBar);

  // Table properties
  displayedColumns: string[] = ['avatar', 'displayName', 'email', 'role', 'balance', 'status', 'createdAt', 'updatedAt', 'actions'];
  dataSource: MatTableDataSource<UserInterface> = new MatTableDataSource<UserInterface>([]);
  
  // State
  readonly isLoading = signal(true);
  readonly isRefreshing = signal(false);
  readonly showStatistics = signal(false);
  readonly isExporting = signal(false);
  readonly searchTerm = signal('');
  
  // Pagination
  totalUsers = 0;
  pageSize = 50;
  pageIndex = 0;
  pageSizeOptions = [10, 25, 50, 100];
  
  // Filters
  roles = ['marketer', 'promoter', 'admin'];
  selectedRole = signal<string>('');
  showActiveOnly = signal<boolean | null>(null);
  showVerifiedOnly = signal<boolean | null>(null);
  
  // View children
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  // Private subjects
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchSubject = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  constructor() {
    // Load saved preferences
    const savedStats = localStorage.getItem('showUserStatistics');
    if (savedStats) {
      this.showStatistics.set(JSON.parse(savedStats));
    }
  }

  ngOnInit(): void {
    this.adminService.fetchAdmin();
    this.setupSearchListener();
    this.loadUsers();
    this.setupUserServiceSubscription();
  }

  ngAfterViewInit() {
    // Setup paginator and sort
    this.setupPaginator();
    this.setupSort();
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
        this.dataSource.data = response.data.users;
        this.totalUsers = response.data.pagination.total;
        this.pageIndex = response.data.pagination.page - 1;
        this.pageSize = response.data.pagination.limit;
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

  private setupPaginator(): void {
    if (this.paginator) {
      this.paginator.page.pipe(
        takeUntil(this.destroy$)
      ).subscribe((pageEvent: PageEvent) => {
        this.pageSize = pageEvent.pageSize;
        this.pageIndex = pageEvent.pageIndex;
        this.userService.updateFilters({
          page: pageEvent.pageIndex + 1,
          limit: pageEvent.pageSize
        });
      });
    }
  }

  private setupSort(): void {
    if (this.sort) {
      this.sort.sortChange.pipe(
        takeUntil(this.destroy$)
      ).subscribe((sortState: Sort) => {
        const direction = sortState.direction === 'desc' ? '-' : '';
        const sortField = `${direction}${sortState.active}`;
        this.userService.updateFilters({ sort: sortField });
      });
    }
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.searchSubject.next(value);
  }

applySearch(searchTerm: string): void {
  this.userService.updateFilters({ 
    search: searchTerm,
    page: 1
  });
  this.refreshUsers(); // This will trigger a new API call
}

onRoleChange(role: string): void {
  this.selectedRole.set(role);
  this.userService.updateFilters({ 
    role: role || undefined,
    page: 1
  });
  this.refreshUsers();
}

  onActiveFilterChange(active: boolean | null): void {
    this.showActiveOnly.set(active);
    this.userService.updateFilters({ 
      isActive: active ?? undefined,
      page: 1
    });
  }

  onVerifiedFilterChange(verified: boolean | null): void {
    this.showVerifiedOnly.set(verified);
    this.userService.updateFilters({ 
      isVerified: verified ?? undefined,
      page: 1
    });
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedRole.set('');
    this.showActiveOnly.set(null);
    this.showVerifiedOnly.set(null);
    this.userService.clearFilters();
  }

refreshUsers(): void {
  this.isRefreshing.set(true);
  this.userService.clearUserListsCache();
  this.loadUsers();
}

  exportUsers(): void {
    this.isExporting.set(true);
    this.userService.streamUsers().subscribe({
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

  viewUserDetails(user: UserInterface): void {
    this.router.navigate(['dashboard/users', user._id]);
  }

  editUser(user: UserInterface): void {
    // Implement edit modal/dialog
    console.log('Edit user:', user);
  }

  activateUser(user: UserInterface): void {
    // Implement activation logic
    console.log('Activate user:', user);
  }

  deactivateUser(user: UserInterface): void {
    // Implement deactivation logic
    console.log('Deactivate user:', user);
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

// Update the loadUsers method:
private loadUsers(): void {
  this.isLoading.set(true);
  this.setupUserServiceSubscription();
}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}