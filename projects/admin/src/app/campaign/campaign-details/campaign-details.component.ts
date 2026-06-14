import { Component, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';

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
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTabsModule,
    MatDialogModule,
    MatMenuModule,
    MatProgressBarModule,
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

  ngOnInit(): void {
    this.adminService.fetchAdmin();
    this.loadCampaignDetails();
  }

  loadCampaignDetails(): void {
    const campaignId = this.route.snapshot.paramMap.get('id');
    if (!campaignId) { this.isLoading.set(false); return; }
    this.isLoading.set(true);
    this.campaignService.getCampaignById(campaignId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        if (response.success) { this.campaign.set(response.data); this.promotions.set(response.data.promotions || []); }
        else { this.snackBar.open('Failed to load campaign details', 'Close', { duration: 3000 }); }
        this.isLoading.set(false);
      },
      error: () => { this.snackBar.open('Error loading campaign details', 'Close', { duration: 3000 }); this.isLoading.set(false); }
    });
  }

  goBack(): void { this.router.navigate(['../'], { relativeTo: this.route }); }

  updateCampaignStatus(status: string): void {
    const c = this.campaign(); if (!c) return;
    this.campaignService.updateCampaignStatus(c._id, status, this.adminService.adminData()?._id || '')
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (r) => { if (r.success) { this.snackBar.open(`Campaign ${status}`, 'Close', { duration: 3000 }); this.loadCampaignDetails(); } else { this.snackBar.open(`Failed to ${status} campaign`, 'Close', { duration: 3000 }); } },
        error: () => this.snackBar.open('Error updating campaign status', 'Close', { duration: 3000 }),
      });
  }

  viewAdvertiserDetails(): void {
    const ownerId = this.campaign()?.owner?._id;
    if (ownerId) this.router.navigate(['/dashboard/users', ownerId]);
  }

  viewActivityLog(): void { this.selectedTabIndex.set(2); }

  viewPromotionDetails(promotion: PromotionInterface): void {
    this.dialog.open(PromotionDetailsComponent, { width: '90%', maxWidth: '1000px', data: { promotion } });
  }

  getTrackedClicks(p: PromotionInterface): number { return Number(p.clickStats?.totalClicks ?? 0); }
  getBillableClicks(p: PromotionInterface): number { return Number(p.clickStats?.billableClicks ?? 0); }
  getEarnedAmount(p: PromotionInterface): number { return Number(p.clickStats?.earnedAmount ?? p.payoutAmount ?? 0); }
  getLastActivity(p: PromotionInterface): string | Date | undefined { return p.clickStats?.lastClickAt || p.acceptedAt || p.paidAt || p.rejectedAt || p.updatedAt || p.createdAt; }

  getStatusPillClass(p: PromotionInterface): string {
    if (p.fraudStatus?.isFlagged) return 'flagged';
    if (String(p.status) === 'accepted' && p.isActive === false) return 'inactive';
    return String(p.status || 'accepted');
  }

  getStatusLabel(p: PromotionInterface): string {
    if (p.fraudStatus?.isFlagged) return 'Under Review';
    if (String(p.status) === 'accepted' && p.isActive === false) return 'Inactive Link';
    if (String(p.status) === 'accepted') return 'Active Link';
    if (String(p.status) === 'paid') return 'Legacy Paid';
    if (String(p.status) === 'rejected') return 'Rejected';
    return String(p.status || 'Promotion');
  }

  budgetPercent(): number {
    const c = this.campaign(); if (!c || !c.budget) return 0;
    return Math.min(100, ((c.spentBudget || 0) / c.budget) * 100);
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
