import { Component, inject, OnInit, OnDestroy, ViewChild, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Subscription, takeUntil } from 'rxjs';

// Angular Material imports
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

// Services
import { CampaignService } from '../campaign/campaign.service';
import { AdminService } from '../common/services/user.service';

// Interfaces
//import { Campaign, Promotion } from '../campaign-mgt/campaign-mgt.component';

// Components
import { ProofViewDialogComponent } from './proof-view-dialog/proof-view-dialog.component';
import { CampaignInterface, PromotionInterface } from '../../../../shared-services/src/public-api';

@Component({
  selector: 'admin-campaign-promotions',
  standalone: true,
  providers: [DatePipe, CurrencyPipe, CampaignService],
  imports: [
    CommonModule,
    // Material Modules
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
    MatProgressBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './promotion.component.html',
  styleUrls: ['./promotion.component.scss'],
})
export class CampaignPromotionsComponent implements OnInit, OnDestroy {
  readonly campaignService = inject(CampaignService);
  readonly adminService = inject(AdminService);
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly snackBar = inject(MatSnackBar);
  readonly dialog = inject(MatDialog);
  private destroy$ = new Subject<void>();

  // Signals for state management
  isLoading = signal(true);
  campaign = signal<CampaignInterface | null>(null);
  promotions = signal<PromotionInterface[]>([]);
  statusFilter = signal<string>('all');

  // Table properties
  displayedColumns: string[] = ['promoter', 'status', 'views', 'submitted', 'validated', 'paid', 'actions'];
  dataSource: MatTableDataSource<PromotionInterface> = new MatTableDataSource<PromotionInterface>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.loadCampaignPromotions();
  }

  ngAfterViewInit() {
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
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.campaign.set(response.data);
            //console.log('response ',response)
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
      })
  }

  refreshPromotions(): void {
    this.loadCampaignPromotions();
  }

  goBack(): void {
    this.router.navigate(['../../'], { relativeTo: this.route });
  }

  applyFilter(event: Event) {
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
    } else {
      this.dataSource.data = this.promotions().filter(p => p.status === event.value);
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
    return this.promotions().filter(p => p.status === status);
  }

  viewProof(promotion: PromotionInterface): void {
    if (!promotion.proofMedia || promotion.proofMedia.length === 0) {
      this.snackBar.open('No proof available for this promotion', 'Close', { duration: 3000 });
      return;
    }

    this.dialog.open(ProofViewDialogComponent, {
      width: '90%',
      maxWidth: '800px',
      data: {
        promotion: promotion,
        campaign: this.campaign()
      }
    });
  }

  validatePromotion(promotion: PromotionInterface): void {
      this.campaignService.updatePromotionStatus(promotion._id, 'validated')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Promotion validated successfully', 'Close', { duration: 3000 });
            this.loadCampaignPromotions(); // Reload to get updated data
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
      this.campaignService.updatePromotionStatus(promotion._id, 'rejected')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Promotion rejected successfully', 'Close', { duration: 3000 });
            this.loadCampaignPromotions(); // Reload to get updated data
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
      this.campaignService.updatePromotionStatus(promotion._id, 'paid')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Promotion marked as paid successfully', 'Close', { duration: 3000 });
            this.loadCampaignPromotions(); // Reload to get updated data
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

  reopenPromotion(promotion: PromotionInterface): void {
      this.campaignService.updatePromotionStatus(promotion._id, 'submitted')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Promotion re-opened successfully', 'Close', { duration: 3000 });
            this.loadCampaignPromotions(); // Reload to get updated data
          } else {
            this.snackBar.open('Failed to re-open promotion', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error re-opening promotion:', error);
          this.snackBar.open('Error re-opening promotion', 'Close', { duration: 3000 });
        }
      })
  }

  viewPromoterDetails(): void {
    this.router.navigate(['/dashboard/users', this.campaign()?.owner._id]);
  }

 
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}