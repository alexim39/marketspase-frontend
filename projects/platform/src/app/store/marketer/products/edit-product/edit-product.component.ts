// components/product-management/edit-product/edit-product.component.ts
import {
  Component, inject, OnInit, signal, OnDestroy,
  computed, effect, Signal, Injector
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
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

// Child Components (reuse from add product)
import { AddProductHeaderComponent } from '../add-products/components/add-product-header/add-product-header.component';
import { ProductStepperComponent } from '../add-products/components/product-stepper/product-stepper.component';
import { BasicInfoFormComponent } from '../add-products/components/basic-info-form/basic-info-form.component';
import { PricingInventoryFormComponent } from '../add-products/components/pricing-inventory-form/pricing-inventory-form.component';
import { ProductVariantsComponent } from '../add-products/components/product-variants/product-variants.component';
import { ShippingFormComponent } from '../add-products/components/shipping-form/shipping-form.component';
import { SeoAdvancedFormComponent } from '../add-products/components/seo-advanced-form/seo-advanced-form.component';
import { ProductReviewComponent } from '../add-products/components/product-review/product-review.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Services and Models
import { UserService } from '../../../../common/services/user.service';
import { UserInterface } from '../../../../../../../shared-services/src/public-api';
import { CATEGORIES, CategoryOption } from '../../../../common/utils/categories';
import { ProductResponse } from '../../../models/product.model';
import { ProductService } from '../product.service';

type StrCtrl = FormControl<string>;
type NumCtrl = FormControl<number>;
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
  price: NumCtrl;
  quantity: NumCtrl;
}>;

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
  selector: 'app-edit-product',
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
    MatProgressSpinnerModule 
  ],
  templateUrl: './edit-product.component.html',
  styleUrls: ['./edit-product.component.scss']
})
export class EditProductComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  public fb = inject(FormBuilder) as NonNullableFormBuilder;
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private productService = inject(ProductService);
  private userService = inject(UserService);
  private injector = inject(Injector);

  protected storeId = '';
  protected productId = '';
  protected user: Signal<UserInterface | null> = this.userService.user;

  // State
  public loading = signal<boolean>(false);
  public initialLoading = signal<boolean>(true);
  private _productCategories = signal<CategoryOption[]>(CATEGORIES);
  public productCategories = this._productCategories.asReadonly();

  // Image handling
  public images = signal<File[]>([]);
  public imagePreviews = signal<string[]>([]);
  public existingImages = signal<Array<{ url: string; altText: string; isMain: boolean; order: number }>>([]);
  public removedImages = signal<string[]>([]);
  public maxImages = 5;

  // Stepper
  public currentStep = signal<number>(0);
  public stepLabels = ['Basic Info', 'Inventory', 'Variants', 'Shipping', 'SEO', 'Review'];

  // Form
  public productForm!: ProductForm;

  // Computed getters
  get basicInfo() { return this.productForm.get('basicInfo') as any; }
  get pricing() { return this.productForm.get('pricing') as any; }
  get inventory() { return this.productForm.get('inventory') as any; }
  get shipping() { return this.productForm.get('shipping') as any; }
  get digital() { return this.productForm.get('digital') as any; }
  get seo() { return this.productForm.get('seo') as any; }
  get advanced() { return this.productForm.get('advanced') as any; }
  get variants() { return this.productForm.get('variants') as any; }
  get tagsArray() { return this.basicInfo.get('tags') as FormArray<StrCtrl>; }
  get keywordsArray() { return this.seo.get('metaKeywords') as FormArray<StrCtrl>; }
  get attributesArray() { return this.variants.get('attributes') as FormArray<AttributeForm>; }
  get variantsArray() { return this.variants.get('variantData') as FormArray<VariantForm>; }

  ngOnInit(): void {
    this.initializeForm();

    // Get route params
    this.route.paramMap.subscribe(params => {
      this.storeId = params.get('storeId') || '';
      this.productId = params.get('productId') || '';
      
      if (this.storeId && this.productId) {
        this.loadProduct();
      }
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
        description: this.fb.control<string>('', { validators: [Validators.required, Validators.maxLength(2000)] }),
        category: this.fb.control<string>('', { validators: [Validators.required] }),
        brand: this.fb.control<string>(''),
        tags: this.fb.array<StrCtrl>([]),
      }),
      pricing: this.fb.group({
        price: this.fb.control<number>(0, { validators: [Validators.required, Validators.min(100)] }),
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

  private loadProduct(): void {
    this.initialLoading.set(true);

    this.productService.getProduct(this.storeId, this.productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // API returns { success, data: { ...product... } }
          const productPayload = (response as any).data ?? response;

          const normalizedResponse = {
            ...productPayload,
            weight: productPayload.weight != null ? productPayload.weight.toString() : undefined,
            variants: productPayload.variants?.map((v: any) => ({
              ...v,
              options: v.options || [],
              priceAdjustment: v.priceAdjustment || 0
            })) || []
          };

          this.populateForm(normalizedResponse as ProductResponse);
          this.initialLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load product:', error);
          this.showError('Failed to load product data');
          this.initialLoading.set(false);
          this.router.navigate(['/dashboard/stores', this.storeId, 'products']);
        }
      });
  }

  private populateForm(product: ProductResponse): void {
    // Basic Info
    this.basicInfo.patchValue({
      name: product.name,
      description: product.description,
      category: product.category,
      brand: product.brand || ''
    });

    // Tags
    if (product.tags && product.tags.length) {
      product.tags.forEach(tag => {
        this.tagsArray.push(this.fb.control<string>(tag));
      });
    }

    // Pricing
    this.pricing.patchValue({
      price: product.price,
      originalPrice: product.originalPrice || 0,
      costPrice: product.costPrice || 0,
      taxClass: product.taxClass || 'standard',
      taxable: product.taxable !== undefined ? product.taxable : true
    });

    // Inventory
    this.inventory.patchValue({
      sku: product.sku || '',
      quantity: product.quantity,
      lowStockAlert: product.lowStockAlert || 5,
      manageStock: product.manageStock !== undefined ? product.manageStock : true,
      backorderAllowed: product.backorderAllowed || false,
      soldIndividually: product.soldIndividually || false
    });

    // Shipping
    this.shipping.patchValue({
      requiresShipping: product.requiresShipping !== undefined ? product.requiresShipping : true,
      weight: (product.weight !== undefined && product.weight !== null) ? product.weight.toString() : '',
      shippingClass: product.shippingClass || ''
    });

    if (product.dimensions) {
      this.shipping.get('dimensions')?.patchValue({
        length: product.dimensions.length?.toString() || '',
        width: product.dimensions.width?.toString() || '',
        height: product.dimensions.height?.toString() || ''
      });
    }

    // Variants
    if (product.hasVariants) {
      this.variants.get('hasVariants')?.setValue(true);

      // Attributes
      if (product.attributes && product.attributes.length) {
        product.attributes.forEach(attr => {
          const valuesArray = this.fb.array<StrCtrl>([]);
          attr.values.forEach(value => {
            valuesArray.push(this.fb.control<string>(value));
          });

          const attributeGroup: AttributeForm = this.fb.group({
            name: this.fb.control<string>(attr.name, { validators: [Validators.required] }),
            values: valuesArray,
            visible: this.fb.control<boolean>(attr.visible !== undefined ? attr.visible : true),
            variation: this.fb.control<boolean>(attr.variation !== undefined ? attr.variation : true)
          });

          this.attributesArray.push(attributeGroup);
        });
      }

      // Variants
      if (product.variants && product.variants.length) {
        product.variants.forEach(variant => {
          const variantGroup: VariantForm = this.fb.group({
            name: this.fb.control<string>(variant.name),
            sku: this.fb.control<string>(variant.sku || ''),
            price: this.fb.control<number>(variant.price || 0, { validators: [Validators.min(0)] }),
            quantity: this.fb.control<number>(variant.quantity || 0, { validators: [Validators.min(0)] })
          });
          this.variantsArray.push(variantGroup);
        });
      }
    }

    // Digital
    if (product.isDigital) {
      this.digital.patchValue({
        isDigital: true,
        digitalFile: product.digitalProduct?.fileName || '',
        downloadLimit: product.digitalProduct?.downloadLimit?.toString() || '',
        downloadExpiry: product.digitalProduct?.downloadExpiry?.toString() || ''
      });
    }

    // SEO
    if (product.seo) {
      this.seo.patchValue({
        seoTitle: product.seo.title || '',
        seoDescription: product.seo.description || ''
      });

      if (product.seo.keywords && product.seo.keywords.length) {
        product.seo.keywords.forEach(keyword => {
          this.keywordsArray.push(this.fb.control<string>(keyword));
        });
      }
    }

    // Advanced
    this.advanced.patchValue({
      isFeatured: product.isFeatured || false,
      isActive: product.isActive !== undefined ? product.isActive : true,
      scheduledStart: product.scheduledStart || '',
      scheduledEnd: product.scheduledEnd || ''
    });

    // Images
    if (product.images && product.images.length) {
      this.existingImages.set(product.images.map(img => ({
        ...img,
        altText: img.altText || '',
        isMain: img.isMain ?? false,
        order: img.order ?? 0
      })));
      this.imagePreviews.set(product.images.map(img => img.url));
    }
  }

  // ======= Event Handlers =======

  onImagesChanged(event: { files: File[], previews: string[] }): void {
    this.images.set(event.files);
    this.imagePreviews.set([...this.existingImages().map(img => img.url), ...event.previews]);
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

  removeExistingImage(index: number): void {
    const removedImage = this.existingImages()[index];
    this.removedImages.update(prev => [...prev, removedImage.url]);
    
    const updatedExisting = this.existingImages().filter((_, i) => i !== index);
    this.existingImages.set(updatedExisting);
    
    this.imagePreviews.set([
      ...updatedExisting.map(img => img.url),
      ...this.images().map(file => URL.createObjectURL(file))
    ]);
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

  // ======= Submit =======

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.markFormGroupTouched(this.productForm);
      this.showError('Please fill all required fields correctly.');
      return;
    }
    
    if (!this.storeId || !this.productId) {
      this.showError('Missing store or product information.');
      return;
    }

    if (!this.user()?._id) {
      this.showError('User not found. Please log in again.');
      return;
    }

    this.loading.set(true);
    const fv = this.productForm.getRawValue();

    // Prepare FormData
    const formData = new FormData();
    
    // Basic info
    formData.append('name', fv.basicInfo.name);
    if (fv.basicInfo.description) formData.append('description', fv.basicInfo.description);
    formData.append('category', fv.basicInfo.category);
    if (fv.basicInfo.brand) formData.append('brand', fv.basicInfo.brand);
    
    // Tags
    if (fv.basicInfo.tags?.length) {
      fv.basicInfo.tags.forEach((tag, index) => {
        if (tag.trim()) formData.append(`tags[${index}]`, tag.trim());
      });
    }

    // Pricing
    formData.append('price', fv.pricing.price.toString());
    if (fv.pricing.originalPrice) formData.append('originalPrice', fv.pricing.originalPrice.toString());
    if (fv.pricing.costPrice) formData.append('costPrice', fv.pricing.costPrice.toString());
    formData.append('taxable', fv.pricing.taxable.toString());
    formData.append('taxClass', fv.pricing.taxClass);

    // Inventory
    formData.append('quantity', fv.inventory.quantity.toString());
    formData.append('lowStockAlert', fv.inventory.lowStockAlert.toString());
    formData.append('manageStock', fv.inventory.manageStock.toString());
    formData.append('backorderAllowed', fv.inventory.backorderAllowed.toString());
    formData.append('soldIndividually', fv.inventory.soldIndividually.toString());
    if (fv.inventory.sku) formData.append('sku', fv.inventory.sku);

    // Shipping
    formData.append('requiresShipping', fv.shipping.requiresShipping.toString());
    if (fv.shipping.weight) formData.append('weight', fv.shipping.weight);
    
    const dims = fv.shipping.dimensions;
    if (dims && (dims.length || dims.width || dims.height)) {
      if (dims.length) formData.append('dimensions[length]', dims.length);
      if (dims.width) formData.append('dimensions[width]', dims.width);
      if (dims.height) formData.append('dimensions[height]', dims.height);
    }
    
    if (fv.shipping.shippingClass) formData.append('shippingClass', fv.shipping.shippingClass);

    // Variants
    formData.append('hasVariants', fv.variants.hasVariants.toString());
    
    if (fv.variants.hasVariants && fv.variants.attributes?.length) {
      fv.variants.attributes.forEach((attr, attrIndex) => {
        if (attr.name?.trim()) {
          formData.append(`attributes[${attrIndex}][name]`, attr.name.trim());
          formData.append(`attributes[${attrIndex}][visible]`, attr.visible.toString());
          formData.append(`attributes[${attrIndex}][variation]`, attr.variation.toString());
          
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

    // Digital
    formData.append('isDigital', fv.digital.isDigital.toString());
    if (fv.digital.isDigital) {
      if (fv.digital.downloadLimit) formData.append('digitalProduct[downloadLimit]', fv.digital.downloadLimit);
      if (fv.digital.downloadExpiry) formData.append('digitalProduct[downloadExpiry]', fv.digital.downloadExpiry);
    }

    // SEO
    if (fv.seo.seoTitle) formData.append('seo[title]', fv.seo.seoTitle);
    if (fv.seo.seoDescription) formData.append('seo[description]', fv.seo.seoDescription);
    
    if (fv.seo.metaKeywords?.length) {
      fv.seo.metaKeywords.forEach((keyword, index) => {
        if (keyword.trim()) {
          formData.append(`seo[keywords][${index}]`, keyword.trim());
        }
      });
    }

    // Advanced
    formData.append('isFeatured', fv.advanced.isFeatured.toString());
    formData.append('isActive', fv.advanced.isActive.toString());
    if (fv.advanced.scheduledStart) formData.append('scheduledStart', fv.advanced.scheduledStart);
    if (fv.advanced.scheduledEnd) formData.append('scheduledEnd', fv.advanced.scheduledEnd);

    // Removed images
    if (this.removedImages().length) {
      formData.append('removedImages', JSON.stringify(this.removedImages()));
    }

    // New images
    const imageFiles = this.images();
    if (imageFiles.length > 0) {
      imageFiles.forEach((imageFile) => {
        if (imageFile) {
          formData.append('images', imageFile);
        }
      });
    }

    // Submit update
    this.productService.updateProduct(this.storeId, this.user()!._id, this.productId, formData as any)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          this.showSuccess('Product updated successfully!');
          
          setTimeout(() => {
            this.router.navigate(['/dashboard/stores', this.storeId, 'products']);
          }, 1500);
        },
        error: (error) => {
          this.loading.set(false);
          console.error('Failed to update product:', error);
          
          let errorMessage = 'Failed to update product. Please try again.';
          if (error.status === 400) {
            errorMessage = error.error.message || 'Invalid product data. Please check all fields.';
          } else if (error.status === 409) {
            errorMessage = 'A product with similar details already exists.';
          } else if (error.status === 413) {
            errorMessage = 'Image files are too large. Please reduce file size.';
          } else if (error.status === 404) {
            errorMessage = 'Product not found.';
          }
          
          this.showError(errorMessage);
        },
      });
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