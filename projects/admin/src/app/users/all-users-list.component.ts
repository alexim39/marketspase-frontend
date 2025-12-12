import { Component, inject, OnInit, OnDestroy, ViewChild, DestroyRef, AfterViewInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

// Angular Material imports
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';

// Services
import { AdminService } from '../common/services/user.service';
import { UserService } from './users.service';
import { Router } from '@angular/router';
import { UserInterface } from '../../../../shared-services/src/public-api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RoleStatisticsComponent } from './statistics/statistics.component';

@Component({
  selector: 'admin-user-mgt',
  standalone: true,
  providers: [UserService],
  imports: [
    CommonModule,
    ReactiveFormsModule,
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
    RoleStatisticsComponent
  ],
  templateUrl: './all-users-list.component.html',
  styleUrls: ['./all-users-list.component.scss'],
})
export class AllUsersListComponent implements OnInit, AfterViewInit {
  readonly adminService = inject(AdminService);
  readonly userService = inject(UserService);
  readonly router = inject(Router);

  // Table properties
  displayedColumns: string[] = ['avatar', 'displayName', 'email', 'role', 'balance', 'status', 'createdAt', 'updatedAt', 'actions'];
  dataSource: MatTableDataSource<UserInterface> = new MatTableDataSource<UserInterface>([]);
  isLoading = true;

    // Statistics toggle state
  showStatistics = signal(false);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    // Initialize the data source with the correct filter predicate
    this.dataSource.filterPredicate = this.createFilter();
  }

  ngOnInit(): void {
    this.adminService.fetchAdmin();

    this.userService.getAppUsers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.dataSource.data = response.data;
            //console.log('Fetched app users:', response.data);
            this.isLoading = false;
          } else {
            console.error('Failed to fetch app users:', response.message);
            this.isLoading = false;
          }
        },
        error: (error) => {
          console.error('Error fetching app users:', error);
          this.isLoading = false;
        }
      })
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  /**
   * Toggle statistics visibility
   */
  toggleStatistics(): void {
    const newValue = !this.showStatistics();
    this.showStatistics.set(newValue);
    
    // Save preference to localStorage
    localStorage.setItem('showUserStatistics', JSON.stringify(newValue));
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    
    // Ensure filterValue is trimmed and in lowercase
    const trimmedFilter = filterValue.trim().toLowerCase();
    this.dataSource.filter = trimmedFilter;

    // Reset paginator to first page
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  createFilter(): (data: UserInterface, filter: string) => boolean {
    return (data: UserInterface, filter: string): boolean => {
      // If the filter is empty, return true for all items
      if (!filter || filter.trim() === '') return true;
      
      const searchData = filter.toLowerCase().trim();
      
      // Check if any of the user properties contain the search term
      return (
        (data.displayName?.toLowerCase() || '').includes(searchData) ||
        (data.email?.toLowerCase() || '').includes(searchData) ||
        (data.username?.toLowerCase() || '').includes(searchData)
      );
    };
  }

  viewUserDetails(user: UserInterface) {
    this.router.navigate(['dashboard/users', user._id]);
  }

  editUser(user: UserInterface) {
    console.log('Edit user:', user);
    // Implement edit user functionality
  }

  activateUser(user: UserInterface) {
    console.log('Activate user:', user);
    // Implement activate user functionality
  }

  deactivateUser(user: UserInterface) {
    console.log('Deactivate user:', user);
    // Implement deactivate user functionality
  }

  deleteUser(user: UserInterface) {
    console.log('Delete user:', user);
    // Implement delete user functionality
  }

  restoreUser(user: UserInterface) {
    console.log('Restore user:', user);
    // Implement restore user functionality
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }
}