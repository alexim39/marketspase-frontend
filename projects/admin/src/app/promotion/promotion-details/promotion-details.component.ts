// promotion-details.component.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
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
import { AdminService } from '../../common/services/user.service';

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
export class PromotionDetailsComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<PromotionDetailsComponent>);
  readonly data = inject<{ promotion: PromotionInterface }>(MAT_DIALOG_DATA);
  readonly campaignService = inject(CampaignService);
  readonly snackBar = inject(MatSnackBar);
  readonly dialog = inject(MatDialog);
  readonly datePipe = inject(DatePipe);
  readonly adminService = inject(AdminService);

  isLoading = signal(true);
  promotion = signal<PromotionInterface | null>(null);
  campaign = signal<CampaignInterface | null>(null);
  public readonly api = this.campaignService.api;

  ngOnInit(): void {
    this.adminService.fetchAdmin;

    this.promotion.set(this.data.promotion);
    this.loadCampaignDetails();
  }

  loadCampaignDetails(): void {
    if (!this.promotion()?.campaign) {
      this.isLoading.set(false);
      return;
    }

    this.campaignService.getCampaignById(this.promotion()!.campaign._id as string)
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
    this.dialog.open(PromotionProofComponent, {
      width: '90%',
      maxWidth: '1200px',
      data: { promotion: this.promotion() }
    });
  }

  validatePromotion(): void {
    if (!this.promotion()) return;

    this.campaignService.updatePromotionStatus(this.promotion()!._id, 'validated', this.adminService.adminData()?._id || '')
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Promotion validated successfully', 'Close', { duration: 3000 });
            this.promotion.set({ ...this.promotion()!, status: 'validated', validatedAt: new Date() });
          } else {
            this.snackBar.open('Failed to validate promotion', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error validating promotion:', error);
          this.snackBar.open('Error validating promotion', 'Close', { duration: 3000 });
        }
      });
  }

  rejectPromotion(): void {
    if (!this.promotion()) return;

    // In a real implementation, you would open a dialog to get rejection reason
    const rejectionReason = prompt('Please enter rejection reason:');
    if (!rejectionReason) return;

    this.campaignService.updatePromotionStatus(this.promotion()!._id, 'rejected', rejectionReason, this.adminService.adminData()?._id || '')
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Promotion rejected successfully', 'Close', { duration: 3000 });
            this.promotion.set({ 
              ...this.promotion()!, 
              status: 'rejected', 
              rejectionReason 
            });
          } else {
            this.snackBar.open('Failed to reject promotion', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error rejecting promotion:', error);
          this.snackBar.open('Error rejecting promotion', 'Close', { duration: 3000 });
        }
      });
  }

  markAsPaid(): void {
    if (!this.promotion()) return;

    this.campaignService.updatePromotionStatus(this.promotion()!._id, 'paid', this.adminService.adminData()?._id || '')
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Promotion marked as paid successfully', 'Close', { duration: 3000 });
            this.promotion.set({ ...this.promotion()!, status: 'paid', paidAt: new Date() });
          } else {
            this.snackBar.open('Failed to mark promotion as paid', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error marking promotion as paid:', error);
          this.snackBar.open('Error marking promotion as paid', 'Close', { duration: 3000 });
        }
      });
  }
}