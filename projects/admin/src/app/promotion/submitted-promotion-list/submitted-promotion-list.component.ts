import { Component, inject, OnInit, AfterViewInit, ViewChild, signal, DestroyRef } from '@angular/core';
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
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';

// Services
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CampaignService } from '../../campaign/campaign.service';
import { AdminService } from '../../common/services/user.service';
import { PromotionService } from '../promotion.service';
import { ProofMediaDialogComponent } from '../proof-media-dialog/proof-media-dialog.component';
import { RejectPromotionDialogComponent } from '../reject-promotion-dialog/reject-promotion-dialog.component';

// Types
export interface Promotion {
  _id: string;
  upi: string;
  campaign: string | Campaign;
  promoter: string | Promoter;
  status: 'submitted'; // Only submitted status
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
}

export interface Promoter {
  _id: string;
  displayName: string;
  email: string;
}

export interface Filters {
  campaign: string[] | null;
  search: string[];
  startDate: Date | null;
  endDate: Date | null;
}

@Component({
  selector: 'app-submitted-promotion-list',
  standalone: true,
  providers: [PromotionService, CampaignService, DatePipe, CurrencyPipe],
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
  readonly rejectionReason = signal('');

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
    campaign: [''],
    search: [''],
    startDate: null,
    endDate: null
  });

  // View Children
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private dialogRef!: MatDialogRef<any>;
  private rejectDialogRef!: MatDialogRef<any>;

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
      const matchesCampaign = filters?.campaign?.length === 0 || 
        filters?.campaign?.includes(this.getCampaignId(data.campaign));
      
      // Date range filter
      const matchesDateRange = this.matchesDateRange(data, filters);
      
      return !!matchesSearch && !!matchesCampaign && !!matchesDateRange;
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
      search: '',
      startDate: null,
      endDate: null
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

  // Dialog Methods
 viewProofMedia(promotion: Promotion): void {
    this.selectedPromotion.set(promotion);
    
    this.dialog.open(ProofMediaDialogComponent, {
      width: '1200px',
      maxWidth: '100vw',
      height: '90vh',
      data: {
        promotion: promotion,
        campaigns: this.campaigns(),
        onValidate: (promo: Promotion) => this.validatePromotion(promo),
        onReject: (promo: Promotion) => this.openRejectDialog(promo)
      }
    });

    // Listen for dialog close if needed
    // this.dialogRef.afterClosed().subscribe(() => {
    //   // Handle any cleanup if needed
    // });
  }

  validatePromotion(promotion: Promotion): void {
    this.isLoading.set(true);
    //this.dialogRef.close();
    
    this.campaignService.updatePromotionStatus(
      promotion._id, 
      'validated', 
      this.adminService.adminData()?._id || ''
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess('Promotion validated successfully');
            //this.loadData();
            // Use setTimeout to avoid change detection issues
            setTimeout(() => {
              this.loadData();
            });
          } else {
            this.showError('Failed to validate promotion');
          }
        },
        error: (error) => this.handleError(error, 'Error validating promotion')
      });
  }

 openRejectDialog(promotion: Promotion): void {
    this.selectedPromotion.set(promotion);
    this.rejectionReason.set('');
    
    this.dialog.open(RejectPromotionDialogComponent, {
      width: '500px',
      data: {
        promotion: promotion,
        onReject: (promo: Promotion, reason: string) => {
          this.rejectPromotionWithReason(promo, reason);
        }
      }
    });
  }


  // Add this new method to handle rejection with reason
  rejectPromotionWithReason(promotion: Promotion, reason: string): void {
    this.isLoading.set(true);
    
    this.campaignService.updatePromotionStatus(
      promotion._id, 
      'rejected', 
      this.adminService.adminData()?._id || '', 
      reason
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess('Promotion rejected successfully');
            this.loadData();
          } else {
            this.showError('Failed to reject promotion');
          }
          this.isLoading.set(false);
        },
        error: (error) => this.handleError(error, 'Error rejecting promotion')
      });
  }

  rejectPromotion(): void {
    const promotion = this.selectedPromotion();
    const reason = this.rejectionReason().trim();
    
    if (!promotion || !reason) {
      this.showError('Please provide a rejection reason');
      return;
    }

    this.rejectPromotionWithReason(promotion, reason);
  }

  // Utility Methods
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
    this.isLoading.set(false);
  }

  private handleError(error: any, message: string): void {
    console.error(`${message}:`, error);
    this.showError(message);
    this.isLoading.set(false);
  }
}