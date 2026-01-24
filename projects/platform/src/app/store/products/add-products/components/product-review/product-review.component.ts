// components/product-management/add-product/components/product-review/product-review.component.ts
import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormArray, FormControl } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';

type StrCtrl = FormControl<string>;

@Component({
  selector: 'app-product-review',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule
  ],
  providers: [DecimalPipe],
  template: `
    <div class="form-step">
      <mat-card class="review-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>preview</mat-icon>
            Review & Submit
          </mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <div class="review-sections">
            <!-- Basic Info Review -->
            <div class="review-section">
              <h3>
                <mat-icon>info</mat-icon>
                Basic Information
                <button mat-button color="primary" (click)="editStep.emit(0)">Edit</button>
              </h3>
              
              <div class="review-grid">
                <div class="review-item">
                  <span class="review-label">Name:</span>
                  <span class="review-value">{{ getBasicInfoValue('name') }}</span>
                </div>
                <div class="review-item">
                  <span class="review-label">Category:</span>
                  <span class="review-value">{{ getBasicInfoValue('category') }}</span>
                </div>
                <div class="review-item">
                  <span class="review-label">Brand:</span>
                  <span class="review-value">{{ getBasicInfoValue('brand') || 'Not specified' }}</span>
                </div>
                <div class="review-item">
                  <span class="review-label">Description:</span>
                  <span class="review-value">{{ getBasicInfoValue('description') || 'No description' }}</span>
                </div>
                <div class="review-item">
                  <span class="review-label">Tags:</span>
                  <span class="review-value">
                    @if (getTags().length > 0) {
                      @for (tag of getTags(); track $index) {
                        <mat-chip>{{ tag }}</mat-chip>
                      }
                    } @else {
                      No tags
                    }
                  </span>
                </div>
                <div class="review-item">
                  <span class="review-label">Images:</span>
                  <span class="review-value">{{ imagesCount() }} images uploaded</span>
                </div>
              </div>
            </div>

            <!-- Pricing & Inventory Review -->
            <div class="review-section">
              <h3>
                <mat-icon>attach_money</mat-icon>
                Pricing & Inventory
                <button mat-button color="primary" (click)="editStep.emit(1)">Edit</button>
              </h3>
              
              <div class="review-grid">
                <div class="review-item">
                  <span class="review-label">Price:</span>
                  <span class="review-value">₦{{ getPricingValue('price') | number:'1.2-2' }}</span>
                </div>
                @if (getPricingValue('originalPrice')) {
                  <div class="review-item">
                    <span class="review-label">Original Price:</span>
                    <span class="review-value">₦{{ getPricingValue('originalPrice') | number:'1.2-2' }}</span>
                  </div>
                }
                <div class="review-item">
                  <span class="review-label">Stock Quantity:</span>
                  <span class="review-value">{{ getInventoryValue('quantity') }}</span>
                </div>
                <div class="review-item">
                  <span class="review-label">Low Stock Alert:</span>
                  <span class="review-value">{{ getInventoryValue('lowStockAlert') }}</span>
                </div>
                <div class="review-item">
                  <span class="review-label">SKU:</span>
                  <span class="review-value">{{ getInventoryValue('sku') || 'Auto-generated' }}</span>
                </div>
              </div>
            </div>

            <!-- Shipping Review -->
            <div class="review-section">
              <h3>
                <mat-icon>local_shipping</mat-icon>
                Shipping
                <button mat-button color="primary" (click)="editStep.emit(3)">Edit</button>
              </h3>
              
              <div class="review-grid">
                <div class="review-item">
                  <span class="review-label">Requires Shipping:</span>
                  <span class="review-value">{{ getShippingValue('requiresShipping') ? 'Yes' : 'No' }}</span>
                </div>
                @if (getShippingValue('requiresShipping')) {
                  <div class="review-item">
                    <span class="review-label">Weight:</span>
                    <span class="review-value">{{ getShippingValue('weight') || 'Not specified' }} kg</span>
                  </div>
                  <div class="review-item">
                    <span class="review-label">Shipping Class:</span>
                    <span class="review-value">{{ getShippingValue('shippingClass') || 'Default' }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Status & SEO Review -->
            <div class="review-section">
              <h3>
                <mat-icon>settings</mat-icon>
                Status & SEO
                <button mat-button color="primary" (click)="editStep.emit(4)">Edit</button>
              </h3>
              
              <div class="review-grid">
                <div class="review-item">
                  <span class="review-label">Status:</span>
                  <span class="review-value">
                    <mat-chip [color]="getAdvancedValue('isActive') ? 'primary' : 'warn'">
                      {{ getAdvancedValue('isActive') ? 'Active' : 'Draft' }}
                    </mat-chip>
                  </span>
                </div>
                <div class="review-item">
                  <span class="review-label">Featured:</span>
                  <span class="review-value">{{ getAdvancedValue('isFeatured') ? 'Yes' : 'No' }}</span>
                </div>
                <div class="review-item">
                  <span class="review-label">Digital Product:</span>
                  <span class="review-value">{{ getDigitalValue('isDigital') ? 'Yes' : 'No' }}</span>
                </div>
                @if (getSeoValue('seoTitle')) {
                  <div class="review-item">
                    <span class="review-label">SEO Title:</span>
                    <span class="review-value">{{ getSeoValue('seoTitle') }}</span>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Validation Summary -->
          <div class="validation-summary" [class.valid]="productForm().valid">
            <mat-icon [class.valid]="productForm().valid">{{ productForm().valid ? 'check_circle' : 'error' }}</mat-icon>
            <div class="validation-text">
              <h4>Form Status: {{ productForm().valid ? 'Ready to Submit' : 'Needs Attention' }}</h4>
              <p>{{ productForm().valid ? 'All required fields are filled correctly.' : 'Please check all required fields and fix errors.' }}</p>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styleUrls: ['./product-review.component.scss']
})
export class ProductReviewComponent {
  productForm = input.required<FormGroup>();
  imagesCount = input<number>(0);
  
  editStep = output<number>();

  getBasicInfoValue(key: string): any {
    const basicInfo = this.productForm().get('basicInfo') as FormGroup;
    return basicInfo?.get(key)?.value || '';
  }

  getPricingValue(key: string): any {
    const pricing = this.productForm().get('pricing') as FormGroup;
    return pricing?.get(key)?.value || 0;
  }

  getInventoryValue(key: string): any {
    const inventory = this.productForm().get('inventory') as FormGroup;
    return inventory?.get(key)?.value || '';
  }

  getShippingValue(key: string): any {
    const shipping = this.productForm().get('shipping') as FormGroup;
    return shipping?.get(key)?.value || '';
  }

  getSeoValue(key: string): any {
    const seo = this.productForm().get('seo') as FormGroup;
    return seo?.get(key)?.value || '';
  }

  getAdvancedValue(key: string): any {
    const advanced = this.productForm().get('advanced') as FormGroup;
    return advanced?.get(key)?.value || false;
  }

  getDigitalValue(key: string): any {
    const digital = this.productForm().get('digital') as FormGroup;
    return digital?.get(key)?.value || false;
  }

  getTags(): string[] {
    const tagsArray = this.productForm().get('basicInfo.tags') as FormArray;
    return tagsArray?.value || [];
  }
}