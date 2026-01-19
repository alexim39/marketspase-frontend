// components/product-management/add-product/add-product.component.ts
import {
  Component, inject, OnInit, signal, OnDestroy,
  computed,
  Signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  FormControl,
  ReactiveFormsModule,
  Validators,
  NonNullableFormBuilder,
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

//import { ProductService } from '../../services/product.service';
//import { StoreService } from '../../services/store.service';
import { ProductVariant, CreateProductRequest } from '../../models/product.model';

// Child Components
import { AddProductHeaderComponent } from './components/add-product-header/add-product-header.component';
import { ProductStepperComponent } from './components/product-stepper/product-stepper.component';
import { BasicInfoFormComponent } from './components/basic-info-form/basic-info-form.component';
import { PricingInventoryFormComponent } from './components/pricing-inventory-form/pricing-inventory-form.component';
import { ProductVariantsComponent } from './components/product-variants/product-variants.component';
import { ShippingFormComponent } from './components/shipping-form/shipping-form.component';
import { SeoAdvancedFormComponent } from './components/seo-advanced-form/seo-advanced-form.component';
import { ProductReviewComponent } from './components/product-review/product-review.component';
import { ProductService } from './add-product.service';
import { UserService } from '../../../common/services/user.service';
import { UserInterface } from '../../../../../../shared-services/src/public-api';

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

// Root product form type
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
    weight: StrCtrl;
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
  providers: [ProductService],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AddProductHeaderComponent,
    ProductStepperComponent,
    BasicInfoFormComponent,
    PricingInventoryFormComponent,
    ProductVariantsComponent,
    ShippingFormComponent,
    SeoAdvancedFormComponent,
    ProductReviewComponent,
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
  //private storeService = inject(StoreService);

  protected storeId = ''

  private userService: UserService = inject(UserService);
  public user: Signal<UserInterface | null> = this.userService.user;
  

  // State
  public loading = signal<boolean>(false);
  //public store = computed(() => this.storeService.currentStoreState());
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

  // Computed getters for child components
  get basicInfo(): ProductForm['controls']['basicInfo'] { return this.productForm.get('basicInfo') as any; }
  get pricing(): ProductForm['controls']['pricing'] { return this.productForm.get('pricing') as any; }
  get inventory(): ProductForm['controls']['inventory'] { return this.productForm.get('inventory') as any; }
  get shipping(): ProductForm['controls']['shipping'] { return this.productForm.get('shipping') as any; }
  get digital(): ProductForm['controls']['digital'] { return this.productForm.get('digital') as any; }
  get seo(): ProductForm['controls']['seo'] { return this.productForm.get('seo') as any; }
  get advanced(): ProductForm['controls']['advanced'] { return this.productForm.get('advanced') as any; }
  get variants(): ProductForm['controls']['variants'] { return this.productForm.get('variants') as any; }
  get tagsArray(): FormArray<StrCtrl> { return this.basicInfo.get('tags') as FormArray<StrCtrl>; }
  get keywordsArray(): FormArray<StrCtrl> { return this.seo.get('metaKeywords') as FormArray<StrCtrl>; }
  get dimensions() { return this.shipping.get('dimensions'); }
  get attributesArray(): FormArray<AttributeForm> { return this.variants.get('attributes') as FormArray<AttributeForm>; }
  get variantsArray(): FormArray<VariantForm> { return this.variants.get('variantData') as FormArray<VariantForm>; }

  ngOnInit(): void {
    this.initializeForm();
    this.listenForFormChanges();

    // Observable (Use if the URL might change while on this page)
    this.route.paramMap.subscribe(params => {
      this.storeId = params.get('storeId') || ''
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

  // ======= Event Handlers =======
  onImagesChanged(event: { files: File[], previews: string[] }): void {
    this.images.set(event.files);
    this.imagePreviews.set(event.previews);
  }

  onTagsChanged(tags: string[]): void {
    this.tagsArray.clear();
    tags.forEach(tag => this.tagsArray.push(this.fb.control<string>(tag)));
  }

  onKeywordsChanged(keywords: string[]): void {
    this.keywordsArray.clear();
    keywords.forEach(keyword => this.keywordsArray.push(this.fb.control<string>(keyword)));
  }

  onAttributeAdded(attribute: any): void {
    const attributeGroup: AttributeForm = this.fb.group({
      name: this.fb.control<string>(attribute.name || '', { validators: [Validators.required] }),
      values: this.fb.array<StrCtrl>([
        this.fb.control<string>('', { validators: [Validators.required] }),
      ]),
      visible: this.fb.control<boolean>(attribute.visible || true),
      variation: this.fb.control<boolean>(attribute.variation || true),
    });
    this.attributesArray.push(attributeGroup);
  }

  onAttributeRemoved(index: number): void {
    this.attributesArray.removeAt(index);
  }

  onAttributeValueAdded(event: { attributeIndex: number, value: string }): void {
    const valuesArray = this.attributesArray.at(event.attributeIndex).get('values') as FormArray<StrCtrl>;
    valuesArray.push(this.fb.control<string>(event.value || '', { validators: [Validators.required] }));
  }

  onAttributeValueRemoved(event: { attributeIndex: number, valueIndex: number }): void {
    const valuesArray = this.attributesArray.at(event.attributeIndex).get('values') as FormArray<StrCtrl>;
    if (valuesArray.length > 1) valuesArray.removeAt(event.valueIndex);
  }

  onVariantsGenerated(variants: any[]): void {
    this.variantsArray.clear();
    variants.forEach(variant => {
      const variantGroup: VariantForm = this.fb.group({
        name: this.fb.control<string>(variant.name),
        sku: this.fb.control<string>(variant.sku || ''),
        price: this.fb.control<number>(variant.price || 0, { validators: [Validators.min(0)] }),
        quantity: this.fb.control<number>(variant.quantity || 0, { validators: [Validators.min(0)] }),
      });
      this.variantsArray.push(variantGroup);
    });
  }

  onVariantChanged(event: { index: number, variant: any }): void {
    const variantGroup = this.variantsArray.at(event.index);
    variantGroup.patchValue(event.variant);
  }

  // ======= Stepper Navigation =======
  nextStep(): void {
    this.currentStep.update((prev) => Math.min(prev + 1, this.stepLabels.length - 1));
  }

  previousStep(): void {
    this.currentStep.update((prev) => Math.max(prev - 1, 0));
  }

  goToStep(step: number): void {
    this.currentStep.set(step);
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
  
  if (!this.storeId) {
    this.showError('No store selected.');
    return;
  }

  if (!this.user()?._id) {
    this.showError('User not found. Please log in again.');
    return;
  }

  this.loading.set(true);
  const fv = this.productForm.getRawValue();

  // Prepare FormData for file upload
  const formData = new FormData();
  
  // Add basic info (only append if value exists)
  formData.append('name', fv.basicInfo.name);
  if (fv.basicInfo.description) formData.append('description', fv.basicInfo.description);
  formData.append('category', fv.basicInfo.category);
  if (fv.basicInfo.brand) formData.append('brand', fv.basicInfo.brand);
  
  // Add tags if any
  if (fv.basicInfo.tags?.length) {
    fv.basicInfo.tags.forEach((tag, index) => {
      if (tag.trim()) {
        formData.append(`tags[${index}]`, tag.trim());
      }
    });
  }

  // Add pricing
  formData.append('price', fv.pricing.price.toString());
  if (fv.pricing.originalPrice) formData.append('originalPrice', fv.pricing.originalPrice.toString());
  if (fv.pricing.costPrice) formData.append('costPrice', fv.pricing.costPrice.toString());
  formData.append('taxable', fv.pricing.taxable.toString());
  formData.append('taxClass', fv.pricing.taxClass);

  // Add inventory
  formData.append('quantity', fv.inventory.quantity.toString());
  formData.append('lowStockAlert', fv.inventory.lowStockAlert.toString());
  formData.append('manageStock', fv.inventory.manageStock.toString());
  formData.append('backorderAllowed', fv.inventory.backorderAllowed.toString());
  formData.append('soldIndividually', fv.inventory.soldIndividually.toString());
  if (fv.inventory.sku) formData.append('sku', fv.inventory.sku);

  // Add shipping
  formData.append('requiresShipping', fv.shipping.requiresShipping.toString());
  if (fv.shipping.weight) formData.append('weight', fv.shipping.weight);
  
  // Add dimensions only if they exist
  const dims = fv.shipping.dimensions;
  if (dims && (dims.length || dims.width || dims.height)) {
    if (dims.length) formData.append('dimensions[length]', dims.length);
    if (dims.width) formData.append('dimensions[width]', dims.width);
    if (dims.height) formData.append('dimensions[height]', dims.height);
  }
  
  if (fv.shipping.shippingClass) formData.append('shippingClass', fv.shipping.shippingClass);

  // Add variants
  formData.append('hasVariants', fv.variants.hasVariants.toString());
  
  if (fv.variants.hasVariants && fv.variants.attributes?.length) {
    fv.variants.attributes.forEach((attr, attrIndex) => {
      if (attr.name?.trim()) {
        formData.append(`attributes[${attrIndex}][name]`, attr.name.trim());
        formData.append(`attributes[${attrIndex}][visible]`, attr.visible.toString());
        formData.append(`attributes[${attrIndex}][variation]`, attr.variation.toString());
        
        // Add attribute values if they exist
        if (attr.values?.length) {
          attr.values.forEach((value, valueIndex) => {
            if (value?.trim()) {
              formData.append(`attributes[${attrIndex}][values][${valueIndex}]`, value.trim());
            }
          });
        }
      }
    });
  }

  if (fv.variants.hasVariants && fv.variants.variantData?.length) {
    fv.variants.variantData.forEach((variant, variantIndex) => {
      if (variant.name) {
        formData.append(`variants[${variantIndex}][name]`, variant.name);
        if (variant.sku) formData.append(`variants[${variantIndex}][sku]`, variant.sku);
        formData.append(`variants[${variantIndex}][price]`, variant.price.toString());
        formData.append(`variants[${variantIndex}][quantity]`, variant.quantity.toString());
      }
    });
  }

  // Add digital product info
  formData.append('isDigital', fv.digital.isDigital.toString());
  if (fv.digital.isDigital) {
    if (fv.digital.downloadLimit) formData.append('digitalProduct[downloadLimit]', fv.digital.downloadLimit);
    if (fv.digital.downloadExpiry) formData.append('digitalProduct[downloadExpiry]', fv.digital.downloadExpiry);
  }

  // Add SEO
  if (fv.seo.seoTitle) formData.append('seo[title]', fv.seo.seoTitle);
  if (fv.seo.seoDescription) formData.append('seo[description]', fv.seo.seoDescription);
  
  if (fv.seo.metaKeywords?.length) {
    fv.seo.metaKeywords.forEach((keyword, index) => {
      if (keyword.trim()) {
        formData.append(`seo[keywords][${index}]`, keyword.trim());
      }
    });
  }

  // Add advanced settings
  formData.append('isFeatured', fv.advanced.isFeatured.toString());
  formData.append('isActive', fv.advanced.isActive.toString());
  if (fv.advanced.scheduledStart) formData.append('scheduledStart', fv.advanced.scheduledStart);
  if (fv.advanced.scheduledEnd) formData.append('scheduledEnd', fv.advanced.scheduledEnd);

  // Add images (important: check if files exist)
  const imageFiles = this.images();
  if (imageFiles.length > 0) {
    imageFiles.forEach((imageFile) => {
      if (imageFile) {
        formData.append('images', imageFile);
      }
    });
  } else {
    console.warn('No images selected for product');
  }

  // Debug: Log all FormData entries
  console.log('FormData entries:');
  for (const pair of formData.entries()) {
    console.log(`${pair[0]}:`, pair[1]);
  }

  // Use the product service to create product
  this.productService.createProduct(this.storeId, this.user()!._id, formData).subscribe({
    next: (response) => {
      this.loading.set(false);
      this.showSuccess('Product created successfully!');
      
      // Reset form after successful creation
      this.productForm.reset();
      this.images.set([]);
      this.imagePreviews.set([]);
      
      // Navigate back to products list after delay
      setTimeout(() => {
        this.router.navigate(['/dashboard/stores', this.storeId, 'products']);
      }, 1500);
    },
    error: (error) => {
      this.loading.set(false);
      console.error('Failed to create product:', error);
      
      // Handle specific errors
      let errorMessage = 'Failed to create product. Please try again.';
      if (error.status === 400) {
        errorMessage = error.error.message || 'Invalid product data. Please check all fields.';
      } else if (error.status === 409) {
        errorMessage = 'A product with similar details already exists.';
      } else if (error.status === 413) {
        errorMessage = 'Image files are too large. Please reduce file size.';
      }
      
      this.showError(errorMessage);
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
    this.router.navigate(['/dashboard/stores', this.storeId, 'products']);
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