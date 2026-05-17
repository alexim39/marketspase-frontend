import { Component, DestroyRef, TemplateRef, ViewChild, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { Clipboard } from '@angular/cdk/clipboard';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CampaignService } from '../../campaign/campaign.service';
import { PromotionService } from '../promotion.service';

interface PromotionClickStats {
  totalClicks?: number;
  billableClicks?: number;
  invalidClicks?: number;
  duplicateClicks?: number;
  earnedAmount?: number;
  lastClickAt?: string;
}

interface PromotionFraudState {
  isFlagged?: boolean;
  reviewStatus?: string;
  reasonSummary?: string;
}

interface PromotionInterface {
  _id: string;
  upi: string;
  campaign: string | CampaignInterface;
  promoter: string | {
    _id?: string;
    displayName?: string;
    email?: string;
    username?: string;
  };
  status: 'accepted' | 'inactive' | 'paid' | 'rejected' | string;
  isActive?: boolean;
  promotionUrl?: string;
  payoutAmount?: number;
  costPerClick?: number;
  acceptedAt?: string;
  paidAt?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
  clickStats?: PromotionClickStats;
  fraudStatus?: PromotionFraudState;
  proofMedia?: string[];
  proofViews?: number;
  activityLog?: Array<{ action?: string; details?: string; timestamp?: string }>;
}

interface CampaignInterface {
  _id: string;
  title: string;
  category?: string;
  costPerClick?: number;
  payoutPerPromotion?: number;
  currency?: string;
  status?: string;
  owner?: any;
}

@Component({
  selector: 'admin-promotion-list-mgt',
  standalone: true,
  providers: [PromotionService, CampaignService, DatePipe, CurrencyPipe],
  imports: [
    CommonModule,
    ReactiveFormsModule,
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
    MatMenuModule
  ],
  templateUrl: './all-promotion-list.component.html',
  styleUrls: ['./all-promotion-list.component.scss'],
})
export class AllPromotionListMgtComponent {
  readonly promotionService = inject(PromotionService);
  readonly campaignService = inject(CampaignService);
  readonly router = inject(Router);
  readonly snackBar = inject(MatSnackBar);
  readonly dialog = inject(MatDialog);
  readonly fb = inject(FormBuilder);
  readonly clipboard = inject(Clipboard);
  private readonly destroyRef = inject(DestroyRef);

  isLoading = signal(true);
  totalPromotions = signal(0);
  activePromotions = signal(0);
  inactivePromotions = signal(0);
  flaggedPromotions = signal(0);
  paidPromotions = signal(0);
  rejectedPromotions = signal(0);
  totalBillableClicks = signal(0);
  campaigns = signal<CampaignInterface[]>([]);
  selectedPromotion = signal<PromotionInterface | null>(null);

  displayedColumns: string[] = ['upi', 'campaign', 'promoter', 'traffic', 'earnings', 'lifecycle', 'status', 'actions'];
  dataSource = new MatTableDataSource<PromotionInterface>([]);

  filtersForm = this.fb.group({
    status: [[] as string[]],
    campaign: [[] as string[]],
    search: [''],
    startDate: [null as Date | null],
    endDate: [null as Date | null]
  });

  dialogRef!: MatDialogRef<any>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('promotionDetailsDialog') promotionDetailsDialog!: TemplateRef<any>;

  constructor() {
    this.dataSource.filterPredicate = this.createFilter();
  }

  ngOnInit(): void {
    this.loadPromotions();
    this.loadCampaigns();

    this.filtersForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.applyFormFilters());
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private loadPromotions(): void {
    this.isLoading.set(true);

    this.promotionService.getAllPromotions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.dataSource.data = response.data as PromotionInterface[];
            this.calculateStats(this.dataSource.data);
          } else {
            this.snackBar.open('Failed to load promotions', 'Close', { duration: 3000 });
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error fetching promotions:', error);
          this.snackBar.open('Error loading promotions', 'Close', { duration: 3000 });
          this.isLoading.set(false);
        }
      });
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
        error: (error) => {
          console.error('Error fetching campaigns:', error);
        }
      });
  }

  private calculateStats(promotions: PromotionInterface[]): void {
    const billableClicks = promotions.reduce((sum, promotion) => sum + this.getBillableClicks(promotion), 0);

    this.totalPromotions.set(promotions.length);
    this.activePromotions.set(promotions.filter((promotion) => this.getFilterStatus(promotion) === 'accepted').length);
    this.inactivePromotions.set(promotions.filter((promotion) => this.getFilterStatus(promotion) === 'inactive').length);
    this.flaggedPromotions.set(promotions.filter((promotion) => this.getFilterStatus(promotion) === 'flagged').length);
    this.paidPromotions.set(promotions.filter((promotion) => promotion.status === 'paid').length);
    this.rejectedPromotions.set(promotions.filter((promotion) => promotion.status === 'rejected').length);
    this.totalBillableClicks.set(billableClicks);
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.filtersForm.patchValue({ search: filterValue });
  }

  applyFormFilters(): void {
    this.dataSource.filter = JSON.stringify(this.filtersForm.value);
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  createFilter(): (data: PromotionInterface, filter: string) => boolean {
    return (data: PromotionInterface, filter: string): boolean => {
      if (!filter) return true;

      const filters = JSON.parse(filter);
      const searchTerm = String(filters.search || '').toLowerCase();
      const derivedStatus = this.getFilterStatus(data);

      const matchesSearch = !searchTerm
        || data.upi?.toLowerCase().includes(searchTerm)
        || this.getPromoterName(data.promoter).toLowerCase().includes(searchTerm)
        || this.getPromoterEmail(data.promoter).toLowerCase().includes(searchTerm)
        || this.getCampaignTitle(data.campaign).toLowerCase().includes(searchTerm);

      const matchesStatus = !filters.status?.length || filters.status.includes(derivedStatus);

      const matchesCampaign = !filters.campaign?.length || filters.campaign.includes(this.getCampaignId(data.campaign));

      let matchesDateRange = true;
      if (filters.startDate && filters.endDate) {
        const activityDate = new Date(this.getLifecycleDate(data) || data.createdAt);
        const startDate = new Date(filters.startDate);
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        matchesDateRange = activityDate >= startDate && activityDate <= endDate;
      }

      return matchesSearch && matchesStatus && matchesCampaign && matchesDateRange;
    };
  }

  clearFilters(): void {
    this.filtersForm.reset({
      status: [],
      campaign: [],
      search: '',
      startDate: null,
      endDate: null
    });
  }

  getCampaignId(campaign: string | CampaignInterface): string {
    return typeof campaign === 'string' ? campaign : (campaign?._id || '');
  }

  getCampaignTitle(campaign: string | CampaignInterface): string {
    if (typeof campaign === 'string') {
      return this.campaigns().find((item) => item._id === campaign)?.title || 'Unknown Campaign';
    }

    return campaign?.title || 'Unknown Campaign';
  }

  getCampaignCategory(campaign: string | CampaignInterface): string {
    if (typeof campaign === 'string') {
      return this.campaigns().find((item) => item._id === campaign)?.category || 'General';
    }

    return campaign?.category || 'General';
  }

  getPromoterId(promoter: string | PromotionInterface['promoter']): string {
    return typeof promoter === 'string' ? promoter : (promoter?._id || '');
  }

  getPromoterName(promoter: string | PromotionInterface['promoter']): string {
    return typeof promoter === 'string' ? 'Unknown Promoter' : (promoter?.displayName || 'Unknown Promoter');
  }

  getPromoterEmail(promoter: string | PromotionInterface['promoter']): string {
    return typeof promoter === 'string' ? 'No email' : (promoter?.email || 'No email');
  }

  getTrackedClicks(promotion: PromotionInterface): number {
    return Number(promotion.clickStats?.totalClicks || 0);
  }

  getBillableClicks(promotion: PromotionInterface): number {
    return Number(promotion.clickStats?.billableClicks || 0);
  }

  getInvalidClicks(promotion: PromotionInterface): number {
    return Number(promotion.clickStats?.invalidClicks || 0) + Number(promotion.clickStats?.duplicateClicks || 0);
  }

  getEarnedAmount(promotion: PromotionInterface): number {
    return Number(promotion.clickStats?.earnedAmount ?? promotion.payoutAmount ?? 0);
  }

  getCostPerClick(promotion: PromotionInterface): number {
    const campaign = typeof promotion.campaign === 'string'
      ? this.campaigns().find((item) => item._id === promotion.campaign)
      : promotion.campaign;

    return Number(promotion.costPerClick ?? campaign?.costPerClick ?? campaign?.payoutPerPromotion ?? 0);
  }

  getLifecycleDate(promotion: PromotionInterface): string | undefined {
    return promotion.clickStats?.lastClickAt
      || promotion.acceptedAt
      || promotion.paidAt
      || promotion.rejectedAt
      || promotion.updatedAt
      || promotion.createdAt;
  }

  getFilterStatus(promotion: PromotionInterface): string {
    if (promotion.fraudStatus?.isFlagged) {
      return 'flagged';
    }

    if (promotion.status === 'accepted' && promotion.isActive === false) {
      return 'inactive';
    }

    return String(promotion.status || 'accepted');
  }

  getStatusLabel(promotion: PromotionInterface): string {
    switch (this.getFilterStatus(promotion)) {
      case 'accepted':
        return 'Active Link';
      case 'inactive':
        return 'Inactive Link';
      case 'flagged':
        return 'Under Review';
      case 'paid':
        return 'Legacy Paid';
      case 'rejected':
        return 'Rejected';
      default:
        return String(promotion.status || 'Promotion');
    }
  }

  getStatusChipClass(promotion: PromotionInterface): string {
    switch (this.getFilterStatus(promotion)) {
      case 'accepted':
        return 'accepted';
      case 'inactive':
        return 'inactive';
      case 'flagged':
        return 'flagged';
      case 'paid':
        return 'paid';
      case 'rejected':
        return 'rejected';
      default:
        return 'pending';
    }
  }

  viewPromotionDetails(promotion: PromotionInterface): void {
    this.selectedPromotion.set(promotion);
    this.dialogRef = this.dialog.open(this.promotionDetailsDialog, {
      width: '860px',
      maxWidth: '94vw'
    });
  }

  copyPromotionLink(promotion: PromotionInterface): void {
    if (!promotion.promotionUrl) {
      this.snackBar.open('No tracking link is available for this promotion.', 'Close', { duration: 3000 });
      return;
    }

    this.clipboard.copy(promotion.promotionUrl);
    this.snackBar.open('Tracking link copied', 'Close', { duration: 2400 });
  }

  openPromotionLink(promotion: PromotionInterface): void {
    if (!promotion.promotionUrl) {
      this.snackBar.open('No tracking link is available for this promotion.', 'Close', { duration: 3000 });
      return;
    }

    window.open(promotion.promotionUrl, '_blank', 'noopener');
  }

  viewActivityLog(promotion: PromotionInterface): void {
    this.selectedPromotion.set(promotion);
    this.snackBar.open(`Viewing activity for ${promotion.upi}`, 'Close', { duration: 2200 });
  }

  viewCampaignDetails(promotion: PromotionInterface): void {
    const campaignId = this.getCampaignId(promotion.campaign);
    if (campaignId) {
      this.router.navigate(['dashboard/campaigns', campaignId]);
    }
  }

  viewCampaignPromotions(promotion: PromotionInterface): void {
    const campaignId = this.getCampaignId(promotion.campaign);
    if (campaignId) {
      this.router.navigate(['dashboard/campaigns', campaignId, 'promotions']);
    }
  }
}
