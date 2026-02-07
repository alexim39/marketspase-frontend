import { Component, OnInit, signal, computed, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, PageEvent, MatPaginator } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { Router, RouterModule } from '@angular/router';

import { StoreService } from '../store.service';
import { Store } from '../shared/store.model';
import { ConfirmationDialogComponent } from '../shared/confirmation-dialog/confirmation-dialog.component';
import { StoreDetailDialogComponent } from './store-detail-dialog/store-detail-dialog.component';
import { StoreEditDialogComponent } from './store-edit-dialog/store-edit-dialog.component';
import { StoreAnalyticsDialogComponent } from './store-analytics-dialog/store-analytics-dialog.component';
import { User } from '../shared/user.model';
import { TruncatePipe } from '../shared/truncate.pipe';
@Component({
  selector: 'admin-store-mgt',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    MatCardModule,
    MatMenuModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
    MatTabsModule,
    RouterModule,
    TruncatePipe
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
  stores = signal<Store[]>([]);
  users = signal<User[]>([]);
  isLoading = signal(true);
  isLoadingUsers = signal(false);
  searchQuery = signal('');
  statusFilter = signal('all');
  verificationFilter = signal('all');
  categoryFilter = signal('all');
  dateRangeFilter = signal<{start: Date | null, end: Date | null}>({ start: null, end: null });
  
  // Table data source
  dataSource = new MatTableDataSource<Store>([]);
  displayedColumns: string[] = ['store', 'owner', 'category', 'verification', 'analytics', 'products', 'date', 'actions'];
  
  // Pagination
  pageSize = signal(10);
  pageIndex = signal(0);
  totalStores = signal(0);
  
  // Statistics
  stats = signal({
    totalStores: 0,
    activeStores: 0,
    verifiedStores: 0,
    totalProducts: 0,
    totalRevenue: 0
  });
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Computed values
  filteredStores = computed(() => {
    let filtered = this.stores();
    
    // Apply search filter
    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      filtered = filtered.filter(store => 
        store.name.toLowerCase().includes(query) ||
        store.description?.toLowerCase().includes(query) ||
        store.storeLink.toLowerCase().includes(query) ||
        store.owner?.name?.toLowerCase().includes(query) ||
        store.owner?.email?.toLowerCase().includes(query)
      );
    }
    
    // Apply verification filter
    if (this.verificationFilter() !== 'all') {
      filtered = filtered.filter(store => {
        if (this.verificationFilter() === 'verified') return store.isVerified;
        if (this.verificationFilter() === 'unverified') return !store.isVerified;
        if (this.verificationFilter() === 'premium') return store.verificationTier === 'premium';
        return true;
      });
    }
    
    // Apply category filter
    if (this.categoryFilter() !== 'all') {
      filtered = filtered.filter(store => store.category === this.categoryFilter());
    }
    
    // Apply date range filter
    const { start, end } = this.dateRangeFilter();
    if (start && end) {
      filtered = filtered.filter(store => {
        const storeDate = new Date(store.createdAt);
        return storeDate >= start && storeDate <= end;
      });
    }
    
    return filtered;
  });

  // Available categories (extracted from stores)
  categories = computed(() => {
    const categories = new Set<string>();
    this.stores().forEach(store => {
      if (store.category) categories.add(store.category);
    });
    return Array.from(categories);
  });

  ngOnInit(): void {
    this.loadStores();
    this.loadStatistics();
    this.loadUsers();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  async loadStores(): Promise<void> {
    try {
      this.isLoading.set(true);
      this.storeService.getStores().subscribe({
        next: (response) => {
          console.log('Stores loaded:', response.data);
          this.stores.set(response.data || []);
          this.applyFilters();
          this.isLoading.set(false);
          this.updateStats();
        },
        error: (error) => {
          console.error('Error loading stores:', error);
          this.isLoading.set(false);
          this.showSnackbar('Failed to load stores', 'error');
        }
      });
    } catch (error) {
      console.error('Error loading stores:', error);
      this.isLoading.set(false);
      this.showSnackbar('Failed to load stores', 'error');
    }
  }

  async loadUsers(): Promise<void> {
    try {
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
    } catch (error) {
      console.error('Error loading users:', error);
      this.isLoadingUsers.set(false);
    }
  }

  async loadStatistics(): Promise<void> {
    this.storeService.getStoreStatistics().subscribe({
      next: (stats) => {
        this.stats.set(stats);
      },
      error: (error) => {
        console.error('Error loading statistics:', error);
      }
    });
  }

  updateStats(): void {
    const stores = this.stores();
    const stats = {
      totalStores: stores.length,
      activeStores: stores.filter(s => s.isActive).length,
      verifiedStores: stores.filter(s => s.isVerified).length,
      totalProducts: stores.reduce((sum, store) => sum + (store.storeProducts?.length || 0), 0),
      totalRevenue: stores.reduce((sum, store) => sum + (store.analytics?.totalSales || 0), 0)
    };
    this.stats.set(stats);
  }

  applyFilters(): void {
    const filtered = this.filteredStores();
    this.dataSource.data = filtered;
    this.totalStores.set(filtered.length);
    
    // Reset paginator to first page
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.pageIndex.set(0);
  }

  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
    this.applyFilters();
  }

  onVerificationFilterChange(event: any): void {
    this.verificationFilter.set(event.value);
    this.applyFilters();
  }

  onCategoryFilterChange(event: any): void {
    this.categoryFilter.set(event.value);
    this.applyFilters();
  }

  onDateRangeChange(start: Date | null, end: Date | null): void {
    this.dateRangeFilter.set({ start, end });
    this.applyFilters();
  }

  onPageChange(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
  }

  getOwnerName(store: Store): string {
    if (store.owner?.name) return store.owner.name;
    if (store.owner?.email) return store.owner.email;
    return 'Unknown Owner';
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
      data: { 
        store,
        users: this.users()
      }
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
            next: (updatedStore) => {
              const index = this.stores().findIndex(s => s._id === store._id);
              if (index !== -1) {
                const updatedStores = [...this.stores()];
                updatedStores[index] = updatedStore;
                this.stores.set(updatedStores);
                this.applyFilters();
                this.updateStats();
                this.showSnackbar(
                  store.isVerified ? 'Store unverified successfully' : 'Store verified successfully',
                  'success'
                );
              }
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
            next: (updatedStore) => {
              const index = this.stores().findIndex(s => s._id === store._id);
              if (index !== -1) {
                const updatedStores = [...this.stores()];
                updatedStores[index] = updatedStore;
                this.stores.set(updatedStores);
                this.applyFilters();
                this.updateStats();
                this.showSnackbar(
                  store.isActive ? 'Store deactivated successfully' : 'Store activated successfully',
                  'success'
                );
              }
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
            next: (updatedStore) => {
              const index = this.stores().findIndex(s => s._id === store._id);
              if (index !== -1) {
                const updatedStores = [...this.stores()];
                updatedStores[index] = updatedStore;
                this.stores.set(updatedStores);
                this.applyFilters();
                this.showSnackbar('Store upgraded to premium successfully', 'success');
              }
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
              const updatedStores = this.stores().filter(s => s._id !== store._id);
              this.stores.set(updatedStores);
              this.applyFilters();
              this.updateStats();
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
    this.storeService.exportStores(format, this.filteredStores())
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
          this.showSnackbar(`Stores exported as ${format.toUpperCase()} successfully`, 'success');
        },
        error: (error) => {
          console.error('Error exporting stores:', error);
          this.showSnackbar('Failed to export stores', 'error');
        }
      });
  }

  refreshData(): void {
    this.loadStores();
    this.loadStatistics();
    this.showSnackbar('Data refreshed successfully', 'success');
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.verificationFilter.set('all');
    this.categoryFilter.set('all');
    this.dateRangeFilter.set({ start: null, end: null });
    this.applyFilters();
  }

  private showSnackbar(message: string, type: 'success' | 'error' | 'info' | 'warning'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: `snackbar-${type}`
    });
  }

  viewStoreProducts(store: Store): void {
    this.router.navigate(['/dashboard/stores/products', store._id]);
  }
}