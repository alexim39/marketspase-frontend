import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { debounceTime, Subject } from 'rxjs';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { StoreService } from '../store.service';
import { Store } from '../shared/store.model';
import { ConfirmationDialogComponent } from '../shared/confirmation-dialog/confirmation-dialog.component';
import { StoreDetailDialogComponent } from './store-detail-dialog/store-detail-dialog.component';
import { StoreEditDialogComponent } from './store-edit-dialog/store-edit-dialog.component';
import { StoreAnalyticsDialogComponent } from './store-analytics-dialog/store-analytics-dialog.component';
import { User } from '../shared/user.model';


@Component({
  selector: 'admin-store-mgt',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatMenuModule,
    MatProgressBarModule
  ],
  providers: [StoreService],
  templateUrl: './store-management.component.html',
  styleUrl: './store-management.component.scss',
})
export class StoreManagementComponent implements OnInit {
  private storeService = inject(StoreService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  readonly router = inject(Router);

  // State with signals
  readonly stores = signal<Store[]>([]);
  readonly users = signal<User[]>([]);
  readonly isLoading = signal(true);
  readonly isLoadingUsers = signal(false);

  // Filter signals
  readonly searchQuery = signal('');
  readonly verificationFilter = signal('all');
  readonly categoryFilter = signal('all');
  readonly dateRangeFilter = signal<{start: Date | null, end: Date | null}>({ start: null, end: null });

  // Pagination
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  readonly totalStores = signal(0);
  readonly totalPages = signal(0);
  readonly pageSizeOptions = [10, 25, 50, 100];

  // Sort
  readonly sortField = signal('createdAt');
  readonly sortDirection = signal<'asc' | 'desc'>('desc');

  // Statistics
  readonly stats = signal({
    totalStores: 0,
    activeStores: 0,
    verifiedStores: 0,
    totalProducts: 0,
    totalRevenue: 0
  });

  // Available categories
  readonly categories = signal<string[]>([]);

  // For debounced search
  private searchSubject = new Subject<string>();

  // Export state
  readonly isExporting = signal(false);

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
    this.loadCategories();
    this.loadStatistics();
    this.loadUsers();
    this.loadStores();

    this.searchSubject.pipe(debounceTime(500)).subscribe(() => {
      this.currentPage.set(1);
      this.loadStores();
    });
  }

  loadStores(): void {
    this.isLoading.set(true);

    const params: any = {
      page: this.currentPage(),
      limit: this.pageSize(),
      sortBy: this.sortField(),
      sortOrder: this.sortDirection()
    };

    if (this.searchQuery()) params.search = this.searchQuery();
    if (this.verificationFilter() !== 'all') params.verification = this.verificationFilter();
    if (this.categoryFilter() !== 'all') params.category = this.categoryFilter();
    if (this.dateRangeFilter().start) params.startDate = this.dateRangeFilter().start;
    if (this.dateRangeFilter().end) params.endDate = this.dateRangeFilter().end;

    this.storeService.getStores(params).subscribe({
      next: (response) => {
        this.stores.set(response.data || []);
        this.totalStores.set(response.pagination?.total || 0);
        this.totalPages.set(response.pagination?.pages || 1);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading stores:', error);
        this.isLoading.set(false);
        this.showSnackbar('Failed to load stores', 'error');
      }
    });
  }

  loadCategories(): void {
    this.storeService.getStores({ limit: 100 }).subscribe({
      next: (response) => {
        const categoriesSet = new Set<string>();
        response.data.forEach(store => {
          if (store.category) categoriesSet.add(store.category);
        });
        this.categories.set(Array.from(categoriesSet));
      },
      error: (error) => console.error('Error loading categories:', error)
    });
  }

  loadUsers(): void {
    this.isLoadingUsers.set(true);
    this.storeService.getStoreOwners().subscribe({
      next: (response) => {
        this.users.set(response.data || []);
        this.isLoadingUsers.set(false);
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.isLoadingUsers.set(false);
      }
    });
  }

  loadStatistics(): void {
    this.storeService.getStoreStatistics().subscribe({
      next: (stats) => this.stats.set(stats),
      error: (error) => console.error('Error loading statistics:', error)
    });
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.searchSubject.next(value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.currentPage.set(1);
    this.loadStores();
  }

  setVerificationFilter(value: string): void {
    this.verificationFilter.set(value);
    this.currentPage.set(1);
    this.loadStores();
  }

  toggleVerificationFilter(value: string): void {
    this.setVerificationFilter(this.verificationFilter() === value ? 'all' : value);
  }

  onCategoryFilterChange(value: string): void {
    this.categoryFilter.set(value);
    this.currentPage.set(1);
    this.loadStores();
  }

  onDateStartChange(value: string): void {
    const start = value ? new Date(value) : null;
    this.dateRangeFilter.set({ start, end: this.dateRangeFilter().end });
    this.currentPage.set(1);
    this.loadStores();
  }

  onDateEndChange(value: string): void {
    const end = value ? new Date(value) : null;
    this.dateRangeFilter.set({ start: this.dateRangeFilter().start, end });
    this.currentPage.set(1);
    this.loadStores();
  }

  getOwnerName(store: Store): string {
    if (store.owner?.name) return store.owner.name;
    if (store.owner?.email) return store.owner.email;
    return 'Unknown Owner';
  }

  toggleSort(field: string): void {
    if (this.sortField() === field) {
      this.sortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set('desc');
    }
    this.currentPage.set(1);
    this.loadStores();
  }

  getSortIndicator(field: string): string {
    if (this.sortField() !== field) return '';
    return this.sortDirection() === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  viewStoreDetails(store: Store): void {
    this.dialog.open(StoreDetailDialogComponent, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: { store }
    });
  }

  editStore(store: Store): void {
    const dialogRef = this.dialog.open(StoreEditDialogComponent, {
      width: '600px',
      data: { store, users: this.users() }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadStores();
        this.showSnackbar('Store updated successfully', 'success');
      }
    });
  }

  toggleStoreVerification(store: Store): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: store.isVerified ? 'Unverify Store' : 'Verify Store',
        message: store.isVerified
          ? 'Are you sure you want to remove verification from this store?'
          : 'Are you sure you want to verify this store? This will grant the store additional privileges.'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.storeService.toggleStoreVerification(store._id, !store.isVerified)
          .subscribe({
            next: () => {
              this.loadStores();
              this.loadStatistics();
              this.showSnackbar(
                store.isVerified ? 'Store unverified successfully' : 'Store verified successfully',
                'success'
              );
            },
            error: (error) => {
              console.error('Error toggling store verification:', error);
              this.showSnackbar('Failed to update store verification', 'error');
            }
          });
      }
    });
  }

  toggleStoreActive(store: Store): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: store.isActive ? 'Deactivate Store' : 'Activate Store',
        message: store.isActive
          ? 'Are you sure you want to deactivate this store? The store will not be accessible to users.'
          : 'Are you sure you want to activate this store?'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.storeService.toggleStoreActive(store._id, !store.isActive)
          .subscribe({
            next: () => {
              this.loadStores();
              this.loadStatistics();
              this.showSnackbar(
                store.isActive ? 'Store deactivated successfully' : 'Store activated successfully',
                'success'
              );
            },
            error: (error) => {
              console.error('Error toggling store active status:', error);
              this.showSnackbar('Failed to update store status', 'error');
            }
          });
      }
    });
  }

  upgradeToPremium(store: Store): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Upgrade to Premium',
        message: 'Are you sure you want to upgrade this store to premium tier? This will enable additional features and analytics.'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.storeService.upgradeStoreTier(store._id, 'premium')
          .subscribe({
            next: () => {
              this.loadStores();
              this.showSnackbar('Store upgraded to premium successfully', 'success');
            },
            error: (error) => {
              console.error('Error upgrading store tier:', error);
              this.showSnackbar('Failed to upgrade store tier', 'error');
            }
          });
      }
    });
  }

  viewStoreAnalytics(store: Store): void {
    this.dialog.open(StoreAnalyticsDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { store }
    });
  }

  deleteStore(store: Store): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Delete Store',
        message: 'Are you sure you want to delete this store? This will also delete all associated products and campaigns. This action cannot be undone.'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.storeService.deleteStore(store._id)
          .subscribe({
            next: () => {
              this.loadStores();
              this.loadStatistics();
              this.showSnackbar('Store deleted successfully', 'success');
            },
            error: (error) => {
              console.error('Error deleting store:', error);
              this.showSnackbar('Failed to delete store', 'error');
            }
          });
      }
    });
  }

  exportStores(format: 'csv' | 'excel' = 'csv'): void {
    this.isExporting.set(true);
    const storesToExport = this.stores();
    this.storeService.exportStores(format, storesToExport)
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `stores_export_${new Date().toISOString().split('T')[0]}.${format}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          this.isExporting.set(false);
          this.showSnackbar(`Stores exported as ${format.toUpperCase()} successfully`, 'success');
        },
        error: (error) => {
          console.error('Error exporting stores:', error);
          this.isExporting.set(false);
          this.showSnackbar('Failed to export stores', 'error');
        }
      });
  }

  refreshData(): void {
    this.currentPage.set(1);
    this.loadStores();
    this.loadStatistics();
    this.showSnackbar('Data refreshed successfully', 'success');
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.verificationFilter.set('all');
    this.categoryFilter.set('all');
    this.dateRangeFilter.set({ start: null, end: null });
    this.currentPage.set(1);
    this.loadStores();
  }

  goToPage(page: number): void {
    const target = Math.max(1, Math.min(page, Math.max(1, this.totalPages())));
    if (target === this.currentPage()) return;
    this.currentPage.set(target);
    this.loadStores();
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
    this.loadStores();
  }

  onStoreLogoError(event: Event): void {
    (event.target as HTMLImageElement).src = '/img/store-default.png';
  }

  onOwnerAvatarError(event: Event): void {
    (event.target as HTMLImageElement).src = '/img/avatar.png';
  }

  viewStoreProducts(store: Store): void {
    this.router.navigate(['/dashboard/stores/products', store._id]);
  }

  private showSnackbar(message: string, type: 'success' | 'error' | 'info' | 'warning'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: `snackbar-${type}`
    });
  }
}
