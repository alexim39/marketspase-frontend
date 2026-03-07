import { Component, inject, OnInit, AfterViewInit, ViewChild, signal, DestroyRef, computed } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormsModule } from '@angular/forms';

// Angular Material imports
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';

// Services
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CampaignService } from '../../../campaign/campaign.service';
import { AdminService } from '../../../common/services/user.service';
import { PromotionService } from '../../promotion.service';
import { ProofMediaDialogComponent } from '../proof-media-dialog/proof-media-dialog.component';
import { RejectPromotionDialogComponent } from '../reject-promotion-dialog/reject-promotion-dialog.component';

// Reusable Components
import { StatisticsCardsComponent, StatCard } from './components/statistics-cards/statistics-cards.component';
import { PromotionFiltersComponent, PromotionFilters } from './components/promotion-filters/promotion-filters.component';
import { LoadingStateComponent } from './components/loading-state/loading-state.component';
import { EmptyStateComponent } from './components/empty-state/empty-state.component';
import { PageHeaderComponent } from './components/page-header/page-header.component';
import { CampaignCellComponent } from './components/campaign-cell/campaign-cell.component';

// Types
export interface Promotion {
  _id: string;
  upi: string;
  campaign: string | Campaign;
  promoter: string | Promoter;
  status: 'submitted';
  proofMedia: string[];
  proofViews?: number;
  payoutAmount?: number;
  submittedAt?: string;
  validatedAt?: string;
  paidAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  activityLog: any[];
}

export interface Campaign {
  _id: string;
  title: string;
  category: string;
  payoutPerPromotion: number;
  owner: any;
  payoutTierId?: string;
  minViewsPerPromotion?: number;
  maxViewsPerPromotion?: number;
}

export interface Promoter {
  _id: string;
  displayName: string;
  email: string;
}

export interface Filters {
  campaign: string[] | null;
  search: string[] | null;
  startDate: Date | null;
  endDate: Date | null;
}

interface PendingAction {
  promotion: Promotion;
  action: 'validate' | 'reject';
  originalIndex: number;
  timestamp: number;
}

@Component({
  selector: 'app-submitted-promotion-list',
  standalone: true,
  providers: [PromotionService, CampaignService],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    // Material Modules
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTooltipModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatMenuModule,
    // Reusable Components
    StatisticsCardsComponent,
    PromotionFiltersComponent,
    LoadingStateComponent,
    EmptyStateComponent,
    PageHeaderComponent,
    CampaignCellComponent
  ],
  templateUrl: './submitted-promotion-list.component.html',
  styleUrls: ['./submitted-promotion-list.component.scss'],
})
export class SubmittedPromotionListComponent implements OnInit, AfterViewInit {
  // Injections
  private readonly adminService = inject(AdminService);
  private readonly promotionService = inject(PromotionService);
  private readonly campaignService = inject(CampaignService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  // State
  readonly isLoading = signal(true);
  readonly totalPromotions = signal(0);
  readonly campaigns = signal<Campaign[]>([]);
  readonly selectedPromotion = signal<Promotion | null>(null);
  readonly pendingActions = signal<PendingAction[]>([]);
  readonly processingPromotions = signal<Set<string>>(new Set()); // Track promotions being processed

  // Table
  readonly displayedColumns: string[] = [
    'upi', 
    'campaign', 
    'promoter', 
    'proof', 
    'payout', 
    'timeline', 
    'status', 
    'actions'
  ];
  
  readonly dataSource = new MatTableDataSource<Promotion>([]);

  // Filters
  readonly filtersForm = this.fb.group<Filters>({
    campaign: null,
    search: null,
    startDate: null,
    endDate: null
  });

  // View Children
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Computed values
  readonly stats = computed<StatCard[]>(() => [
    {
      label: 'Total Submitted',
      value: this.totalPromotions(),
      icon: 'send',
      iconClass: 'submitted',
      tooltip: 'Total promotions submitted for review'
    },
    {
      label: 'Pending Review',
      value: this.dataSource.filteredData.length,
      icon: 'assignment',
      iconClass: 'pending',
      tooltip: 'Promotions currently pending review'
    },
    {
      label: 'Overdue',
      value: this.dataSource.filteredData.filter(p => this.isOverdue(p)).length,
      icon: 'warning',
      iconClass: 'rejected',
      tooltip: 'Promotions overdue for review (>48 hours)'
    }
  ]);

  constructor() {
    this.dataSource.filterPredicate = this.createFilter();
  }

  ngOnInit(): void {
    this.adminService.fetchAdmin();
    this.loadData();
    this.setupFilterSubscriptions();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private loadData(): void {
    this.isLoading.set(true);
    
    this.promotionService.getPromotionsByStatus('submitted')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.dataSource.data = response.data;
            this.totalPromotions.set(response.data.length);
          } else {
            this.showError('Failed to load promotions');
          }
          this.isLoading.set(false);
        },
        error: (error) => this.handleError(error, 'Error loading promotions')
      });

    this.loadCampaigns();
  }

  private loadCampaigns(): void {
    this.campaignService.getAppCampaigns()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.campaigns.set(response.data);
          }
        },
        error: (error) => console.error('Error fetching campaigns:', error)
      });
  }

  private setupFilterSubscriptions(): void {
    this.filtersForm.controls.search.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.applyFilters());

    this.filtersForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.applyFilters());
  }

  // Filter Methods
  applyFilters(): void {
    this.dataSource.filter = JSON.stringify(this.filtersForm.value);
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  private createFilter(): (data: Promotion, filter: string) => boolean {
    return (data: Promotion, filter: string): boolean => {
      if (!filter) return true;
      
      const filters: Filters = JSON.parse(filter);
      const searchTerm = filters.search?.join(' ').toLowerCase() || '';
      
      // Search filter
      const matchesSearch = searchTerm === '' || 
        data.upi.toLowerCase().includes(searchTerm) ||
        this.getPromoter(data.promoter).displayName.toLowerCase().includes(searchTerm) ||
        this.getPromoter(data.promoter).email.toLowerCase().includes(searchTerm) ||
        this.getCampaign(data.campaign).title.toLowerCase().includes(searchTerm);
      
      // Campaign filter
      const matchesCampaign = !filters.campaign || filters.campaign.length === 0 || 
        filters.campaign.includes(this.getCampaignId(data.campaign));
      
      // Date range filter
      const matchesDateRange = this.matchesDateRange(data, filters);
      
      return matchesSearch && matchesCampaign && matchesDateRange;
    };
  }

  private matchesDateRange(data: Promotion, filters: Filters): boolean {
    if (!filters.startDate || !filters.endDate) return true;
    
    const submissionDate = data.submittedAt ? new Date(data.submittedAt) : new Date(data.createdAt);
    const startDate = new Date(filters.startDate);
    const endDate = new Date(filters.endDate);
    endDate.setHours(23, 59, 59, 999);
    
    return submissionDate >= startDate && submissionDate <= endDate;
  }

  clearFilters(): void {
    this.filtersForm.reset({
      campaign: null,
      search: null,
      startDate: null,
      endDate: null
    });
  }

  onFiltersChange(filters: PromotionFilters): void {
    // Convert from PromotionFilters to Filters format
    this.filtersForm.patchValue({
      campaign: filters.campaignIds,
      search: filters.search ? [filters.search] : null,
      startDate: filters.startDate,
      endDate: filters.endDate
    });
  }

  // Helper Methods
  getCampaign(campaign: string | Campaign): Campaign {
    if (typeof campaign === 'string') {
      return this.campaigns().find(c => c._id === campaign) || 
        { _id: '', title: 'Unknown Campaign', category: 'Unknown', payoutPerPromotion: 0, owner: null };
    }
    return campaign;
  }

  getCampaignId(campaign: string | Campaign): string {
    return typeof campaign === 'string' ? campaign : campaign._id;
  }

  getPromoter(promoter: string | Promoter): Promoter {
    if (typeof promoter === 'string') {
      return { _id: '', displayName: 'Loading...', email: 'Loading...' };
    }
    return promoter;
  }

  getPayoutAmount(promotion: Promotion): number {
    return promotion.payoutAmount || this.getCampaign(promotion.campaign).payoutPerPromotion || 0;
  }

  isOverdue(promotion: Promotion): boolean {
    const submittedDate = promotion.submittedAt ? new Date(promotion.submittedAt) : new Date(promotion.createdAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - submittedDate.getTime()) / (1000 * 60 * 60);
    
    return hoursDiff > 48; // Overdue if more than 48 hours
  }

  isProcessing(promotionId: string): boolean {
    return this.processingPromotions().has(promotionId);
  }

  // Optimized Dialog Methods with Immediate UI Update
  viewProofMedia(promotion: Promotion): void {
    // Use setTimeout to push this to the next execution cycle
    setTimeout(() => {
      this.selectedPromotion.set(promotion);
      
      const dialogRef = this.dialog.open(ProofMediaDialogComponent, {
        width: '1200px',
        maxWidth: '100vw',
        height: '90vh',
        data: {
          promotion: promotion,
          campaigns: this.campaigns(),
          onValidate: (promo: Promotion) => this.validatePromotion(promo),
          onReject: (promo: Promotion) => this.openRejectDialog(promo)
        },
        disableClose: true
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result === 'validated' || result === 'rejected') {
          // logic...
        }
      });
    });
  }


  validatePromotion(promotion: Promotion): void {
    // Find the promotion in the current data
    const promotionIndex = this.dataSource.data.findIndex(p => p._id === promotion._id);
    
    if (promotionIndex === -1) {
      this.showError('Promotion not found in current list');
      return;
    }

    // Add to processing set
    this.processingPromotions.update(set => {
      const newSet = new Set(set);
      newSet.add(promotion._id);
      return newSet;
    });

    // Store original state for rollback
    const pendingAction: PendingAction = {
      promotion: { ...promotion },
      action: 'validate',
      originalIndex: promotionIndex,
      timestamp: Date.now()
    };
    
    // OPTIMIZATION 1: Remove from UI immediately
    this.removePromotionFromUI(promotion._id);
    
    // Add to pending actions for potential rollback
    this.pendingActions.update(actions => [...actions, pendingAction]);
    
    // OPTIMIZATION 2: Update backend asynchronously
    this.campaignService.updatePromotionStatus(
      promotion._id, 
      'validated', 
      this.adminService.adminData()?._id || ''
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          // Remove from processing set
          this.processingPromotions.update(set => {
            const newSet = new Set(set);
            newSet.delete(promotion._id);
            return newSet;
          });

          if (response.success) {
            // Success: Remove from pending actions and show success
            this.removeFromPendingActions(promotion._id);
            this.showSuccessWithUndo(
              'Promotion validated successfully',
              'Undo',
              () => this.undoValidation(promotion, pendingAction.originalIndex)
            );
          } else {
            // API failed: Rollback
            this.rollbackAction(promotion, pendingAction.originalIndex);
            this.showError('Failed to validate promotion');
          }
        },
        error: (error) => {
          // Remove from processing set
          this.processingPromotions.update(set => {
            const newSet = new Set(set);
            newSet.delete(promotion._id);
            return newSet;
          });

          // Error: Rollback
          this.rollbackAction(promotion, pendingAction.originalIndex);
          this.handleError(error, 'Error validating promotion');
        }
      });
  }

  openRejectDialog(promotion: Promotion): void {
    this.selectedPromotion.set(promotion);
    
    const dialogRef = this.dialog.open(RejectPromotionDialogComponent, {
      width: '500px',
      data: {
        promotion: promotion,
        onReject: (promo: Promotion, reason: string) => {
          this.rejectPromotionWithReason(promo, reason);
          dialogRef.close('rejected');
        }
      }
    });
  }

  rejectPromotionWithReason(promotion: Promotion, reason: string): void {
    // Find the promotion in the current data
    const promotionIndex = this.dataSource.data.findIndex(p => p._id === promotion._id);
    
    if (promotionIndex === -1) {
      this.showError('Promotion not found in current list');
      return;
    }

    // Add to processing set
    this.processingPromotions.update(set => {
      const newSet = new Set(set);
      newSet.add(promotion._id);
      return newSet;
    });

    // Store original state for rollback
    const pendingAction: PendingAction = {
      promotion: { ...promotion },
      action: 'reject',
      originalIndex: promotionIndex,
      timestamp: Date.now()
    };
    
    // OPTIMIZATION 1: Remove from UI immediately
    this.removePromotionFromUI(promotion._id);
    
    // Add to pending actions for potential rollback
    this.pendingActions.update(actions => [...actions, pendingAction]);
    
    // OPTIMIZATION 2: Update backend asynchronously
    this.campaignService.updatePromotionStatus(
      promotion._id, 
      'rejected', 
      this.adminService.adminData()?._id || '', 
      reason
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          // Remove from processing set
          this.processingPromotions.update(set => {
            const newSet = new Set(set);
            newSet.delete(promotion._id);
            return newSet;
          });

          if (response.success) {
            // Success: Remove from pending actions and show success
            this.removeFromPendingActions(promotion._id);
            this.showSuccessWithUndo(
              'Promotion rejected successfully',
              'Undo',
              () => this.undoRejection(promotion, pendingAction.originalIndex)
            );
          } else {
            // API failed: Rollback
            this.rollbackAction(promotion, pendingAction.originalIndex);
            this.showError('Failed to reject promotion');
          }
        },
        error: (error) => {
          // Remove from processing set
          this.processingPromotions.update(set => {
            const newSet = new Set(set);
            newSet.delete(promotion._id);
            return newSet;
          });

          // Error: Rollback
          this.rollbackAction(promotion, pendingAction.originalIndex);
          this.handleError(error, 'Error rejecting promotion');
        }
      });
  }

  // Helper methods for UI optimization
  private removePromotionFromUI(promotionId: string): void {
    const currentData = [...this.dataSource.data];
    const updatedData = currentData.filter(p => p._id !== promotionId);
    
    // Update data source (triggers UI update)
    this.dataSource.data = updatedData;
    
    // Update total count
    this.totalPromotions.update(total => total - 1);
  }

  private rollbackAction(promotion: Promotion, originalIndex: number): void {
    // Remove from pending actions
    this.removeFromPendingActions(promotion._id);
    
    // Restore to original position
    const currentData = [...this.dataSource.data];
    currentData.splice(originalIndex, 0, promotion);
    
    // Update data source
    this.dataSource.data = currentData;
    
    // Update total count
    this.totalPromotions.update(total => total + 1);
  }

  private removeFromPendingActions(promotionId: string): void {
    this.pendingActions.update(actions => 
      actions.filter(action => action.promotion._id !== promotionId)
    );
  }

  // Undo methods for user actions
  private undoValidation(promotion: Promotion, originalIndex: number): void {
    // Revert status back to submitted
    this.campaignService.updatePromotionStatus(
      promotion._id,
      'submitted',
      this.adminService.adminData()?._id || ''
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Restore to UI
            const currentData = [...this.dataSource.data];
            currentData.splice(originalIndex, 0, promotion);
            this.dataSource.data = currentData;
            this.totalPromotions.update(total => total + 1);
            this.showSuccess('Validation undone - promotion restored to submitted list');
          } else {
            this.showError('Failed to undo validation');
          }
        },
        error: (error) => {
          this.handleError(error, 'Error undoing validation');
        }
      });
  }

  private undoRejection(promotion: Promotion, originalIndex: number): void {
    // Revert status back to submitted
    this.campaignService.updatePromotionStatus(
      promotion._id,
      'submitted',
      this.adminService.adminData()?._id || '',
      '' // Clear rejection reason
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Restore to UI
            const currentData = [...this.dataSource.data];
            currentData.splice(originalIndex, 0, promotion);
            this.dataSource.data = currentData;
            this.totalPromotions.update(total => total + 1);
            this.showSuccess('Rejection undone - promotion restored to submitted list');
          } else {
            this.showError('Failed to undo rejection');
          }
        },
        error: (error) => {
          this.handleError(error, 'Error undoing rejection');
        }
      });
  }

  // Refresh data manually if needed
  refreshData(): void {
    this.loadData();
  }

  // Utility Methods
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }

  private showSuccessWithUndo(message: string, undoText: string, undoAction: () => void): void {
    const snackBarRef = this.snackBar.open(message, undoText, { duration: 5000 });
    
    snackBarRef.onAction().subscribe(() => {
      undoAction();
    });
    this.dialog.closeAll();
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
    this.dialog.closeAll();
  }

  private handleError(error: any, message: string): void {
    console.error(`${message}:`, error);
    this.showError(message);
  }
}