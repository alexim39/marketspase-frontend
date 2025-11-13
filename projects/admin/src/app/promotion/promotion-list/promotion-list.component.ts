import { Component, inject, OnInit, OnDestroy, ViewChild, signal, DestroyRef, TemplateRef } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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
import { MatProgressBarModule } from '@angular/material/progress-bar';

// Services
//import { CampaignService } from '../campaign/campaign.service';
//import { PromotionService } from './promotion.service';
//import { AdminService } from '../common/services/user.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CampaignService } from '../../campaign/campaign.service';
import { AdminService } from '../../common/services/user.service';
import { PromotionService } from '../promotion.service';

export interface PromotionInterface {
  _id: string;
  upi: string;
  campaign: string | any;
  promoter: string | any;
  status: 'pending' | 'submitted' | 'validated' | 'paid' | 'rejected';
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

export interface CampaignInterface {
  _id: string;
  title: string;
  category: string;
  payoutPerPromotion: number;
  owner: any;
}

@Component({
  selector: 'admin-promotion-list-mgt',
  standalone: true,
  providers: [PromotionService, CampaignService, DatePipe, CurrencyPipe],
  imports: [
    CommonModule,
    ReactiveFormsModule,
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
    MatProgressBarModule,
    FormsModule
  ],
  templateUrl: './promotion-list.component.html',
  styleUrls: ['./promotion-list.component.scss'],
})
export class PromotionListMgtComponent implements OnInit {
  readonly adminService = inject(AdminService);
  readonly promotionService = inject(PromotionService);
  readonly campaignService = inject(CampaignService);
  readonly router = inject(Router);
  readonly snackBar = inject(MatSnackBar);
  readonly dialog = inject(MatDialog);
  readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  // Signals for state management
  isLoading = signal(true);
  totalPromotions = signal(0);
  pendingPromotions = signal(0);
  submittedPromotions = signal(0);
  validatedPromotions = signal(0);
  paidPromotions = signal(0);
  rejectedPromotions = signal(0);
  campaigns = signal<CampaignInterface[]>([]);
  selectedPromotion = signal<PromotionInterface | null>(null);

  // Table properties
  displayedColumns: string[] = ['upi', 'campaign', 'promoter', 'proof', 'payout', 'timeline', 'status', 'actions'];
  dataSource: MatTableDataSource<PromotionInterface> = new MatTableDataSource<PromotionInterface>([]);

  // Filters form
  filtersForm = this.fb.group({
    status: [[]],
    campaign: [[]],
    search: [''],
    startDate: [null],
    endDate: [null]
  });

  // Rejection dialog
  rejectionReason = '';
  dialogRef!: MatDialogRef<any>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('proofMediaDialog') proofMediaDialog!: TemplateRef<any>;
  @ViewChild('rejectDialog') rejectDialog!: TemplateRef<any>;

  constructor() {
    // Initialize the data source with the correct filter predicate
    this.dataSource.filterPredicate = this.createFilter();
  }

  ngOnInit(): void {
    this.adminService.fetchAdmin();
    this.loadPromotions();
    this.loadCampaigns();

    // Subscribe to filter changes
    this.filtersForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.applyFormFilters();
      });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private loadPromotions(): void {
    this.isLoading.set(true);
    
    this.promotionService.getPromotions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.dataSource.data = response.data;
            this.calculateStats(response.data);
            this.isLoading.set(false);
          } else {
            this.snackBar.open('Failed to load promotions', 'Close', { duration: 3000 });
            this.isLoading.set(false);
          }
        },
        error: (error) => {
          console.error('Error fetching promotions:', error);
          this.snackBar.open('Error loading promotions', 'Close', { duration: 3000 });
          this.isLoading.set(false);
        }
      });
  }

  loadCampaigns(): void {
    this.campaignService.getAppCampaigns()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.campaigns.set(response.data);
          }
        },
        error: (error) => {
          console.error('Error fetching campaigns:', error);
        }
      });
  }

  calculateStats(promotions: PromotionInterface[]): void {
    this.totalPromotions.set(promotions.length);
    this.pendingPromotions.set(promotions.filter(p => p.status === 'pending').length);
    this.submittedPromotions.set(promotions.filter(p => p.status === 'submitted').length);
    this.validatedPromotions.set(promotions.filter(p => p.status === 'validated').length);
    this.paidPromotions.set(promotions.filter(p => p.status === 'paid').length);
    this.rejectedPromotions.set(promotions.filter(p => p.status === 'rejected').length);
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.filtersForm.patchValue({ search: filterValue });
  }

  applyFormFilters() {
    const filters = this.filtersForm.value;
    this.dataSource.filter = JSON.stringify(filters);
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  createFilter(): (data: PromotionInterface, filter: string) => boolean {
    return (data: PromotionInterface, filter: string): boolean => {
      if (!filter) return true;
      
      const filters = JSON.parse(filter);
      const searchTerm = filters.search?.toLowerCase() || '';
      
      // Check search term
      const matchesSearch = searchTerm === '' || 
        data.upi.toLowerCase().includes(searchTerm) ||
        this.getPromoterName(data.promoter).toLowerCase().includes(searchTerm) ||
        this.getPromoterEmail(data.promoter).toLowerCase().includes(searchTerm) ||
        this.getCampaignTitle(data.campaign).toLowerCase().includes(searchTerm);
      
      // Check status filter
      const matchesStatus = filters.status.length === 0 || filters.status.includes(data.status);
      
      // Check campaign filter
      const matchesCampaign = filters.campaign.length === 0 || 
        (typeof data.campaign === 'string' ? filters.campaign.includes(data.campaign) : 
         filters.campaign.includes(data.campaign._id));
      
      // Check date range filter
      let matchesDateRange = true;
      if (filters.startDate && filters.endDate) {
        const submissionDate = data.submittedAt ? new Date(data.submittedAt) : new Date(data.createdAt);
        const startDate = new Date(filters.startDate);
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999); // Include entire end date
        
        matchesDateRange = submissionDate >= startDate && submissionDate <= endDate;
      }
      
      return matchesSearch && matchesStatus && matchesCampaign && matchesDateRange;
    };
  }

  clearFilters(): void {
    this.filtersForm.reset({
      //status: [],
      //campaign: [],
      search: '',
      startDate: null,
      endDate: null
    });
  }

  // Helper methods to handle both string and populated objects
  getCampaignTitle(campaign: string | any): string {
    if (typeof campaign === 'string') {
      const foundCampaign = this.campaigns().find(c => c._id === campaign);
      return foundCampaign?.title || 'Unknown Campaign';
    }
    return campaign?.title || 'Unknown Campaign';
  }

  getCampaignCategory(campaign: string | any): string {
    if (typeof campaign === 'string') {
      const foundCampaign = this.campaigns().find(c => c._id === campaign);
      return foundCampaign?.category || 'Unknown';
    }
    return campaign?.category || 'Unknown';
  }

  getPromoterName(promoter: string | any): string {
    if (typeof promoter === 'string') {
      return 'Loading...';
    }
    return promoter?.displayName || 'Unknown Promoter';
  }

  getPromoterEmail(promoter: string | any): string {
    if (typeof promoter === 'string') {
      return 'Loading...';
    }
    return promoter?.email || 'No email';
  }

  getPayoutAmount(promotion: PromotionInterface): number {
    if (promotion.payoutAmount) {
      return promotion.payoutAmount;
    }
    
    // Calculate from campaign if available
    const campaign = typeof promotion.campaign === 'string' 
      ? this.campaigns().find(c => c._id === promotion.campaign)
      : promotion.campaign;
    
    return campaign?.payoutPerPromotion || 0;
  }

  isOverdue(promotion: PromotionInterface): boolean {
    if (promotion.status !== 'submitted') return false;
    
    const submittedDate = promotion.submittedAt ? new Date(promotion.submittedAt) : new Date(promotion.createdAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - submittedDate.getTime()) / (1000 * 60 * 60);
    
    return hoursDiff > 48; // Consider overdue if more than 48 hours
  }


  viewProofMedia(promotion: PromotionInterface): void {
    this.selectedPromotion.set(promotion);
    this.dialogRef = this.dialog.open(this.proofMediaDialog, {
      width: '800px',
      maxWidth: '90vw'
    });
  }

  validatePromotion(promotion: PromotionInterface): void {
    this.isLoading.set(true);
    
    this.campaignService.updatePromotionStatus(promotion._id, 'validated', this.adminService.adminData()?._id || '')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Promotion validated successfully', 'Close', { duration: 3000 });
            this.dialogRef.close();
            this.loadPromotions(); // Refresh data
          } else {
            this.snackBar.open('Failed to validate promotion', 'Close', { duration: 3000 });
            this.isLoading.set(false);
          }
        },
        error: (error) => {
          console.error('Error validating promotion:', error);
          this.snackBar.open('Error validating promotion', 'Close', { duration: 3000 });
          this.isLoading.set(false);
        }
      });
  }

  openRejectDialog(promotion: PromotionInterface): void {
    this.selectedPromotion.set(promotion);
    this.rejectionReason = '';
    
    this.dialogRef = this.dialog.open(this.rejectDialog, {
      width: '200px',
      height: 'auto'
    });
  }

  rejectPromotion(): void {
    if (!this.selectedPromotion() || !this.rejectionReason.trim()) {
      this.snackBar.open('Please provide a rejection reason', 'Close', { duration: 3000 });
      return;
    }

    this.isLoading.set(true);
    
    this.campaignService.updatePromotionStatus(this.selectedPromotion()!._id, 'rejected', this.adminService.adminData()?._id || '', this.rejectionReason)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Promotion rejected successfully', 'Close', { duration: 3000 });
            this.dialogRef.close();
            this.loadPromotions(); // Refresh data
          } else {
            this.snackBar.open('Failed to reject promotion', 'Close', { duration: 3000 });
            this.isLoading.set(false);
          }
        },
        error: (error) => {
          console.error('Error rejecting promotion:', error);
          this.snackBar.open('Error rejecting promotion', 'Close', { duration: 3000 });
          this.isLoading.set(false);
        }
      });
  }

  // markAsPaid(promotion: PromotionInterface): void {
  //   this.isLoading.set(true);
    
  //   this.promotionService.markAsPaid(promotion._id)
  //     .pipe(takeUntilDestroyed(this.destroyRef))
  //     .subscribe({
  //       next: (response) => {
  //         if (response.success) {
  //           this.snackBar.open('Promotion marked as paid', 'Close', { duration: 3000 });
  //           this.loadPromotions(); // Refresh data
  //         } else {
  //           this.snackBar.open('Failed to mark promotion as paid', 'Close', { duration: 3000 });
  //           this.isLoading.set(false);
  //         }
  //       },
  //       error: (error) => {
  //         console.error('Error marking promotion as paid:', error);
  //         this.snackBar.open('Error marking promotion as paid', 'Close', { duration: 3000 });
  //         this.isLoading.set(false);
  //       }
  //     });
  // }

  // revertToSubmitted(promotion: PromotionInterface): void {
  //   this.isLoading.set(true);
    
  //   this.promotionService.revertToSubmitted(promotion._id)
  //     .pipe(takeUntilDestroyed(this.destroyRef))
  //     .subscribe({
  //       next: (response) => {
  //         if (response.success) {
  //           this.snackBar.open('Promotion reverted to submitted status', 'Close', { duration: 3000 });
  //           this.loadPromotions(); // Refresh data
  //         } else {
  //           this.snackBar.open('Failed to revert promotion', 'Close', { duration: 3000 });
  //           this.isLoading.set(false);
  //         }
  //       },
  //       error: (error) => {
  //         console.error('Error reverting promotion:', error);
  //         this.snackBar.open('Error reverting promotion', 'Close', { duration: 3000 });
  //         this.isLoading.set(false);
  //       }
  //     });
  // }

  viewActivityLog(promotion: PromotionInterface): void {
    this.selectedPromotion.set(promotion);
    this.snackBar.open(`Viewing activity log for ${promotion.upi}`, 'Close', { duration: 2000 });
    // Implement activity log view logic
  }
}