import { Component, inject, signal, computed, OnInit, OnDestroy, DestroyRef } from '@angular/core';
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
import { UserService } from '../users.service';
import { MatTableModule } from '@angular/material/table';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserInterface } from '../../../../../shared-services/src/public-api';


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
    MatListModule,
    MatTableModule 
  ],
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.scss']
})
export class UserDetailsComponent implements OnInit {
  private userService = inject(UserService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  // State with signals
  user = signal<UserInterface | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  // Computed values
  userRole = computed(() => this.user()?.role || 'unknown');
  isUserActive = computed(() => this.user()?.isActive && !this.user()?.isDeleted);
  public userIsDeleted = computed(() => !!this.user()?.isDeleted);

  // Define the columns for the Angular Material table
  //public displayedColumns: string[] = ['date', 'description', 'amount', 'status', 'type'];

  // Add 'wallet' to the displayed columns
public displayedColumns: string[] = ['date', 'description', 'amount', 'status', 'type', 'wallet'];

  // A computed signal for the transaction data source
 public dataSource = computed(() => {
  const user = this.user();
  if (!user) return [];
  
  // Combine transactions from both wallets
  const marketerTransactions = user?.wallets?.marketer?.transactions || [];
  const promoterTransactions = user?.wallets?.promoter?.transactions || [];
  
  return [...marketerTransactions, ...promoterTransactions];
});

// Add this computed property for professional info
professionalInfo = computed(() => {
  return this.user()?.professionalInfo || {
    skills: [],
    experience: '',
    education: ''
  };
});


// Add this computed property for interests
interestsInfo = computed(() => {
  return this.user()?.interests || {
    hobbies: [],
    favoriteTopics: []
  };
});

// Add this computed property for payout accounts
payoutAccounts = computed(() => {
  return this.user()?.savedAccounts || [];
});

  private readonly destroyRef = inject(DestroyRef);

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
    this.userService.getUserById(userId).pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (response) => {
        if (response.success) {
          this.user.set(response.data);
          //console.log('user ',response.data)
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

    this.userService.updateUserStatus(userId, newStatus).pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
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

  // Add this computed property
withdrawalTransactions = computed(() => {
  const transactions = this.dataSource();
  return transactions.filter(t => t.category === 'withdrawal' || t.description?.toLowerCase().includes('withdrawal'));
});


}