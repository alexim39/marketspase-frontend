// components/product-management/add-product/components/pricing-inventory-form/pricing-inventory-form.component.ts
import { Component, computed, effect, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { map, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatTooltipModule } from '@angular/material/tooltip';

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
    MatSlideToggleModule,
    MatTooltipModule
  ],
  templateUrl: './pricing-inventory-form.component.html',
  styleUrls: ['./pricing-inventory-form.component.scss']
})
export class PricingInventoryFormComponent {
  pricingForm = input.required<FormGroup>();
  inventoryForm = input.required<FormGroup>();
  productName = input.required<string>(); // parent must bind this

   // 1. Create a simple writable signal for the price
  public priceValue = signal<number>(0);

  // 2. Compute the final amount based on that signal
  payableAmount = computed(() => this.priceValue() * 0.9);
  feeAmount = computed(() => this.priceValue() * 0.1);

  constructor() {
    // 3. Use an effect to set up the listener once the input is available
    effect((onCleanup) => {
      const form = this.pricingForm();
      const priceControl = form.get('price');

      if (priceControl) {
        // Set initial value
        this.priceValue.set(Number(priceControl.value) || 0);

        // Listen for changes
        const sub = priceControl.valueChanges.subscribe(val => {
          this.priceValue.set(Number(val) || 0);
        });

        // Clean up the subscription if the input changes or component dies
        onCleanup(() => sub.unsubscribe());
      }
    });
  }

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