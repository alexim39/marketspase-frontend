import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormControl } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Product } from '../../shared/product.model';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';

interface ProductEditDialogData {
  product: Product;
  storeId: string;
  categories: string[];
  tags: string[];
}

@Component({
  selector: 'app-product-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatDividerModule,
    MatCheckboxModule,
    MatChipsModule,
    MatExpansionModule,
    MatTabsModule,
    MatTooltipModule,
    MatAutocompleteModule,
    MatNativeDateModule,
    MatDatepickerModule,
  ],
  templateUrl: './product-edit-dialog.component.html',
  styleUrls: ['./product-edit-dialog.component.scss']
})
export class ProductEditDialogComponent implements OnInit {
  productForm: FormGroup;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  filteredTags: string[] = [];
  
  // Computed properties for price info
  get price(): number {
    return this.productForm.get('price')?.value || 0;
  }
  
  get originalPrice(): number {
    return this.productForm.get('originalPrice')?.value || 0;
  }
  
  get costPrice(): number {
    return this.productForm.get('costPrice')?.value || 0;
  }
  
  get priceDifference(): number {
    if (!this.originalPrice || this.originalPrice <= this.price) return 0;
    return this.originalPrice - this.price;
  }
  
  get discountPercentage(): number {
    if (!this.originalPrice || this.originalPrice <= this.price) return 0;
    return ((this.originalPrice - this.price) / this.originalPrice) * 100;
  }
  
  get marginPercentage(): number {
    if (!this.costPrice || this.costPrice <= 0 || this.price <= 0) return 0;
    return ((this.price - this.costPrice) / this.price) * 100;
  }
  
  get descriptionLength(): number {
    const description = this.productForm.get('description')?.value || '';
    return description.length;
  }
  
  get tagsArray(): FormArray {
    return this.productForm.get('tags') as FormArray;
  }

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ProductEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProductEditDialogData
  ) {
    this.productForm = this.fb.group({
      // Basic Information
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      description: ['', [Validators.maxLength(2000)]],
      category: ['', [Validators.required]],
      brand: [''],
      sku: [''],
      slug: [''],
      tags: this.fb.array([]),
      
      // Pricing
      price: [0, [Validators.required, Validators.min(0)]],
      originalPrice: [0, [Validators.min(0)]],
      costPrice: [0, [Validators.min(0)]],
      
      // Inventory
      manageStock: [true],
      quantity: [0, [Validators.required, Validators.min(0)]],
      lowStockAlert: [5, [Validators.min(0)]],
      backorderAllowed: [false],
      soldIndividually: [false],
      
      // Shipping
      requiresShipping: [true],
      weight: [0, [Validators.min(0)]],
      weightUnit: ['kg'],
      length: [0, [Validators.min(0)]],
      width: [0, [Validators.min(0)]],
      height: [0, [Validators.min(0)]],
      dimensionUnit: ['cm'],
      shippingClass: [''],
      
      // Advanced
      taxable: [true],
      taxClass: ['standard'],
      isDigital: [false],
      digitalFileUrl: [''],
      downloadLimit: [0, [Validators.min(0)]],
      downloadExpiry: [0, [Validators.min(0)]],
      
      // SEO
      seoTitle: ['', [Validators.maxLength(60)]],
      seoDescription: ['', [Validators.maxLength(160)]],
      seoKeywords: [''],
      
      // Status
      status: ['draft'],
      isFeatured: [false],
      scheduledStart: [null],
      scheduledEnd: [null]
    });
  }

  ngOnInit(): void {
    this.patchFormValues();
    this.setupTagFiltering();
    this.setupFormListeners();
  }

  patchFormValues(): void {
    const product = this.data.product;
    
    if (product._id) {
      // Patch existing product
      this.productForm.patchValue({
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        brand: product.brand || '',
        sku: product.sku || '',
        slug: product.slug || '',
        price: product.price || 0,
        originalPrice: product.originalPrice || 0,
        costPrice: product.costPrice || 0,
        manageStock: product.manageStock !== false,
        quantity: product.quantity || 0,
        lowStockAlert: product.lowStockAlert || 5,
        backorderAllowed: product.backorderAllowed || false,
        soldIndividually: product.soldIndividually || false,
        requiresShipping: product.requiresShipping !== false,
        weight: product.weight || 0,
        weightUnit: product.weightUnit || 'kg',
        length: product.dimensions?.length || 0,
        width: product.dimensions?.width || 0,
        height: product.dimensions?.height || 0,
        dimensionUnit: product.dimensions?.unit || 'cm',
        shippingClass: product.shippingClass || '',
        taxable: product.taxable !== false,
        taxClass: product.taxClass || 'standard',
        isDigital: product.isDigital || false,
        digitalFileUrl: product.digitalProduct?.fileUrl || '',
        downloadLimit: product.digitalProduct?.downloadLimit || 0,
        downloadExpiry: product.digitalProduct?.downloadExpiry || 0,
        seoTitle: product.seo?.title || '',
        seoDescription: product.seo?.description || '',
        seoKeywords: product.seo?.keywords?.join(', ') || '',
        status: product.status || 'draft',
        isFeatured: product.isFeatured || false,
        scheduledStart: product.scheduledStart || null,
        scheduledEnd: product.scheduledEnd || null
      });
      
      // Add tags
      if (product.tags && product.tags.length > 0) {
        product.tags.forEach(tag => this.tagsArray.push(new FormControl(tag)));
      }
    } else {
      // Set defaults for new product
      this.productForm.patchValue({
        quantity: 0,
        lowStockAlert: 5,
        status: 'draft',
        price: 0,
        manageStock: true,
        requiresShipping: true,
        taxable: true,
        taxClass: 'standard'
      });
    }
  }

  setupTagFiltering(): void {
    this.productForm.get('tags')?.valueChanges.subscribe(() => {
      this.updateFilteredTags();
    });
    
    this.updateFilteredTags();
  }

  updateFilteredTags(): void {
    const currentTags = this.tagsArray.value;
    this.filteredTags = this.data.tags.filter(tag => 
      !currentTags.includes(tag)
    );
  }

  setupFormListeners(): void {
    // Auto-generate slug from name
    this.productForm.get('name')?.valueChanges.subscribe(name => {
      if (!this.productForm.get('slug')?.value && name) {
        const slug = name.toLowerCase()
          .replace(/[^\w\s]/gi, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
        this.productForm.patchValue({ slug }, { emitEvent: false });
      }
    });
    
    // Auto-generate SKU if empty
    this.productForm.get('name')?.valueChanges.subscribe(name => {
      if (!this.productForm.get('sku')?.value && name) {
        const baseSku = name.substring(0, 20).toUpperCase().replace(/\s+/g, '-');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const sku = `${baseSku}-${random}`;
        this.productForm.patchValue({ sku }, { emitEvent: false });
      }
    });
    
    // Show/hide inventory fields based on manageStock
    this.productForm.get('manageStock')?.valueChanges.subscribe(manageStock => {
      const quantityControl = this.productForm.get('quantity');
      const lowStockControl = this.productForm.get('lowStockAlert');
      
      if (manageStock) {
        quantityControl?.setValidators([Validators.required, Validators.min(0)]);
        lowStockControl?.setValidators([Validators.min(0)]);
      } else {
        quantityControl?.clearValidators();
        lowStockControl?.clearValidators();
      }
      
      quantityControl?.updateValueAndValidity();
      lowStockControl?.updateValueAndValidity();
    });
  }

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    
    if (value) {
      this.tagsArray.push(new FormControl(value));
    }
    
    event.chipInput!.clear();
    this.updateFilteredTags();
  }

  addTagFromAutocomplete(event: any): void {
    const value = event.option.value;
    
    if (value && !this.tagsArray.value.includes(value)) {
      this.tagsArray.push(new FormControl(value));
    }
    
    this.updateFilteredTags();
  }

  removeTag(index: number): void {
    this.tagsArray.removeAt(index);
    this.updateFilteredTags();
  }

  onSubmit(): void {
    if (this.productForm.valid) {
      const formValue = this.productForm.value;
      
      const productData = {
        ...this.data.product,
        name: formValue.name,
        description: formValue.description,
        category: formValue.category,
        brand: formValue.brand,
        sku: formValue.sku,
        slug: formValue.slug,
        tags: this.tagsArray.value,
        price: formValue.price,
        originalPrice: formValue.originalPrice || undefined,
        costPrice: formValue.costPrice || undefined,
        manageStock: formValue.manageStock,
        quantity: formValue.quantity,
        lowStockAlert: formValue.lowStockAlert,
        backorderAllowed: formValue.backorderAllowed,
        soldIndividually: formValue.soldIndividually,
        requiresShipping: formValue.requiresShipping,
        weight: formValue.weight || undefined,
        weightUnit: formValue.weightUnit,
        dimensions: {
          length: formValue.length || undefined,
          width: formValue.width || undefined,
          height: formValue.height || undefined,
          unit: formValue.dimensionUnit
        },
        shippingClass: formValue.shippingClass || undefined,
        taxable: formValue.taxable,
        taxClass: formValue.taxClass,
        isDigital: formValue.isDigital,
        digitalProduct: formValue.isDigital ? {
          fileUrl: formValue.digitalFileUrl || undefined,
          downloadLimit: formValue.downloadLimit,
          downloadExpiry: formValue.downloadExpiry
        } : undefined,
        seo: {
          title: formValue.seoTitle || undefined,
          description: formValue.seoDescription || undefined,
          keywords: formValue.seoKeywords ? formValue.seoKeywords.split(',').map((k: string) => k.trim()) : []
        },
        status: formValue.status,
        isFeatured: formValue.isFeatured,
        scheduledStart: formValue.scheduledStart || undefined,
        scheduledEnd: formValue.scheduledEnd || undefined,
        store: this.data.storeId
      };
      
      this.dialogRef.close(productData);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}