import { Component, inject, OnInit, OnDestroy, ViewChild, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';

// Angular Material imports
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import {MatProgressBarModule} from '@angular/material/progress-bar';
// Services
import { CampaignService } from './campaign.service';
import { Router } from '@angular/router';
import { AdminService } from '../common/services/user.service';
import { CampaignInterface } from '../../../../shared-services/src/public-api';

export interface ActivityLog {
  action: string;
  timestamp: string;
  details: string;
}

@Component({
  selector: 'admin-campaign-mgt',
  standalone: true,
  providers: [CampaignService, DatePipe, CurrencyPipe],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // Material Modules
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTooltipModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatExpansionModule,
    MatMenuModule,
    MatBadgeModule,
    MatProgressBarModule
  ],
  template: `
    <div class="admin-campaigns-container">
      <!-- Header Section -->
      <div class="header-section">
        <h1 class="page-title">Campaign Management</h1>
        <p class="page-subtitle">Manage all campaigns on the platform</p>
        
        <!-- Stats Overview -->
        <div class="stats-overview">
          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-content">
                <mat-icon class="stat-icon">campaign</mat-icon>
                <div class="stat-details">
                  <span class="stat-value">{{ totalCampaigns() }}</span>
                  <span class="stat-label">Total Campaigns</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
          
          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-content">
                <mat-icon class="stat-icon active">play_arrow</mat-icon>
                <div class="stat-details">
                  <span class="stat-value">{{ activeCampaigns() }}</span>
                  <span class="stat-label">Active</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
          
          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-content">
                <mat-icon class="stat-icon pending">schedule</mat-icon>
                <div class="stat-details">
                  <span class="stat-value">{{ pendingCampaigns() }}</span>
                  <span class="stat-label">Pending</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
          
          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-content">
                <mat-icon class="stat-icon completed">check_circle</mat-icon>
                <div class="stat-details">
                  <span class="stat-value">{{ completedCampaigns() }}</span>
                  <span class="stat-label">Completed</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <!-- Filters Card -->
      <mat-card class="filters-card">
        <mat-card-content>
          <div class="filters-container">
            <mat-form-field appearance="outline" class="filter-field search-field">
              <mat-label>Search Campaigns</mat-label>
              <input matInput (keyup)="applyFilter($event)" placeholder="Search by title, owner, category" #input>
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Status</mat-label>
              <mat-select [formControl]="filtersForm.controls.status" multiple>
                <div style="background-color: black;">
                  <mat-option value="active">Active</mat-option>
                  <mat-option value="paused">Paused</mat-option>
                  <mat-option value="rejected">Rejected</mat-option>
                  <mat-option value="completed">Completed</mat-option>
                  <mat-option value="exhausted">Exhausted</mat-option>
                  <mat-option value="expired">Expired</mat-option>
                  <mat-option value="pending">Pending</mat-option>
                </div>
              </mat-select>
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Category</mat-label>
              <mat-select [formControl]="filtersForm.controls.category" multiple>
                <div style="background-color: black;">
                  @for (category of categories(); track category) {
                    <mat-option [value]="category">{{ category }}</mat-option>
                  }
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

      <!-- Campaigns Table -->
      <mat-card class="table-card">
        <mat-card-content>
          <div class="table-container">
            @if (isLoading()) {
              <div class="loading-spinner">
                <mat-spinner diameter="40"></mat-spinner>
                <p>Loading campaigns...</p>
              </div>
            } @else {
              <table mat-table [dataSource]="dataSource" matSort class="campaigns-table">
                <!-- Title Column -->
                <ng-container matColumnDef="title">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header> Campaign </th>
                  <td mat-cell *matCellDef="let campaign">
                    <div class="campaign-info">
                      <span class="campaign-title">{{ campaign.title }}</span>
                      <span class="campaign-category">{{ campaign.category }}</span>
                    </div>
                  </td>
                </ng-container>

                <!-- Owner Column -->
                <ng-container matColumnDef="owner">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header> Advertiser </th>
                  <td mat-cell *matCellDef="let campaign">
                    <div class="owner-info">
                      <span class="owner-name">{{ campaign.owner.displayName }}</span>
                      <span class="owner-email">{{ campaign.owner.email }}</span>
                    </div>
                  </td>
                </ng-container>

                <!-- Budget Column -->
                <ng-container matColumnDef="budget">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header> Budget </th>
                  <td mat-cell *matCellDef="let campaign">
                    <div class="budget-info">
                      <span class="budget-amount">{{ campaign.budget | currency:'NGN':'₦' }}</span>
                      <span class="payout-amount">Payout: {{ campaign.payoutPerPromotion | currency:'NGN':'₦' }}</span>
                    </div>
                  </td>
                </ng-container>

                <!-- Promoters Column -->
                <ng-container matColumnDef="promoters">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header> Promoters </th>
                  <td mat-cell *matCellDef="let campaign">
                    <div class="promoters-info">
                      <span class="promoters-count">{{ campaign.currentPromoters }} / {{ campaign.maxPromoters }}</span>
                      <mat-progress-bar 
                        mode="determinate" 
                        [value]="(campaign.currentPromoters / campaign.maxPromoters) * 100"
                        class="promoters-progress">
                      </mat-progress-bar>
                    </div>
                  </td>
                </ng-container>

                <!-- Status Column -->
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header> Status </th>
                  <td mat-cell *matCellDef="let campaign">
                    <mat-chip 
                      [class]="campaign.status"
                      class="status-chip">
                      {{ campaign.status | titlecase }}
                    </mat-chip>
                  </td>
                </ng-container>

                <!-- Dates Column -->
                <ng-container matColumnDef="dates">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header> Timeline </th>
                  <td mat-cell *matCellDef="let campaign">
                    <div class="dates-info">
                      <span class="date-start">Start: {{ campaign.startDate | date:'shortDate' }}</span>
                      @if (campaign.endDate) {
                        <span class="date-end">End: {{ campaign.endDate | date:'shortDate' }}</span>
                      }
                    </div>
                  </td>
                </ng-container>

                <!-- Actions Column -->
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef> Actions </th>
                  <td mat-cell *matCellDef="let campaign">
                    <div class="action-buttons">
                      <button mat-icon-button 
                              matTooltip="View Details"
                              (click)="viewCampaignDetails(campaign)">
                        <mat-icon>visibility</mat-icon>
                      </button>

                      <button mat-icon-button [matMenuTriggerFor]="menu" matTooltip="More Actions">
                        <mat-icon>more_vert</mat-icon>
                      </button>
                      
                      <mat-menu #menu="matMenu" >
                      <div style="background-color: black !important;">
                        @if (campaign.status === 'pending') {
                          <button mat-menu-item (click)="approveCampaign(campaign)">
                            <mat-icon>check_circle</mat-icon>
                            <span>Approve</span>
                          </button>
                          <button mat-menu-item (click)="rejectCampaign(campaign)">
                            <mat-icon>cancel</mat-icon>
                            <span>Reject</span>
                          </button>
                        }
                        @if (campaign.status === 'active') {
                          <button mat-menu-item (click)="pauseCampaign(campaign)">
                            <mat-icon>pause_circle</mat-icon>
                            <span>Pause</span>
                          </button>
                        }
                        @if (campaign.status === 'paused') {
                          <button mat-menu-item (click)="resumeCampaign(campaign)">
                            <mat-icon>play_circle</mat-icon>
                            <span>Resume</span>
                          </button>
                        }
                        <button mat-menu-item (click)="viewPromotions(campaign)">
                          <mat-icon>groups</mat-icon>
                          <span>View Promotions</span>
                        </button>
                        <button mat-menu-item (click)="viewActivityLog(campaign)">
                          <mat-icon>history</mat-icon>
                          <span>Activity Log</span>
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
                    No campaigns found matching your criteria
                  </td>
                </tr>
              </table>
            }
          </div>

          <mat-paginator [pageSizeOptions]="[10, 25, 50, 100]" showFirstLastButtons aria-label="Select page of campaigns">
          </mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .admin-campaigns-container {
      padding: 16px;
      max-width: 100%;
      box-sizing: border-box;
      background-color: #f5f5f5;
      color: rgba(0, 0, 0, 0.87);
      min-height: 100vh;
    }

    .header-section {
      margin-bottom: 24px;
    }

    .page-title {
      font-size: 24px;
      font-weight: 500;
      margin: 0 0 8px 0;
      color: rgba(0, 0, 0, 0.87);
    }

    .page-subtitle {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.54);
      margin: 0 0 24px 0;
    }

    .stats-overview {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
      
      &.active {
        color: #4caf50;
      }
      
      &.pending {
        color: #ff9800;
      }
      
      &.completed {
        color: #9c27b0;
      }
    }

    .stat-details {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 20px;
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

    .campaigns-table {
      width: 100%;
    }

    .campaign-info {
      display: flex;
      flex-direction: column;
    }

    .campaign-title {
      font-weight: 500;
    }

    .campaign-category {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.54);
    }

    .owner-info {
      display: flex;
      flex-direction: column;
    }

    .owner-name {
      font-weight: 500;
    }

    .owner-email {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.54);
    }

    .budget-info {
      display: flex;
      flex-direction: column;
    }

    .budget-amount {
      font-weight: 500;
    }

    .payout-amount {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.54);
    }

    .promoters-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .promoters-count {
      font-weight: 500;
    }

    .promoters-progress {
      height: 6px;
      border-radius: 3px;
    }

    .status-chip {
      font-size: 12px;
      font-weight: 500;
      
      &.active {
        background-color: #e8f5e9;
        color: #2e7d32;
      }
      
      &.paused {
        background-color: #fff3e0;
        color: #ef6c00;
      }
      
      &.completed, &.exhausted {
        background-color: #f3e5f5;
        color: #7b1fa2;
      }
      
      &.expired {
        background-color: #ffebee;
        color: #c62828;
      }

      &.rejected {
        background-color: #ffebee;
        color: #591a1aff;
      }
      
      &.pending {
        background-color: #e3f2fd;
        color: #1976d2;
      }
    }

    .dates-info {
      display: flex;
      flex-direction: column;
    }

    .date-start, .date-end {
      font-size: 12px;
    }

    .action-buttons {
      display: flex;
      gap: 4px;
    }

    .no-data {
      text-align: center;
      padding: 24px;
      color: rgba(0, 0, 0, 0.54);
      font-style: italic;
    }

    .mat-row, .mat-header-row {
      min-height: 56px;
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
      .admin-campaigns-container {
        padding: 8px;
      }

      .stats-overview {
        grid-template-columns: 1fr 1fr;
      }

      .filters-container {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }

      .filter-field {
        width: 100%;
      }

      .campaigns-table .mat-header-row {
        display: none;
      }

      .campaigns-table .mat-row {
        flex-direction: column;
        align-items: start;
        padding: 8px 0;
        border-bottom: 1px solid #e0e0e0;
      }

      .campaigns-table .mat-cell {
        border: none;
        padding: 4px 16px;
        width: 100%;
        box-sizing: border-box;
      }

      .campaigns-table .mat-cell:before {
        content: attr(data-label);
        float: left;
        font-weight: 500;
        color: rgba(0, 0, 0, 0.54);
        margin-right: 8px;
      }

      .campaigns-table .mat-cell:first-of-type {
        padding-top: 16px;
      }

      .campaigns-table .mat-cell:last-of-type {
        padding-bottom: 16px;
      }

      .campaigns-table .mat-column-actions {
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
      .campaigns-table .mat-column-title {
        min-width: 200px;
      }

      .campaigns-table .mat-column-owner {
        min-width: 180px;
      }

      .campaigns-table .mat-column-budget {
        width: 120px;
      }

      .campaigns-table .mat-column-promoters {
        width: 120px;
      }

      .campaigns-table .mat-column-status {
        width: 100px;
      }

      .campaigns-table .mat-column-dates {
        width: 140px;
      }

      .campaigns-table .mat-column-actions {
        width: 80px;
      }
    }
  `],
})
export class CampaignMgtComponent implements OnInit, OnDestroy {
  readonly adminService = inject(AdminService);
  readonly campaignService = inject(CampaignService);
  readonly router = inject(Router);
  readonly snackBar = inject(MatSnackBar);
  readonly fb = inject(FormBuilder);
  private subscriptions: Subscription = new Subscription();

  // Signals for state management
  isLoading = signal(true);
  totalCampaigns = signal(0);
  activeCampaigns = signal(0);
  pendingCampaigns = signal(0);
  completedCampaigns = signal(0);
  categories = signal<string[]>([]);

  // Table properties
  displayedColumns: string[] = ['title', 'owner', 'budget', 'promoters', 'status', 'dates', 'actions'];
  dataSource: MatTableDataSource<CampaignInterface> = new MatTableDataSource<CampaignInterface>([]);

  // Filters form
  filtersForm = this.fb.group({
    status: [[]],
    category: [[]],
    search: ['']
  });

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
    // Initialize the data source with the correct filter predicate
    this.dataSource.filterPredicate = this.createFilter();
  }

  ngOnInit(): void {
    this.adminService.fetchAdmin();
    this.loadCampaigns();

    // Subscribe to filter changes
    this.subscriptions.add(
      this.filtersForm.valueChanges.subscribe(() => {
        this.applyFormFilters();
      })
    );
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadCampaigns(): void {
    this.isLoading.set(true);
    
    this.subscriptions.add(
      this.campaignService.getAppCampaigns().subscribe({
        next: (response) => {
          if (response.success) {
            this.dataSource.data = response.data;
            this.calculateStats(response.data);
            this.extractCategories(response.data);
            this.isLoading.set(false);
          } else {
            //console.error('Failed to fetch campaigns:', response.message);
            this.snackBar.open('Failed to load campaigns', 'Close', { duration: 3000 });
            this.isLoading.set(false);
          }
        },
        error: (error) => {
          //console.error('Error fetching campaigns:', error);
          this.snackBar.open('Error loading campaigns', 'Close', { duration: 3000 });
          this.isLoading.set(false);
        }
      })
    );
  }

  calculateStats(campaigns: CampaignInterface[]): void {
    this.totalCampaigns.set(campaigns.length);
    this.activeCampaigns.set(campaigns.filter(c => c.status === 'active').length);
    this.pendingCampaigns.set(campaigns.filter(c => c.status === 'pending').length);
    this.completedCampaigns.set(
      campaigns.filter(c => ['completed', 'exhausted', 'expired'].includes(c.status)).length
    );
  }

  extractCategories(campaigns: CampaignInterface[]): void {
    const categories = new Set(campaigns.map(c => c.category).filter(Boolean));
    this.categories.set(Array.from(categories) as string[]);
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.filtersForm.patchValue({ search: filterValue });
  }

  applyFormFilters() {
    const filters = this.filtersForm.value;
    this.dataSource.filter = JSON.stringify(filters);
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  createFilter(): (data: CampaignInterface, filter: string) => boolean {
    return (data: CampaignInterface, filter: string): boolean => {
      // If the filter is empty, return true for all items
      if (!filter) return true;
      
      const filters = JSON.parse(filter);
      const searchTerm = filters.search?.toLowerCase() || '';
      
      // Check search term
      const matchesSearch = searchTerm === '' || 
        data.title.toLowerCase().includes(searchTerm) ||
        data.owner.displayName.toLowerCase().includes(searchTerm) ||
        data.owner.email.toLowerCase().includes(searchTerm) ||
        data.category?.toLowerCase().includes(searchTerm);
      
      // Check status filter
      const matchesStatus = filters.status.length === 0 || filters.status.includes(data.status);
      
      // Check category filter
      const matchesCategory = filters.category.length === 0 || 
        (data.category && filters.category.includes(data.category));
      
      return matchesSearch && matchesStatus && matchesCategory;
    };
  }

  clearFilters(): void {
    this.filtersForm.reset({
      status: null,
      category: null,
      search: ''
    });
  }

  viewCampaignDetails(campaign: CampaignInterface): void {
    this.router.navigate(['dashboard/campaigns', campaign._id]);
  }

  viewPromotions(campaign: CampaignInterface): void {
    this.router.navigate(['dashboard/campaigns', campaign._id, 'promotions']);
  }

  viewActivityLog(campaign: CampaignInterface): void {
    this.router.navigate(['dashboard/campaigns', campaign._id, 'activity']);
  }

  approveCampaign(campaign: CampaignInterface): void {
    this.subscriptions.add(
      this.campaignService.updateCampaignStatus(campaign._id, 'active').subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Campaign approved successfully', 'Close', { duration: 3000 });
            this.loadCampaigns();
          } else {
            this.snackBar.open('Failed to approve campaign', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error approving campaign:', error);
          this.snackBar.open('Error approving campaign', 'Close', { duration: 3000 });
        }
      })
    );
  }

  rejectCampaign(campaign: CampaignInterface): void {
    this.subscriptions.add(
      this.campaignService.updateCampaignStatus(campaign._id, 'rejected').subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Campaign rejected successfully', 'Close', { duration: 3000 });
            this.loadCampaigns();
          } else {
            this.snackBar.open('Failed to reject campaign', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error rejecting campaign:', error);
          this.snackBar.open('Error rejecting campaign', 'Close', { duration: 3000 });
        }
      })
    );
  }

  pauseCampaign(campaign: CampaignInterface): void {
    this.subscriptions.add(
      this.campaignService.updateCampaignStatus(campaign._id, 'paused').subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Campaign paused successfully', 'Close', { duration: 3000 });
            this.loadCampaigns();
          } else {
            this.snackBar.open('Failed to pause campaign', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error pausing campaign:', error);
          this.snackBar.open('Error pausing campaign', 'Close', { duration: 3000 });
        }
      })
    );
  }

  resumeCampaign(campaign: CampaignInterface): void {
    this.subscriptions.add(
      this.campaignService.updateCampaignStatus(campaign._id, 'active').subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Campaign resumed successfully', 'Close', { duration: 3000 });
            this.loadCampaigns();
          } else {
            this.snackBar.open('Failed to resume campaign', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error resuming campaign:', error);
          this.snackBar.open('Error resuming campaign', 'Close', { duration: 3000 });
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}