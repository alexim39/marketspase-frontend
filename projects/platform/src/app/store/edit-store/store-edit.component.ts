// components/store-create/store-create.component.ts
import { Component, inject, signal, OnDestroy, Signal, OnInit } from '@angular/core';
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
import { StoreService } from '../services/store.service';
import { CATEGORIES } from '../../common/utils/categories';
import { UserService } from '../../common/services/user.service';
import { UserInterface } from '../../../../../shared-services/src/public-api';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-store-edit',
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
    MatTooltipModule,
    MatProgressBarModule
  ],
  templateUrl: './store-edit.component.html',
  styleUrls: ['./store-edit.component.scss']
})
export class StoreEditComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private storeService = inject(StoreService);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  // Store data
  storeToEdit = signal<any>(null);
  storeId = signal<string>('');

  // Signals
  loading = signal<boolean>(false);
  previewImage = signal<string | null>(null);
  isSubmitting = signal<boolean>(false);

  private userService: UserService = inject(UserService);
  public user: Signal<UserInterface | null> = this.userService.user;

  logoError = signal<boolean>(false);

  get categories() {
    return CATEGORIES;
  }

  // Form - logo is not required for editing
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
    logo: [null],
    userId: this.user()?._id
  });

  // Character counters
  nameLength = signal<number>(0);
  descriptionLength = signal<number>(0);

  ngOnInit(): void {
    this.setupFormListeners();
    
    this.route.params.subscribe(params => {
      const storeId = params['id'];
      if (storeId) {
        this.storeId.set(storeId);
        this.loadStoreData(storeId);
      }
    });
  }

  private loadStoreData(storeId: string): void {
    this.loading.set(true);
    this.storeService.getStoreById(storeId).subscribe({
      next: (response) => {
        console.log('Store data loaded:', response);
        this.storeToEdit.set(response.data);
        this.populateFormWithStoreData(response.data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load store:', error);
        this.snackBar.open('Failed to load store data', 'OK', { duration: 3000 });
        this.router.navigate(['/dashboard/stores']);
        this.loading.set(false);
      }
    });
  }
  
  private populateFormWithStoreData(store: any): void {
    // Populate form with existing store data
    this.storeForm.patchValue({
      name: store.name,
      description: store.description,
      category: store.category,
      userId: this.user()?._id
    });
    
    // Handle logo preview if it exists
    if (store.logo) {
      this.previewImage.set(store.logo);
      this.storeForm.patchValue({ logo: store.logo });
    }
    
    // Update character counters
    this.nameLength.set(store.name?.length || 0);
    this.descriptionLength.set(store.description?.length || 0);
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
      this.storeForm.get('logo')?.markAsTouched();
      this.logoError.set(false);
      
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
    this.storeForm.get('logo')?.markAsTouched();
    this.logoError.set(true);
    
    // Reset file input
    const fileInput = document.getElementById('logoUpload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

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
    
    return 'Invalid value';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.storeForm.get(fieldName);
    return !!(field?.invalid && field.touched);
  }

  onSubmit(): void {
    // Mark all fields as touched to trigger validation messages
    this.storeForm.markAllAsTouched();
    
    if (this.storeForm.valid && !this.isSubmitting()) {
      this.isSubmitting.set(true);
      
      const formData = new FormData();
      formData.append('name', this.storeForm.value.name.trim());
      formData.append('description', this.storeForm.value.description.trim());
      formData.append('category', this.storeForm.value.category);
      formData.append('userId', this.storeForm.value.userId);
      
      // Handle logo - if it's a File, append it; if it's a string (URL), skip it
      const logoValue = this.storeForm.value.logo;
      if (logoValue instanceof File) {
        formData.append('logo', logoValue, logoValue.name);
      } else if (logoValue === null && this.previewImage() === null) {
        // If logo was removed, send null to remove it on backend
        formData.append('logo', 'null');
      }
      // If logoValue is a string (existing URL), don't append anything to keep it
      
      // Update store
      this.storeService.updateStore(this.storeId(), formData).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response) => {
          this.snackBar.open('Store updated successfully!', 'OK', { duration: 3000 });
          this.router.navigate(['/dashboard/stores']);
        },
        error: (error) => {
          console.error('Store update failed:', error);
          const errorMessage = error.error?.message || 'Failed to update store. Please try again.';
          this.snackBar.open(errorMessage, 'OK', { duration: 5000 });
          this.isSubmitting.set(false);
        },
        complete: () => {
          this.isSubmitting.set(false);
        }
      });
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

  // Getters for template
  get name() { return this.storeForm.get('name'); }
  get description() { return this.storeForm.get('description'); }
  get category() { return this.storeForm.get('category'); }
}