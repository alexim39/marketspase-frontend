// promoter-stores-list.component.ts
import { Component, OnInit, inject, signal, computed, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { MatSnackBar } from '@angular/material/snack-bar';
import { DeviceService } from '../../../../../../shared-services/src/public-api';
import { UserService } from '../../../common/services/user.service';

// Child Components
import { PromoterStoresHeaderComponent } from './components/stores-header/stores-header.component';
import { StoresFilterSidebarComponent } from './components/stores-filter-sidebar/stores-filter-sidebar.component';
import { StoresContentViewComponent } from './components/stores-content-view/stores-content-view.component';
import { Store, StoreFilterOptions, StoreListService } from './stores-list.service';


interface StoreFilterState {
  searchQuery: string;
  selectedCategories: string[];
  selectedVerificationTiers: string[];
  sortBy: 'name' | 'rating' | 'productCount' | 'totalViews' | 'createdAt';
  sortOrder: 'asc' | 'desc';
  minProducts: number;
}

@Component({
  selector: 'app-promoter-stores-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    PromoterStoresHeaderComponent,
    StoresFilterSidebarComponent,
    StoresContentViewComponent
  ],
  templateUrl: './promoter-stores-list.component.html',
  styleUrls: ['./promoter-stores-list.component.scss'],
  providers: [StoreListService]
})
export class PromoterStoresListComponent implements OnInit, OnDestroy {
  private storeService = inject(StoreListService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private deviceService = inject(DeviceService);
  private userService = inject(UserService);
  private destroy$ = new Subject<void>();

  // Search control
  searchControl = new FormControl('');

  // Signals
  stores = signal<Store[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Pagination signals
  totalStores = signal<number>(0);
  totalPages = signal<number>(0);
  currentPage = signal<number>(1);
  pageSize = signal<number>(12);

  // Filter signals
  categories = signal<Array<{ name: string; count: number }>>([]);
  verificationTiers = signal<Array<{ name: string; count: number }>>([]);
  filterOptions = signal<StoreFilterOptions | null>(null);

  // Device detection
  deviceType = computed(() => this.deviceService.type());

  // Current filter state
  currentFilters = signal<StoreFilterState>({
    searchQuery: '',
    selectedCategories: [],
    selectedVerificationTiers: [],
    sortBy: 'createdAt',
    sortOrder: 'desc',
    minProducts: 0
  });

  // Statistics for header
  stats = computed(() => {
    return {
      total: this.totalStores(),
      verified: this.filterOptions()?.verifiedStores || 0,
      categories: this.categories().length,
      premiumStores: this.stores().filter(s => s.verificationTier === 'premium').length
    };
  });

  ngOnInit(): void {
    this.loadStores();

    // Setup search with debounce
    this.searchControl.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.applyFilters({ searchQuery: searchTerm || '' });
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadStores(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const filters = this.currentFilters();
      const response = await this.storeService.getStoresForPromoter({
        page: this.currentPage(),
        limit: this.pageSize(),
        search: filters.searchQuery,
        category: filters.selectedCategories.join(','),
        verificationTier: filters.selectedVerificationTiers.join(','),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        minProducts: filters.minProducts
      }).toPromise();

      if (!response || !response.data) {
        this.error.set('No stores found.');
        this.stores.set([]);
        this.totalStores.set(0);
        this.totalPages.set(0);
        return;
      }

      this.stores.set(response.data);
      this.totalStores.set(response.pagination.total);
      this.totalPages.set(response.pagination.totalPages);
      
      if (response.filters) {
        this.categories.set(response.filters.categories || []);
        this.verificationTiers.set(response.filters.verificationTiers || []);
        this.filterOptions.set(response.filters);
      }
    } catch (err) {
      this.error.set('Failed to load stores. Please try again later.');
      this.snackBar.open('Failed to load stores', 'Close', { duration: 5000 });
      console.error('Error loading stores:', err);
    } finally {
      this.loading.set(false);
    }
  }

  applyFilters(filterState: Partial<any>): void {
//   applyFilters(filterState: Partial<StoreFilterState>): void {
    // Reset to first page when filters change
    this.currentPage.set(1);
    
    // Merge with existing filters
    this.currentFilters.update(current => ({
      ...current,
      ...filterState
    }));
    
    // Reload stores with new filters
    this.loadStores();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadStores();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.loadStores();
  }

  // Store actions
  viewStoreDetails(store: Store): void {
    this.router.navigate(['dashboard/stores/view', store._id]);
  }

  async followStore(store: Store): Promise<void> {
    try {
      const response = await this.storeService.toggleFollowStore(store._id).toPromise();
      if (response?.success) {
        // Update local state
        this.stores.update(stores => 
          stores.map(s => 
            s._id === store._id 
              ? { ...s, isFollowing: response.isFollowing }
              : s
          )
        );
        this.snackBar.open(response.message, 'Close', { duration: 3000 });
      }
    } catch (error) {
      this.snackBar.open('Failed to update follow status', 'Close', { duration: 3000 });
      console.error('Error following store:', error);
    }
  }

  retryLoading(): void {
    this.loadStores();
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.applyFilters({
      searchQuery: '',
      selectedCategories: [],
      selectedVerificationTiers: [],
      sortBy: 'createdAt',
      sortOrder: 'desc',
      minProducts: 0
    });
  }
}