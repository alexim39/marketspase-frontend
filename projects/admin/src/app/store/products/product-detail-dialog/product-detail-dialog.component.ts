import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { DatePipe, CurrencyPipe, PercentPipe } from '@angular/common';
import { Product } from '../../shared/product.model';
import { Store } from '../../shared/store.model';

interface ProductDetailDialogData {
  product: Product;
  store?: Store;
}

@Component({
  selector: 'app-product-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatTabsModule,
    MatExpansionModule,
    MatProgressBarModule,
    MatBadgeModule,
    DatePipe,
    CurrencyPipe,
    PercentPipe,
  ],
  template: `
    <div class="product-detail-dialog">
      <div class="dialog-header">
        <h2 mat-dialog-title>Product Details</h2>
        <button mat-icon-button (click)="onClose()" class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <mat-dialog-content>
        <div class="product-overview">
          <!-- Product Header -->
          <div class="product-header">
            <div class="product-images">
              @if (data.product.images && data.product.images.length > 0) {
                <div class="main-image">
                  <img [src]="data.product.mainImage || data.product.images[0].url" 
                       alt="{{ data.product.name }}"
                       class="product-image"
                       onerror="this.src='/img/product-default.png'">
                </div>
                @if (data.product.images.length > 1) {
                  <div class="image-thumbnails">
                    @for (image of data.product.images.slice(0, 4); track $index) {
                      <img [src]="image.url" 
                           alt="{{ image.altText || 'Product image' }}"
                           class="thumbnail"
                           [class.active]="image.url === (data.product.mainImage || data.product.images[0].url)"
                           onerror="this.src='/img/product-default.png'">
                    }
                    @if (data.product.images.length > 4) {
                      <div class="thumbnail more-thumbnails">
                        +{{ data.product.images.length - 4 }}
                      </div>
                    }
                  </div>
                }
              } @else {
                <div class="main-image placeholder">
                  <mat-icon>photo</mat-icon>
                  <span>No image available</span>
                </div>
              }
            </div>
            
            <div class="product-info">
              <div class="product-title-row">
                <h1 class="product-name">{{ data.product.name }}</h1>
                <div class="product-badges">
                  @if (data.product.isFeatured) {
                    <mat-icon matBadge="Featured" class="featured-badge">star</mat-icon>
                  }
                  @if (data.product.status === 'active') {
                    <mat-chip class="status-chip active">Active</mat-chip>
                  } @else if (data.product.status === 'draft') {
                    <mat-chip class="status-chip draft">Draft</mat-chip>
                  } @else {
                    <mat-chip class="status-chip archived">Archived</mat-chip>
                  }
                </div>
              </div>
              
              <div class="product-meta">
                @if (data.product.sku) {
                  <div class="meta-item">
                    <mat-icon>tag</mat-icon>
                    <span class="meta-label">SKU:</span>
                    <span class="meta-value">{{ data.product.sku }}</span>
                  </div>
                }
                
                <div class="meta-item">
                  <mat-icon>category</mat-icon>
                  <span class="meta-label">Category:</span>
                  <span class="meta-value">{{ data.product.category || 'Uncategorized' }}</span>
                </div>
                
                @if (data.product.brand) {
                  <div class="meta-item">
                    <mat-icon>business</mat-icon>
                    <span class="meta-label">Brand:</span>
                    <span class="meta-value">{{ data.product.brand }}</span>
                  </div>
                }
                
                <div class="meta-item">
                  <mat-icon>calendar_today</mat-icon>
                  <span class="meta-label">Created:</span>
                  <span class="meta-value">{{ data.product.createdAt | date:'mediumDate' }}</span>
                </div>
              </div>
              
              <!-- Price Information -->
              <div class="price-section">
                <div class="price-row">
                  <span class="current-price">{{ data.product.price | currency:'USD':'symbol':'1.2-2' }}</span>
                  @if (data.product.originalPrice && data.product.originalPrice > data.product.price) {
                    <span class="original-price">{{ data.product.originalPrice | currency:'USD':'symbol':'1.2-2' }}</span>
                    <span class="discount-badge">
                      Save {{ ((data.product.originalPrice - data.product.price) / data.product.originalPrice * 100) | number:'1.0-0' }}%
                    </span>
                  }
                </div>
                
                @if (data.product.costPrice) {
                  <div class="cost-price">
                    <span class="cost-label">Cost:</span>
                    <span class="cost-value">{{ data.product.costPrice | currency:'USD':'symbol':'1.2-2' }}</span>
                    <span class="margin-badge">
                      Margin: {{ ((data.product.price - data.product.costPrice) / data.product.price * 100) | number:'1.0-0' }}%
                    </span>
                  </div>
                }
              </div>
              
              <!-- Stock Information -->
              <div class="stock-section">
                <div class="stock-status">
                  <mat-icon class="stock-icon" [ngClass]="getStockColor()">
                    @switch (getStockColor()) {
                      @case ('in-stock') { inventory }
                      @case ('low-stock') { warning }
                      @case ('out-of-stock') { error_outline }
                      @default { remove_circle_outline }
                    }
                  </mat-icon>
                  <span class="stock-text">{{ getStockText() }}</span>
                </div>
                
                @if (data.product.manageStock && data.product.quantity !== undefined) {
                  <div class="stock-details">
                    <div class="stock-quantity">
                      <span class="quantity-label">Quantity:</span>
                      <span class="quantity-value">{{ data.product.quantity }}</span>
                    </div>
                    
                    <div class="stock-progress">
                      <mat-progress-bar 
                        mode="determinate" 
                        [value]="getStockPercentage()"
                        [color]="getStockColor() === 'low-stock' ? 'warn' : 
                                getStockColor() === 'out-of-stock' ? 'warn' : 'primary'">
                      </mat-progress-bar>
                      <div class="progress-labels">
                        <span>0</span>
                        <span>Low Stock: {{ data.product.lowStockAlert }}</span>
                        <!-- <span>{{ Math.max(data.product.quantity, data.product.lowStockAlert || 10) }}</span> -->
                      </div>
                    </div>
                  </div>
                }
              </div>
              
              <!-- Tags -->
              @if (data.product.tags && data.product.tags.length > 0) {
                <div class="tags-section">
                  <h4 class="section-subtitle">Tags</h4>
                  <div class="tags-container">
                    @for (tag of data.product.tags; track tag) {
                      <mat-chip class="tag-chip">{{ tag }}</mat-chip>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
          
          <mat-divider></mat-divider>
          
          <!-- Product Tabs -->
          <mat-tab-group class="product-tabs">
            <!-- Description Tab -->
            <mat-tab label="Description">
              <div class="tab-content">
                <div class="description-content">
                  @if (data.product.description) {
                    <p class="product-description">{{ data.product.description }}</p>
                  } @else {
                    <div class="empty-description">
                      <mat-icon>description</mat-icon>
                      <p>No description provided</p>
                    </div>
                  }
                </div>
              </div>
            </mat-tab>
            
            <!-- Variants Tab -->
            @if (data.product.hasVariants && data.product.variants && data.product.variants.length > 0) {
              <mat-tab label="Variants ({{ data.product.variants.length }})">
                <div class="tab-content">
                  <div class="variants-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Variant</th>
                          <th>SKU</th>
                          <th>Attributes</th>
                          <th>Price</th>
                          <th>Stock</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (variant of data.product.variants; track variant._id || $index) {
                          <tr>
                            <td class="variant-name">{{ variant.name }}</td>
                            <td class="variant-sku">{{ variant.sku || '—' }}</td>
                            <td class="variant-attributes">
                              @for (attr of getVariantAttributes(variant); track $index) {
                                <span class="attribute-chip">{{ attr.name }}: {{ attr.value }}</span>
                              }
                            </td>
                            <td class="variant-price">{{ variant.price | currency:'USD':'symbol':'1.2-2' }}</td>
                            <td class="variant-stock">
                              <span [ngClass]="{
                                'in-stock': variant.quantity > (variant.lowStockAlert || 5),
                                'low-stock': variant.quantity > 0 && variant.quantity <= (variant.lowStockAlert || 5),
                                'out-of-stock': variant.quantity === 0
                              }">
                                {{ variant.quantity }}
                              </span>
                            </td>
                            <td class="variant-status">
                              <mat-chip class="status-chip" [ngClass]="variant.isActive ? 'active' : 'inactive'">
                                {{ variant.isActive ? 'Active' : 'Inactive' }}
                              </mat-chip>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              </mat-tab>
            }
            
            <!-- Performance Tab -->
            <mat-tab label="Performance">
              <div class="tab-content">
                <div class="performance-grid">
                  <div class="performance-card">
                    <div class="performance-icon views">
                      <mat-icon>visibility</mat-icon>
                    </div>
                    <div class="performance-info">
                      <span class="performance-value">{{ data.product.viewCount || 0 }}</span>
                      <span class="performance-label">Total Views</span>
                    </div>
                  </div>
                  
                  <div class="performance-card">
                    <div class="performance-icon sales">
                      <mat-icon>shopping_cart</mat-icon>
                    </div>
                    <div class="performance-info">
                      <span class="performance-value">{{ data.product.purchaseCount || 0 }}</span>
                      <span class="performance-label">Total Sales</span>
                    </div>
                  </div>
                  
                  <div class="performance-card">
                    <div class="performance-icon conversion">
                      <mat-icon>trending_up</mat-icon>
                    </div>
                    <div class="performance-info">
                      <span class="performance-value">{{ getConversionRate() }}%</span>
                      <span class="performance-label">Conversion Rate</span>
                    </div>
                  </div>
                  
                  <div class="performance-card">
                    <div class="performance-icon rating">
                      <mat-icon>star</mat-icon>
                    </div>
                    <div class="performance-info">
                      <span class="performance-value">{{ data.product.averageRating || 0 | number:'1.1-1' }}</span>
                      <span class="performance-label">Average Rating</span>
                      <span class="performance-subtext">({{ data.product.ratingCount || 0 }} reviews)</span>
                    </div>
                  </div>
                </div>
                
                <!-- Performance Metrics -->
                <div class="performance-metrics">
                  <h4 class="section-subtitle">Performance Metrics</h4>
                  <div class="metrics-grid">
                    <div class="metric-item">
                      <span class="metric-label">Revenue Generated</span>
                      <span class="metric-value">
                        {{ (data.product.price || 0) * (data.product.purchaseCount || 0) | currency:'USD':'symbol':'1.0-0' }}
                      </span>
                    </div>
                    
                    <div class="metric-item">
                      <span class="metric-label">Average Order Value</span>
                      <span class="metric-value">{{ data.product.price | currency:'USD':'symbol':'1.2-2' }}</span>
                    </div>
                    
                    <div class="metric-item">
                      <span class="metric-label">Inventory Turnover</span>
                      <span class="metric-value">
                        {{ getInventoryTurnover() | number:'1.2-2' }}
                      </span>
                    </div>
                    
                    <div class="metric-item">
                      <span class="metric-label">Stock Coverage</span>
                      <span class="metric-value">
                        {{ getStockCoverage() }} days
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </mat-tab>
            
            <!-- SEO Tab -->
            @if (data.product.seo) {
              <mat-tab label="SEO">
                <div class="tab-content">
                  <div class="seo-info">
                    <div class="seo-item">
                      <h4 class="section-subtitle">SEO Title</h4>
                      <p class="seo-content">{{ data.product.seo.title || 'Not set' }}</p>
                      @if (data.product.seo.title) {
                        <div class="seo-preview">
                          <span class="preview-label">Preview:</span>
                          <div class="title-preview">{{ data.product.seo.title }}</div>
                        </div>
                      }
                    </div>
                    
                    <div class="seo-item">
                      <h4 class="section-subtitle">Meta Description</h4>
                      <p class="seo-content">{{ data.product.seo.description || 'Not set' }}</p>
                      @if (data.product.seo.description) {
                        <div class="seo-preview">
                          <span class="preview-label">Preview:</span>
                          <div class="description-preview">{{ data.product.seo.description }}</div>
                        </div>
                      }
                    </div>
                    
                    @if (data.product.seo.keywords && data.product.seo.keywords.length > 0) {
                      <div class="seo-item">
                        <h4 class="section-subtitle">Keywords</h4>
                        <div class="keywords-container">
                          @for (keyword of data.product.seo.keywords; track keyword) {
                            <mat-chip class="keyword-chip">{{ keyword }}</mat-chip>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </mat-tab>
            }
            
            <!-- Store Info Tab -->
            @if (data.store) {
              <mat-tab label="Store Info">
                <div class="tab-content">
                  <div class="store-info">
                    <div class="store-header">
                      @if (data.store.logo) {
                        <img [src]="data.store.logo" alt="Store logo" class="store-logo" onerror="this.src='/img/store-default.png'">
                      } @else {
                        <div class="store-logo-placeholder">
                          <mat-icon>store</mat-icon>
                        </div>
                      }
                      <div class="store-details">
                        <h3 class="store-name">{{ data.store.name }}</h3>
                        <mat-chip class="store-status" [ngClass]="data.store.isVerified ? 'verified' : 'unverified'">
                          {{ data.store.isVerified ? 'Verified Store' : 'Unverified Store' }}
                        </mat-chip>
                      </div>
                    </div>
                    
                    <div class="store-meta">
                      <div class="meta-item">
                        <mat-icon>category</mat-icon>
                        <span>{{ data.store.category || 'Uncategorized' }}</span>
                      </div>
                      <div class="meta-item">
                        <mat-icon>link</mat-icon>
                        <a [href]="'/store/' + data.store.storeLink" target="_blank" class="store-link">
                          /{{ data.store.storeLink }}
                        </a>
                      </div>
                      <div class="meta-item">
                        <mat-icon>calendar_today</mat-icon>
                        <span>Created {{ data.store.createdAt | date:'mediumDate' }}</span>
                      </div>
                    </div>
                    
                    @if (data.store.description) {
                      <div class="store-description">
                        <h4 class="section-subtitle">Store Description</h4>
                        <p>{{ data.store.description }}</p>
                      </div>
                    }
                  </div>
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
          Edit Product
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .product-detail-dialog {
      width: 900px;
      max-width: 95vw;
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
      color: #202124;
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
    
    .product-overview {
      padding: 16px 0;
    }
    
    .product-header {
      display: flex;
      gap: 32px;
      margin-bottom: 24px;
      
      @media (max-width: 768px) {
        flex-direction: column;
        gap: 24px;
      }
    }
    
    .product-images {
      flex: 1;
      min-width: 300px;
    }
    
    .main-image {
      width: 100%;
      height: 300px;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 12px;
      background: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &.placeholder {
        flex-direction: column;
        color: #9e9e9e;
        
        mat-icon {
          font-size: 64px;
          width: 64px;
          height: 64px;
          margin-bottom: 12px;
        }
        
        span {
          font-size: 14px;
        }
      }
    }
    
    .product-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    
    .image-thumbnails {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    
    .thumbnail {
      width: 60px;
      height: 60px;
      border-radius: 4px;
      object-fit: cover;
      cursor: pointer;
      border: 2px solid transparent;
      
      &.active {
        border-color: #1a73e8;
      }
      
      &:hover:not(.active) {
        border-color: #e0e0e0;
      }
      
      &.more-thumbnails {
        background: #f5f5f5;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #5f6368;
        font-size: 12px;
        font-weight: 500;
      }
    }
    
    .product-info {
      flex: 2;
      min-width: 300px;
    }
    
    .product-title-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 12px;
    }
    
    .product-name {
      font-size: 28px;
      font-weight: 600;
      color: #202124;
      margin: 0;
      line-height: 1.2;
    }
    
    .product-badges {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    
    .featured-badge {
      background: #fff3e0;
      color: #e65100;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      
      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
    }
    
    .status-chip {
      font-size: 12px;
      height: 24px;
      font-weight: 500;
      
      &.active {
        background: #e6f4ea;
        color: #137333;
      }
      
      &.draft {
        background: #fef7e0;
        color: #f9ab00;
      }
      
      &.archived {
        background: #f5f5f5;
        color: #9e9e9e;
      }
    }
    
    .product-meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    
    .meta-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
    }
    
    .meta-label {
      color: #5f6368;
      font-weight: 500;
    }
    
    .meta-value {
      color: #202124;
      font-weight: 500;
    }
    
    .price-section {
      margin-bottom: 20px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    
    .price-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }
    
    .current-price {
      font-size: 32px;
      font-weight: 700;
      color: #1a237e;
    }
    
    .original-price {
      font-size: 18px;
      color: #9e9e9e;
      text-decoration: line-through;
    }
    
    .discount-badge {
      background: #34a853;
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .cost-price {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
    }
    
    .cost-label {
      color: #5f6368;
    }
    
    .cost-value {
      color: #202124;
      font-weight: 500;
    }
    
    .margin-badge {
      background: #e6f4ea;
      color: #137333;
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 500;
    }
    
    .stock-section {
      margin-bottom: 20px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    
    .stock-status {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }
    
    .stock-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      
      &.in-stock {
        color: #34a853;
      }
      
      &.low-stock {
        color: #f9ab00;
      }
      
      &.out-of-stock {
        color: #ea4335;
      }
      
      &:not(.in-stock):not(.low-stock):not(.out-of-stock) {
        color: #9e9e9e;
      }
    }
    
    .stock-text {
      font-size: 16px;
      font-weight: 500;
      color: #202124;
    }
    
    .stock-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .stock-quantity {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
    }
    
    .quantity-label {
      color: #5f6368;
    }
    
    .quantity-value {
      color: #202124;
      font-weight: 600;
    }
    
    .stock-progress {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .progress-labels {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #5f6368;
    }
    
    .tags-section {
      margin-bottom: 20px;
    }
    
    .section-subtitle {
      font-size: 14px;
      font-weight: 600;
      color: #202124;
      margin: 0 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .tags-container {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    
    .tag-chip {
      background: #e8f0fe;
      color: #1a73e8;
      font-size: 12px;
      height: 24px;
    }
    
    mat-divider {
      margin: 24px 0;
    }
    
    .product-tabs {
      ::ng-deep .mat-tab-label {
        min-width: 120px;
      }
    }
    
    .tab-content {
      padding: 20px 0;
    }
    
    .description-content {
      line-height: 1.6;
      color: #5f6368;
      font-size: 14px;
    }
    
    .empty-description {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      color: #9e9e9e;
      
      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 12px;
      }
      
      p {
        margin: 0;
        font-size: 14px;
      }
    }
    
    .variants-table {
      overflow-x: auto;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
    }
    
    thead {
      background: #f8f9fa;
    }
    
    th {
      padding: 12px 16px;
      text-align: left;
      font-weight: 500;
      font-size: 12px;
      color: #5f6368;
      border-bottom: 1px solid #e0e0e0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    td {
      padding: 12px 16px;
      font-size: 14px;
      color: #202124;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .variant-name {
      font-weight: 500;
    }
    
    .variant-sku {
      color: #5f6368;
      font-family: monospace;
    }
    
    .variant-attributes {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    
    .attribute-chip {
      background: #f1f3f4;
      color: #5f6368;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
    }
    
    .variant-price {
      font-weight: 600;
      color: #1a237e;
    }
    
    .variant-stock span {
      font-weight: 500;
      
      &.in-stock {
        color: #34a853;
      }
      
      &.low-stock {
        color: #f9ab00;
      }
      
      &.out-of-stock {
        color: #ea4335;
      }
    }
    
    .performance-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .performance-card {
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
    
    .performance-icon {
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
      
      &.views {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
      
      &.sales {
        background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
      }
      
      &.conversion {
        background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
      }
      
      &.rating {
        background: linear-gradient(135deg, #2196f3 0%, #0d47a1 100%);
      }
    }
    
    .performance-info {
      display: flex;
      flex-direction: column;
    }
    
    .performance-value {
      font-size: 24px;
      font-weight: 600;
      color: #202124;
      line-height: 1;
    }
    
    .performance-label {
      font-size: 13px;
      color: #5f6368;
      margin-top: 4px;
    }
    
    .performance-subtext {
      font-size: 11px;
      color: #9e9e9e;
      margin-top: 2px;
    }
    
    .performance-metrics {
      margin-top: 24px;
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }
    
    .metric-item {
      display: flex;
      flex-direction: column;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    
    .metric-label {
      font-size: 12px;
      color: #5f6368;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    
    .metric-value {
      font-size: 18px;
      font-weight: 600;
      color: #202124;
    }
    
    .seo-info {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    
    .seo-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .seo-content {
      margin: 0;
      color: #5f6368;
      font-size: 14px;
      line-height: 1.5;
    }
    
    .seo-preview {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 8px;
    }
    
    .preview-label {
      font-size: 12px;
      color: #5f6368;
      font-weight: 500;
    }
    
    .title-preview {
      font-size: 18px;
      color: #1a0dab;
      font-weight: 400;
      line-height: 1.3;
      max-width: 600px;
    }
    
    .description-preview {
      font-size: 14px;
      color: #545454;
      line-height: 1.4;
      max-width: 600px;
    }
    
    .keywords-container {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    
    .keyword-chip {
      background: #e8f0fe;
      color: #1a73e8;
      font-size: 12px;
      height: 24px;
    }
    
    .store-info {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    .store-header {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .store-logo, .store-logo-placeholder {
      width: 60px;
      height: 60px;
      border-radius: 8px;
      overflow: hidden;
    }
    
    .store-logo {
      object-fit: cover;
    }
    
    .store-logo-placeholder {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      
      mat-icon {
        color: white;
        font-size: 28px;
        width: 28px;
        height: 28px;
      }
    }
    
    .store-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .store-name {
      font-size: 20px;
      font-weight: 600;
      color: #202124;
      margin: 0;
    }
    
    .store-status {
      font-size: 12px;
      height: 24px;
      
      &.verified {
        background: #e6f4ea;
        color: #137333;
      }
      
      &.unverified {
        background: #f5f5f5;
        color: #9e9e9e;
      }
    }
    
    .store-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }
    
    .store-description p {
      margin: 0;
      line-height: 1.6;
      color: #5f6368;
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
  `]
})
export class ProductDetailDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ProductDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProductDetailDialogData
  ) {}

  getStockColor(): string {
    const product = this.data.product;
    if (!product.manageStock) return 'not-tracking';
    
    const quantity = product.quantity || 0;
    const lowStockAlert = product.lowStockAlert || 5;
    
    if (quantity === 0) return 'out-of-stock';
    if (quantity <= lowStockAlert) return 'low-stock';
    return 'in-stock';
  }

  getStockText(): string {
    const product = this.data.product;
    if (!product.manageStock) return 'No Stock Tracking';
    
    const quantity = product.quantity || 0;
    const lowStockAlert = product.lowStockAlert || 5;
    
    if (quantity === 0) return 'Out of Stock';
    if (quantity <= lowStockAlert) return 'Low Stock';
    return `${quantity} in stock`;
  }

  getStockPercentage(): number {
    const product = this.data.product;
    if (!product.manageStock || product.quantity === undefined) return 0;
    const max = Math.max(product.quantity, product.lowStockAlert || 10);
    return (product.quantity / max) * 100;
  }

  getVariantAttributes(variant: any): Array<{name: string, value: string}> {
    if (!variant.attributes) return [];
    return Object.entries(variant.attributes).map(([key, value]) => ({
      name: key,
      value: value as string
    }));
  }

  getConversionRate(): number {
    const product = this.data.product;
    if (!product.viewCount || product.viewCount === 0) return 0;
    return ((product.purchaseCount || 0) / product.viewCount * 100);
  }

  getInventoryTurnover(): number {
    const product = this.data.product;
    if (!product.purchaseCount || product.purchaseCount === 0) return 0;
    
    // Simplified calculation: purchases per month
    const daysSinceCreation = Math.max(1, Math.floor((new Date().getTime() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
    const monthsSinceCreation = daysSinceCreation / 30;
    
    return (product.purchaseCount || 0) / monthsSinceCreation;
  }

  getStockCoverage(): number {
    const product = this.data.product;
    if (!product.purchaseCount || product.purchaseCount === 0 || !product.quantity) return 0;
    
    // Calculate days of stock coverage based on average daily sales
    const daysSinceCreation = Math.max(1, Math.floor((new Date().getTime() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
    const averageDailySales = (product.purchaseCount || 0) / daysSinceCreation;
    
    if (averageDailySales === 0) return Infinity;
    return Math.floor(product.quantity / averageDailySales);
  }

  onEdit(): void {
    this.dialogRef.close('edit');
  }

  onClose(): void {
    this.dialogRef.close();
  }
}