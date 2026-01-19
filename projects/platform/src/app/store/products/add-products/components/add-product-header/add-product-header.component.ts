// components/product-management/add-product/components/add-product-header/add-product-header.component.ts
import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-add-product-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="product-header">
      <div class="header-content">
        <div class="header-left">
          <button mat-button [routerLink]="['/dashboard/stores']" class="back-btn">
          <!-- <button mat-button [routerLink]="['/dashboard/stores', storeId(), 'products']" class="back-btn"> -->
            <mat-icon>arrow_back</mat-icon>
            Back to Products
          </button>
          
          <div class="header-title">
            <h1>Add New Product</h1>
            <p class="subtitle">Fill in the product details below. All fields marked with * are required.</p>
          </div>
        </div>
        
        <div class="header-right">
          <button mat-stroked-button (click)="cancel.emit()" class="cancel-btn">
            Cancel
          </button>
          <button mat-raised-button color="primary" (click)="submit.emit()" [disabled]="loading()">
            @if (loading()) {
              <mat-progress-spinner diameter="20" mode="indeterminate"></mat-progress-spinner>
              <span>Saving...</span>
            } @else {
              <mat-icon>save</mat-icon>
              <span>Save Product</span>
            }
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./add-product-header.component.scss']
})
export class AddProductHeaderComponent {
  loading = input<boolean>(false);
  storeId = input<string>();
  cancel = output<void>();
  submit = output<void>();
}