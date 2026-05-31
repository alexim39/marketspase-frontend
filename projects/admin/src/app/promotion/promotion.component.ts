import { Component, DestroyRef, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Clipboard } from '@angular/cdk/clipboard';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { CampaignService } from '../campaign/campaign.service';
import { AdminService } from '../common/services/user.service';
import { CampaignInterface, PromotionInterface } from '../../../../shared-services/src/public-api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PromotionDetailsComponent } from './promotion-details/promotion-details.component';

@Component({
  selector: 'admin-campaign-promotions',
  standalone: true,
  providers: [DatePipe, CurrencyPipe, CampaignService],
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTooltipModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './promotion.component.html',
  styleUrls: ['./promotion.component.scss'],
})
export class CampaignPromotionsComponent {
  readonly campaignService = inject(CampaignService);
  readonly adminService = inject(AdminService);
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly snackBar = inject(MatSnackBar);
  readonly dialog = inject(MatDialog);
  readonly clipboard = inject(Clipboard);
  private readonly destroyRef = inject(DestroyRef);

  isLoading = signal(true);
  campaign = signal<CampaignInterface | null>(null);
  promotions = signal<PromotionInterface[]>([]);
  statusFilter = signal<string>('all');

  displayedColumns: string[] = ['promoter', 'upi', 'status', 'trackedClicks', 'billableClicks', 'earned', 'lastActivity', 'actions'];
  dataSource = new MatTableDataSource<PromotionInterface>([]);

  activeLinks = computed(() =>
    this.promotions().filter((promotion) => String(promotion.status) === 'accepted' && promotion.isActive !== false).length
  );

  inactiveLinks = computed(() =>
    this.promotions().filter((promotion) => String(promotion.status) === 'accepted' && promotion.isActive === false).length
  );

  flaggedLinks = computed(() =>
    this.promotions().filter((promotion) => promotion.fraudStatus?.isFlagged).length
  );

  billableClicks = computed(() =>
    this.promotions().reduce((sum, promotion) => sum + Number(promotion.clickStats?.billableClicks ?? 0), 0)
  );

  earnedAmount = computed(() =>
    this.promotions().reduce((sum, promotion) => sum + Number(promotion.clickStats?.earnedAmount ?? promotion.payoutAmount ?? 0), 0)
  );

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.adminService.fetchAdmin();
    this.loadCampaignPromotions();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadCampaignPromotions(): void {
    const campaignId = this.route.snapshot.paramMap.get('id');

    if (!campaignId) {
      this.isLoading.set(false);
      this.snackBar.open('Invalid campaign ID', 'Close', { duration: 3000 });
      return;
    }

    this.isLoading.set(true);

    this.campaignService.getCampaignById(campaignId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.campaign.set(response.data);
            this.promotions.set(response.data.promotions || []);
            this.dataSource.data = response.data.promotions || [];
          } else {
            this.snackBar.open('Failed to load campaign promotions', 'Close', { duration: 3000 });
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error fetching campaign promotions:', error);
          this.snackBar.open('Error loading campaign promotions', 'Close', { duration: 3000 });
          this.isLoading.set(false);
        }
      });
  }

  refreshPromotions(): void {
    this.loadCampaignPromotions();
  }

  goBack(): void {
    this.router.navigate(['../../'], { relativeTo: this.route });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onStatusFilterChange(event: any): void {
    this.statusFilter.set(event.value);

    if (event.value === 'all') {
      this.dataSource.data = this.promotions();
    } else if (event.value === 'inactive') {
      this.dataSource.data = this.promotions().filter((promotion) => String(promotion.status) === 'accepted' && promotion.isActive === false);
    } else if (event.value === 'flagged') {
      this.dataSource.data = this.promotions().filter((promotion) => promotion.fraudStatus?.isFlagged);
    } else {
      this.dataSource.data = this.promotions().filter((promotion) => String(promotion.status) === event.value);
    }

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  clearFilters(): void {
    this.statusFilter.set('all');
    this.dataSource.data = this.promotions();
    this.dataSource.filter = '';

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  getPromotionsByStatus(status: string): PromotionInterface[] {
    if (status === 'inactive') {
      return this.promotions().filter((promotion) => String(promotion.status) === 'accepted' && promotion.isActive === false);
    }

    if (status === 'flagged') {
      return this.promotions().filter((promotion) => promotion.fraudStatus?.isFlagged);
    }

    return this.promotions().filter((promotion) => String(promotion.status) === status);
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

  viewPromotionDetails(promotion: PromotionInterface): void {
    this.dialog.open(PromotionDetailsComponent, {
      width: '90%',
      maxWidth: '1000px',
      data: { promotion }
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

  viewPromoterDetails(promotion: PromotionInterface): void {
    const promoterId = typeof promotion.promoter === 'string' ? promotion.promoter : promotion.promoter?._id;
    if (promoterId) {
      this.router.navigate(['/dashboard/users', promoterId]);
    }
  }
}
