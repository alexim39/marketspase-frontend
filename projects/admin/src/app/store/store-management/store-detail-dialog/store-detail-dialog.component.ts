import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { Store } from '../../shared/store.model';
import { DatePipe } from '@angular/common';

interface StoreDetailDialogData {
  store: Store;
}

@Component({
  selector: 'app-store-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatTabsModule,
    DatePipe
  ],
  template: `
    <div class="store-detail-dialog">
      <div class="dialog-header">
        <h2 mat-dialog-title>Store Details</h2>
        <button mat-icon-button (click)="onClose()" class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <mat-dialog-content>
        <div class="store-overview">
          <div class="store-header">
            <div class="store-logo-section">
              @if (data.store.logo) {
                <img [src]="data.store.logo" alt="Store logo" class="store-logo" onerror="this.src='/img/store-default.png'">
              } @else {
                <div class="store-logo-placeholder">
                  <mat-icon>store</mat-icon>
                </div>
              }
            </div>
            
            <div class="store-info-section">
              <h1 class="store-name">{{ data.store.name }}</h1>
              
              <div class="store-status">
                <mat-chip class="verification-chip" [ngClass]="{
                  'verified': data.store.isVerified,
                  'premium': data.store.verificationTier === 'premium'
                }">
                  @if (data.store.verificationTier === 'premium') {
                    <mat-icon class="chip-icon">diamond</mat-icon>
                    Premium Verified
                  } @else if (data.store.isVerified) {
                    <mat-icon class="chip-icon">verified</mat-icon>
                    Verified
                  } @else {
                    <mat-icon class="chip-icon">pending</mat-icon>
                    Unverified
                  }
                </mat-chip>
                
                <mat-chip class="status-chip" [ngClass]="data.store.isActive ? 'active' : 'inactive'">
                  <mat-icon class="chip-icon">{{ data.store.isActive ? 'check_circle' : 'cancel' }}</mat-icon>
                  {{ data.store.isActive ? 'Active' : 'Inactive' }}
                </mat-chip>
                
                @if (data.store.isDefaultStore) {
                  <mat-chip class="default-chip">
                    <mat-icon class="chip-icon">star</mat-icon>
                    Default Store
                  </mat-chip>
                }
              </div>
              
              <div class="store-meta">
                <div class="meta-item">
                  <mat-icon>link</mat-icon>
                  <a [href]="'/store/' + data.store.storeLink" target="_blank" class="store-link">
                    {{ data.store.storeLink }}
                  </a>
                </div>
                <div class="meta-item">
                  <mat-icon>category</mat-icon>
                  <span>{{ data.store.category || 'Uncategorized' }}</span>
                </div>
                <div class="meta-item">
                  <mat-icon>calendar_today</mat-icon>
                  <span>Created {{ data.store.createdAt | date:'mediumDate' }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <mat-divider></mat-divider>
          
          <mat-tab-group class="store-tabs">
            <!-- Basic Information Tab -->
            <mat-tab label="Basic Information">
              <div class="tab-content">
                <div class="info-section">
                  <h3 class="section-title">Description</h3>
                  <p class="description">{{ data.store.description || 'No description provided.' }}</p>
                </div>
                
                <div class="info-section">
                  <h3 class="section-title">Owner Information</h3>
                  <div class="owner-info">
                    @if (data.store.owner?.avatar) {
                      <img [src]="data.store.owner.avatar" alt="Owner avatar" class="owner-avatar" onerror="this.src='/img/avatar.png'">
                    } @else {
                      <div class="owner-avatar-placeholder">
                        <mat-icon>person</mat-icon>
                      </div>
                    }
                    <div class="owner-details">
                      <span class="owner-name">{{ getOwnerName() }}</span>
                      @if (data.store.owner?.email) {
                        <span class="owner-email">{{ data.store.owner.email }}</span>
                      }
                      <span class="owner-role">{{ data.store.owner?.role | titlecase }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </mat-tab>
            
            <!-- Analytics Tab -->
            <mat-tab label="Analytics">
              <div class="tab-content">
                <div class="analytics-grid">
                  <div class="analytics-card">
                    <div class="analytics-icon total-views">
                      <mat-icon>visibility</mat-icon>
                    </div>
                    <div class="analytics-info">
                      <span class="analytics-value">{{ data.store.analytics?.totalViews || 0 }}</span>
                      <span class="analytics-label">Total Views</span>
                    </div>
                  </div>
                  
                  <div class="analytics-card">
                    <div class="analytics-icon total-sales">
                      <mat-icon>shopping_cart</mat-icon>
                    </div>
                    <div class="analytics-info">
                      <span class="analytics-value">{{ data.store.analytics?.totalSales || 0 }}</span>
                      <span class="analytics-label">Total Sales</span>
                    </div>
                  </div>
                  
                  <div class="analytics-card">
                    <div class="analytics-icon conversion-rate">
                      <mat-icon>trending_up</mat-icon>
                    </div>
                    <div class="analytics-info">
                      <span class="analytics-value">{{ data.store.analytics?.conversionRate || 0 }}%</span>
                      <span class="analytics-label">Conversion Rate</span>
                    </div>
                  </div>
                  
                  <div class="analytics-card">
                    <div class="analytics-icon promoter-traffic">
                      <mat-icon>group</mat-icon>
                    </div>
                    <div class="analytics-info">
                      <span class="analytics-value">{{ data.store.analytics?.promoterTraffic || 0 }}</span>
                      <span class="analytics-label">Promoter Traffic</span>
                    </div>
                  </div>
                </div>
                
                <div class="info-section">
                  <h3 class="section-title">Store Products</h3>
                  <div class="products-count">
                    <mat-icon>inventory</mat-icon>
                    <span>{{ data.store.storeProducts?.length || 0 }} Products</span>
                  </div>
                </div>
                
                <div class="info-section">
                  <h3 class="section-title">Active Campaigns</h3>
                  <div class="campaigns-count">
                    <mat-icon>campaign</mat-icon>
                    <span>{{ data.store.activeCampaigns?.length || 0 }} Campaigns</span>
                  </div>
                </div>
              </div>
            </mat-tab>
            
            <!-- WhatsApp Integration Tab -->
            @if (data.store.whatsappNumber) {
              <mat-tab label="WhatsApp Integration">
                <div class="tab-content">
                  <div class="info-section">
                    <h3 class="section-title">WhatsApp Number</h3>
                    <div class="whatsapp-info">
                      <mat-icon class="whatsapp-icon">whatsapp</mat-icon>
                      <span class="whatsapp-number">{{ data.store.whatsappNumber }}</span>
                    </div>
                  </div>
                  
                  @if (data.store.whatsappTemplates && data.store.whatsappTemplates.length > 0) {
                    <div class="info-section">
                      <h3 class="section-title">Templates ({{ data.store.whatsappTemplates.length }})</h3>
                      <div class="templates-list">
                        @for (template of data.store.whatsappTemplates; track $index) {
                          <mat-chip class="template-chip">
                            {{ template }}
                          </mat-chip>
                        }
                      </div>
                    </div>
                  }
                </div>
              </mat-tab>
            }
          </mat-tab-group>
        </div>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-button (click)="onClose()">Close</button>
        <button mat-raised-button color="primary" (click)="onEdit()">
          <mat-icon>edit</mat-icon>
          Edit Store
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .store-detail-dialog {
      width: 800px;
      max-width: 90vw;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
    }
    
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px 0;
    }
    
    h2.mat-dialog-title {
      margin: 0;
      font-size: 24px;
      font-weight: 500;
      //color: #202124;
    }
    
    .close-button {
      margin: -8px -8px 0 0;
    }
    
    mat-dialog-content {
      padding: 0 24px;
      margin: 0;
      flex: 1;
      overflow-y: auto;
    }
    
    .store-overview {
      padding: 16px 0;
    }
    
    .store-header {
      display: flex;
      gap: 24px;
      margin-bottom: 24px;
    }
    
    .store-logo-section {
      flex-shrink: 0;
    }
    
    .store-logo, .store-logo-placeholder {
      width: 120px;
      height: 120px;
      border-radius: 12px;
      overflow: hidden;
    }
    
    .store-logo {
      object-fit: cover;
      border: 1px solid #e0e0e0;
    }
    
    .store-logo-placeholder {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      
      mat-icon {
        color: white;
        font-size: 48px;
        width: 48px;
        height: 48px;
      }
    }
    
    .store-info-section {
      flex: 1;
    }
    
    .store-name {
      font-size: 28px;
      font-weight: 600;
      //color: #202124;
      margin: 0 0 12px 0;
      line-height: 1.2;
    }
    
    .store-status {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;
    }
    
    .verification-chip, .status-chip, .default-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-weight: 500;
      font-size: 13px;
      height: 28px;
      
      .chip-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }
    
    .verification-chip.verified {
      background: #137333;
      //color: #137333;
    }
    
    .verification-chip.premium {
      background: linear-gradient(135deg, #fce4ec 0%, #f3e5f5 100%);
      color: #880e4f;
    }
    
    .status-chip.active {
      background: #1a73e8;
      //color: #1a73e8;
    }
    
    .status-chip.inactive {
      background: #c5221f;
      //color: #c5221f;
    }
    
    .default-chip {
      background: #f9ab00;
      //color: #f9ab00;
    }
    
    .store-meta {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .meta-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #5f6368;
      
      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }
    
    .store-link {
      color: #1a73e8;
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
      }
    }
    
    mat-divider {
      margin: 24px 0;
    }
    
    .store-tabs {
      ::ng-deep .mat-tab-label {
        min-width: 120px;
      }
    }
    
    .tab-content {
      padding: 20px 0;
    }
    
    .info-section {
      margin-bottom: 24px;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
    
    .section-title {
      font-size: 16px;
      font-weight: 500;
      margin: 0 0 12px 0;
    }
    
    .description {
      margin: 0;
      line-height: 1.6;
      font-size: 14px;
    }
    
    .owner-info {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px;
      background: #0f0f0f;
      border-radius: 8px;
    }
    
    .owner-avatar, .owner-avatar-placeholder {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      overflow: hidden;
    }
    
    .owner-avatar {
      object-fit: cover;
      border: 2px solid #e0e0e0;
    }
    
    .owner-avatar-placeholder {
      //background: #e8f0fe;
      display: flex;
      align-items: center;
      justify-content: center;
      
      mat-icon {
        color: #1a73e8;
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
    }
    
    .owner-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .owner-name {
      font-weight: 500;
      font-size: 16px;
      color: #8f9196;
    }
    
    .owner-email {
      font-size: 14px;
      color: #b5b5b5;
    }
    
    .owner-role {
      font-size: 12px;
      color: #1a73e8;
      background: #e8f0fe;
      padding: 2px 8px;
      border-radius: 12px;
      display: inline-block;
      width: fit-content;
    }
    
    .analytics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .analytics-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
      transition: transform 0.2s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
    }
    
    .analytics-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      
      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
        color: white;
      }
    }
    
    .total-views {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    
    .total-sales {
      background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
    }
    
    .conversion-rate {
      background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
    }
    
    .promoter-traffic {
      background: linear-gradient(135deg, #2196f3 0%, #0d47a1 100%);
    }
    
    .analytics-info {
      display: flex;
      flex-direction: column;
    }
    
    .analytics-value {
      font-size: 24px;
      font-weight: 600;
      color: #202124;
      line-height: 1;
    }
    
    .analytics-label {
      font-size: 13px;
      color: #202124;
      margin-top: 4px;
    }
    
    .products-count, .campaigns-count {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #1a1a1a;
      border-radius: 8px;
      
      mat-icon {
        color: #1a73e8;
      }
      
      span {
        font-weight: 500;
        //color: #202124;
      }
    }
    
    .whatsapp-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    
    .whatsapp-icon {
      color: #25D366;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
    
    .whatsapp-number {
      font-weight: 500;
      font-size: 16px;
      //color: #202124;
    }
    
    .templates-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .template-chip {
      background: #e8f0fe;
      color: #1a73e8;
      font-weight: 500;
    }
    
    mat-dialog-actions {
      padding: 16px 24px;
      margin: 0;
      border-top: 1px solid #e0e0e0;
      
      button {
        min-width: 100px;
        
        mat-icon {
          margin-right: 8px;
        }
      }
    }
    
    @media (max-width: 768px) {
      .store-header {
        flex-direction: column;
        gap: 16px;
      }
      
      .store-logo, .store-logo-placeholder {
        width: 80px;
        height: 80px;
      }
      
      .store-name {
        font-size: 24px;
      }
      
      .analytics-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class StoreDetailDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<StoreDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StoreDetailDialogData
  ) {}

  getOwnerName(): string {
    if (this.data.store.owner?.name) return this.data.store.owner.name;
    if (this.data.store.owner?.email) return this.data.store.owner.email;
    return 'Unknown Owner';
  }

  onEdit(): void {
    this.dialogRef.close('edit');
  }

  onClose(): void {
    this.dialogRef.close();
  }
}