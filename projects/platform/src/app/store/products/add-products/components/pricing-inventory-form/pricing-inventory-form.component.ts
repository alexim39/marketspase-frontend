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
  templateUrl: './pricing-inventory-form.component.html',
  styleUrls: ['./pricing-inventory-form.component.scss']
})
export class PricingInventoryFormComponent {
  pricingForm = input.required<FormGroup>();
  inventoryForm = input.required<FormGroup>();
}