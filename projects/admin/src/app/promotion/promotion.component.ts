import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Clipboard } from '@angular/cdk/clipboard';

import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { CampaignService } from '../campaign/campaign.service';
import { PromotionService } from './promotion.service';
import { AdminService } from '../common/services/user.service';
import { CampaignInterface, PromotionInterface } from '../../../../shared-services/src/public-api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PromotionDetailsComponent } from './promotion-details/promotion-details.component';

@Component({
  selector: 'admin-campaign-promotions',
  standalone: true,
  providers: [DatePipe, CurrencyPipe, CampaignService, PromotionService],
  imports: [
    CommonModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatIconModule, MatButtonModule, MatCardModule, MatTooltipModule,
    MatChipsModule, MatProgressSpinnerModule, MatSnackBarModule,
    MatDialogModule, MatMenuModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatProgressBarModule,
  ],
  templateUrl: './promotion.component.html',
  styleUrls: ['./promotion.component.scss'],
})
export class CampaignPromotionsComponent {
  readonly campaignService = inject(CampaignService);
  readonly promotionService = inject(PromotionService);
  readonly adminService = inject(AdminService);
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly snackBar = inject(MatSnackBar);
  readonly dialog = inject(MatDialog);
  readonly clipboard = inject(Clipboard);
  private readonly destroyRef = inject(DestroyRef);

  readonly isLoading = signal(true);
  readonly campaign = signal<CampaignInterface | null>(null);
  readonly promotions = signal<PromotionInterface[]>([]);
  readonly statusFilter = signal<string>('all');

  readonly pageSize = signal(50);
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);

  activeMenuPromotion: PromotionInterface | null = null;

  readonly dataSource = new MatTableDataSource<PromotionInterface>([]);

  readonly activeLinks = computed(() =>
    this.promotions().filter(p => String(p.status) === 'accepted' && p.isActive !== false).length
  );

  readonly inactiveLinks = computed(() =>
    this.promotions().filter(p => String(p.status) === 'accepted' && p.isActive === false).length
  );

  readonly flaggedLinks = computed(() =>
    this.promotions().filter(p => p.fraudStatus?.isFlagged).length
  );

  readonly billableClicks = computed(() =>
    this.promotions().reduce((sum, p) => sum + Number(p.clickStats?.billableClicks ?? 0), 0)
  );

  readonly earnedAmount = computed(() =>
    this.promotions().reduce((sum, p) => sum + Number(p.clickStats?.earnedAmount ?? p.payoutAmount ?? 0), 0)
  );

  readonly pageNumbers = computed(() => {
    const total = Math.max(1, this.totalPages());
    const current = this.currentPage();
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });

  ngOnInit(): void {
    this.adminService.fetchAdmin();
    this.loadCampaignPromotions();
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
            const promotions = response.data.promotions || [];
            this.promotions.set(promotions);
            this.dataSource.data = promotions;
            this.totalPages.set(Math.ceil(promotions.length / this.pageSize()) || 1);
          } else {
            this.snackBar.open('Failed to load campaign promotions', 'Close', { duration: 3000 });
          }
          this.isLoading.set(false);
        },
        error: () => {
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
  }

  onStatusFilterChange(event: any, value: string): void {
    this.statusFilter.set(value);

    if (value === 'all') {
      this.dataSource.data = this.promotions();
    } else if (value === 'inactive') {
      this.dataSource.data = this.promotions().filter(p => String(p.status) === 'accepted' && p.isActive === false);
    } else if (value === 'flagged') {
      this.dataSource.data = this.promotions().filter(p => p.fraudStatus?.isFlagged);
    } else {
      this.dataSource.data = this.promotions().filter(p => String(p.status) === value);
    }

    this.currentPage.set(1);
  }

  clearFilters(): void {
    this.statusFilter.set('all');
    this.dataSource.data = this.promotions();
    this.dataSource.filter = '';
    this.currentPage.set(1);
  }

  getStatusChipClass(promotion: PromotionInterface): string {
    if (promotion.fraudStatus?.isFlagged) return 'flagged';
    if (String(promotion.status) === 'accepted' && promotion.isActive === false) return 'inactive';
    return String(promotion.status || 'accepted');
  }

  getStatusLabel(promotion: PromotionInterface): string {
    if (promotion.fraudStatus?.isFlagged) return 'Under Review';
    if (String(promotion.status) === 'accepted' && promotion.isActive === false) return 'Inactive Link';
    if (String(promotion.status) === 'accepted') return 'Active Link';
    if (String(promotion.status) === 'paid') return 'Legacy Paid';
    if (String(promotion.status) === 'rejected') return 'Rejected';
    return String(promotion.status || 'Promotion');
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

  viewPromotionDetails(promotion: PromotionInterface): void {
    this.dialog.open(PromotionDetailsComponent, {
      width: '90%',
      maxWidth: '1000px',
      data: { promotion }
    });
  }

  copyPromotionLink(promotion: PromotionInterface): void {
    if (!promotion.promotionUrl) {
      this.snackBar.open('No tracking link available', 'Close', { duration: 3000 });
      return;
    }
    this.clipboard.copy(promotion.promotionUrl);
    this.snackBar.open('Tracking link copied', 'Close', { duration: 2400 });
  }

  openPromotionLink(promotion: PromotionInterface): void {
    if (!promotion.promotionUrl) {
      this.snackBar.open('No tracking link available', 'Close', { duration: 3000 });
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

  togglePromotionActive(promotion: PromotionInterface): void {
    const api = this.promotionService.api || '';
    fetch(`${api}/api/v1/campaign/admin/promotion/${promotion._id}/toggle-active`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          this.snackBar.open(data.message || 'Updated', 'Close', { duration: 2500 });
          this.loadCampaignPromotions();
        } else {
          this.snackBar.open(data.message || 'Failed', 'Close', { duration: 3000 });
        }
      })
      .catch(() => this.snackBar.open('Network error', 'Close', { duration: 3000 }));
  }

  toggleMenu(event: MouseEvent, promotion: PromotionInterface): void {
    event.stopPropagation();
    this.activeMenuPromotion = this.activeMenuPromotion?._id === promotion._id ? null : promotion;
  }

  closeMenu(): void { this.activeMenuPromotion = null; }

  goToPage(page: number): void {
    const target = Math.max(1, Math.min(page, Math.max(1, this.totalPages())));
    if (target === this.currentPage()) return;
    this.currentPage.set(target);
  }

  onPageInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const page = parseInt(input.value, 10);
    if (!isNaN(page) && page >= 1 && page <= this.totalPages()) {
      this.goToPage(page);
    }
    input.value = '';
  }
}
