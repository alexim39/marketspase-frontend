import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';

// Services
import { UserService } from './user.service';

// Interfaces
export interface User {
  _id: string;
  uid: string;
  username: string;
  displayName: string;
  email: string;
  authenticationMethod: string;
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
      transactions: any[];
    };
    promoter: {
      balance: number;
      reserved: number;
      transactions: any[];
    };
  };
  professionalInfo: {
    skills: string[];
  };
  interests: {
    hobbies: string[];
    favoriteTopics: string[];
  };
  preferences: {
    notification: boolean;
  };
  testimonials: any[];
  payoutAccounts: any[];
}

@Component({
  selector: 'app-user-details',
  standalone: true,
  providers: [UserService, DatePipe, CurrencyPipe],
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    // Material Modules
    MatCardModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    MatDividerModule,
    MatListModule
  ],
  template: `
    <div class="user-details-container">
      <!-- Header with back button and actions -->
      <div class="header-section">
        <button mat-icon-button (click)="goBack()" class="back-button">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1 class="page-title">User Details</h1>
        <div class="action-buttons">
          <button mat-icon-button [matTooltip]="user()?.isActive ? 'Deactivate User' : 'Activate User'" 
                  (click)="toggleUserStatus()" class="status-button">
            <mat-icon>{{ user()?.isActive ? 'toggle_on' : 'toggle_off' }}</mat-icon>
          </button>
          <button mat-icon-button matTooltip="Edit User" (click)="editUser()" class="edit-button">
            <mat-icon>edit</mat-icon>
          </button>
        </div>
      </div>

      <!-- Main content -->
      @if (isLoading()) {
        <div class="loading-spinner">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Loading user details...</p>
        </div>
      } @else if (user()) {
        <div class="user-content">
          <!-- Profile summary card -->
          <mat-card class="profile-card">
            <mat-card-content>
              <div class="profile-header">
                <img [src]="user()?.avatar" alt="User avatar" class="user-avatar-large">
                <div class="profile-info">
                  <h2 class="user-name">{{ user()?.displayName }}</h2>
                  <p class="user-username">@{{ user()?.username }}</p>
                  <div class="status-badges">
                    <mat-chip class="role-chip" [class]="user()?.role">
                      {{ user()?.role }}
                    </mat-chip>
                    <mat-chip class="status-chip" 
                              [class.active]="user()?.isActive && !user()?.isDeleted" 
                              [class.inactive]="!user()?.isActive && !user()?.isDeleted"
                              [class.deleted]="user()?.isDeleted">
                      {{ user()?.isDeleted ? 'Deleted' : (user()?.isActive ? 'Active' : 'Inactive') }}
                    </mat-chip>
                    <mat-chip class="verification-chip" *ngIf="user()?.isVerified && !user()?.isDeleted">
                      Verified
                    </mat-chip>
                  </div>
                </div>
              </div>

              <mat-divider class="divider"></mat-divider>

              <div class="profile-details">
                <div class="detail-item">
                  <mat-icon class="detail-icon">email</mat-icon>
                  <div class="detail-content">
                    <span class="detail-label">Email</span>
                    <span class="detail-value">{{ user()?.email }}</span>
                  </div>
                </div>

                <div class="detail-item">
                  <mat-icon class="detail-icon">fingerprint</mat-icon>
                  <div class="detail-content">
                    <span class="detail-label">Authentication Method</span>
                    <span class="detail-value">{{ user()?.authenticationMethod || 'Not specified' }}</span>
                  </div>
                </div>

                <div class="detail-item">
                  <mat-icon class="detail-icon">calendar_today</mat-icon>
                  <div class="detail-content">
                    <span class="detail-label">Joined</span>
                    <span class="detail-value">{{ user()?.createdAt | date:'fullDate' }}</span>
                  </div>
                </div>

                <div class="detail-item">
                  <mat-icon class="detail-icon">update</mat-icon>
                  <div class="detail-content">
                    <span class="detail-label">Last Updated</span>
                    <span class="detail-value">{{ user()?.updatedAt | date:'fullDate' }}</span>
                  </div>
                </div>

                <div class="detail-item">
                  <mat-icon class="detail-icon">star</mat-icon>
                  <div class="detail-content">
                    <span class="detail-label">Rating</span>
                    <span class="detail-value">{{ user()?.rating || 0 }} ({{ user()?.ratingCount || 0 }} reviews)</span>
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Tabs for detailed information -->
          <mat-tab-group animationDuration="0ms" class="details-tabs">
            <!-- Wallet Information Tab -->
            <mat-tab label="Wallet">
              <div class="tab-content">
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>Wallet Information</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="wallet-section">
                      <h3>Advertiser Wallet</h3>
                      <mat-list>
                        <mat-list-item>
                          <span matListItemTitle>Available Balance</span>
                          <span matListItemLine>{{ user()?.wallets?.advertiser?.balance | currency:'NGN':'₦' }}</span>
                        </mat-list-item>
                        <mat-list-item>
                          <span matListItemTitle>Reserved Funds</span>
                          <span matListItemLine>{{ user()?.wallets?.advertiser?.reserved | currency:'NGN':'₦' }}</span>
                        </mat-list-item>
                        <mat-list-item>
                          <span matListItemTitle>Transactions</span>
                          <span matListItemLine>{{ user()?.wallets?.advertiser?.transactions?.length || 0 }}</span>
                        </mat-list-item>
                      </mat-list>
                    </div>

                    <mat-divider class="divider"></mat-divider>

                    <div class="wallet-section">
                      <h3>Promoter Wallet</h3>
                      <mat-list>
                        <mat-list-item>
                          <span matListItemTitle>Available Balance</span>
                          <span matListItemLine>{{ user()?.wallets?.promoter?.balance | currency:'NGN':'₦' }}</span>
                        </mat-list-item>
                        <mat-list-item>
                          <span matListItemTitle>Reserved Funds</span>
                          <span matListItemLine>{{ user()?.wallets?.promoter?.reserved | currency:'NGN':'₦' }}</span>
                        </mat-list-item>
                        <mat-list-item>
                          <span matListItemTitle>Transactions</span>
                          <span matListItemLine>{{ user()?.wallets?.promoter?.transactions?.length || 0 }}</span>
                        </mat-list-item>
                      </mat-list>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
            </mat-tab>

            <!-- Professional Information Tab -->
            <mat-tab label="Professional">
              <div class="tab-content">
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>Professional Information</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="skills-section">
                      <h3>Skills</h3>
                      @if (user()?.professionalInfo?.skills?.length) {
                        <div class="chips-container">
                          <mat-chip *ngFor="let skill of user()?.professionalInfo?.skills" class="skill-chip">
                            {{ skill }}
                          </mat-chip>
                        </div>
                      } @else {
                        <p class="no-data">No skills added</p>
                      }
                    </div>

                    <mat-divider class="divider"></mat-divider>

                    <div class="testimonials-section">
                      <h3>Testimonials ({{ user()?.testimonials?.length || 0 }})</h3>
                      @if (user()?.testimonials?.length) {
                        <p>User has {{ user()?.testimonials?.length }} testimonials</p>
                      } @else {
                        <p class="no-data">No testimonials yet</p>
                      }
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
            </mat-tab>

            <!-- Interests Tab -->
            <mat-tab label="Interests">
              <div class="tab-content">
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>Interests & Preferences</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="interests-section">
                      <h3>Hobbies</h3>
                      @if (user()?.interests?.hobbies?.length) {
                        <div class="chips-container">
                          <mat-chip *ngFor="let hobby of user()?.interests?.hobbies" class="interest-chip">
                            {{ hobby }}
                          </mat-chip>
                        </div>
                      } @else {
                        <p class="no-data">No hobbies listed</p>
                      }
                    </div>

                    <mat-divider class="divider"></mat-divider>

                    <div class="topics-section">
                      <h3>Favorite Topics</h3>
                      @if (user()?.interests?.favoriteTopics?.length) {
                        <div class="chips-container">
                          <mat-chip *ngFor="let topic of user()?.interests?.favoriteTopics" class="topic-chip">
                            {{ topic }}
                          </mat-chip>
                        </div>
                      } @else {
                        <p class="no-data">No favorite topics listed</p>
                      }
                    </div>

                    <mat-divider class="divider"></mat-divider>

                    <div class="preferences-section">
                      <h3>Preferences</h3>
                      <mat-list>
                        <mat-list-item>
                          <mat-icon matListItemIcon>notifications</mat-icon>
                          <span matListItemTitle>Notifications</span>
                          <span matListItemLine>{{ user()?.preferences?.notification ? 'Enabled' : 'Disabled' }}</span>
                        </mat-list-item>
                      </mat-list>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
            </mat-tab>

            <!-- Payout Accounts Tab -->
            <mat-tab label="Payouts">
              <div class="tab-content">
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>Payout Accounts</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    @if (user()?.payoutAccounts?.length) {
                      <p>User has {{ user()?.payoutAccounts?.length }} payout accounts configured</p>
                    } @else {
                      <p class="no-data">No payout accounts configured</p>
                    }
                  </mat-card-content>
                </mat-card>
              </div>
            </mat-tab>
          </mat-tab-group>
        </div>
      } @else {
        <div class="error-state">
          <mat-icon class="error-icon">error_outline</mat-icon>
          <h3>User not found</h3>
          <p>We couldn't find the user you're looking for.</p>
          <button mat-raised-button color="primary" (click)="goBack()">Back to Users</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .user-details-container {
      padding: 16px;
      //max-width: 1200px;
      margin: 0 auto;
      box-sizing: border-box;
      min-height: 100vh;
      background-color: #e6e6e6ff;
      color: rgba(0, 0, 0, 0.87) !important;
    }

    .header-section {
      display: flex;
      align-items: center;
      margin-bottom: 24px;
      gap: 16px;
    }

    .back-button {
      background-color: #f5f5f5;
    }

    .page-title {
      font-size: 24px;
      font-weight: 500;
      margin: 0;
      flex: 1;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
    }

    .status-button, .edit-button {
      background-color: #f5f5f5;
    }

    .loading-spinner {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 100px 0;
    }

    .loading-spinner p {
      margin-top: 16px;
      color: rgba(0, 0, 0, 0.54);
    }

    .user-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .profile-card {
      margin-bottom: 16px;
    }

    .profile-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }

    .user-avatar-large {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      object-fit: cover;
    }

    .profile-info {
      flex: 1;
    }

    .user-name {
      font-size: 24px;
      font-weight: 500;
      margin: 0 0 4px 0;
    }

    .user-username {
      color: rgba(0, 0, 0, 0.6);
      margin: 0 0 12px 0;
    }

    .status-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
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
      font-size: 12px;
    }

    .divider {
      margin: 16px 0;
    }

    .profile-details {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .detail-icon {
      color: rgba(0, 0, 0, 0.54);
    }

    .detail-content {
      display: flex;
      flex-direction: column;
    }

    .detail-label {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
    }

    .detail-value {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.87);
    }

    .details-tabs {
      width: 100%;
    }

    .tab-content {
      padding: 16px 0;
    }

    .wallet-section, .skills-section, .testimonials-section, 
    .interests-section, .topics-section, .preferences-section {
      margin-bottom: 16px;
    }

    .chips-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .skill-chip, .interest-chip, .topic-chip {
      font-size: 12px;
    }

    .skill-chip {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .interest-chip {
      background-color: #f3e5f5;
      color: #7b1fa2;
    }

    .topic-chip {
      background-color: #e8f5e9;
      color: #2e7d32;
    }

    .no-data {
      color: rgba(0, 0, 0, 0.54);
      font-style: italic;
      margin: 8px 0;
    }

    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
    }

    .error-icon {
      font-size: 60px;
      width: 60px;
      height: 60px;
      color: rgba(0, 0, 0, 0.54);
      margin-bottom: 16px;
    }

    .error-state h3 {
      margin: 0 0 8px 0;
      color: rgba(0, 0, 0, 0.87);
    }

    .error-state p {
      margin: 0 0 24px 0;
      color: rgba(0, 0, 0, 0.6);
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
      .user-details-container {
        padding: 8px;
      }

      .header-section {
        flex-wrap: wrap;
      }

      .page-title {
        font-size: 20px;
      }

      .profile-header {
        flex-direction: column;
        text-align: center;
      }

      .status-badges {
        justify-content: center;
      }

      .detail-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .detail-icon {
        align-self: center;
      }
    }
  `]
})
export class UserDetailsComponent implements OnInit {
  private userService = inject(UserService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  // State with signals
  user = signal<User | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  // Computed values
  userRole = computed(() => this.user()?.role || 'unknown');
  isUserActive = computed(() => this.user()?.isActive && !this.user()?.isDeleted);

  ngOnInit(): void {
    this.loadUserDetails();
  }

  loadUserDetails(): void {
    const userId = this.route.snapshot.paramMap.get('id');
    
    if (!userId) {
      this.error.set('User ID not provided');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.userService.getUserById(userId).subscribe({
      next: (response) => {
        if (response.success) {
          this.user.set(response.data);
        } else {
          this.error.set(response.message || 'Failed to load user details');
          this.showSnackbar('Failed to load user details', 'error');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('An error occurred while loading user details');
        this.showSnackbar('An error occurred while loading user details', 'error');
        this.isLoading.set(false);
        console.error('Error loading user details:', err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['dashboard/users']);
  }

  editUser(): void {
    // Implement edit functionality
    this.showSnackbar('Edit user functionality coming soon', 'info');
  }

  toggleUserStatus(): void {
    if (!this.user()) return;

    const newStatus = !this.user()?.isActive;
    const userId = this.user()?._id;

    if (!userId) return;

    this.userService.updateUserStatus(userId, newStatus).subscribe({
      next: (response) => {
        if (response.success) {
          // Update local state
          this.user.update(current => {
            if (current) {
              return { ...current, isActive: newStatus };
            }
            return current;
          });
          
          this.showSnackbar(
            `User ${newStatus ? 'activated' : 'deactivated'} successfully`, 
            'success'
          );
        } else {
          this.showSnackbar('Failed to update user status', 'error');
        }
      },
      error: (err) => {
        this.showSnackbar('An error occurred while updating user status', 'error');
        console.error('Error updating user status:', err);
      }
    });
  }

  private showSnackbar(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: `snackbar-${type}`
    });
  }
}