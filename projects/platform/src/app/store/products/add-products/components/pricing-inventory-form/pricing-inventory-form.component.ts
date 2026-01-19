// components/product-management/add-product/components/pricing-inventory-form/pricing-inventory-form.component.ts
import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

type StrCtrl = FormControl<string>;
type NumCtrl = FormControl<number>;
type BoolCtrl = FormControl<boolean>;

@Component({
  selector: 'app-pricing-inventory-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule
  ],
  template: `
    <div class="form-step">
      <div class="two-column-layout">
        <!-- Pricing Card -->
        <mat-card class="form-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>attach_money</mat-icon>
              Pricing
            </mat-card-title>
          </mat-card-header>
          
          <mat-card-content>
            <div class="form-grid" [formGroup]="pricingForm()">
              <!-- Price -->
              <mat-form-field appearance="outline">
                <mat-label>Price *</mat-label>
                <input matInput type="number" formControlName="price" min="0" step="0.01">
                <span matTextPrefix>₦</span>
                @if (pricingForm().get('price')?.hasError('required')) {
                  <mat-error>Price is required</mat-error>
                }
              </mat-form-field>

              <!-- Original Price -->
              <mat-form-field appearance="outline">
                <mat-label>Original Price</mat-label>
                <input matInput type="number" formControlName="originalPrice" min="0" step="0.01">
                <span matTextPrefix>₦</span>
                <mat-hint>For showing discounts</mat-hint>
              </mat-form-field>

              <!-- Cost Price -->
              <mat-form-field appearance="outline">
                <mat-label>Cost Price</mat-label>
                <input matInput type="number" formControlName="costPrice" min="0" step="0.01">
                <span matTextPrefix>₦</span>
                <mat-hint>Your purchase cost (not shown to customers)</mat-hint>
              </mat-form-field>

              <!-- Tax Settings -->
              <div class="full-width">
                <mat-slide-toggle formControlName="taxable">
                  Product is taxable
                </mat-slide-toggle>
                
                @if (pricingForm().get('taxable')?.value) {
                  <mat-form-field appearance="outline" class="tax-field">
                    <mat-label>Tax Class</mat-label>
                    <mat-select formControlName="taxClass">
                      <mat-option value="standard">Standard Rate</mat-option>
                      <mat-option value="reduced">Reduced Rate</mat-option>
                      <mat-option value="zero">Zero Rate</mat-option>
                    </mat-select>
                  </mat-form-field>
                }
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Inventory Card -->
        <mat-card class="form-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>inventory_2</mat-icon>
              Inventory
            </mat-card-title>
          </mat-card-header>
          
          <mat-card-content>
            <div class="form-grid" [formGroup]="inventoryForm()">
              <!-- SKU -->
              <mat-form-field appearance="outline">
                <mat-label>SKU</mat-label>
                <input matInput formControlName="sku">
                <mat-icon matSuffix>inventory</mat-icon>
                <mat-hint>Stock Keeping Unit (auto-generated from name)</mat-hint>
              </mat-form-field>

              <!-- Quantity -->
              <mat-form-field appearance="outline">
                <mat-label>Stock Quantity *</mat-label>
                <input matInput type="number" formControlName="quantity" min="0">
                @if (inventoryForm().get('quantity')?.hasError('required')) {
                  <mat-error>Quantity is required</mat-error>
                }
              </mat-form-field>

              <!-- Low Stock Alert -->
              <mat-form-field appearance="outline">
                <mat-label>Low Stock Alert</mat-label>
                <input matInput type="number" formControlName="lowStockAlert" min="0">
                <mat-icon matSuffix>warning</mat-icon>
                <mat-hint>Get notified when stock reaches this level</mat-hint>
              </mat-form-field>

              <!-- Inventory Settings -->
              <div class="full-width">
                <mat-slide-toggle formControlName="manageStock">
                  Manage stock
                </mat-slide-toggle>
                
                <div class="toggle-group">
                  <mat-slide-toggle formControlName="backorderAllowed">
                    Allow backorders
                  </mat-slide-toggle>
                  
                  <mat-slide-toggle formControlName="soldIndividually">
                    Sold individually
                  </mat-slide-toggle>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styleUrls: ['./pricing-inventory-form.component.scss']
})
export class PricingInventoryFormComponent {
  pricingForm = input.required<FormGroup>();
  inventoryForm = input.required<FormGroup>();
}