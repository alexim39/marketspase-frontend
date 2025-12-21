// all-users-list.component.ts - FIXED VERSION
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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
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
import { EditDisplayNameDialogComponent } from './edit-display-name-dialog/edit-display-name-dialog.component';

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
  private readonly dialog = inject(MatDialog);

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
    this.setupUserServiceSubscription(); // Set up subscription once
    this.loadUsers(); // Load initial data
  }

  ngAfterViewInit() {
    // Setup paginator and sort after view is initialized
    this.setupPaginator();
    this.setupSort();

    // Initialize paginator after data is loaded
    if (this.paginator) {
      this.updatePaginatorAfterDataLoad();
    }
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

  // Add this method to AllUsersListComponent class
  onPageChange(pageEvent: PageEvent): void {
    this.pageSize = pageEvent.pageSize;
    this.pageIndex = pageEvent.pageIndex;
    
    // Update filters with pagination
    this.userService.updateFilters({
      page: pageEvent.pageIndex + 1,
      limit: pageEvent.pageSize
    });
    
    // Load data with new pagination
    this.loadUsers();
  }

  private setupPaginator(): void {
    if (this.paginator) {
      this.paginator.page.pipe(
        takeUntil(this.destroy$)
      ).subscribe((pageEvent: PageEvent) => {
        this.pageSize = pageEvent.pageSize;
        this.pageIndex = pageEvent.pageIndex;
        
        // Update filters with pagination
        this.userService.updateFilters({
          page: pageEvent.pageIndex + 1,
          limit: pageEvent.pageSize
        });
        
        // Load data with new pagination - don't call refreshUsers()
        this.loadUsers();
      });
    }
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
          
          // Update paginator after data is loaded
          this.updatePaginatorAfterDataLoad();
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

   private updatePaginatorAfterDataLoad(): void {
    // Update paginator properties after data is loaded
    if (this.paginator) {
      // Use setTimeout to ensure change detection runs
      setTimeout(() => {
        this.paginator.length = this.totalUsers;
        this.paginator.pageIndex = this.pageIndex;
        this.paginator.pageSize = this.pageSize;
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
        
        // Update filters with sort
        this.userService.updateFilters({ 
          sort: sortField,
          page: 1 // Reset to first page when sorting
        });
        
        // Reset pagination
        this.resetPagination();
        
        // Reload data with new sort
        this.refreshUsers();
      });
    }
  }

  onSearchInput(value: string): void {

    // Use the passed 'value' directly
    this.searchTerm.set(value);
    this.searchSubject.next(value);
  }

  applySearch(searchTerm: string): void {
    this.userService.updateFilters({ 
      search: searchTerm.trim(),
      page: 1
    });
    
    this.resetPagination();
    this.loadUsers(); // Use loadUsers instead of refreshUsers
  }

  onRoleChange(role: string): void {
    this.selectedRole.set(role);
    this.userService.updateFilters({ 
      role: role || undefined,
      page: 1
    });
    
    this.resetPagination();
    this.loadUsers(); // Use loadUsers instead of refreshUsers
  }

   onActiveFilterChange(active: boolean | null): void {
    this.showActiveOnly.set(active);
    this.userService.updateFilters({ 
      isActive: active ?? undefined,
      page: 1
    });
    
    this.resetPagination();
    this.loadUsers(); // Use loadUsers instead of refreshUsers
  }

  onVerifiedFilterChange(verified: boolean | null): void {
    this.showVerifiedOnly.set(verified);
    this.userService.updateFilters({ 
      isVerified: verified ?? undefined,
      page: 1
    });
    
    this.resetPagination();
    this.loadUsers(); // Use loadUsers instead of refreshUsers
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedRole.set('');
    this.showActiveOnly.set(null);
    this.showVerifiedOnly.set(null);
    
    this.userService.clearFilters();
    this.resetPagination();
    this.loadUsers(); // Use loadUsers instead of refreshUsers
  }


  refreshUsers(): void {
    this.isRefreshing.set(true);
    
    // Reset to first page when refreshing
    this.pageIndex = 0;
    
    // Update filters to first page
    this.userService.updateFilters({
      page: 1
    });
    
    // Load users with current filters
    this.loadUsers();
  }

  private resetPagination(): void {
    this.pageIndex = 0;
    
    // Update paginator if it exists
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
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
    const dialogRef = this.dialog.open(EditDisplayNameDialogComponent, {
      width: '500px',
      data: {
        user: user,
        currentDisplayName: user.displayName
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        // Update the user in the local data source
        const updatedUsers = this.dataSource.data.map(u => 
          u._id === result.user._id ? { ...u, displayName: result.displayName } : u
        );
        this.dataSource.data = updatedUsers;
        
        this.showSuccess('Display name updated successfully');
      }
    });
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

  private loadUsers(): void {
    this.isLoading.set(true);
    // Trigger the service to load data with current filters
    this.userService.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchSubject.complete();
  }
}