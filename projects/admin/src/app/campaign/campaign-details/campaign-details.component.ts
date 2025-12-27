import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Subscription, takeUntil } from 'rxjs';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';

// Services
import { CampaignService } from '../campaign.service';
import { AdminService } from '../../common/services/user.service';
import { CampaignInterface, PromotionInterface } from '../../../../../shared-services/src/public-api';
import { PromotionDetailsComponent } from '../../promotion/promotion-details/promotion-details.component';
import { PromotionProofComponent } from '../../promotion/promotion-proof/promotion-proof.component';

// Interfaces
//import { Campaign, Promotion, ActivityLog } from '../campaign-mgt/campaign-mgt.component';

@Component({
  selector: 'admin-campaign-details',
  standalone: true,
  providers: [DatePipe, CurrencyPipe, CampaignService],
  imports: [
    CommonModule,
    // Material Modules
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
    MatProgressBarModule,
    MatExpansionModule,
    MatListModule,
  ],
  templateUrl: './campaign-details.component.html',
  styleUrls: ['./campaign-details.component.scss'],
})
export class CampaignDetailsComponent implements OnInit, OnDestroy {
  readonly campaignService = inject(CampaignService);
  readonly dialog = inject(MatDialog);
  readonly adminService = inject(AdminService);
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  // Signals for state management
  isLoading = signal(true);
  campaign = signal<CampaignInterface | null>(null);
  promotions = signal<PromotionInterface[]>([]);
  public readonly api = this.campaignService.api;

  // Table properties for promotions
  promotionsColumns: string[] = ['promoter', 'status', 'views', 'submitted', 'actions'];
  promotionsDataSource: MatTableDataSource<PromotionInterface> = new MatTableDataSource<PromotionInterface>([]);

  ngOnInit(): void {
    this.adminService.fetchAdmin;

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
            //console.log('campaign ', response.data);
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
      })
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
            this.loadCampaignDetails(); // Reload to get updated data
          } else {
            this.snackBar.open(`Failed to ${status} campaign`, 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error updating campaign status:', error);
          this.snackBar.open('Error updating campaign status', 'Close', { duration: 3000 });
        }
      })
  }

  viewAdvertiserDetails(): void {
    const campaign = this.campaign();
    if (!campaign) return;
    
    this.router.navigate(['/dashboard/users', campaign.owner._id]);
  }

  viewActivityLog(): void {
    // This could open a dialog or navigate to a dedicated activity log page
    this.snackBar.open('Activity log feature coming soon', 'Close', { duration: 3000 });
  }

  viewPromotionProof(promotion: PromotionInterface): void {
    // This would open a dialog with the proof images
    //this.snackBar.open('View proof feature coming soon', 'Close', { duration: 3000 });

    this.dialog.open(PromotionProofComponent, {
      width: '90%',
      maxWidth: '1200px',
      data: { promotion: promotion }
    });
  }

  validatePromotion(promotion: PromotionInterface): void {
      this.campaignService.updatePromotionStatus(promotion._id, 'validated', this.adminService.adminData()?._id || '')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Promotion validated successfully', 'Close', { duration: 3000 });
            this.loadCampaignDetails(); // Reload to get updated data
          } else {
            this.snackBar.open('Failed to validate promotion', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error validating promotion:', error);
          this.snackBar.open('Error validating promotion', 'Close', { duration: 3000 });
        }
      })
  }

  rejectPromotion(promotion: PromotionInterface): void {
      this.campaignService.updatePromotionStatus(promotion._id, 'rejected', this.adminService.adminData()?._id || '')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Promotion rejected successfully', 'Close', { duration: 3000 });
            this.loadCampaignDetails(); // Reload to get updated data
          } else {
            this.snackBar.open('Failed to reject promotion', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error rejecting promotion:', error);
          this.snackBar.open('Error rejecting promotion', 'Close', { duration: 3000 });
        }
      })
  }

  markAsPaid(promotion: PromotionInterface): void {
      this.campaignService.updatePromotionStatus(promotion._id, 'paid', this.adminService.adminData()?._id || '')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Promotion marked as paid successfully', 'Close', { duration: 3000 });
            this.loadCampaignDetails(); // Reload to get updated data
          } else {
            this.snackBar.open('Failed to mark promotion as paid', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error marking promotion as paid:', error);
          this.snackBar.open('Error marking promotion as paid', 'Close', { duration: 3000 });
        }
      })
  }

  viewPromotionDetails(promotion: PromotionInterface): void {
    // This could open a dialog with promotion details
    //this.snackBar.open('Promotion details feature coming soon', 'Close', { duration: 3000 });

    this.dialog.open(PromotionDetailsComponent, {
      width: '90%',
      maxWidth: '1000px',
      data: { promotion }
    });
  }

 
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}