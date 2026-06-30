import { Component, inject, signal, OnDestroy, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Subject, takeUntil } from 'rxjs';
import { ApiService } from '@shared/services/api';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CATEGORIES } from '../../../../common/utils/categories';

@Component({
  selector: 'app-create-service',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatRadioModule,
    MatSlideToggleModule,
    MatChipsModule,
    MatProgressBarModule,
  ],
  templateUrl: './create-service.component.html',
  styleUrls: ['./create-service.component.scss']
})
export class CreateServiceComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  loading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  mediaPreviews = signal<string[]>([]);
  mediaFiles = signal<File[]>([]);
  includesChips = signal<string[]>([]);
  currentChipInput = signal<string>('');
  editingServiceId: string | null = null;

  get categories() {
    return CATEGORIES;
  }

  storeId: string = '';

  serviceForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(2000)]],
    category: ['', Validators.required],
    pricingType: ['fixed', Validators.required],
    price: [null],
    hourlyRate: [null],
    packages: this.fb.array([]),
    acceptsQuotes: [false],
    deliveryTime: [''],
    location: this.fb.group({
      city: [''],
      state: [''],
      remote: [false]
    }),
    commissionType: ['per_lead'],
    leadCommission: [200],
    bookingCommissionRate: [200],
    availability: ['available'],
    slotsPerWeek: [10],
  });

  pricingType = computed(() => this.serviceForm.get('pricingType')?.value);
  commissionType = computed(() => this.serviceForm.get('commissionType')?.value);

  get packages(): FormArray {
    return this.serviceForm.get('packages') as FormArray;
  }

  constructor() {
    this.storeId = this.route.snapshot.paramMap.get('storeId') || '';
    const serviceId = this.route.snapshot.queryParamMap.get('serviceId');
    if (serviceId) this.loadServiceForEdit(serviceId);
  }

  private loadServiceForEdit(serviceId: string): void {
    this.apiService.get<any>(`api/v1/stores/service/${this.storeId}/${serviceId}`, undefined, undefined, true)
      .subscribe({
        next: (r) => {
          const s = r?.data;
          if (!s) return;
          this.serviceForm.patchValue({
            name: s.name, description: s.description, category: s.category,
            pricingType: s.pricingType, price: s.price, hourlyRate: s.hourlyRate,
            acceptsQuotes: s.acceptsQuotes, deliveryTime: s.deliveryTime,
            commissionType: s.affiliate?.commissionType || 'per_lead',
            leadCommission: s.affiliate?.leadCommission || 200,
            bookingCommissionRate: s.affiliate?.bookingCommissionRate || 200,
            location: { city: s.location?.city || '', state: s.location?.state || '', remote: s.location?.remote || false },
          });
          if (s.packages?.length) {
            s.packages.forEach((p: any) => this.addPackage(p));
          }
          if (s.includes?.length) {
            s.includes.forEach((i: string) => this.addIncludeChip(i));
          }
          this.editingServiceId = serviceId;
        },
        error: () => null,
      });
  }

  ngOnInit(): void {
    this.setupFormListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFormListeners(): void {
    this.serviceForm.get('pricingType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.serviceForm.get('price')?.updateValueAndValidity();
        this.serviceForm.get('hourlyRate')?.updateValueAndValidity();
      });
  }

  onPricingTypeChange(type: string): void {
    if (type === 'fixed') {
      this.serviceForm.get('price')?.setValidators([Validators.required]);
      this.serviceForm.get('hourlyRate')?.clearValidators();
    } else if (type === 'hourly') {
      this.serviceForm.get('hourlyRate')?.setValidators([Validators.required]);
      this.serviceForm.get('price')?.clearValidators();
    } else {
      this.serviceForm.get('price')?.clearValidators();
      this.serviceForm.get('hourlyRate')?.clearValidators();
    }
    this.serviceForm.get('price')?.updateValueAndValidity();
    this.serviceForm.get('hourlyRate')?.updateValueAndValidity();
  }

  addPackage(p?: any): void {
    this.packages.push(this.fb.group({
      name: [p?.name || '', Validators.required],
      price: [p?.price || null, Validators.required],
      description: [p?.description || ''],
      includes: [p?.includes || ''],
    }));
  }

  removePackage(index: number): void {
    this.packages.removeAt(index);
  }

  addIncludeChip(value: string): void {
    const v = value.trim();
    if (v && !this.includesChips().includes(v)) {
      this.includesChips.update(list => [...list, v]);
    }
    this.currentChipInput.set('');
  }

  onMediaSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/ogg'];
      if (!validTypes.includes(file.type)) {
        this.snackBar.open(`Unsupported file type: ${file.name}`, 'OK', { duration: 5000 });
        continue;
      }
      if (file.size > 50 * 1024 * 1024) {
        this.snackBar.open(`${file.name} exceeds 50MB limit`, 'OK', { duration: 5000 });
        continue;
      }

      const currentFiles = [...this.mediaFiles()];
      currentFiles.push(file);
      this.mediaFiles.set(currentFiles);

      const reader = new FileReader();
      reader.onload = () => {
        const previews = [...this.mediaPreviews()];
        previews.push(reader.result as string);
        this.mediaPreviews.set(previews);
      };
      reader.readAsDataURL(file);
    }
    (event.target as HTMLInputElement).value = '';
  }

  removeMedia(index: number): void {
    const files = [...this.mediaFiles()];
    files.splice(index, 1);
    this.mediaFiles.set(files);

    const previews = [...this.mediaPreviews()];
    previews.splice(index, 1);
    this.mediaPreviews.set(previews);
  }

  addIncludesChip(): void {
    const value = this.currentChipInput().trim();
    if (value && !this.includesChips().includes(value)) {
      this.includesChips.set([...this.includesChips(), value]);
    }
    this.currentChipInput.set('');
  }

  removeIncludesChip(chip: string): void {
    this.includesChips.set(this.includesChips().filter(c => c !== chip));
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.serviceForm.get(fieldName);
    return !!(field?.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.serviceForm.get(fieldName);
    if (!field?.errors || !field.touched) return '';
    if (field.errors['required']) return 'This field is required';
    if (field.errors['maxlength']) return `Maximum ${field.errors['maxlength'].requiredLength} characters allowed`;
    return 'Invalid value';
  }

  async onSubmit(): Promise<void> {
    this.serviceForm.markAllAsTouched();

    if (this.serviceForm.invalid || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.loading.set(true);

    const formValue = this.serviceForm.value;

    const payload: any = {
      name: formValue.name.trim(),
      description: formValue.description?.trim() || '',
      category: formValue.category,
      pricingType: formValue.pricingType,
      acceptsQuotes: formValue.acceptsQuotes,
      deliveryTime: formValue.deliveryTime?.trim() || '',
      includes: this.includesChips(),
      location: {
        city: formValue.location.city?.trim() || '',
        state: formValue.location.state?.trim() || '',
        remote: formValue.location.remote,
      },
      affiliate: {
        commissionType: formValue.commissionType,
      },
      availability: formValue.availability || 'available',
      slotsPerWeek: Number(formValue.slotsPerWeek) || 10,
      isPublished: true,
    };

    if (formValue.commissionType === 'per_lead') {
      payload.affiliate.leadCommission = Number(formValue.leadCommission) || 200;
    } else {
      payload.affiliate.bookingCommissionRate = Number(formValue.bookingCommissionRate) || 200;
    }

    if (formValue.pricingType === 'fixed') {
      payload.price = Number(formValue.price);
    } else if (formValue.pricingType === 'hourly') {
      payload.price = Number(formValue.price) || null;
      payload.hourlyRate = Number(formValue.hourlyRate);
    } else if (formValue.pricingType === 'package') {
      payload.packages = formValue.packages;
    }

    if (this.mediaFiles().length > 0) {
      const mediaForm = new FormData();
      this.mediaFiles().forEach((file, i) => {
        mediaForm.append('files', file);
      });
      mediaForm.append('data', JSON.stringify(payload));
      // NOTE: For proper multipart upload, a dedicated endpoint or header is needed.
      // Sending as JSON for now; the backend can handle media uploads separately.
    }

    const url = this.editingServiceId
      ? `api/v1/stores/service/${this.storeId}/${this.editingServiceId}`
      : `api/v1/stores/service/${this.storeId}/create`;

    const domain = this.apiService.getBaseUrl();
    const fullUrl = `${domain}/${url}`;

    // Use FormData if media files are present
    if (this.mediaFiles().length > 0) {
      const formData = new FormData();
      this.mediaFiles().forEach(file => formData.append('files', file));
      formData.append('data', JSON.stringify(payload));

      try {
        const httpMethod = this.editingServiceId ? 'PUT' : 'POST';
        const r = await firstValueFrom(this.http.request(httpMethod, fullUrl, { body: formData, withCredentials: true }));
        this.snackBar.open(this.editingServiceId ? 'Service updated!' : 'Service created!', 'OK', { duration: 3000 });
        this.router.navigate(['/dashboard/stores', this.storeId, 'services']);
      } catch (err: any) {
        this.snackBar.open(err?.error?.message || 'Failed to save service', 'Close', { duration: 5000 });
      } finally {
        this.isSubmitting.set(false);
        this.loading.set(false);
      }
      return;
    }

    // No media — send as JSON
    const method = this.editingServiceId ? 'put' : 'post';
    (this.apiService as any)[method](url, payload, undefined, true)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Service created successfully!', 'OK', { duration: 3000 });
          this.router.navigate(['/dashboard/stores', this.storeId]);
        },
        error: (error: any) => {
          console.error('Service creation failed:', error);
          this.snackBar.open(error.error?.message || 'Failed to create service', 'OK', { duration: 5000 });
          this.isSubmitting.set(false);
          this.loading.set(false);
        },
        complete: () => {
          setTimeout(() => {
            this.isSubmitting.set(false);
            this.loading.set(false);
          }, 500);
        }
      });
  }

  onCancel(): void {
    if (this.serviceForm.dirty) {
      const confirmLeave = confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmLeave) return;
    }
    this.router.navigate(['/dashboard/stores', this.storeId]);
  }
}
