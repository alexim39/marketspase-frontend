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

import { AdminService } from '../../common/services/user.service';
import { UserService } from '../users.service';
import { UserInterface } from '../../../../../shared-services/src/public-api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { EditDisplayNameDialogComponent } from '../edit-display-name-dialog/edit-display-name-dialog.component';
@Component({
  selector: 'admin-marketers-mgt',
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
    MatProgressBarModule
  ],
  templateUrl: './marketer-users.component.html',
  styleUrls: ['./marketer-users.component.scss'],
})
export class MarketerUserMgtComponent implements OnInit, OnDestroy {
  readonly adminService = inject(AdminService);
  readonly userService = inject(UserService);
  readonly router = inject(Router);
  readonly snackBar = inject(MatSnackBar);

  readonly users = signal<UserInterface[]>([]);

  readonly isLoading = signal(true);
  readonly searchTerm = signal('');
  readonly showActiveOnly = signal<boolean | null>(null);
  readonly showVerifiedOnly = signal<boolean | null>(null);

  readonly totalUsers = signal(0);
  readonly pageSize = signal(50);
  readonly currentPage = signal(1);
  readonly totalPages = signal(0);
  readonly pageSizeOptions = [25, 50, 100, 200];

  readonly sortField = signal<string>('createdAt');
  readonly sortDirection = signal<'asc' | 'desc'>('desc');

  readonly roleStats = signal<{
    counts: { total: number; active: number; inactive: number; verified: number; unverified: number; deleted: number; recent: number };
    financial: { totalBalance: number; averageBalance: number; currency: string };
    engagement: { averageRating: number; totalRatings: number; percentageRated: number };
    activity: { totalReferrals: number; totalEarned: number };
  } | null>(null);
  readonly statsLoading = signal(false);

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

  ngOnInit(): void {
    this.adminService.fetchAdmin();
    this.setupSearchListener();
    this.loadRoleStats();
    this.loadMarketers();
  }

  private setupSearchListener(): void {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(searchTerm => {
      this.currentPage.set(1);
      this.loadMarketers();
    });
  }

  private loadRoleStats(): void {
    this.statsLoading.set(true);
    this.userService.getStatsByRole('marketer').pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        if (response.success) {
          this.roleStats.set(response.data as any);
        }
        this.statsLoading.set(false);
      },
      error: () => this.statsLoading.set(false)
    });
  }

  loadMarketers(): void {
    this.isLoading.set(true);

    const filters: any = {
      page: this.currentPage(),
      limit: this.pageSize(),
      sort: this.sortDirection() === 'desc' ? `-${this.sortField()}` : this.sortField(),
    };

    if (this.searchTerm()) filters.search = this.searchTerm();
    if (this.showActiveOnly() !== null) filters.isActive = this.showActiveOnly();
    if (this.showVerifiedOnly() !== null) filters.isVerified = this.showVerifiedOnly();

    this.userService.getUsersByRole('marketer', filters).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        if (response.success) {
          this.users.set(response.data.users);
          this.totalUsers.set(response.data.pagination.total);
          this.totalPages.set(response.data.pagination.totalPages || 1);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.showError('Failed to load marketers');
      }
    });
  }

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
    this.searchSubject.next(value);
  }

  onActiveFilterChange(active: boolean | null): void {
    this.showActiveOnly.set(active);
    this.currentPage.set(1);
    this.loadMarketers();
  }

  onVerifiedFilterChange(verified: boolean | null): void {
    this.showVerifiedOnly.set(verified);
    this.currentPage.set(1);
    this.loadMarketers();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.showActiveOnly.set(null);
    this.showVerifiedOnly.set(null);
    this.currentPage.set(1);
    this.loadMarketers();
  }

  toggleSort(field: string): void {
    if (this.sortField() === field) {
      this.sortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set('desc');
    }
    this.currentPage.set(1);
    this.loadMarketers();
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
      data: { user, currentDisplayName: user.displayName },
      disableClose: true
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result?.success) {
        const updated = this.users().map(u =>
          u._id === result.user._id ? { ...u, displayName: result.displayName } : u
        );
        this.users.set(updated);
        this.showSuccess('Display name updated successfully');
      }
    });
  }

  activateUser(user: UserInterface): void {
    this.userService.updateUserStatus(user._id, true).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.showSuccess('User activated'); this.loadMarketers(); this.loadRoleStats(); },
      error: () => this.showError('Failed to activate user')
    });
  }

  deactivateUser(user: UserInterface): void {
    this.userService.updateUserStatus(user._id, false).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.showSuccess('User deactivated'); this.loadMarketers(); this.loadRoleStats(); },
      error: () => this.showError('Failed to deactivate user')
    });
  }

  goToPage(page: number): void {
    const target = Math.max(1, Math.min(page, Math.max(1, this.totalPages())));
    if (target === this.currentPage()) return;
    this.currentPage.set(target);
    this.loadMarketers();
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
    this.loadMarketers();
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
