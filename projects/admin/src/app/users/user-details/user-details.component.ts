import { Component, inject, signal, computed, OnInit, OnDestroy, DestroyRef, effect, linkedSignal } from '@angular/core';
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
import { EditDisplayNameDialogComponent } from '../edit-display-name-dialog/edit-display-name-dialog.component';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule} from '@angular/forms';

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
    MatTableModule,
    MatSlideToggleModule,
    FormsModule,
    ReactiveFormsModule
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

  isChecked = linkedSignal({
    source: this.user,
    computation: (user) => !!user?.isMarketingRep
  });

  // Add 'wallet' to the displayed columns
  public displayedColumns: string[] = ['date', 'description', 'amount', 'status', 'type', 'wallet'];

  constructor() {
    effect(() => {
      // Read the user signal
      const currentUser = this.user();
      //console.log('current user ',currentUser)
      // Update the toggle state based on the user's current status
      if (currentUser) {
        this.isChecked.set(!!currentUser.isMarketingRep);
      }
    }, { allowSignalWrites: true }); 
  }

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
         const updatedUsers = this.dataSource().map(u => 
           u._id === result.user._id ? { ...u, displayName: result.displayName } : u
         );

         
         //this.showSuccess('Display name updated successfully');
         
         // Optional: Refresh the user list to get the latest data
         //this.refreshUsers();
       }
     });
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


  userAge = computed(() => {
    const dob = this.user()?.personalInfo?.dob;
    if (!dob) return null;
    
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Adjust age if birthday hasn't occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  });

  // Returns formatted address from user().personalInfo.address
  get formattedAddress(): string {
    const addr = this.user()?.personalInfo?.address;
    if (!addr) return '—';
    return [addr.street, addr.city, addr.state, addr.country].filter(Boolean).join(', ');
  }

  onMarketingRepChange(userId: string) {
    // Access the current value of the signal
    const newValue = this.isChecked(); 
    
    // Call your backend service
    this.userService.updateMarketingStatus(newValue, userId).subscribe({
      // Removed extra parentheses from parameters
      next: (response: any) => {
        if (response.success) {
          this.showSnackbar(response.message, 'success');
        }
      },
      error: (error: Error) => {
        console.error('Update failed', error);
        // Optional: Rollback the toggle if the backend call fails
        this.isChecked.set(!newValue);
        this.showSnackbar('Failed to set user as marketing rep', 'error');
      }
    });
  }


}