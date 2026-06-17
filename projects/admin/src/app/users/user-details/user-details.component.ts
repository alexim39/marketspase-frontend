import { Component, inject, signal, computed, OnInit, OnDestroy, DestroyRef, effect, linkedSignal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { UserService } from '../users.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserInterface } from '../../../../../shared-services/src/public-api';
import { EditDisplayNameDialogComponent } from '../edit-display-name-dialog/edit-display-name-dialog.component';

@Component({
  selector: 'app-user-details',
  standalone: true,
  providers: [UserService, DatePipe, CurrencyPipe],
  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe,
    DatePipe,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    MatTabsModule,
    MatSlideToggleModule,
    MatTableModule,
    MatProgressBarModule
  ],
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.scss']
})
export class UserDetailsComponent implements OnInit, OnDestroy {
  private userService = inject(UserService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  user = signal<UserInterface | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  userRole = computed(() => this.user()?.role || 'unknown');
  isUserActive = computed(() => !!(this.user()?.isActive && !this.user()?.isDeleted));
  userIsDeleted = computed(() => !!this.user()?.isDeleted);

  isChecked = linkedSignal({
    source: this.user,
    computation: (user) => !!user?.isMarketingRep
  });

  displayedColumns: string[] = ['date', 'description', 'amount', 'status', 'type', 'wallet'];

  dataSource = computed(() => {
    const user = this.user();
    if (!user) return [];
    const marketerTransactions = user?.wallets?.marketer?.transactions || [];
    const promoterTransactions = user?.wallets?.promoter?.transactions || [];
    return [...marketerTransactions, ...promoterTransactions];
  });

  professionalInfo = computed(() => this.user()?.professionalInfo || { skills: [], experience: '', education: '' });

  interestsInfo = computed(() => this.user()?.interests || { hobbies: [], favoriteTopics: [] });

  payoutAccounts = computed(() => this.user()?.savedAccounts || []);

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
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  });

  get formattedAddress(): string {
    const addr = this.user()?.personalInfo?.address;
    if (!addr) return '—';
    return [addr.street, addr.city, addr.state, addr.country].filter(Boolean).join(', ');
  }

  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    effect(() => {
      const currentUser = this.user();
      if (currentUser) this.isChecked.set(!!currentUser.isMarketingRep);
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.loadUserDetails();
  }

  loadUserDetails(): void {
    const userId = this.route.snapshot.paramMap.get('id');
    if (!userId) { this.error.set('User ID not provided'); this.isLoading.set(false); return; }

    this.isLoading.set(true);
    this.userService.getUserById(userId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        if (response.success) { this.user.set(response.data); }
        else { this.error.set(response.message || 'Failed to load user details'); this.showSnackbar('Failed to load user details', 'error'); }
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

  goBack(): void { this.router.navigate(['dashboard/users']); }

  editUser(user: UserInterface): void {
    const dialogRef = this.dialog.open(EditDisplayNameDialogComponent, {
      width: '500px',
      data: { user, currentDisplayName: user.displayName },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.showSnackbar('Display name updated successfully', 'success');
        this.loadUserDetails();
      }
    });
  }

  toggleUserStatus(): void {
    if (!this.user()) return;
    const newStatus = !this.user()?.isActive;
    const userId = this.user()?._id;
    if (!userId) return;

    this.userService.updateUserStatus(userId, newStatus).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        if (response.success) {
          this.user.update(current => current ? { ...current, isActive: newStatus } : current);
          this.showSnackbar(`User ${newStatus ? 'activated' : 'deactivated'} successfully`, 'success');
        } else { this.showSnackbar('Failed to update user status', 'error'); }
      },
      error: (err) => { this.showSnackbar('An error occurred while updating user status', 'error'); console.error('Error updating user status:', err); }
    });
  }

  onMarketingRepChange(userId: string): void {
    const newValue = this.isChecked();
    this.userService.updateMarketingStatus(newValue, userId).subscribe({
      next: (response: any) => { if (response.success) this.showSnackbar(response.message, 'success'); },
      error: (error: Error) => { console.error('Update failed', error); this.isChecked.set(!newValue); this.showSnackbar('Failed to set user as marketing rep', 'error'); }
    });
  }

  onAvatarError(event: Event): void {
    (event.target as HTMLImageElement).src = '/img/avatar.png';
  }

  private showSnackbar(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.snackBar.open(message, 'Close', { duration: 3000, panelClass: `snackbar-${type}` });
  }

  ngOnDestroy(): void { }
}
