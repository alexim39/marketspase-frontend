import { Component, inject, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

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
import { UserService } from './user.service';
import { Router } from '@angular/router';

// Interfaces
export interface User {
  _id: string;
  uid: string;
  username: string;
  displayName: string;
  email: string;
  role: 'advertiser' | 'promoter';
  avatar: string;
  rating: number;
  ratingCount: number;
  isActive: boolean;
  isVerified: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  wallets: {
    advertiser: {
      balance: number;
      reserved: number;
    };
    promoter: {
      balance: number;
      reserved: number;
    };
  };
}

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
  ],
  template: `
    <div class="admin-users-container">
      <!-- Header Section -->
      <div class="header-section">
        <h1 class="page-title">User Management</h1>
        <p class="page-subtitle">Manage all users of the platform</p>
      </div>

      <!-- Filters Card -->
      <mat-card class="filters-card">
        <mat-card-content>
          <div class="filters-container">
            <mat-form-field appearance="outline" class="filter-field search-field">
              <mat-label>Search Users</mat-label>
              <input matInput (keyup)="applyFilter($event)" placeholder="Search by name, email, username" #input>
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Users Table -->
      <mat-card class="table-card">
        <mat-card-content>
          <div class="table-container">
            @if (isLoading) {
              <div class="loading-spinner">
                <mat-spinner diameter="40"></mat-spinner>
                <p>Loading users...</p>
              </div>
            } @else {
              <table mat-table [dataSource]="dataSource" matSort class="users-table">
                <!-- Avatar Column -->
                <ng-container matColumnDef="avatar">
                  <th mat-header-cell *matHeaderCellDef> </th>
                  <td mat-cell *matCellDef="let user">
                    <img [src]="user.avatar" alt="User avatar" class="user-avatar">
                  </td>
                </ng-container>

                <!-- Name Column -->
                <ng-container matColumnDef="displayName">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header> Name </th>
                  <td mat-cell *matCellDef="let user">
                    <div class="user-info">
                      <span class="user-name">{{ user.displayName }}</span>
                      <span class="user-username">@{{ user.username }}</span>
                    </div>
                  </td>
                </ng-container>

                <!-- Email Column -->
                <ng-container matColumnDef="email">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header> Email </th>
                  <td mat-cell *matCellDef="let user" class="email-cell">
                    {{ user.email }}
                  </td>
                </ng-container>

                <!-- Role Column -->
                <ng-container matColumnDef="role">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header> Currently </th>
                  <td mat-cell *matCellDef="let user">
                    <mat-chip [class]="user.role" class="role-chip">
                      {{ user.role }}
                    </mat-chip>
                  </td>
                </ng-container>

                <!-- Balance Column -->
                <ng-container matColumnDef="balance">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header> Balance </th>
                  <td mat-cell *matCellDef="let user">
                    <div class="balance-info">
                      <span class="balance-amount">
                        {{ user.role === 'advertiser' ? (user.wallets.advertiser.balance | currency:'NGN':'₦') : (user.wallets.promoter.balance | currency:'NGN':'₦') }}
                      </span>
                    </div>
                  </td>
                </ng-container>

                <!-- Status Column -->
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header> Status </th>
                  <td mat-cell *matCellDef="let user">
                    <div class="status-container">
                      <mat-chip 
                        [class.active]="user.isActive && !user.isDeleted" 
                        [class.inactive]="!user.isActive && !user.isDeleted"
                        [class.deleted]="user.isDeleted"
                        class="status-chip">
                        {{ user.isDeleted ? 'Deleted' : (user.isActive ? 'Active' : 'Inactive') }}
                      </mat-chip>
                      <mat-chip class="verification-chip" *ngIf="user.isVerified && !user.isDeleted">
                        Verified
                      </mat-chip>
                    </div>
                  </td>
                </ng-container>

                <!-- Joined Column -->
                <ng-container matColumnDef="createdAt">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header> Joined </th>
                  <td mat-cell *matCellDef="let user">
                    {{ user.createdAt | date:'mediumDate' }}
                  </td>
                </ng-container>

                <!-- Actions Column -->
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef> Actions </th>
                  <td mat-cell *matCellDef="let user">
                    <div class="action-buttons">
                      <button mat-icon-button 
                              matTooltip="View Details"
                              (click)="viewUserDetails(user)">
                        <mat-icon>visibility</mat-icon>
                      </button>

                     <!--  <button mat-icon-button 
                              matTooltip="{{ user.isActive ? 'Deactivate' : 'Activate' }}"
                              (click)="user.isActive ? deactivateUser(user) : activateUser(user)" 
                              [disabled]="user.isDeleted">
                        <mat-icon>{{ user.isActive ? 'toggle_off' : 'toggle_on' }}</mat-icon>
                      </button> -->
                      
                    </div>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

                <!-- Row shown when there's no matching data -->
                <tr class="mat-row" *matNoDataRow>
                  <td class="mat-cell no-data" [attr.colspan]="displayedColumns.length">
                    No users found matching "{{ input.value }}"
                  </td>
                </tr>
              </table>
            }
          </div>

          <mat-paginator [pageSizeOptions]="[10, 25, 50, 100]" showFirstLastButtons aria-label="Select page of users">
          </mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .admin-users-container {
      padding: 16px;
      max-width: 100%;
      box-sizing: border-box;
      background-color: #e6e6e6ff;
      color: rgba(0, 0, 0, 0.87) !important;
      min-height: 100vh;
    }

    .header-section {
      margin-bottom: 24px;
    }

    .page-title {
      font-size: 24px;
      font-weight: 500;
      margin: 0 0 8px 0;
      color: rgba(0, 0, 0, 0.87);
    }

    .page-subtitle {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.54);
      margin: 0;
    }

    .filters-card {
      margin-bottom: 24px;
      background-color: #ffffff;
    }

    .filters-container {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: center;
    }

    .search-field {
      flex: 1 1 300px;
    }

    .table-card {
      overflow: auto;
      background-color: #ffffff;
    }

    .table-container {
      min-height: 400px;
      position: relative;
    }

    .loading-spinner {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 50px 0;
    }

    .loading-spinner p {
      margin-top: 16px;
      color: rgba(0, 0, 0, 0.54);
    }

    .users-table {
      width: 100%;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
    }

    .user-info {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-weight: 500;
    }

    .user-username {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.54);
    }

    .email-cell {
      word-break: break-all;
    }

    .role-chip {
      font-size: 12px;
      font-weight: 500;
    }

    .role-chip.advertiser {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .role-chip.promoter {
      background-color: #f3e5f5;
      color: #7b1fa2;
    }

    .balance-info {
      display: flex;
      flex-direction: column;
    }

    .balance-amount {
      font-weight: 500;
    }

    .status-container {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .status-chip {
      font-size: 12px;
      font-weight: 500;
    }

    .status-chip.active {
      background-color: #e8f5e9;
      color: #2e7d32;
    }

    .status-chip.inactive {
      background-color: #fff3e0;
      color: #ef6c00;
    }

    .status-chip.deleted {
      background-color: #ffebee;
      color: #c62828;
    }

    .verification-chip {
      background-color: #e8f5e9;
      color: #2e7d32;
      font-size: 10px;
    }

    .action-buttons {
      display: flex;
      gap: 4px;
    }

    .no-data {
      text-align: center;
      padding: 24px;
      color: rgba(0, 0, 0, 0.54);
      font-style: italic;
    }

    .mat-row, .mat-header-row {
      min-height: 56px;
    }

    /* Fix for form fields */
    .mat-form-field-appearance-outline .mat-form-field-outline {
      color: rgba(0, 0, 0, 0.42);
    }

    .mat-form-field-appearance-outline.mat-focused .mat-form-field-outline-thick {
      color: #3f51b5;
    }

    .mat-form-field-label {
      color: rgba(0, 0, 0, 0.6);
    }

    .mat-input-element {
      color: rgba(0, 0, 0, 0.87);
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
      .admin-users-container {
        padding: 8px;
      }

      .filters-container {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }

      .search-field {
        width: 100%;
      }

      .users-table .mat-header-row {
        display: none;
      }

      .users-table .mat-row {
        flex-direction: column;
        align-items: start;
        padding: 8px 0;
        border-bottom: 1px solid #e0e0e0;
      }

      .users-table .mat-cell {
        border: none;
        padding: 4px 16px;
        width: 100%;
        box-sizing: border-box;
      }

      .users-table .mat-cell:before {
        content: attr(data-label);
        float: left;
        font-weight: 500;
        color: rgba(0, 0, 0, 0.54);
        margin-right: 8px;
      }

      .users-table .mat-cell:first-of-type {
        padding-top: 16px;
      }

      .users-table .mat-cell:last-of-type {
        padding-bottom: 16px;
      }

      .users-table .mat-column-actions {
        display: flex;
        justify-content: flex-end;
        width: 100%;
      }
      
      .action-buttons {
        justify-content: flex-end;
        width: 100%;
      }
    }

    /* For desktop - ensure proper table layout */
    @media (min-width: 769px) {
      .users-table .mat-column-avatar {
        width: 60px;
      }

      .users-table .mat-column-displayName {
        min-width: 180px;
      }

      .users-table .mat-column-email {
        min-width: 200px;
      }

      .users-table .mat-column-role {
        width: 120px;
      }

      .users-table .mat-column-balance {
        width: 120px;
      }

      .users-table .mat-column-status {
        width: 140px;
      }

      .users-table .mat-column-createdAt {
        width: 120px;
      }

      .users-table .mat-column-actions {
        width: 200px;
      }
    }
  `],
})
export class UserMgtComponent implements OnInit, OnDestroy {
  readonly adminService = inject(AdminService);
  readonly userService = inject(UserService);
  readonly router = inject(Router);
  private subscriptions: Subscription = new Subscription();

  // Table properties
  displayedColumns: string[] = ['avatar', 'displayName', 'email', 'role', 'balance', 'status', 'createdAt', 'actions'];
  dataSource: MatTableDataSource<User> = new MatTableDataSource<User>([]);
  isLoading = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
    // Initialize the data source with the correct filter predicate
    this.dataSource.filterPredicate = this.createFilter();
  }

  ngOnInit(): void {
    this.adminService.fetchAdmin();

    this.subscriptions.add(
      this.userService.getAppUsers().subscribe({
        next: (response) => {
          if (response.success) {
            this.dataSource.data = response.data;
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
    );
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  createFilter(): (data: User, filter: string) => boolean {
    return (data: User, filter: string): boolean => {
      // If the filter is empty, return true for all items
      if (!filter) return true;
      
      const searchData = filter.toLowerCase();
      return searchData === '' || 
        data.displayName.toLowerCase().includes(searchData) ||
        data.email.toLowerCase().includes(searchData) ||
        data.username.toLowerCase().includes(searchData);
    };
  }

  viewUserDetails(user: User) {
    //console.log('View user details:', user);
    // Implement view details functionality
    this.router.navigate(['dashboard/users', user._id]);
  }

  editUser(user: User) {
    console.log('Edit user:', user);
    // Implement edit user functionality
  }

  activateUser(user: User) {
    console.log('Activate user:', user);
    // Implement activate user functionality
  }

  deactivateUser(user: User) {
    console.log('Deactivate user:', user);
    // Implement deactivate user functionality
  }

  deleteUser(user: User) {
    console.log('Delete user:', user);
    // Implement delete user functionality
  }

  restoreUser(user: User) {
    console.log('Restore user:', user);
    // Implement restore user functionality
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}