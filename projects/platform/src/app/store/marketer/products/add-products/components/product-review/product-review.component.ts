// components/product-management/add-product/components/product-review/product-review.component.ts
import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormArray } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';

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
  templateUrl: './product-review.component.html',
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