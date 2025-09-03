import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

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
import { CampaignService } from './campaign.service';
import { AdminService } from '../common/services/user.service';
import { CampaignInterface, PromotionInterface } from '../../../../shared-services/src/public-api';

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
  template: `
    <div class="admin-campaign-details-container">
      <!-- Header Section with Back Button -->
      <div class="header-section">
        <button mat-button (click)="goBack()" class="back-button">
          <mat-icon>arrow_back</mat-icon>
          Back to Campaigns
        </button>
        
        <div class="header-title">
          <h1 class="page-title">Campaign Details</h1>
          <p class="page-subtitle">Manage and monitor campaign performance</p>
        </div>
        
        <div class="header-actions">
          <button mat-icon-button [matMenuTriggerFor]="statusMenu" matTooltip="Change Status">
            <mat-icon>settings</mat-icon>
          </button>
          <mat-menu #statusMenu="matMenu">
            <div style="background-color: black !important;">
            @if (campaign()?.status === 'pending') {
              <button mat-menu-item (click)="updateCampaignStatus('active')">
                <mat-icon>check_circle</mat-icon>
                <span>Approve</span>
              </button>
              <button mat-menu-item (click)="updateCampaignStatus('paused')">
                <mat-icon>pause_circle</mat-icon>
                <span>Pause</span>
              </button>
            }
            @if (campaign()?.status === 'active') {
              <button mat-menu-item (click)="updateCampaignStatus('paused')">
                <mat-icon>pause_circle</mat-icon>
                <span>Pause</span>
              </button>
            }
            @if (campaign()?.status === 'paused') {
              <button mat-menu-item (click)="updateCampaignStatus('active')">
                <mat-icon>play_circle</mat-icon>
                <span>Resume</span>
              </button>
            }
            <button mat-menu-item (click)="viewActivityLog()">
              <mat-icon>history</mat-icon>
              <span>View Activity Log</span>
            </button>
            </div>
          </mat-menu>
        </div>
      </div>

      @if (isLoading()) {
        <div class="loading-spinner">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Loading campaign details...</p>
        </div>
      } @else if (campaign()) {
        <!-- Campaign Overview Card -->
        <mat-card class="overview-card">
          <mat-card-content>
            <div class="overview-header">
              <div class="campaign-title-section">
                <h2 class="campaign-title">{{ campaign()?.title }}</h2>
                <mat-chip [class]="campaign()?.status" class="status-chip">
                  {{ campaign()?.status | titlecase }}
                </mat-chip>
              </div>
              
              <div class="campaign-meta">
                <span class="created-date">Created: {{ campaign()?.createdAt | date:'mediumDate' }}</span>
                <span class="campaign-id">ID: {{ campaign()?._id }}</span>
              </div>
            </div>
            
            <div class="overview-stats">
              <div class="stat-item">
                <div class="stat-value">{{ campaign()?.currentPromoters }} / {{ campaign()?.maxPromoters }}</div>
                <div class="stat-label">Promoters</div>
                <!-- <mat-progress-bar 
                  mode="determinate" 
                  [value]="(campaign()?.currentPromoters / campaign()?.maxPromoters) * 100"
                  class="stat-progress">
                </mat-progress-bar> -->
              </div>
              
              <div class="stat-item">
                <div class="stat-value">{{ campaign()?.validatedPromotions }}</div>
                <div class="stat-label">Validated</div>
              </div>
              
              <div class="stat-item">
                <div class="stat-value">{{ campaign()?.paidPromotions }}</div>
                <div class="stat-label">Paid</div>
              </div>
              
              <div class="stat-item">
                <div class="stat-value">{{ campaign()?.spentBudget | currency:'NGN':'₦' }} / {{ campaign()?.budget | currency:'NGN':'₦' }}</div>
                <div class="stat-label">Budget Spent</div>
                <!-- <mat-progress-bar 
                  mode="determinate" 
                  [value]="(campaign()?.spentBudget / campaign()?.budget) * 100"
                  class="stat-progress">
                </mat-progress-bar> -->
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Main Content Tabs -->
        <mat-tab-group animationDuration="0ms" class="content-tabs">
          <!-- Details Tab -->
          <mat-tab label="Details">
            <div class="tab-content">
              <div class="details-grid">
                <!-- Campaign Information -->
                <mat-card class="detail-card">
                  <mat-card-header>
                    <mat-card-title>Campaign Information</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="detail-item">
                      <span class="detail-label">Title:</span>
                      <span class="detail-value">{{ campaign()?.title }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Category:</span>
                      <span class="detail-value">{{ campaign()?.category || 'Not specified' }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Media Type:</span>
                      <span class="detail-value">{{ campaign()?.mediaType || 'Not specified' }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Caption:</span>
                      <span class="detail-value">{{ campaign()?.caption || 'No caption' }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Link:</span>
                      @if (campaign()?.link) {
                        <a [href]="campaign()?.link" target="_blank" class="detail-value link">{{ campaign()?.link }}</a>
                      } @else {
                        <span class="detail-value">No link</span>
                      }
                    </div>
                    @if (campaign()?.mediaUrl) {
                      <div class="detail-item">
                        <span class="detail-label">Media Preview:</span>
                        <div class="media-preview">
                          <img [src]="api + campaign()?.mediaUrl" alt="Campaign media" class="preview-image">
                        </div>
                      </div>
                    }
                  </mat-card-content>
                </mat-card>

                <!-- Budget & Payout -->
                <mat-card class="detail-card">
                  <mat-card-header>
                    <mat-card-title>Budget & Payout</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="detail-item">
                      <span class="detail-label">Total Budget:</span>
                      <span class="detail-value">{{ campaign()?.budget | currency:'NGN':'₦' }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Payout per Promotion:</span>
                      <span class="detail-value">{{ campaign()?.payoutPerPromotion | currency:'NGN':'₦' }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Spent Budget:</span>
                      <span class="detail-value">{{ campaign()?.spentBudget | currency:'NGN':'₦' }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Remaining Budget:</span>
                      <!-- <span class="detail-value">{{ (campaign()?.budget - campaign()?.spentBudget) | currency:'NGN':'₦' }}</span> -->
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Currency:</span>
                      <span class="detail-value">{{ campaign()?.currency }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Minimum Views Required:</span>
                      <span class="detail-value">{{ campaign()?.minViewsPerPromotion }}</span>
                    </div>
                  </mat-card-content>
                </mat-card>

                <!-- Timeline -->
                <mat-card class="detail-card">
                  <mat-card-header>
                    <mat-card-title>Timeline</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="detail-item">
                      <span class="detail-label">Start Date:</span>
                      <span class="detail-value">{{ campaign()?.startDate | date:'medium' }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">End Date:</span>
                      <span class="detail-value">{{ campaign()?.endDate ? (campaign()?.endDate | date:'medium') : 'Not set' }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Created:</span>
                      <span class="detail-value">{{ campaign()?.createdAt | date:'medium' }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Last Updated:</span>
                      <span class="detail-value">{{ campaign()?.updatedAt | date:'medium' }}</span>
                    </div>
                  </mat-card-content>
                </mat-card>

                <!-- Advertiser Information -->
                <mat-card class="detail-card">
                  <mat-card-header>
                    <mat-card-title>Advertiser Information</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="detail-item">
                      <span class="detail-label">Name:</span>
                      <span class="detail-value">{{ campaign()?.owner.displayName }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Username:</span>
                      <span class="detail-value">@{{ campaign()?.owner.username }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Email:</span>
                      <span class="detail-value">{{ campaign()?.owner.email }}</span>
                    </div>
                    <div class="detail-item">
                      <button mat-button color="primary" (click)="viewAdvertiserDetails()">
                        View Advertiser Profile
                      </button>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
            </div>
          </mat-tab>

          <!-- Promotions Tab -->
          <mat-tab label="Promotions">
            <div class="tab-content">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Campaign Promotions</mat-card-title>
                  <mat-card-subtitle>All promotions for this campaign</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  @if (promotions().length === 0) {
                    <div class="no-data">
                      <mat-icon>groups</mat-icon>
                      <p>No promotions yet</p>
                    </div>
                  } @else {
                    <div class="promotions-table-container">
                      <table mat-table [dataSource]="promotionsDataSource" class="promotions-table">
                        <!-- Promoter Column -->
                        <ng-container matColumnDef="promoter">
                          <th mat-header-cell *matHeaderCellDef> Promoter </th>
                          <td mat-cell *matCellDef="let promotion">
                            <div class="promoter-info">
                              <span class="promoter-name">{{ promotion.promoter.displayName }}</span>
                              <span class="promoter-username">@{{ promotion.promoter.username }}</span>
                            </div>
                          </td>
                        </ng-container>

                        <!-- Status Column -->
                        <ng-container matColumnDef="status">
                          <th mat-header-cell *matHeaderCellDef> Status </th>
                          <td mat-cell *matCellDef="let promotion">
                            <mat-chip [class]="promotion.status" class="status-chip small">
                              {{ promotion.status | titlecase }}
                            </mat-chip>
                          </td>
                        </ng-container>

                        <!-- Views Column -->
                        <ng-container matColumnDef="views">
                          <th mat-header-cell *matHeaderCellDef> Views </th>
                          <td mat-cell *matCellDef="let promotion">
                            {{ promotion.proofViews || 0 }}
                          </td>
                        </ng-container>

                        <!-- Submitted Column -->
                        <ng-container matColumnDef="submitted">
                          <th mat-header-cell *matHeaderCellDef> Submitted </th>
                          <td mat-cell *matCellDef="let promotion">
                            {{ promotion.submittedAt ? (promotion.submittedAt | date:'short') : 'Not submitted' }}
                          </td>
                        </ng-container>

                        <!-- Actions Column -->
                        <ng-container matColumnDef="actions">
                          <th mat-header-cell *matHeaderCellDef> Actions </th>
                          <td mat-cell *matCellDef="let promotion">
                            <button mat-icon-button matTooltip="View Proof" (click)="viewPromotionProof(promotion)">
                              <mat-icon>visibility</mat-icon>
                            </button>
                            <button mat-icon-button [matMenuTriggerFor]="promotionMenu" matTooltip="More Actions">
                              <mat-icon>more_vert</mat-icon>
                            </button>
                            
                            <mat-menu #promotionMenu="matMenu">
                              @if (promotion.status === 'submitted') {
                                <button mat-menu-item (click)="validatePromotion(promotion)">
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
                              <button mat-menu-item (click)="viewPromotionDetails(promotion)">
                                <mat-icon>info</mat-icon>
                                <span>View Details</span>
                              </button>
                            </mat-menu>
                          </td>
                        </ng-container>

                        <tr mat-header-row *matHeaderRowDef="promotionsColumns"></tr>
                        <tr mat-row *matRowDef="let row; columns: promotionsColumns;"></tr>
                      </table>
                    </div>
                  }
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <!-- Activity Log Tab -->
          <mat-tab label="Activity Log">
            <div class="tab-content">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Activity History</mat-card-title>
                  <mat-card-subtitle>All activities for this campaign</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  @if (campaign()?.activityLog?.length === 0) {
                    <div class="no-data">
                      <mat-icon>history</mat-icon>
                      <p>No activity recorded yet</p>
                    </div>
                  } @else {
                    <div class="activity-timeline">
                      @for (activity of campaign()?.activityLog; track activity.timestamp; let i = $index) {
                        <div class="activity-item">
                          <div class="activity-icon">
                            <mat-icon>event</mat-icon>
                          </div>
                          <div class="activity-content">
                            <div class="activity-action">{{ activity.action }}</div>
                            <div class="activity-details">{{ activity.details }}</div>
                            <div class="activity-time">{{ activity.timestamp | date:'medium' }}</div>
                          </div>
                        </div>
                      }
                    </div>
                  }
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>
        </mat-tab-group>
      } @else {
        <div class="error-state">
          <mat-icon>error_outline</mat-icon>
          <h3>Campaign not found</h3>
          <p>The campaign you're looking for doesn't exist or may have been deleted.</p>
          <button mat-raised-button color="primary" (click)="goBack()">
            Back to Campaigns
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-campaign-details-container {
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

    .loading-spinner {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 100px 0;
    }

    .loading-spinner p {
      margin-top: 16px;
      color: rgba(0, 0, 0, 0.54);
    }

    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 100px 0;
      text-align: center;
    }

    .error-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #f44336;
      margin-bottom: 16px;
    }

    .error-state h3 {
      margin: 0 0 8px 0;
      color: rgba(0, 0, 0, 0.87);
    }

    .error-state p {
      margin: 0 0 24px 0;
      color: rgba(0, 0, 0, 0.54);
    }

    .overview-card {
      margin-bottom: 24px;
    }

    .overview-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .campaign-title-section {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .campaign-title {
      margin: 0;
      font-size: 20px;
      font-weight: 500;
    }

    .campaign-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }

    .created-date, .campaign-id {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.54);
    }

    .overview-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 24px;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .stat-value {
      font-size: 18px;
      font-weight: 500;
    }

    .stat-label {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.54);
    }

    .stat-progress {
      height: 6px;
      border-radius: 3px;
    }

    .content-tabs {
      margin-bottom: 24px;
    }

    .tab-content {
      padding: 16px 0;
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
    }

    .detail-card {
      height: 100%;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 16px;
    }

    .detail-label {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.54);
      font-weight: 500;
    }

    .detail-value {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.87);
    }

    .link {
      color: #1976d2;
      text-decoration: none;
      word-break: break-all;
    }

    .link:hover {
      text-decoration: underline;
    }

    .media-preview {
      margin-top: 8px;
    }

    .preview-image {
      max-width: 100%;
      max-height: 200px;
      border-radius: 4px;
      object-fit: contain;
    }

    .no-data {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 0;
      color: rgba(0, 0, 0, 0.54);
      text-align: center;
    }

    .no-data mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }

    .promotions-table-container {
      overflow-x: auto;
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

    .promoter-username {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.54);
    }

    .status-chip {
      font-size: 12px;
      font-weight: 500;
      
      &.active, &.validated, &.paid {
        background-color: #e8f5e9;
        color: #2e7d32;
      }
      
      &.paused, &.pending {
        background-color: #fff3e0;
        color: #ef6c00;
      }
      
      &.rejected {
        background-color: #ffebee;
        color: #c62828;
      }
      
      &.submitted {
        background-color: #e3f2fd;
        color: #1976d2;
      }
      
      &.small {
        font-size: 10px;
        height: 20px;
      }
    }

    .activity-timeline {
      padding: 16px 0;
    }

    .activity-item {
      display: flex;
      gap: 16px;
      padding: 16px 0;
      border-bottom: 1px solid #e0e0e0;
    }

    .activity-item:last-child {
      border-bottom: none;
    }

    .activity-icon {
      display: flex;
      align-items: flex-start;
    }

    .activity-icon mat-icon {
      color: rgba(0, 0, 0, 0.54);
    }

    .activity-content {
      flex: 1;
    }

    .activity-action {
      font-weight: 500;
      margin-bottom: 4px;
    }

    .activity-details {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.7);
      margin-bottom: 4px;
    }

    .activity-time {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.54);
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
      .admin-campaign-details-container {
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

      .overview-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .campaign-meta {
        align-items: flex-start;
      }

      .overview-stats {
        grid-template-columns: 1fr;
      }

      .details-grid {
        grid-template-columns: 1fr;
      }

      .promotions-table {
        min-width: 600px;
      }
    }
  `],
})
export class CampaignDetailsComponent implements OnInit, OnDestroy {
  readonly campaignService = inject(CampaignService);
  readonly adminService = inject(AdminService);
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly snackBar = inject(MatSnackBar);
  private subscriptions: Subscription = new Subscription();

  // Signals for state management
  isLoading = signal(true);
  campaign = signal<CampaignInterface | null>(null);
  promotions = signal<PromotionInterface[]>([]);
  public readonly api = this.campaignService.api;

  // Table properties for promotions
  promotionsColumns: string[] = ['promoter', 'status', 'views', 'submitted', 'actions'];
  promotionsDataSource: MatTableDataSource<PromotionInterface> = new MatTableDataSource<PromotionInterface>([]);

  ngOnInit(): void {
    this.loadCampaignDetails();
  }

  loadCampaignDetails(): void {
    const campaignId = this.route.snapshot.paramMap.get('id');
    
    if (!campaignId) {
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    
    this.subscriptions.add(
      this.campaignService.getCampaignById(campaignId).subscribe({
        next: (response) => {
          if (response.success) {
            this.campaign.set(response.data);
            this.promotions.set(response.data.promotions || []);
            this.promotionsDataSource.data = response.data.promotions || [];
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
    );
  }

  goBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  updateCampaignStatus(status: string): void {
    const campaign = this.campaign();
    if (!campaign) return;

    this.subscriptions.add(
      this.campaignService.updateCampaignStatus(campaign._id, status).subscribe({
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
    );
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
    this.snackBar.open('View proof feature coming soon', 'Close', { duration: 3000 });
  }

  validatePromotion(promotion: PromotionInterface): void {
    this.subscriptions.add(
      this.campaignService.updateCampaignStatus(promotion._id, 'validated').subscribe({
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
    );
  }

  rejectPromotion(promotion: PromotionInterface): void {
    this.subscriptions.add(
      this.campaignService.updateCampaignStatus(promotion._id, 'rejected').subscribe({
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
    );
  }

  markAsPaid(promotion: PromotionInterface): void {
    this.subscriptions.add(
      this.campaignService.updateCampaignStatus(promotion._id, 'paid').subscribe({
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
    );
  }

  viewPromotionDetails(promotion: PromotionInterface): void {
    // This could open a dialog with promotion details
    this.snackBar.open('Promotion details feature coming soon', 'Close', { duration: 3000 });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}