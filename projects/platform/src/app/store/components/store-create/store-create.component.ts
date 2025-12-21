// components/store-create/store-create.component.ts
import { Component, inject, signal, OnDestroy, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';
import { StoreService } from '../../services/store.service';
import { CreateStoreRequest } from '../../models';
import { CATEGORIES } from '../../../common/utils/categories';
import { UserService } from '../../../common/services/user.service';
import { UserInterface } from '../../../../../../shared-services/src/public-api';

@Component({
  selector: 'app-store-create',
  standalone: true,
  providers: [StoreService],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './store-create.component.html',
  styleUrls: ['./store-create.component.scss']
})
export class StoreCreateComponent implements OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private storeService = inject(StoreService);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  // Signals
  loading = signal<boolean>(false);
  previewImage = signal<string | null>(null);
  isSubmitting = signal<boolean>(false);


  private userService: UserService = inject(UserService);
  public user: Signal<UserInterface | null> = this.userService.user;

  // Store categories
  // categories = [
  //   'Fashion & Apparel',
  //   'Electronics',
  //   'Home & Garden',
  //   'Beauty & Personal Care',
  //   'Health & Wellness',
  //   'Food & Beverage',
  //   'Sports & Outdoors',
  //   'Toys & Games',
  //   'Books & Media',
  //   'Automotive',
  //   'Jewelry & Accessories',
  //   'Arts & Crafts',
  //   'Digital Products',
  //   'Services',
  //   'Other'
  // ];


  get categories() {
    return CATEGORIES;
  }

  // Form
  storeForm: FormGroup = this.fb.group({
    name: ['', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(50)
    ]],
    description: ['', [
      Validators.required,
      Validators.minLength(10),
      Validators.maxLength(500)
    ]],
    category: ['', Validators.required],
    whatsappNumber: [this.user()?.personalInfo.phone ?? '', [
      Validators.required,
      Validators.pattern(/^(\+234|0)[789][01]\d{8}$/) // Nigerian phone number pattern
    ]],
    logo: [null]
  });

  // Character counters
  nameLength = signal<number>(0);
  descriptionLength = signal<number>(0);

  // Validation messages
  validationMessages = {
    name: {
      required: 'Store name is required',
      minlength: 'Store name must be at least 2 characters long',
      maxlength: 'Store name cannot exceed 50 characters'
    },
    description: {
      required: 'Store description is required',
      minlength: 'Description must be at least 10 characters long',
      maxlength: 'Description cannot exceed 500 characters'
    },
    category: {
      required: 'Please select a category'
    },
    whatsappNumber: {
      required: 'WhatsApp number is required',
      pattern: 'Please enter a valid Nigerian phone number'
    }
  };

  ngOnInit(): void {
    this.setupFormListeners();
     // Disable the whatsappNumber control
    this.storeForm.get('whatsappNumber')?.disable();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFormListeners(): void {
    // Track name length
    this.storeForm.get('name')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.nameLength.set(value?.length || 0);
      });

    // Track description length
    this.storeForm.get('description')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.descriptionLength.set(value?.length || 0);
      });
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        this.snackBar.open('Please select a valid image file (JPEG, PNG, WebP, GIF)', 'OK', { duration: 5000 });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.snackBar.open('Image size must be less than 5MB', 'OK', { duration: 5000 });
        return;
      }

      this.storeForm.patchValue({ logo: file });
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.previewImage.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  removeLogo(): void {
    this.storeForm.patchValue({ logo: null });
    this.previewImage.set(null);
    
    // Reset file input
    const fileInput = document.getElementById('logoUpload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

 // Alternative simpler getFieldError method
getFieldError(fieldName: string): string {
  const field = this.storeForm.get(fieldName);
  
  if (!field?.errors || !field.touched) {
    return '';
  }

  const errors = field.errors;
  
  if (errors['required']) {
    return 'This field is required';
  }
  
  if (errors['minlength']) {
    return `Minimum ${errors['minlength'].requiredLength} characters required`;
  }
  
  if (errors['maxlength']) {
    return `Maximum ${errors['maxlength'].requiredLength} characters allowed`;
  }
  
  if (errors['pattern']) {
    return 'Please enter a valid format';
  }
  
  return 'Invalid value';
}

  isFieldInvalid(fieldName: string): boolean {
    const field = this.storeForm.get(fieldName);
    return !!(field?.invalid && field.touched);
  }

  async onSubmit(): Promise<void> {
    // Mark all fields as touched to trigger validation messages
    this.storeForm.markAllAsTouched();

    if (this.storeForm.valid && !this.isSubmitting()) {
      this.isSubmitting.set(true);
      this.loading.set(true);

      try {
        const formData: CreateStoreRequest = {
          name: this.storeForm.value.name.trim(),
          description: this.storeForm.value.description.trim(),
          category: this.storeForm.value.category,
          whatsappNumber: this.formatPhoneNumber(this.storeForm.value.whatsappNumber),
          logo: this.storeForm.value.logo,
          settings: {
            notifications: {
              lowStock: true,
              newOrder: true,
              promotionEnding: true,
              weeklyReport: true
            },
            inventory: {
              lowStockThreshold: 5,
              autoArchiveOutOfStock: false,
              restockNotifications: true
            },
            promotions: {
              autoApprovePromoters: false,
              minPromoterRating: 4.0,
              defaultCommission: 10
            },
            appearance: {
              theme: 'light',
              primaryColor: '#667eea',
              logoPosition: 'left'
            }
          }
        };

        await this.storeService.createStore(formData).subscribe({
          next: (store) => {
            this.snackBar.open('Store created successfully!', 'OK', { duration: 3000 });
            this.router.navigate(['/dashboard/stores', store._id]);
          },
          error: (error) => {
            console.error('Store creation failed:', error);
            const errorMessage = error.error?.message || 'Failed to create store. Please try again.';
            this.snackBar.open(errorMessage, 'OK', { duration: 5000 });
          }
        });
      } catch (error) {
        console.error('Unexpected error:', error);
        this.snackBar.open('An unexpected error occurred. Please try again.', 'OK', { duration: 5000 });
      } finally {
        this.isSubmitting.set(false);
        this.loading.set(false);
      }
    }
  }

  onCancel(): void {
    if (this.storeForm.dirty) {
      const confirmLeave = confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmLeave) {
        return;
      }
    }
    this.router.navigate(['/dashboard/stores']);
  }

  private formatPhoneNumber(phone: string): string {
    if (!phone) return ''
    // Format Nigerian phone numbers to international format
    let formatted = phone.trim();
    
    // Remove any non-digit characters
    formatted = formatted.replace(/\D/g, '');
    
    // Handle numbers starting with 0
    if (formatted.startsWith('0')) {
      formatted = '+234' + formatted.substring(1);
    }
    // Handle numbers without country code
    else if (formatted.length === 10) {
      formatted = '+234' + formatted;
    }
    // Handle numbers with 234 but without +
    else if (formatted.startsWith('234') && formatted.length === 12) {
      formatted = '+' + formatted;
    }
    
    return formatted;
  }

  // Getters for template
  get name() { return this.storeForm.get('name'); }
  get description() { return this.storeForm.get('description'); }
  get category() { return this.storeForm.get('category'); }
  get whatsappNumber() { return this.storeForm.get('whatsappNumber'); }
}