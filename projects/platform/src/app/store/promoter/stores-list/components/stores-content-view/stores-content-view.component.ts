// stores-content-view.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Store } from '../../stores-list.service';

@Component({
  selector: 'app-stores-content-view',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatPaginatorModule],
  template: `
    <div class="stores-content">
      <!-- Loading State -->
      @if (loading) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading stores...</p>
        </div>
      }
      
      <!-- Error State -->
      @else if (error) {
        <div class="error-state">
          <mat-icon>error_outline</mat-icon>
          <p>{{ error }}</p>
          <button class="retry-btn" (click)="retry.emit()">Try Again</button>
        </div>
      }
      
      <!-- Empty State -->
      @else if (stores.length === 0) {
        <div class="empty-state">
          <mat-icon>store_off</mat-icon>
          <p>No stores found</p>
          <p class="subtext">Try adjusting your filters or search criteria</p>
        </div>
      }
      
      <!-- Stores Grid -->
      @else {
        <div class="stores-grid" [class.list-view]="deviceType === 'mobile'">
          @for (store of stores; track store._id) {
            <div class="store-card" (click)="viewStore.emit(store)">
              <div class="card-badge" *ngIf="store.isVerified">
                <mat-icon>verified</mat-icon>
                <span>{{ store.verificationTier | titlecase }}</span>
              </div>
              
              <div class="store-logo">
                <img [src]="store.logo || '/assets/default-store.png'" [alt]="store.name">
              </div>
              
              <div class="store-info">
                <h3>{{ store.name }}</h3>
                <p class="description">{{ store.description | slice:0:100 }}{{ store!.description!.length > 100 ? '...' : '' }}</p>
                
                <div class="store-stats">
                  <div class="stat">
                    <mat-icon>shopping_bag</mat-icon>
                    <span>{{ store.productCount }} products</span>
                  </div>
                  <div class="stat">
                    <mat-icon>visibility</mat-icon>
                    <span>{{ store.analytics.totalViews | number }} views</span>
                  </div>
                  <div class="stat">
                    <mat-icon>trending_up</mat-icon>
                    <span>{{ store.analytics.conversionRate || 0 }}% conv.</span>
                  </div>
                </div>
                
                <div class="product-preview" *ngIf="store.productPreview.length">
                  <div class="preview-images">
                    @for (product of store.productPreview.slice(0, 4); track product._id) {
                      <div class="preview-img">
                        <img [src]="product?.images?.[0] || '/img/product.png'" [alt]="product.name">
                        <span class="commission">{{ product.promotion.commissionRate }}%</span>
                      </div>
                    }
                  </div>
                </div>
              </div>
              
              <div class="card-actions">
                <button 
                  class="follow-btn"
                  [class.following]="store.isFollowing"
                  (click)="$event.stopPropagation(); followStore.emit(store)">
                  <mat-icon>{{ store.isFollowing ? 'favorite' : 'favorite_border' }}</mat-icon>
                  <span>{{ store.isFollowing ? 'Following' : 'Follow' }}</span>
                </button>
              </div>
            </div>
          }
        </div>
        
        <!-- Pagination -->
        @if (totalPages > 1) {
          <mat-paginator
            [length]="totalStores"
            [pageSize]="pageSize"
            [pageSizeOptions]="[12, 24, 48]"
            [pageIndex]="currentPage - 1"
            (page)="onPageChange($event)"
            aria-label="Select page">
          </mat-paginator>
        }
      }
    </div>
  `,
  styles: [`
    .stores-content {
      min-height: 500px;
      
      .loading-state, .error-state, .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem 2rem;
        text-align: center;
        
        mat-icon {
          font-size: 4rem;
          width: 4rem;
          height: 4rem;
          margin-bottom: 1rem;
          color: #9ca3af;
        }
        
        p {
          margin: 0 0 1rem;
          color: #6b7280;
        }
        
        .subtext {
          font-size: 0.875rem;
          color: #9ca3af;
        }
        
        .retry-btn {
          padding: 0.5rem 1.5rem;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          
          &:hover {
            background: #5a6fd8;
          }
        }
      }
      
      .loading-state .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #e5e7eb;
        border-top-color: #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 1rem;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      .stores-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
        
        &.list-view {
          grid-template-columns: 1fr;
        }
      }
      
      .store-card {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
        cursor: pointer;
        position: relative;
        
        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
        }
        
        .card-badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: #10b981;
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 20px;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          z-index: 1;
          
          mat-icon {
            font-size: 0.875rem;
            width: 0.875rem;
            height: 0.875rem;
          }
        }
        
        .store-logo {
          height: 120px;
          background: #f9fafb;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          
          img {
            max-width: 80px;
            max-height: 80px;
            object-fit: contain;
          }
        }
        
        .store-info {
          padding: 1rem;
          
          h3 {
            margin: 0 0 0.5rem;
            font-size: 1.125rem;
            font-weight: 600;
          }
          
          .description {
            margin: 0 0 1rem;
            font-size: 0.875rem;
            color: #6b7280;
            line-height: 1.4;
          }
          
          .store-stats {
            display: flex;
            gap: 1rem;
            margin-bottom: 1rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #e5e7eb;
            
            .stat {
              display: flex;
              align-items: center;
              gap: 0.25rem;
              font-size: 0.75rem;
              color: #6b7280;
              
              mat-icon {
                font-size: 0.875rem;
                width: 0.875rem;
                height: 0.875rem;
              }
            }
          }
          
          .product-preview {
            .preview-images {
              display: flex;
              gap: 0.5rem;
              
              .preview-img {
                position: relative;
                width: 50px;
                height: 50px;
                border-radius: 8px;
                overflow: hidden;
                
                img {
                  width: 100%;
                  height: 100%;
                  object-fit: cover;
                }
                
                .commission {
                  position: absolute;
                  bottom: 0;
                  left: 0;
                  right: 0;
                  background: rgba(0, 0, 0, 0.7);
                  color: white;
                  font-size: 0.625rem;
                  text-align: center;
                  padding: 0.125rem;
                }
              }
            }
          }
        }
        
        .card-actions {
          padding: 1rem;
          border-top: 1px solid #e5e7eb;
          
          .follow-btn {
            width: 100%;
            padding: 0.5rem;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            background: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            transition: all 0.2s ease;
            
            &:hover {
              background: #f9fafb;
            }
            
            &.following {
              background: #fee2e2;
              border-color: #fecaca;
              color: #dc2626;
            }
            
            mat-icon {
              font-size: 1.125rem;
              width: 1.125rem;
              height: 1.125rem;
            }
          }
        }
      }
    }
    
    @media (max-width: 768px) {
      .stores-content .stores-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
    }
  `]
})
export class StoresContentViewComponent {
  @Input() stores: Store[] = [];
  @Input() loading = false;
  @Input() error: string | null = null;
  @Input() totalStores = 0;
  @Input() totalPages = 0;
  @Input() currentPage = 1;
  @Input() pageSize = 12;
  @Input() deviceType: string = 'desktop';
  
  @Output() viewStore = new EventEmitter<Store>();
  @Output() followStore = new EventEmitter<Store>();
  @Output() retry = new EventEmitter<void>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event.pageIndex + 1);
    if (event.pageSize !== this.pageSize) {
      this.pageSizeChange.emit(event.pageSize);
    }
  }
}