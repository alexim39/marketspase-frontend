import { Component, OnInit, inject, signal, computed, Signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DeviceService, PromotionInterface, UserInterface } from '../../../../../shared-services/src/public-api';
import { PromoterService } from '../../promoter/promoter.service';
import { UserService } from '../../common/services/user.service';

import { HeaderComponent } from './components/header/header.component';
import { StatsOverviewComponent } from './components/stats-overview/stats-overview.component';
import { PromotionCardComponent } from './components/promotion-card/promotion-card.component';
import { EmptyStateComponent } from './components/empty-state/empty-state.component';
import { LoadingStateComponent } from './components/loading-state/loading-state.component';
import { SubmitProofDialogComponent } from './submit-proof/submit-proof-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { StatsOverviewMobileComponent } from './components/stats-overview/mobile/stats-overview-mobile.component';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface PromotionStats {
  total: number;
  pending: number;
  submitted: number;
  validated: number;
  paid: number;
  rejected: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

@Component({
  selector: 'app-promotion',
  standalone: true,
  providers: [PromoterService],
  imports: [
    CommonModule,
    RouterModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    HeaderComponent,
    StatsOverviewComponent,
    PromotionCardComponent,
    EmptyStateComponent,
    LoadingStateComponent,
    StatsOverviewMobileComponent
  ],
  templateUrl: './promotion.component.html',
  styleUrls: ['./promotion.component.scss'],
})
export class PromotionComponent implements OnInit {
  private promoterService = inject(PromoterService);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  readonly dialog = inject(MatDialog);

  private userService: UserService = inject(UserService);
  public user: Signal<UserInterface | null> = this.userService.user;

  private deviceService = inject(DeviceService);
  deviceType = computed(() => this.deviceService.type());

  // Signals
  isLoading = signal<boolean>(true);
  isLoadingMore = signal<boolean>(false);
  currentPagePromotions = signal<PromotionInterface[]>([]); // Only current page promotions
  
  stats = signal<PromotionStats>({
    total: 0,
    pending: 0,
    submitted: 0,
    validated: 0,
    paid: 0,
    rejected: 0,
  });

  selectedTab = signal<string>('all');
  pagination = signal<PaginationInfo>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });

  // Computed signals
  filteredPromotions = computed(() => {
    return this.currentPagePromotions();
  });

  isEmptyState = computed(() => this.filteredPromotions().length === 0 && !this.isLoading());
  hasMoreData = computed(() => {
    const pagination = this.pagination();
    return pagination.page < pagination.totalPages;
  });

  displayedPromotionsCount = computed(() => {
    const pagination = this.pagination();
    const currentPromotions = this.currentPagePromotions().length;
    const startIndex = (pagination.page - 1) * pagination.limit + 1;
    const endIndex = Math.min(pagination.page * pagination.limit, pagination.total);
    
    return { start: startIndex, end: endIndex, total: pagination.total };
  });

  ngOnInit(): void {
    this.loadUserPromotions();
  }

  loadUserPromotions(loadMore: boolean = false): void {
    if (loadMore) {
      this.isLoadingMore.set(true);
    } else {
      this.isLoading.set(true);
    }

    const userId = this.user()?._id;
    const currentPagination = this.pagination();

    if (!userId) {
      this.snackBar.open('User not logged in or ID not available.', 'Dismiss', { duration: 3000 });
      this.isLoading.set(false);
      this.isLoadingMore.set(false);
      return;
    }

    const pageToLoad = loadMore ? currentPagination.page + 1 : 1;

    this.promoterService.getUserPromotions(userId, {
      page: pageToLoad,
      limit: currentPagination.limit,
      status: this.selectedTab() !== 'all' ? this.selectedTab() : undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response && response.data) {
            if (loadMore) {
              // For mobile load more, append to current promotions
              this.currentPagePromotions.update(current => [...current, ...response.data]);
              this.pagination.update(current => ({
                ...current,
                page: response.currentPage,
                total: response.total,
                totalPages: response.totalPages
              }));
            } else {
              // For desktop pagination or initial load, replace promotions
              this.currentPagePromotions.set(response.data);
              this.pagination.set({
                page: response.currentPage,
                limit: currentPagination.limit,
                total: response.total,
                totalPages: response.totalPages
              });
            }
            
            // Calculate stats from all promotions (if you want stats across all pages)
            // For now, we'll calculate stats only from current page data
            this.stats.set(this.calculateStats(response.data));

           

          } else {
            this.currentPagePromotions.set([]);
            this.stats.set(this.calculateStats([]));
          }
          
          this.isLoading.set(false);
          this.isLoadingMore.set(false);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to load promotions:', error);
          this.isLoading.set(false);
          this.isLoadingMore.set(false);
        }
      });
  }

  loadMorePromotions(): void {
    if (this.hasMoreData() && !this.isLoadingMore()) {
      this.loadUserPromotions(true);
    }
  }

  onTabChange(tab: string): void {
    this.selectedTab.set(tab);
    this.pagination.update(p => ({ ...p, page: 1 })); // Reset to first page
    this.loadUserPromotions(false); // Reload with new filter
  }

  onPageChange(event: PageEvent): void {
    this.pagination.update(p => ({
      ...p,
      page: event.pageIndex + 1,
      limit: event.pageSize
    }));
    this.loadUserPromotions(false);
  }

  private calculateStats(promotions: PromotionInterface[]): PromotionStats {
    const promos = promotions || [];
    return promos.reduce((acc, promo) => {
      acc.total++;
      if (promo.status) {
        acc[promo.status as keyof PromotionStats] = (acc[promo.status as keyof PromotionStats] as number) + 1;
      }
      return acc;
    }, { total: 0, pending: 0, submitted: 0, validated: 0, paid: 0, rejected: 0 });
  }

  openSubmitProofDialog(promotion: PromotionInterface): void {
    const dialogRef = this.dialog.open(SubmitProofDialogComponent, {
      data: { promotion: promotion }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'submitted') {
        this.currentPagePromotions.update(promotions => 
          promotions.map(p => 
            p._id === promotion._id 
              ? { ...p, status: 'submitted' as any } 
              : p
          )
        );
        
        this.stats.set(this.calculateStats(this.currentPagePromotions()));
      }
    });
  }
}