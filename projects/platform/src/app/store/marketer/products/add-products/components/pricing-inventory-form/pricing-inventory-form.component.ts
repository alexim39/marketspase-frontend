// components/product-management/add-product/components/pricing-inventory-form/pricing-inventory-form.component.ts
import { Component, effect, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

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
  templateUrl: './pricing-inventory-form.component.html',
  styleUrls: ['./pricing-inventory-form.component.scss']
})
export class PricingInventoryFormComponent {
  pricingForm = input.required<FormGroup>();
  inventoryForm = input.required<FormGroup>();
  productName = input.required<string>(); // parent must bind this

  ngOnInit(): void {
    // Default values
    this.inventoryForm().get('quantity')?.setValue(5);
    this.inventoryForm().get('lowStockAlert')?.setValue(5);   
    this.inventoryForm().get('sku')?.setValue(this.generateSku(this.productName())); 
  }

  private generateSku(name: string): string {
    const base = (name || 'product')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const suffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    return `${base || 'product'}-${suffix}`.substring(0, 50);
  }
}