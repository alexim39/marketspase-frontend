// components/product-management/add-product/components/product-variants/product-variants.component.ts
import { Component, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormArray, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

type StrCtrl = FormControl<string>;
type BoolCtrl = FormControl<boolean>;
type AttributeForm = FormGroup<{
  name: StrCtrl;
  values: FormArray<StrCtrl>;
  visible: BoolCtrl;
  variation: BoolCtrl;
}>;
type VariantForm = FormGroup<{
  name: StrCtrl;
  sku: StrCtrl;
  price: FormControl<number>;
  quantity: FormControl<number>;
}>;

@Component({
  selector: 'app-product-variants',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatSlideToggleModule
  ],
  templateUrl: './product-variants.component.html',
  styleUrls: ['./product-variants.component.scss']
})
export class ProductVariantsComponent implements OnInit {
  formGroup = input.required<FormGroup>();
  
  attributeAdded = output<any>();
  attributeRemoved = output<number>();
  attributeValueAdded = output<{ attributeIndex: number, value: string }>();
  attributeValueRemoved = output<{ attributeIndex: number, valueIndex: number }>();
  variantsGenerated = output<any[]>();
  variantChanged = output<{ index: number, variant: any }>();

  get variants(): FormGroup {
    return this.formGroup();
  }

  get hasVariants(): boolean {
    return this.variants.get('hasVariants')?.value || false;
  }

  get attributesArray(): FormArray<AttributeForm> {
    return this.variants.get('attributes') as FormArray<AttributeForm>;
  }

  get variantsArray(): FormArray<VariantForm> {
    return this.variants.get('variantData') as FormArray<VariantForm>;
  }

  ngOnInit(): void {
    // Initialize with one attribute if hasVariants is true
    if (this.hasVariants && this.attributesArray.length === 0) {
      this.addAttribute();
    }
  }

  getAttributeValuesArray(attributeIndex: number): FormArray<StrCtrl> {
    return this.attributesArray.at(attributeIndex).get('values') as FormArray<StrCtrl>;
  }

  addAttribute(): void {
    this.attributeAdded.emit({ name: '', visible: true, variation: true });
  }

  removeAttribute(index: number): void {
    this.attributeRemoved.emit(index);
  }

  addAttributeValue(attributeIndex: number): void {
    this.attributeValueAdded.emit({ attributeIndex, value: '' });
  }

  removeAttributeValue(attributeIndex: number, valueIndex: number): void {
    this.attributeValueRemoved.emit({ attributeIndex, valueIndex });
  }

  generateVariants(): void {
    const variants: any[] = [];
    this.attributesArray.controls.forEach((attrCtrl) => {
      const name = (attrCtrl.get('name') as StrCtrl).value ?? '';
      const values = (attrCtrl.get('values') as FormArray<StrCtrl>).controls.map((c) => c.value ?? '');

      values.forEach((v) => {
        variants.push({
          name: `${name}: ${v}`,
          sku: '',
          price: 0,
          quantity: 0,
          attributes: { [name]: v }
        });
      });
    });
    
    this.variantsGenerated.emit(variants);
  }

  onVariantChange(index: number): void {
    const variant = this.variantsArray.at(index).value;
    this.variantChanged.emit({ index, variant });
  }
}