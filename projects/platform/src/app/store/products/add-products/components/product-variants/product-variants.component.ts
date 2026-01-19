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
  template: `
    <div class="form-step">
      <mat-card class="form-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>layers</mat-icon>
            Product Variants
          </mat-card-title>
        </mat-card-header>
        
        <mat-card-content [formGroup]="formGroup()">
          <!-- Variant Toggle -->
          <div class="variant-toggle">
            <mat-slide-toggle formControlName="hasVariants">
              This product has multiple options (like size or color)
            </mat-slide-toggle>
          </div>

          @if (hasVariants) {
            <div class="variants-section">
              <!-- Attributes -->
              <div class="attributes-section">
                <h3>Attributes</h3>
                @for (attribute of attributesArray.controls; track $index; let i = $index) {
                  <div class="attribute-card" [formGroup]="attribute">
                    <div class="attribute-header">
                      <mat-form-field appearance="outline" class="attribute-name">
                        <mat-label>Attribute Name</mat-label>
                        <input matInput formControlName="name">
                        <mat-icon matSuffix>label</mat-icon>
                      </mat-form-field>
                      
                      <div class="attribute-actions">
                        <button mat-icon-button color="warn" (click)="removeAttribute(i)">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </div>
                    </div>

                    <div class="attribute-values">
                      <h4>Values</h4>
                      @for (valueCtrl of getAttributeValuesArray(i).controls; track $index; let j = $index) {
                        <div class="value-row">
                          <mat-form-field appearance="outline">
                            <mat-label>Value {{ j + 1 }}</mat-label>
                            <input matInput [formControl]="valueCtrl">
                          </mat-form-field>
                          <button mat-icon-button (click)="removeAttributeValue(i, j)" [disabled]="getAttributeValuesArray(i).length <= 1">
                            <mat-icon>remove</mat-icon>
                          </button>
                        </div>
                      }
                      
                      <button mat-button color="primary" (click)="addAttributeValue(i)">
                        <mat-icon>add</mat-icon>
                        Add Value
                      </button>
                    </div>

                    <div class="attribute-settings">
                      <mat-checkbox formControlName="visible" class="setting-checkbox">
                        Visible on product page
                      </mat-checkbox>
                      <mat-checkbox formControlName="variation" class="setting-checkbox">
                        Used for variations
                      </mat-checkbox>
                    </div>
                  </div>
                }

                <button mat-raised-button color="primary" (click)="addAttribute()">
                  <mat-icon>add</mat-icon>
                  Add Attribute
                </button>

                @if (attributesArray.length > 0) {
                  <div class="generate-variants">
                    <button mat-raised-button color="accent" (click)="generateVariants()">
                      <mat-icon>auto_awesome</mat-icon>
                      Generate Variants
                    </button>
                  </div>
                }
              </div>

              <!-- Generated Variants -->
              @if (variantsArray.length > 0) {
                <div class="generated-variants">
                  <h3>Generated Variants ({{ variantsArray.length }})</h3>
                  <div class="variants-list">
                    @for (variant of variantsArray.controls; track $index; let i = $index) {
                      <mat-card class="variant-card" [formGroup]="variant">
                        <mat-card-content>
                          <div class="variant-details">
                            <div class="variant-info">
                              <mat-form-field appearance="outline" class="variant-name">
                                <mat-label>Variant Name</mat-label>
                                <input matInput formControlName="name" (change)="onVariantChange(i)">
                              </mat-form-field>
                              
                              <mat-form-field appearance="outline" class="variant-sku">
                                <mat-label>SKU</mat-label>
                                <input matInput formControlName="sku" (change)="onVariantChange(i)">
                              </mat-form-field>
                              
                              <mat-form-field appearance="outline" class="variant-price">
                                <mat-label>Price</mat-label>
                                <input matInput type="number" formControlName="price" min="0" step="0.01" (change)="onVariantChange(i)">
                                <span matTextPrefix>₦</span>
                              </mat-form-field>
                              
                              <mat-form-field appearance="outline" class="variant-quantity">
                                <mat-label>Quantity</mat-label>
                                <input matInput type="number" formControlName="quantity" min="0" (change)="onVariantChange(i)">
                              </mat-form-field>
                            </div>
                          </div>
                        </mat-card-content>
                      </mat-card>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
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