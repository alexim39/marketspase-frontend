import { Component, inject, OnInit, OnDestroy, ViewChild, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

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
import { CampaignService } from './campaign.service';
import { AdminService } from '../common/services/user.service';

// Interfaces
//import { Campaign, Promotion } from '../campaign-mgt/campaign-mgt.component';

// Components
import { ProofViewDialogComponent } from './proof-view-dialog.component';
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
  template: `
    <div class="admin-promotions-container">
      <!-- Header Section with Back Button -->
      <div class="header-section">
        <button mat-button (click)="goBack()" class="back-button">
          <mat-icon>arrow_back</mat-icon>
          Back to Campaign
        </button>
        
        <div class="header-title">
          <h1 class="page-title">Campaign Promotions</h1>
          <p class="page-subtitle" *ngIf="campaign()">Managing promotions for: {{ campaign()?.title }}</p>
        </div>
        
        <div class="header-actions">
          <button mat-button (click)="refreshPromotions()" matTooltip="Refresh">
            <mat-icon>refresh</mat-icon>
            Refresh
          </button>
        </div>
      </div>

      <!-- Stats Overview -->
      <div class="stats-overview" *ngIf="campaign()">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon">groups</mat-icon>
              <div class="stat-details">
                <span class="stat-value">{{ promotions().length }}</span>
                <span class="stat-label">Total Promotions</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
        
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon submitted">schedule</mat-icon>
              <div class="stat-details">
                <span class="stat-value">{{ getPromotionsByStatus('submitted').length }}</span>
                <span class="stat-label">Pending Review</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
        
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon validated">check_circle</mat-icon>
              <div class="stat-details">
                <span class="stat-value">{{ getPromotionsByStatus('validated').length }}</span>
                <span class="stat-label">Validated</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
        
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon paid">payments</mat-icon>
              <div class="stat-details">
                <span class="stat-value">{{ getPromotionsByStatus('paid').length }}</span>
                <span class="stat-label">Paid</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
        
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon rejected">cancel</mat-icon>
              <div class="stat-details">
                <span class="stat-value">{{ getPromotionsByStatus('rejected').length }}</span>
                <span class="stat-label">Rejected</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Filters Card -->
      <mat-card class="filters-card">
        <mat-card-content>
          <div class="filters-container">
            <mat-form-field appearance="outline" class="filter-field search-field">
              <mat-label>Search Promotions</mat-label>
              <input matInput (keyup)="applyFilter($event)" placeholder="Search by promoter name, email" #input>
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Status</mat-label>
              <mat-select [value]="statusFilter()" (selectionChange)="onStatusFilterChange($event)">
                <div style="background-color: black;">
                  <mat-option value="all">All Statuses</mat-option>
                  <mat-option value="pending">Pending</mat-option>
                  <mat-option value="submitted">Submitted</mat-option>
                  <mat-option value="validated">Validated</mat-option>
                  <mat-option value="rejected">Rejected</mat-option>
                  <mat-option value="paid">Paid</mat-option>
                </div>
              </mat-select>
            </mat-form-field>
            
            <button mat-button (click)="clearFilters()" class="clear-filters-btn">
              <mat-icon>clear</mat-icon>
              Clear Filters
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Promotions Table -->
      <mat-card class="table-card">
        <mat-card-content>
          <div class="table-container">
            @if (isLoading()) {
              <div class="loading-spinner">
                <mat-spinner diameter="40"></mat-spinner>
                <p>Loading promotions...</p>
              </div>
            } @else if (promotions().length === 0) {
              <div class="no-data">
                <mat-icon>groups</mat-icon>
                <p>No promotions found for this campaign</p>
              </div>
            } @else {
              <table mat-table [dataSource]="dataSource" matSort class="promotions-table">
                <!-- Promoter Column -->
                <ng-container matColumnDef="promoter">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header> Promoter </th>
                  <td mat-cell *matCellDef="let promotion">
                    <div class="promoter-info">
                      <span class="promoter-name">{{ campaign()?.owner.displayName }}</span>
                      <span class="promoter-username">@{{ campaign()?.owner.username }}</span>
                      <span class="promoter-email">{{ campaign()?.owner.email }}</span>
                    </div>
                  </td>
                </ng-container>

                <!-- Status Column -->
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header> Status </th>
                  <td mat-cell *matCellDef="let promotion">
                    <mat-chip 
                      [class]="promotion.status"
                      class="status-chip">
                      {{ promotion.status | titlecase }}
                    </mat-chip>
                  </td>
                </ng-container>

                <!-- Views Column -->
                <ng-container matColumnDef="views">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header> Views </th>
                  <td mat-cell *matCellDef="let promotion">
                    <div class="views-info">
                      <span class="views-count">{{ promotion.proofViews || 0 }}</span>
                      @if (campaign() && promotion.proofViews < campaign()!.minViewsPerPromotion && promotion.status === 'submitted') {
                        <span class="views-warning">(Minimum: {{ campaign()!.minViewsPerPromotion }})</span>
                      }
                    </div>
                  </td>
                </ng-container>

                <!-- Submitted Column -->
                <ng-container matColumnDef="submitted">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header> Submitted </th>
                  <td mat-cell *matCellDef="let promotion">
                    {{ promotion.submittedAt ? (promotion.submittedAt | date:'short') : 'Not submitted' }}
                  </td>
                </ng-container>

                <!-- Validated Column -->
                <ng-container matColumnDef="validated">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header> Validated </th>
                  <td mat-cell *matCellDef="let promotion">
                    {{ promotion.validatedAt ? (promotion.validatedAt | date:'short') : 'Not validated' }}
                  </td>
                </ng-container>

                <!-- Paid Column -->
                <ng-container matColumnDef="paid">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header> Paid </th>
                  <td mat-cell *matCellDef="let promotion">
                    {{ promotion.paidAt ? (promotion.paidAt | date:'short') : 'Not paid' }}
                  </td>
                </ng-container>

                <!-- Actions Column -->
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef> Actions </th>
                  <td mat-cell *matCellDef="let promotion">
                    <div class="action-buttons">
                      <button mat-icon-button 
                              matTooltip="View Proof"
                              (click)="viewProof(promotion)"
                              [disabled]="!promotion.proofMedia || promotion.proofMedia.length === 0">
                        <mat-icon>visibility</mat-icon>
                      </button>

                      <button mat-icon-button [matMenuTriggerFor]="menu" matTooltip="More Actions">
                        <mat-icon>more_vert</mat-icon>
                      </button>
                      
                      <mat-menu #menu="matMenu">
                        <div style="background-color: black;">
                        @if (promotion.status === 'submitted') {
                          <button mat-menu-item (click)="validatePromotion(promotion)" 
                                  [disabled]="promotion.proofViews < campaign()!.minViewsPerPromotion">
                            <mat-icon>check_circle</mat-icon>
                            <span>Validate</span>
                          </button>
                          <button mat-menu-item (click)="rejectPromotion(promotion)">
                            <mat-icon>cancel</mat-icon>
                            <span>Reject</span>
                          </button>
                        }
                        @if (promotion.status === 'validated') {
                          <button mat-menu-item (click)="markAsPaid(promotion)">
                            <mat-icon>payments</mat-icon>
                            <span>Mark as Paid</span>
                          </button>
                        }
                        @if (promotion.status === 'rejected') {
                          <button mat-menu-item (click)="reopenPromotion(promotion)">
                            <mat-icon>restart_alt</mat-icon>
                            <span>Re-open</span>
                          </button>
                        }
                        <button mat-menu-item (click)="viewPromoterDetails()">
                          <mat-icon>person</mat-icon>
                          <span>View Promoter</span>
                        </button>
                      </div>
                      </mat-menu>
                    </div>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

                <!-- Row shown when there's no matching data -->
                <tr class="mat-row" *matNoDataRow>
                  <td class="mat-cell no-data" [attr.colspan]="displayedColumns.length">
                    No promotions found matching "{{ input.value }}"
                  </td>
                </tr>
              </table>
            }
          </div>

          <mat-paginator [pageSizeOptions]="[10, 25, 50, 100]" showFirstLastButtons aria-label="Select page of promotions">
          </mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .admin-promotions-container {
      padding: 16px;
      max-width: 100%;
      box-sizing: border-box;
      background-color: #f5f5f5;
      color: rgba(0, 0, 0, 0.87);
      min-height: 100vh;
    }

    .header-section {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .back-button {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .header-title {
      flex: 1;
      min-width: 200px;
    }

    .page-title {
      font-size: 24px;
      font-weight: 500;
      margin: 0 0 4px 0;
      color: rgba(0, 0, 0, 0.87);
    }

    .page-subtitle {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.54);
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .stats-overview {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background-color: #ffffff;
    }

    .stat-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .stat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #3f51b5;
      
      &.submitted {
        color: #ff9800;
      }
      
      &.validated {
        color: #4caf50;
      }
      
      &.paid {
        color: #9c27b0;
      }
      
      &.rejected {
        color: #f44336;
      }
    }

    .stat-details {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 18px;
      font-weight: 600;
    }

    .stat-label {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.54);
    }

    .filters-card {
      margin-bottom: 24px;
      background-color: #ffffff;
    }

    .filters-container {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: center;
    }

    .filter-field {
      flex: 1 1 200px;
    }

    .search-field {
      flex: 2 1 300px;
    }

    .clear-filters-btn {
      white-space: nowrap;
    }

    .table-card {
      overflow: auto;
      background-color: #ffffff;
    }

    .table-container {
      min-height: 400px;
      position: relative;
    }

    .loading-spinner {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 50px 0;
    }

    .loading-spinner p {
      margin-top: 16px;
      color: rgba(0, 0, 0, 0.54);
    }

    .no-data {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 100px 0;
      color: rgba(0, 0, 0, 0.54);
      text-align: center;
    }

    .no-data mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }

    .promotions-table {
      width: 100%;
    }

    .promoter-info {
      display: flex;
      flex-direction: column;
    }

    .promoter-name {
      font-weight: 500;
    }

    .promoter-username, .promoter-email {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.54);
    }

    .status-chip {
      font-size: 12px;
      font-weight: 500;
      
      &.pending {
        background-color: #fff3e0;
        color: #ef6c00;
      }
      
      &.submitted {
        background-color: #e3f2fd;
        color: #1976d2;
      }
      
      &.validated {
        background-color: #e8f5e9;
        color: #2e7d32;
      }
      
      &.rejected {
        background-color: #ffebee;
        color: #c62828;
      }
      
      &.paid {
        background-color: #f3e5f5;
        color: #7b1fa2;
      }
    }

    .views-info {
      display: flex;
      flex-direction: column;
    }

    .views-count {
      font-weight: 500;
    }

    .views-warning {
      font-size: 11px;
      color: #f44336;
    }

    .action-buttons {
      display: flex;
      gap: 4px;
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
      .admin-promotions-container {
        padding: 8px;
      }

      .header-section {
        flex-direction: column;
        align-items: flex-start;
      }

      .header-title {
        width: 100%;
      }

      .header-actions {
        width: 100%;
        justify-content: flex-end;
      }

      .stats-overview {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      }

      .filters-container {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }

      .filter-field {
        width: 100%;
      }

      .promotions-table .mat-header-row {
        display: none;
      }

      .promotions-table .mat-row {
        flex-direction: column;
        align-items: start;
        padding: 8px 0;
        border-bottom: 1px solid #e0e0e0;
      }

      .promotions-table .mat-cell {
        border: none;
        padding: 4px 16px;
        width: 100%;
        box-sizing: border-box;
      }

      .promotions-table .mat-cell:before {
        content: attr(data-label);
        float: left;
        font-weight: 500;
        color: rgba(0, 0, 0, 0.54);
        margin-right: 8px;
      }

      .promotions-table .mat-cell:first-of-type {
        padding-top: 16px;
      }

      .promotions-table .mat-cell:last-of-type {
        padding-bottom: 16px;
      }

      .promotions-table .mat-column-actions {
        display: flex;
        justify-content: flex-end;
        width: 100%;
      }
      
      .action-buttons {
        justify-content: flex-end;
        width: 100%;
      }
    }

    /* For desktop - ensure proper table layout */
    @media (min-width: 769px) {
      .promotions-table .mat-column-promoter {
        min-width: 200px;
      }

      .promotions-table .mat-column-status {
        width: 120px;
      }

      .promotions-table .mat-column-views {
        width: 100px;
      }

      .promotions-table .mat-column-submitted {
        width: 150px;
      }

      .promotions-table .mat-column-validated {
        width: 150px;
      }

      .promotions-table .mat-column-paid {
        width: 150px;
      }

      .promotions-table .mat-column-actions {
        width: 100px;
      }
    }
  `],
})
export class CampaignPromotionsComponent implements OnInit, OnDestroy {
  readonly campaignService = inject(CampaignService);
  readonly adminService = inject(AdminService);
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly snackBar = inject(MatSnackBar);
  readonly dialog = inject(MatDialog);
  private subscriptions: Subscription = new Subscription();

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
    
    this.subscriptions.add(
      this.campaignService.getCampaignById(campaignId).subscribe({
        next: (response) => {
          if (response.success) {
            this.campaign.set(response.data);
            console.log('response ',response)
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
    );
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
    this.subscriptions.add(
      this.campaignService.updatePromotionStatus(promotion._id, 'validated').subscribe({
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
    );
  }

  rejectPromotion(promotion: PromotionInterface): void {
    this.subscriptions.add(
      this.campaignService.updatePromotionStatus(promotion._id, 'rejected').subscribe({
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
    );
  }

  markAsPaid(promotion: PromotionInterface): void {
    this.subscriptions.add(
      this.campaignService.updatePromotionStatus(promotion._id, 'paid').subscribe({
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
    );
  }

  reopenPromotion(promotion: PromotionInterface): void {
    this.subscriptions.add(
      this.campaignService.updatePromotionStatus(promotion._id, 'submitted').subscribe({
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
    );
  }

  viewPromoterDetails(): void {
    this.router.navigate(['/dashboard/users', this.campaign()?.owner._id]);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}