
// components/product-management/add-product/add-product.component.ts
import {
  Component, inject, OnInit, signal, computed, OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  FormControl,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  NonNullableFormBuilder,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatRadioModule } from '@angular/material/radio';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ProductService } from '../../services/product.service';
import { StoreService } from '../../services/store.service';
import { ProductVariant, CreateProductRequest, ProductAttribute } from '../../models/product.model';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatMenuModule } from '@angular/material/menu';
import { ViewChild, ElementRef } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';

type StrCtrl = FormControl<string>;
type NumCtrl = FormControl<number>;
type BoolCtrl = FormControl<boolean>;

// Attribute form type
type AttributeForm = FormGroup<{
  name: StrCtrl;
  values: FormArray<StrCtrl>;
  visible: BoolCtrl;
  variation: BoolCtrl;
}>;

// Variant form type
type VariantForm = FormGroup<{
  name: StrCtrl;
  sku: StrCtrl;
  price: NumCtrl;
  quantity: NumCtrl;
}>;

// Root product form type (simplified to what the template uses)
type ProductForm = FormGroup<{
  basicInfo: FormGroup<{
    name: StrCtrl;
    description: StrCtrl;
    category: StrCtrl;
    brand: StrCtrl;
    tags: FormArray<StrCtrl>;
  }>;
  pricing: FormGroup<{
    price: NumCtrl;
    originalPrice: NumCtrl;
    costPrice: NumCtrl;
    taxClass: StrCtrl;
    taxable: BoolCtrl;
  }>;
  inventory: FormGroup<{
    sku: StrCtrl;
    quantity: NumCtrl;
    lowStockAlert: NumCtrl;
    manageStock: BoolCtrl;
    backorderAllowed: BoolCtrl;
    soldIndividually: BoolCtrl;
  }>;
  shipping: FormGroup<{
    requiresShipping: BoolCtrl;
    weight: StrCtrl; // keep as string if you prefer free-text; change to NumCtrl if numeric-only
    dimensions: FormGroup<{
      length: StrCtrl;
      width: StrCtrl;
      height: StrCtrl;
    }>;
    shippingClass: StrCtrl;
  }>;
  variants: FormGroup<{
    hasVariants: BoolCtrl;
    attributes: FormArray<AttributeForm>;
    variantData: FormArray<VariantForm>;
  }>;
  digital: FormGroup<{
    isDigital: BoolCtrl;
    digitalFile: StrCtrl;
    downloadLimit: StrCtrl;
    downloadExpiry: StrCtrl;
  }>;
  seo: FormGroup<{
    seoTitle: StrCtrl;
    seoDescription: StrCtrl;
    metaKeywords: FormArray<StrCtrl>;
  }>;
  advanced: FormGroup<{
    isFeatured: BoolCtrl;
    isActive: BoolCtrl;
    scheduledStart: StrCtrl;
    scheduledEnd: StrCtrl;
  }>;
}>;

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatStepperModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    MatTabsModule,
    MatRadioModule,
    MatExpansionModule,
    MatTooltipModule,
    MatBadgeModule,
    MatDatepickerModule,
    MatNativeDateModule,
    RouterModule,
    MatAutocompleteModule,
    MatMenuModule,
    MatChipsModule,
    MatProgressBarModule,
  ],
  templateUrl: './add-product.component.html',
  styleUrls: ['./add-product.component.scss'],
})
export class AddProductComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  public fb = inject(FormBuilder) as NonNullableFormBuilder;
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private productService = inject(ProductService);
  private storeService = inject(StoreService);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;


  // State
  public loading = signal<boolean>(false);
  public store = computed(() => this.storeService.currentStoreState());
  public productCategories = signal<string[]>([
    'Electronics',
    'Fashion',
    'Home & Garden',
    'Beauty & Health',
    'Sports',
    'Books',
    'Food & Grocery',
    'Automotive',
    'Digital Products',
    'Services',
  ]);

  // Image handling
  public images = signal<File[]>([]);
  public imagePreviews = signal<string[]>([]);
  public maxImages = 5;

  // Stepper
  public currentStep = signal<number>(0);
  public stepLabels = ['Basic Info', 'Inventory', 'Variants', 'Shipping', 'SEO', 'Review'];

  // Form
  public productForm!: ProductForm;

  // Variants
  public hasVariants = signal<boolean>(false);
  public attributes = signal<ProductAttribute[]>([]);

  ngOnInit(): void {
    this.initializeForm();
    this.listenForFormChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

    triggerFileInput(): void {
     this.fileInput.nativeElement.click();
    }

  private initializeForm(): void {
    this.productForm = this.fb.group({
      basicInfo: this.fb.group({
        name: this.fb.control<string>('', { validators: [Validators.required, Validators.minLength(3), Validators.maxLength(200)] }),
        description: this.fb.control<string>('', { validators: [Validators.maxLength(2000)] }),
        category: this.fb.control<string>('', { validators: [Validators.required] }),
        brand: this.fb.control<string>(''),
        tags: this.fb.array<StrCtrl>([]),
      }),
      pricing: this.fb.group({
        // make them numbers from the start -> avoids parseFloat/parseInt churn later
        price: this.fb.control<number>(0, { validators: [Validators.required, Validators.min(0)] }),
        originalPrice: this.fb.control<number>(0, { validators: [Validators.min(0)] }),
        costPrice: this.fb.control<number>(0, { validators: [Validators.min(0)] }),
        taxClass: this.fb.control<string>('standard'),
        taxable: this.fb.control<boolean>(true),
      }),
      inventory: this.fb.group({
        sku: this.fb.control<string>(''),
        quantity: this.fb.control<number>(0, { validators: [Validators.required, Validators.min(0)] }),
        lowStockAlert: this.fb.control<number>(5, { validators: [Validators.min(0)] }),
        manageStock: this.fb.control<boolean>(true),
        backorderAllowed: this.fb.control<boolean>(false),
        soldIndividually: this.fb.control<boolean>(false),
      }),
      shipping: this.fb.group({
        requiresShipping: this.fb.control<boolean>(true),
        weight: this.fb.control<string>(''),
        dimensions: this.fb.group({
          length: this.fb.control<string>(''),
          width: this.fb.control<string>(''),
          height: this.fb.control<string>(''),
        }),
        shippingClass: this.fb.control<string>(''),
      }),
      variants: this.fb.group({
        hasVariants: this.fb.control<boolean>(false),
        attributes: this.fb.array<AttributeForm>([]),
        variantData: this.fb.array<VariantForm>([]),
      }),
      digital: this.fb.group({
        isDigital: this.fb.control<boolean>(false),
        digitalFile: this.fb.control<string>(''),
        downloadLimit: this.fb.control<string>(''),
        downloadExpiry: this.fb.control<string>(''),
      }),
      seo: this.fb.group({
        seoTitle: this.fb.control<string>(''),
        seoDescription: this.fb.control<string>(''),
        metaKeywords: this.fb.array<StrCtrl>([]),
      }),
      advanced: this.fb.group({
        isFeatured: this.fb.control<boolean>(false),
        isActive: this.fb.control<boolean>(true),
        scheduledStart: this.fb.control<string>(''),
        scheduledEnd: this.fb.control<string>(''),
      }),
    });
  }

  private listenForFormChanges(): void {
    // Toggle variant management
    this.variants.get('hasVariants')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((has) => {
        this.hasVariants.set(!!has);
        if (has) {
          if (this.attributesArray.length === 0) this.addAttribute();
        } else {
          this.clearAttributes();
        }
      });

    // Auto-generate SKU from name
    this.basicInfo.get('name')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((name) => {
        const skuCtrl = this.inventory.get('sku') as StrCtrl;
        if (name && !skuCtrl.value) {
          const sku = name.toUpperCase().replace(/\s+/g, '-').substring(0, 20);
          skuCtrl.setValue(sku);
        }
      });
  }

  // ======= Form getters (typed) =======
  get basicInfo(): ProductForm['controls']['basicInfo'] { return this.productForm.get('basicInfo') as any; }
  get pricing(): ProductForm['controls']['pricing'] { return this.productForm.get('pricing') as any; }
  get inventory(): ProductForm['controls']['inventory'] { return this.productForm.get('inventory') as any; }
  get shipping(): ProductForm['controls']['shipping'] { return this.productForm.get('shipping') as any; }
  get digital(): ProductForm['controls']['digital'] { return this.productForm.get('digital') as any; }
  get seo(): ProductForm['controls']['seo'] { return this.productForm.get('seo') as any; }
  get advanced(): ProductForm['controls']['advanced'] { return this.productForm.get('advanced') as any; }
  get variants(): ProductForm['controls']['variants'] { return this.productForm.get('variants') as any; }

  get attributesArray(): FormArray<AttributeForm> {
    return this.variants.get('attributes') as FormArray<AttributeForm>;
  }
  get variantsArray(): FormArray<VariantForm> {
    return this.variants.get('variantData') as FormArray<VariantForm>;
  }
  get tagsArray(): FormArray<StrCtrl> {
    return this.basicInfo.get('tags') as FormArray<StrCtrl>;
  }
  get keywordsArray(): FormArray<StrCtrl> {
    return this.seo.get('metaKeywords') as FormArray<StrCtrl>;
  }
  get dimensions(): ProductForm['controls']['shipping']['controls']['dimensions'] {
    return this.shipping.get('dimensions') as any;
  }

  // ======= Utilities to avoid TS2739 in templates =======
  // Return a FormControl for a path (for [formControl] bindings)
  fc<T = unknown>(path: string): FormControl<T> {
    return this.productForm.get(path) as FormControl<T>;
  }
  // Return a FormControl from an AbstractControl (for arrays)
  asCtrl<T>(ctrl: AbstractControl<T, any> | null): FormControl<T> {
    return ctrl as FormControl<T>;
  }
  // Convenience: value control inside attributes.values FormArray
  valueControl(attributeIndex: number, valueIndex: number): StrCtrl {
    return this.getAttributeValuesArray(attributeIndex).at(valueIndex) as StrCtrl;
  }

  // ======= Attribute Management =======
  clearAttributes(): void {
    while (this.attributesArray.length) this.attributesArray.removeAt(0);
    while (this.variantsArray.length) this.variantsArray.removeAt(0);
  }

  getAttributeValuesArray(attributeIndex: number): FormArray<StrCtrl> {
    return this.attributesArray.at(attributeIndex).get('values') as FormArray<StrCtrl>;
  }

  addAttribute(): void {
    const attributeGroup: AttributeForm = this.fb.group({
      name: this.fb.control<string>('', { validators: [Validators.required] }),
      values: this.fb.array<StrCtrl>([
        this.fb.control<string>('', { validators: [Validators.required] }),
      ]),
      visible: this.fb.control<boolean>(true),
      variation: this.fb.control<boolean>(true),
    });
    this.attributesArray.push(attributeGroup);
  }

  removeAttribute(index: number): void {
    this.attributesArray.removeAt(index);
  }

  addAttributeValue(attributeIndex: number): void {
    const valuesArray = this.getAttributeValuesArray(attributeIndex);
    valuesArray.push(this.fb.control<string>('', { validators: [Validators.required] }));
  }

  removeAttributeValue(attributeIndex: number, valueIndex: number): void {
    const valuesArray = this.getAttributeValuesArray(attributeIndex);
    if (valuesArray.length > 1) valuesArray.removeAt(valueIndex);
  }

  generateVariants(): void {
    this.variantsArray.clear();
    // Simple variant generation: each value becomes a variant (across all attributes)
    this.attributesArray.controls.forEach((attrCtrl) => {
      const name = (attrCtrl.get('name') as StrCtrl).value ?? '';
      const values = (attrCtrl.get('values') as FormArray<StrCtrl>).controls.map((c) => c.value ?? '');

      values.forEach((v) => {
        const variant: VariantForm = this.fb.group({
          name: this.fb.control<string>(`${name}: ${v}`),
          sku: this.fb.control<string>(''),
          price: this.fb.control<number>(0, { validators: [Validators.min(0)] }),
          quantity: this.fb.control<number>(0, { validators: [Validators.min(0)] }),
        });
        this.variantsArray.push(variant);
      });
    });
  }

  // ======= Tags / Keywords =======
  addTag(event: any): void {
    const input = event.input;
    const value = (event.value ?? '').trim();
    if (value) {
      this.tagsArray.push(this.fb.control<string>(value));
      if (input) input.value = '';
    }
  }
  removeTag(index: number): void {
    this.tagsArray.removeAt(index);
  }

  // ======= Image Handling =======
  onImageSelect(event: any): void {
    const files: FileList = event.target.files;
    for (let i = 0; i < files.length; i++) {
      if (this.imagePreviews().length >= this.maxImages) break;
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.images.update((prev) => [...prev, file]);
        this.imagePreviews.update((prev) => [...prev, e.target.result]);
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(index: number): void {
    this.images.update((prev) => prev.filter((_, i) => i !== index));
    this.imagePreviews.update((prev) => prev.filter((_, i) => i !== index));
  }

  reorderImages(from: number, to: number): void {
    const images = [...this.imagePreviews()];
    const [moved] = images.splice(from, 1);
    images.splice(to, 0, moved);
    this.imagePreviews.set(images);
  }

  // ======= Stepper & Validation =======
  nextStep(): void {
    this.currentStep.update((prev) => Math.min(prev + 1, this.stepLabels.length - 1));
  }
  previousStep(): void {
    this.currentStep.update((prev) => Math.max(prev - 1, 0));
  }
  isStepValid(step: number): boolean {
    switch (step) {
      case 0: return this.basicInfo.valid;
      case 1: return this.pricing.valid && this.inventory.valid;
      default: return true;
    }
  }

  // ======= Submit / Cancel =======
  onSubmit(): void {
    if (this.productForm.invalid) {
      this.markFormGroupTouched(this.productForm);
      this.showError('Please fill all required fields correctly.');
      return;
    }
    if (!this.store()) {
      this.showError('No store selected.');
      return;
    }

    this.loading.set(true);
    const fv = this.productForm.getRawValue(); // typed

    const productData: CreateProductRequest = {
      name: fv.basicInfo.name,
      description: fv.basicInfo.description || '',
      price: fv.pricing.price ?? 0,
      originalPrice: fv.pricing.originalPrice || undefined,
      images: this.images(), // File[]
      quantity: fv.inventory.quantity ?? 0,
      category: fv.basicInfo.category,
      tags: fv.basicInfo.tags?.length ? fv.basicInfo.tags : [],
      lowStockAlert: fv.inventory.lowStockAlert ?? 0,
      isFeatured: fv.advanced.isFeatured ?? false,
      seo: {
        title: fv.seo.seoTitle || '',
        description: fv.seo.seoDescription || '',
        keywords: fv.seo.metaKeywords?.length ? fv.seo.metaKeywords : [],
        slug: this.generateSlug(fv.basicInfo.name),
      },
      variants: fv.variants.hasVariants
        ? this.prepareVariants(this.variantsArray.getRawValue())
        : undefined,
    };

    this.storeService.addProduct(this.store()!._id!, productData).subscribe({
      next: () => {
        this.loading.set(false);
        this.showSuccess('Product created successfully!');
        setTimeout(() => {
          this.router.navigate(['/dashboard/stores', this.store()?._id, 'products']);
        }, 1500);
      },
      error: (error) => {
        this.loading.set(false);
        console.error('Failed to create product:', error);
        this.showError('Failed to create product. Please try again.');
      },
    });
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  private prepareVariants(variantData: Array<{
    name: string;
    price: number;
    sku: string;
    quantity: number;
    attributes?: any;
  }>): ProductVariant[] {
    const basePrice = this.pricing.get('price')?.value ?? 0;
    return variantData.map((v, i) => ({
      id: `variant-${i + 1}`,
      name: v.name,
      options: this.prepareVariantOptions(v.attributes),
      priceAdjustment: (v.price ?? 0) - basePrice,
      price: v.price ?? basePrice,
      sku: v.sku,
      quantity: v.quantity ?? 0,
      attributes: v.attributes,
    }));
  }

  private prepareVariantOptions(attributes: any): any {
    return attributes ?? {};
  }

  onCancel(): void {
    if (this.productForm.dirty) {
      const confirmLeave = confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmLeave) return;
    }
    this.router.navigate(['/dashboard/stores', this.store()?._id, 'products']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control as any);
      }
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'OK', { duration: 3000, panelClass: ['success-snackbar'] });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'OK', { duration: 5000, panelClass: ['error-snackbar'] });
  }
}
