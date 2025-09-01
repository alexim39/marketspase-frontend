import { Component, OnInit, inject, signal, computed, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { CampaignService } from '../campaign/campaign.service';
import { UserInterface, UserService } from '../common/services/user.service';
import { MatMenuModule } from '@angular/material/menu';
import { PromotionInterface } from '../common/models/promotions';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { CategoryPlaceholderPipe } from '../common/pipes/category-placeholder.pipe';
import { SubmitProofDialogComponent } from './submit-proof/submit-proof-dialog.component';
// import { CampaignService } from '../services/campaign.service';
// import { UserInterface } from '../../models/user.model';
// import { PromotionInterface } from '../../models/promotion.model';
// import { SubmitProofDialogComponent } from '../../components/submit-proof-dialog/submit-proof-dialog.component';

interface PromotionStats {
  total: number;
  pending: number;
  submitted: number;
  validated: number;
  paid: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
}

@Component({
  selector: 'app-promoter-campaigns',
  standalone: true,
  providers: [CampaignService],
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatTabsModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatMenuModule,
    CategoryPlaceholderPipe
  ],
  templateUrl: './promoter-campaign.component.html',
  styleUrls: ['./promoter-campaign.component.scss']
})
export class PromoterCampaignsComponent implements OnInit {
  private campaignService = inject(CampaignService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // State signals
  isLoading = signal(true);
  selectedTab = signal(0);
  promotions = signal<PromotionInterface[]>([]);
  private userService = inject(UserService);
  // Expose the signal directly to the template
  public user: Signal<UserInterface | null> = this.userService.user;
  public readonly api = this.campaignService.api;

  // Computed values
  filteredPromotions = computed(() => {
    const statusFilter = this.getStatusFilter(this.selectedTab());
    return this.promotions().filter(p => 
      statusFilter === 'all' || p.status === statusFilter
    );
  });

  stats = computed<PromotionStats>(() => {
    const promotions = this.promotions();
    return {
      total: promotions.length,
      pending: promotions.filter(p => p.status === 'pending').length,
      submitted: promotions.filter(p => p.status === 'submitted').length,
      validated: promotions.filter(p => p.status === 'validated').length,
      paid: promotions.filter(p => p.status === 'paid').length,
      totalEarnings: promotions
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + (p.payoutAmount || 0), 0),
      pendingEarnings: promotions
        .filter(p => p.status === 'validated')
        .reduce((sum, p) => sum + (p.payoutAmount || 0), 0),
      paidEarnings: promotions
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + (p.payoutAmount || 0), 0)
    };
  });

  ngOnInit(): void {
    this.loadUserPromotions();
  }

  private loadUserPromotions(): void {
    this.isLoading.set(true);
    this.campaignService.getUserPromotions(this.user()!._id).subscribe({
      next: (response) => {
        this.promotions.set(response.data);
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        let errorMessage = 'Server error occurred, please try again.';
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        }
        this.snackBar.open(errorMessage, 'Ok', { duration: 3000 });
        this.isLoading.set(false);
      }
    });
  }

  private getStatusFilter(tabIndex: number): string {
    const filters = ['all', 'pending', 'submitted', 'validated', 'paid'];
    return filters[tabIndex] || 'all';
  }

  onTabChange(tabIndex: number): void {
    this.selectedTab.set(tabIndex);
  }

  openSubmitProofDialog(promotion: PromotionInterface): void {
    const dialogRef = this.dialog.open(SubmitProofDialogComponent, {
      width: '100%',
      maxWidth: '500px',
      data: { promotion }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'submitted') {
        this.loadUserPromotions(); // Refresh data
      }
    });
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      pending: 'warning',
      submitted: 'info',
      validated: 'success',
      paid: 'primary',
      rejected: 'error'
    };
    return colors[status] || 'default';
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      pending: 'schedule',
      submitted: 'pending_actions',
      validated: 'check_circle',
      paid: 'paid',
      rejected: 'cancel'
    };
    return icons[status] || 'help';
  }

  getDaysRemaining(endDate: Date): number {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  isSubmissionExpired(promotion: PromotionInterface): boolean {
    if (!promotion.campaign.endDate) return false;
    return this.getDaysRemaining(promotion.campaign.endDate) <= 0;
  }

  trackByPromotionId(index: number, promotion: PromotionInterface): string {
    return promotion._id;
  }
}