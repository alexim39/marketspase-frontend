import { Component, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PromotionInterface, CampaignInterface } from '../../../../../shared-services/src/public-api';
import { PromotionProofComponent } from '../promotion-proof/promotion-proof.component';
import { CampaignService } from '../../campaign/campaign.service';

@Component({
  selector: 'admin-promotion-details',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatChipsModule
  ],
  providers: [DatePipe, CampaignService],
  templateUrl: './promotion-details.component.html',
  styleUrls: ['./promotion-details.component.scss']
})
export class PromotionDetailsComponent {
  readonly dialogRef = inject(MatDialogRef<PromotionDetailsComponent>);
  readonly data = inject<{ promotion: PromotionInterface }>(MAT_DIALOG_DATA);
  readonly campaignService = inject(CampaignService);
  readonly snackBar = inject(MatSnackBar);
  readonly dialog = inject(MatDialog);
  readonly datePipe = inject(DatePipe);
  readonly clipboard = inject(Clipboard);

  isLoading = signal(true);
  promotion = signal<PromotionInterface | null>(null);
  campaign = signal<CampaignInterface | null>(null);
  public readonly api = this.campaignService.api;

  ngOnInit(): void {
    this.promotion.set(this.data.promotion);
    this.loadCampaignDetails();
  }

  loadCampaignDetails(): void {
    const campaignId = this.promotion()?.campaign?._id as string | undefined;
    if (!campaignId) {
      this.isLoading.set(false);
      return;
    }

    this.campaignService.getCampaignById(campaignId)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.campaign.set(response.data);
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error fetching campaign details:', error);
          this.isLoading.set(false);
        }
      });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  viewProof(): void {
    if (!this.promotion()?.proofMedia?.length) {
      this.snackBar.open('No legacy proof files are attached to this promotion.', 'Close', { duration: 3000 });
      return;
    }

    this.dialog.open(PromotionProofComponent, {
      width: '90%',
      maxWidth: '1200px',
      data: { promotion: this.promotion() }
    });
  }

  copyTrackingLink(): void {
    const promotionUrl = this.promotion()?.promotionUrl;
    if (!promotionUrl) {
      this.snackBar.open('No tracking link is available for this promotion.', 'Close', { duration: 3000 });
      return;
    }

    this.clipboard.copy(promotionUrl);
    this.snackBar.open('Tracking link copied', 'Close', { duration: 2200 });
  }

  openTrackingLink(): void {
    const promotionUrl = this.promotion()?.promotionUrl;
    if (!promotionUrl) {
      this.snackBar.open('No tracking link is available for this promotion.', 'Close', { duration: 3000 });
      return;
    }

    window.open(promotionUrl, '_blank', 'noopener');
  }

  getStatusChipClass(): string {
    const promotion = this.promotion();
    if (promotion?.fraudStatus?.isFlagged) {
      return 'flagged';
    }

    if (String(promotion?.status) === 'accepted' && promotion?.isActive === false) {
      return 'inactive';
    }

    return String(promotion?.status || 'accepted');
  }

  getStatusLabel(): string {
    const promotion = this.promotion();
    if (promotion?.fraudStatus?.isFlagged) {
      return 'Under Review';
    }

    if (String(promotion?.status) === 'accepted' && promotion?.isActive === false) {
      return 'Inactive Link';
    }

    if (String(promotion?.status) === 'accepted') {
      return 'Active Link';
    }

    if (String(promotion?.status) === 'paid') {
      return 'Legacy Paid';
    }

    if (String(promotion?.status) === 'rejected') {
      return 'Rejected';
    }

    return String(promotion?.status || 'Promotion');
  }

  getTrackedClicks(): number {
    return Number(this.promotion()?.clickStats?.totalClicks ?? 0);
  }

  getBillableClicks(): number {
    return Number(this.promotion()?.clickStats?.billableClicks ?? 0);
  }

  getInvalidClicks(): number {
    const promotion = this.promotion();
    return Number(promotion?.clickStats?.invalidClicks ?? 0) + Number(promotion?.clickStats?.duplicateClicks ?? 0);
  }

  getEarnedAmount(): number {
    return Number(this.promotion()?.clickStats?.earnedAmount ?? this.promotion()?.payoutAmount ?? 0);
  }
}
