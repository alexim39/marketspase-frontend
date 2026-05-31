import { Component, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';

import { CampaignService } from '../campaign.service';
import { AdminService } from '../../common/services/user.service';
import { CampaignInterface, PromotionInterface } from '../../../../../shared-services/src/public-api';
import { PromotionDetailsComponent } from '../../promotion/promotion-details/promotion-details.component';

@Component({
  selector: 'admin-campaign-details',
  standalone: true,
  providers: [DatePipe, CurrencyPipe, CampaignService],
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTabsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatMenuModule,
    MatExpansionModule,
    MatListModule,
  ],
  templateUrl: './campaign-details.component.html',
  styleUrls: ['./campaign-details.component.scss'],
})
export class CampaignDetailsComponent {
  readonly campaignService = inject(CampaignService);
  readonly dialog = inject(MatDialog);
  readonly adminService = inject(AdminService);
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();

  isLoading = signal(true);
  selectedTabIndex = signal(0);
  campaign = signal<CampaignInterface | null>(null);
  promotions = signal<PromotionInterface[]>([]);
  public readonly api = this.campaignService.api;

  promotionsColumns: string[] = ['promoter', 'status', 'trackedClicks', 'billableClicks', 'earned', 'lastActivity', 'actions'];
  promotionsDataSource = new MatTableDataSource<PromotionInterface>([]);

  ngOnInit(): void {
    this.adminService.fetchAdmin();
    this.loadCampaignDetails();
  }

  loadCampaignDetails(): void {
    const campaignId = this.route.snapshot.paramMap.get('id');

    if (!campaignId) {
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);

    this.campaignService.getCampaignById(campaignId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.campaign.set(response.data);
            this.promotions.set(response.data.promotions || []);
            this.promotionsDataSource.data = response.data.promotions || [];
          } else {
            this.snackBar.open('Failed to load campaign details', 'Close', { duration: 3000 });
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error fetching campaign details:', error);
          this.snackBar.open('Error loading campaign details', 'Close', { duration: 3000 });
          this.isLoading.set(false);
        }
      });
  }

  goBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  updateCampaignStatus(status: string): void {
    const campaign = this.campaign();
    if (!campaign) return;

    this.campaignService.updateCampaignStatus(campaign._id, status, this.adminService.adminData()?._id || '')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open(`Campaign ${status} successfully`, 'Close', { duration: 3000 });
            this.loadCampaignDetails();
          } else {
            this.snackBar.open(`Failed to ${status} campaign`, 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error updating campaign status:', error);
          this.snackBar.open('Error updating campaign status', 'Close', { duration: 3000 });
        }
      });
  }

  viewAdvertiserDetails(): void {
    const campaign = this.campaign();
    const ownerId = campaign?.owner?._id;
    if (ownerId) {
      this.router.navigate(['/dashboard/users', ownerId]);
    }
  }

  viewActivityLog(): void {
    this.selectedTabIndex.set(2);
  }

  viewPromotionDetails(promotion: PromotionInterface): void {
    this.dialog.open(PromotionDetailsComponent, {
      width: '90%',
      maxWidth: '1000px',
      data: { promotion }
    });
  }

  getTrackedClicks(promotion: PromotionInterface): number {
    return Number(promotion.clickStats?.totalClicks ?? 0);
  }

  getBillableClicks(promotion: PromotionInterface): number {
    return Number(promotion.clickStats?.billableClicks ?? 0);
  }

  getEarnedAmount(promotion: PromotionInterface): number {
    return Number(promotion.clickStats?.earnedAmount ?? promotion.payoutAmount ?? 0);
  }

  getLastActivity(promotion: PromotionInterface): string | Date | undefined {
    return promotion.clickStats?.lastClickAt
      || promotion.acceptedAt
      || promotion.paidAt
      || promotion.rejectedAt
      || promotion.updatedAt
      || promotion.createdAt;
  }

  getStatusChipClass(promotion: PromotionInterface): string {
    if (promotion.fraudStatus?.isFlagged) {
      return 'flagged';
    }

    if (String(promotion.status) === 'accepted' && promotion.isActive === false) {
      return 'inactive';
    }

    return String(promotion.status || 'accepted');
  }

  getStatusLabel(promotion: PromotionInterface): string {
    if (promotion.fraudStatus?.isFlagged) {
      return 'Under Review';
    }

    if (String(promotion.status) === 'accepted' && promotion.isActive === false) {
      return 'Inactive Link';
    }

    if (String(promotion.status) === 'accepted') {
      return 'Active Link';
    }

    if (String(promotion.status) === 'paid') {
      return 'Legacy Paid';
    }

    if (String(promotion.status) === 'rejected') {
      return 'Rejected';
    }

    return String(promotion.status || 'Promotion');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
