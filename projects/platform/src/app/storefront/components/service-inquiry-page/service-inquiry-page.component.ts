import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '@shared/services/api';

@Component({
  selector: 'app-service-inquiry-page',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule,
    MatProgressBarModule, MatChipsModule, MatTooltipModule,
  ],
  templateUrl: './service-inquiry-page.component.html',
  styleUrls: ['./service-inquiry-page.component.scss'],
})
export class ServiceInquiryPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private snackBar = inject(MatSnackBar);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  storeLink = '';
  storeName = '';
  serviceId = '';
  loading = signal(true);
  error = signal<string | null>(null);
  submitting = signal(false);
  submitted = signal(false);
  service: any = null;
  selectedPackage: any = null;

  inquiryForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    phone: ['', [Validators.required, Validators.pattern(/^(\+234|0)?[789][01]\d{8}$/)]],
    email: ['', Validators.email],
    message: ['', Validators.maxLength(1000)],
    budget: [''],
    timeline: [''],
  });

  get name() { return this.inquiryForm.get('name'); }
  get phone() { return this.inquiryForm.get('phone'); }
  get message() { return this.inquiryForm.get('message'); }

  get serviceName(): string { return this.service?.name || ''; }
  get servicePrice(): number { return this.service?.price || 0; }
  get serviceDescription(): string { return this.service?.description?.substring(0, 200) || ''; }
  get pricingType(): string { return this.service?.pricingType || ''; }
  get packages(): any[] { return this.service?.packages || []; }
  get serviceImage(): string { return this.service?.media?.[0]?.url || this.service?.portfolio?.[0]?.url || ''; }
  get providerName(): string { return this.service?.provider?.name || this.storeName || ''; }
  get averageRating(): number { return this.service?.averageRating || 0; }
  get ratingCount(): number { return this.service?.ratingCount || 0; }
  get averageResponseTime(): string {
    const ms = this.service?.averageResponseTime;
    if (!ms) return '';
    if (ms < 3600000) return 'within an hour';
    const hours = Math.round(ms / 3600000);
    return hours === 1 ? 'within 1 hour' : `within ${hours} hours`;
  }
  get availability(): string { return this.service?.availability || 'available'; }
  get commissionType(): string { return this.service?.affiliate?.commissionType || 'per_lead'; }

  async ngOnInit() {
    this.storeLink = this.route.snapshot.paramMap.get('storeLink') || '';
    this.serviceId = this.route.snapshot.paramMap.get('serviceId') || '';

    if (!this.storeLink || !this.serviceId) {
      this.error.set('Invalid link.');
      this.loading.set(false);
      return;
    }

    try {
      const storeResp = await this.api.get<any>(`api/v1/stores/storefront/link/${this.storeLink}`, undefined, undefined, true).toPromise();
      if (!storeResp?.data) throw new Error('Store not found');
      this.storeName = storeResp.data.name || ('');

      const svcResp = await this.api.get<any>(`api/v1/stores/service/${storeResp.data._id}/list`, undefined, undefined, true).toPromise();
      const svc = (svcResp?.data || []).find((s: any) => s._id === this.serviceId);
      if (!svc) throw new Error('Service not found or no longer available');
      this.service = svc;
    } catch (e: any) {
      this.error.set(e.message || 'Failed to load service details');
    } finally {
      this.loading.set(false);
    }
  }

  selectPackage(pkg: any): void {
    this.selectedPackage = this.selectedPackage?.name === pkg.name ? null : pkg;
    if (this.selectedPackage) {
      this.inquiryForm.patchValue({ budget: pkg.price || '' });
    }
  }

  submit(): void {
    this.inquiryForm.markAllAsTouched();
    if (this.inquiryForm.invalid || this.submitting()) return;

    this.submitting.set(true);
    const formValue = this.inquiryForm.value;

    this.api.post('api/v1/stores/service/inquiry', {
      serviceId: this.serviceId,
      customer: {
        name: formValue.name.trim(),
        phone: formValue.phone.trim(),
        email: formValue.email?.trim() || undefined,
      },
      message: (this.selectedPackage ? `[Package: ${this.selectedPackage.name}] ` : '') + (formValue.message?.trim() || ''),
      budget: formValue.budget?.trim() || undefined,
      timeline: formValue.timeline?.trim() || undefined,
      trackingCode: this.route.snapshot.queryParamMap.get('ref') || undefined,
    }, undefined, true).subscribe({
      next: () => {
        this.submitting.set(false);
        this.submitted.set(true);
      },
      error: (err) => {
        this.submitting.set(false);
        this.snackBar.open(err.error?.message || 'Failed to send inquiry', 'OK', { duration: 5000 });
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/store', this.storeLink]);
  }
}
