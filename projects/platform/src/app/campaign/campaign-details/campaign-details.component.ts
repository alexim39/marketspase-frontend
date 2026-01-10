// campaign-details.component.ts
import { Component, OnInit, inject, signal, computed, DestroyRef, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CampaignInterface, DeviceService, FormatCurrencyPipe, PromotionInterface, UserInterface } from '../../../../../shared-services/src/public-api';

import { ShortNumberPipe } from '../../common/pipes/short-number.pipe';
import { CategoryPlaceholderPipe } from '../../common/pipes/category-placeholder.pipe';
import { PromotionDetailsDialogComponent } from './promotion-details-dialog/promotion-details-dialog.component';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import { TruncateIDPipe } from './truncate-id.pipe';
import { CampaignDetailsService } from './campaign-details.service';
import { MediaViewerOnlyDialogComponent } from './media-viewer-dialog/media-viewer-dialog.component';
import { UserService } from '../../common/services/user.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export enum CampaignStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  ENDED = 'ended',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  EXHAUSTED = 'exhausted',
  EXPIRED = 'expired',
  DRAFT = 'draft',
  REJECTED = 'rejected'
}


@Component({
  selector: 'app-campaign-details',
  standalone: true,
  providers: [CampaignDetailsService],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    ShortNumberPipe,
    CategoryPlaceholderPipe,
    MatProgressBarModule,
    TruncateIDPipe
  ],
  templateUrl: './campaign-details.component.html',
  styleUrls: ['./campaign-details.component.scss']
})
export class CampaignDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private campaignDetailsService = inject(CampaignDetailsService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  campaign = signal<CampaignInterface | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);
  promotionSearchControl = new FormControl('');
  selectedStatusFilter = signal<string>('');
  private deviceService = inject(DeviceService);
  deviceType = computed(() => this.deviceService.type());
  
  // API base URL for media
  public readonly api = this.campaignDetailsService.api;

  private userService = inject(UserService);
  public user = this.userService.user;

  private readonly destroyRef = inject(DestroyRef);

  
  // Computed signal for filtered promotions
  filteredPromotions = computed(() => {
    const campaignData = this.campaign();
    if (!campaignData || !campaignData.promotions) return [];
    
    let promotions = [...campaignData.promotions];
    const searchTerm = this.promotionSearchControl.value?.toLowerCase() || '';
    const statusFilter = this.selectedStatusFilter();
    
    // Filter by search term
    if (searchTerm) {
      promotions = promotions.filter(p => 
        p.promoter?.displayName?.toLowerCase().includes(searchTerm) || 
        p.status.toLowerCase().includes(searchTerm)
      );
    }
    
    // Filter by status
    if (statusFilter) {
      promotions = promotions.filter(p => p.status === statusFilter);
    }
    
    return promotions;
  });

  ngOnInit() {
    this.loadCampaign();
    
    // Subscribe to search input changes
    this.promotionSearchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        // Filtering is handled by the computed signal
      });
  }

  loadCampaign() {
    this.isLoading.set(true);
    this.error.set(null);
    
    const campaignId = this.route.snapshot.paramMap.get('id');
    if (!campaignId) {
      this.error.set('Invalid campaign ID');
      this.isLoading.set(false);
      return;
    }
    
    this.campaignDetailsService.getCampaignById(campaignId).subscribe({
      next: (response) => {
        if (response.success) {
            //console.log('campaign ',response)
            this.campaign.set(response.data);
            this.isLoading.set(false);
        }
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load campaign');
        this.isLoading.set(false);
      }
    });
  }

  goBack() {
    this.router.navigate(['/dashboard/campaigns']);
  }

  editCampaign() {
    const campaign = this.campaign();
    if (campaign) {
      this.router.navigate(['/dashboard/campaigns/edit', campaign._id]);
    }
  }

  duplicateCampaign() {
    const campaign = this.campaign();
    if (campaign) {
    //   this.campaignService.duplicateCampaign(campaign._id).subscribe({
    //     next: (newCampaign) => {
    //       this.snackBar.open('Campaign duplicated successfully', 'Close', { duration: 3000 });
    //       this.router.navigate(['/marketer/campaigns/edit', newCampaign._id]);
    //     },
    //     error: (err) => {
    //       this.snackBar.open(err.message || 'Failed to duplicate campaign', 'Close', { duration: 3000 });
    //     }
    //   });
    }
  }

  toggleCampaignStatus() {
    const campaign = this.campaign();
    if (!campaign) return;
    
    const newStatus = campaign.status === CampaignStatus.ACTIVE ? CampaignStatus.PAUSED : CampaignStatus.ACTIVE;
    
    // this.campaignService.updateCampaignStatus(campaign._id, newStatus).subscribe({
    //   next: (updatedCampaign) => {
    //     this.campaign.set(updatedCampaign);
    //     this.snackBar.open(`Campaign ${newStatus} successfully`, 'Close', { duration: 3000 });
    //   },
    //   error: (err) => {
    //     this.snackBar.open(err.message || 'Failed to update campaign status', 'Close', { duration: 3000 });
    //   }
    // });
  }

  deleteCampaign() {
    const campaign = this.campaign();
    if (!campaign) return;
    
    if (confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
    //   this.campaignService.deleteCampaign(campaign._id).subscribe({
    //     next: () => {
    //       this.snackBar.open('Campaign deleted successfully', 'Close', { duration: 3000 });
    //       this.router.navigate(['/marketer/campaigns']);
    //     },
    //     error: (err) => {
    //       this.snackBar.open(err.message || 'Failed to delete campaign', 'Close', { duration: 3000 });
    //     }
    //   });
    }
  }

  getInitials(name: string | undefined): string {
    if (!name) return '?';
    return name.split(' ').map(part => part[0]).join('').toUpperCase().substring(0, 2);
  }

  getTotalViews(promotions: PromotionInterface[] | undefined): number {
    if (!promotions) return 0;
    return promotions.reduce((total, promotion) => total + (promotion.proofViews || 0), 0);
  }

  formatCurrency(amount: number | undefined): string {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      //currency: 'USD'
      currency: 'NGN'
    }).format(amount);
  }

  getProgressColor(percentage: number): string {
    if (percentage < 50) return 'success';
    if (percentage < 80) return 'warning';
    return 'danger';
  }

  updateStatusFilter(status: string) {
    this.selectedStatusFilter.set(status);
  }

  // Alternative approach in campaign-details.component.ts
  viewPromotionDetails(promotion: PromotionInterface) {
    const dialogRef = this.dialog.open(PromotionDetailsDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: { promotion }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'validated') {
        //this.validatePromotion(promotion);
      } else if (result === 'rejected') {
        //this.rejectPromotion(promotion);
      }
    });
  }

 /*  validatePromotion(promotion: PromotionInterface) {
    this.marketerService.validatePromotion(promotion._id).subscribe({
      next: (updatedPromotion) => {
        this.updatePromotionInList(updatedPromotion);
        this.snackBar.open('Promotion validated successfully', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open(err.message || 'Failed to validate promotion', 'Close', { duration: 3000 });
      }
    });
  } */

 /*  rejectPromotion(promotion: PromotionInterface) {
    const reason = prompt('Please enter the reason for rejection:');
    if (!reason) return;
    
    this.marketerService.rejectPromotion(promotion._id, reason).subscribe({
      next: (updatedPromotion) => {
        this.updatePromotionInList(updatedPromotion);
        this.snackBar.open('Promotion rejected successfully', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open(err.message || 'Failed to reject promotion', 'Close', { duration: 3000 });
      }
    });
  } */

  private updatePromotionInList(updatedPromotion: PromotionInterface) {
    const campaign = this.campaign();
    if (!campaign || !campaign.promotions) return;
    
    const index = campaign.promotions.findIndex(p => p._id === updatedPromotion._id);
    if (index !== -1) {
      campaign.promotions[index] = updatedPromotion;
      this.campaign.set({...campaign});
    }
  }

  // viewMedia(mediaUrl: string | undefined) {
  //   if (!mediaUrl) return;
  //   window.open(mediaUrl, '_blank');
  // }

  viewMedia(mediaUrl: string | undefined) {
    if (!mediaUrl) return;

    console.log('Viewing media URL:', mediaUrl);

    // basic media type detection
    const isVideo = /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(mediaUrl) || /youtube\.com|youtu\.be|vimeo\.com/.test(mediaUrl);
    const mediaType = isVideo ? (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(mediaUrl) ? 'video' : 'embed') : 'image';

    this.dialog.open(MediaViewerOnlyDialogComponent, {
      data: {
        url: mediaUrl,
        mediaType,
        title: this.campaign()?.title || undefined
      },
      width: '90vw',
      maxWidth: '900px',
      panelClass: 'media-viewer-dialog-panel'
    });
  }

  pauseCampaign(campaign: CampaignInterface): void {
      this.campaignDetailsService.updateCampaignStatus(campaign._id, 'paused', this.user()?._id || '')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Campaign paused successfully', 'Close', { duration: 3000 });
            this.loadCampaign();
          } else {
            this.snackBar.open('Failed to pause campaign', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error pausing campaign:', error);
          this.snackBar.open('Error pausing campaign', 'Close', { duration: 3000 });
        }
      })
  }

  resumeCampaign(campaign: CampaignInterface): void {
      this.campaignDetailsService.updateCampaignStatus(campaign._id, 'active', this.user()?._id || '')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Campaign resumed successfully', 'Close', { duration: 3000 });
            this.loadCampaign();
          } else {
            this.snackBar.open('Failed to resume campaign', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error resuming campaign:', error);
          this.snackBar.open('Error resuming campaign', 'Close', { duration: 3000 });
        }
      })
  }
  
}