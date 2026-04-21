import { Component, OnInit, signal, computed, inject, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
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
import { debounceTime, Subject } from 'rxjs';

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
  private cdr = inject(ChangeDetectorRef);
  readonly router = inject(Router);

  // State with signals
  stores = signal<Store[]>([]);
  users = signal<User[]>([]);
  isLoading = signal(true);
  isLoadingUsers = signal(false);
  
  // Filter signals
  searchQuery = signal('');
  verificationFilter = signal('all');
  categoryFilter = signal('all');
  dateRangeFilter = signal<{start: Date | null, end: Date | null}>({ start: null, end: null });
  
  // Table data source
  dataSource = new MatTableDataSource<Store>([]);
  displayedColumns: string[] = ['store', 'owner', 'category', 'verification', 'analytics', 'products', 'date', 'actions'];
  
  // Pagination - these are bound to the mat-paginator
  pageSize = signal(10);
  pageIndex = signal(0);
  totalStores = signal(0);
  
  // For debounced search
  private searchSubject = new Subject<string>();
  
  // Statistics
  stats = signal({
    totalStores: 0,
    activeStores: 0,
    verifiedStores: 0,
    totalProducts: 0,
    totalRevenue: 0
  });

  // Available categories
  categories = signal<string[]>([]);

  ngOnInit(): void {
    this.loadCategories();
    this.loadStatistics();
    this.loadUsers();
    this.loadStores();
    
    // Set up debounced search
    this.searchSubject.pipe(debounceTime(500)).subscribe(() => {
      this.pageIndex.set(0); // Reset to first page on search
      this.loadStores();
    });
  }

  async loadStores(): Promise<void> {
    try {
      this.isLoading.set(true);
      
      // Build query parameters
      const params: any = {
        page: this.pageIndex() + 1, // Backend uses 1-based page
        limit: this.pageSize(),
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };
      
      // Add filters if they have values
      if (this.searchQuery()) {
        params.search = this.searchQuery();
      }
      
      if (this.verificationFilter() !== 'all') {
        params.verification = this.verificationFilter();
      }
      
      if (this.categoryFilter() !== 'all') {
        params.category = this.categoryFilter();
      }
      
      if (this.dateRangeFilter().start) {
        params.startDate = this.dateRangeFilter().start?.toISOString();
      }
      
      if (this.dateRangeFilter().end) {
        params.endDate = this.dateRangeFilter().end?.toISOString();
      }
      
      console.log('Loading stores with params:', params);
      
      this.storeService.getStores(params).subscribe({
        next: (response) => {
          console.log('Stores loaded:', response);
          this.stores.set(response.data || []);
          this.dataSource.data = response.data || [];
          this.totalStores.set(response.pagination?.total || 0);
          this.isLoading.set(false);
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading stores:', error);
          this.isLoading.set(false);
          this.showSnackbar('Failed to load stores', 'error');
          this.cdr.detectChanges();
        }
      });
    } catch (error) {
      console.error('Error loading stores:', error);
      this.isLoading.set(false);
      this.showSnackbar('Failed to load stores', 'error');
      this.cdr.detectChanges();
    }
  }

  async loadCategories(): Promise<void> {
    // Extract categories from stores when they load
    // For now, we'll just use an empty array and populate when stores load
    this.storeService.getStores({ limit: 100 }).subscribe({
      next: (response) => {
        const categoriesSet = new Set<string>();
        response.data.forEach(store => {
          if (store.category) categoriesSet.add(store.category);
        });
        this.categories.set(Array.from(categoriesSet));
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  async loadUsers(): Promise<void> {
    try {
      this.isLoadingUsers.set(true);
      this.storeService.getStoreOwners().subscribe({
        next: (response) => {
          this.users.set(response.data || []);
          this.isLoadingUsers.set(false);
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.isLoadingUsers.set(false);
          this.cdr.detectChanges();
        }
      });
    } catch (error) {
      console.error('Error loading users:', error);
      this.isLoadingUsers.set(false);
      this.cdr.detectChanges();
    }
  }

  async loadStatistics(): Promise<void> {
    this.storeService.getStoreStatistics().subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading statistics:', error);
      }
    });
  }

  // This method is called when the user interacts with the paginator
  onPageChange(event: PageEvent): void {
    console.log('Page changed:', event);
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
    this.loadStores(); // Reload data for the new page
  }

  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
    this.searchSubject.next(input.value); // Debounced search
  }

  onVerificationFilterChange(event: any): void {
    console.log('Verification filter changed:', event.value);
    this.verificationFilter.set(event.value);
    this.pageIndex.set(0); // Reset to first page
    this.loadStores();
  }

  onCategoryFilterChange(event: any): void {
    console.log('Category filter changed:', event.value);
    this.categoryFilter.set(event.value);
    this.pageIndex.set(0); // Reset to first page
    this.loadStores();
  }

  onDateRangeChange(start: Date | null, end: Date | null): void {
    console.log('Date range changed:', start, end);
    this.dateRangeFilter.set({ start, end });
    this.pageIndex.set(0); // Reset to first page
    this.loadStores();
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
            next: () => {
              this.loadStores(); // Reload to get updated data
              this.loadStatistics(); // Update stats
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
              this.loadStores(); // Reload to get updated data
              this.loadStatistics(); // Update stats
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
              this.loadStores(); // Reload to get updated data
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
              this.loadStores(); // Reload to get updated data
              this.loadStatistics(); // Update stats
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
    // Export all stores (you might want to add a separate API for exporting all)
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
          this.showSnackbar(`Stores exported as ${format.toUpperCase()} successfully`, 'success');
        },
        error: (error) => {
          console.error('Error exporting stores:', error);
          this.showSnackbar('Failed to export stores', 'error');
        }
      });
  }

  refreshData(): void {
    this.pageIndex.set(0);
    this.loadStores();
    this.loadStatistics();
    this.showSnackbar('Data refreshed successfully', 'success');
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.verificationFilter.set('all');
    this.categoryFilter.set('all');
    this.dateRangeFilter.set({ start: null, end: null });
    this.pageIndex.set(0);
    this.loadStores();
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