// components/product-management/add-product/components/shipping-form/shipping-form.component.ts
import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-shipping-form',
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
      <mat-card class="form-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>local_shipping</mat-icon>
            Shipping
          </mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <div class="form-grid" [formGroup]="formGroup()">
            <!-- Shipping Toggle -->
            <div class="full-width">
              <mat-slide-toggle formControlName="requiresShipping">
                This product requires shipping
              </mat-slide-toggle>
            </div>

            @if (formGroup().get('requiresShipping')?.value) {
              <!-- Weight -->
              <mat-form-field appearance="outline">
                <mat-label>Weight (kg)</mat-label>
                <input matInput type="number" formControlName="weight" min="0" step="0.001">
                <mat-icon matSuffix>scale</mat-icon>
              </mat-form-field>

              <!-- Dimensions -->
              <div class="dimensions-section full-width" [formGroup]="dimensions()">
                <h4>Dimensions (cm)</h4>
                <div class="dimensions-grid">
                  <mat-form-field appearance="outline">
                    <mat-label>Length</mat-label>
                    <input matInput formControlName="length">
                  </mat-form-field>
                  
                  <mat-form-field appearance="outline">
                    <mat-label>Width</mat-label>
                    <input matInput formControlName="width">
                  </mat-form-field>
                  
                  <mat-form-field appearance="outline">
                    <mat-label>Height</mat-label>
                    <input matInput formControlName="height">
                  </mat-form-field>
                </div>
              </div>

              <!-- Shipping Class -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Shipping Class</mat-label>
                <mat-select formControlName="shippingClass">
                  <mat-option value="">Default</mat-option>
                  <mat-option value="fragile">Fragile</mat-option>
                  <mat-option value="oversized">Oversized</mat-option>
                  <mat-option value="refrigerated">Refrigerated</mat-option>
                </mat-select>
              </mat-form-field>
            } @else {
              <div class="digital-notice full-width">
                <mat-icon>cloud_download</mat-icon>
                <p>This product will be marked as digital (downloadable)</p>
              </div>
            }
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styleUrls: ['./shipping-form.component.scss']
})
export class ShippingFormComponent {
  formGroup = input.required<FormGroup>();

  get dimensions() {
    return () => this.formGroup().get('dimensions') as FormGroup;
  }
}