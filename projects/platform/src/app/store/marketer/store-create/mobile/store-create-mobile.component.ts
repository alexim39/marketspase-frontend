import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StoreService } from '../../../services/store.service';
import { StoreCreateComponent } from '../store-create.component';

@Component({
  selector: 'app-store-create-mobile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  providers: [StoreService],
  templateUrl: './store-create-mobile.component.html',
  styleUrls: ['./store-create-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoreCreateMobileComponent extends StoreCreateComponent {
  private readonly mobileRouter = inject(Router);

  readonly currentStep = signal(0);
  readonly confirmLeaveOpen = signal(false);
  readonly mobileStepLabels = ['Brand', 'Contact', 'Review'];

  progressPercent(): number {
    return Math.round(((this.currentStep() + 1) / this.mobileStepLabels.length) * 100);
  }

  goNext(): void {
    if (!this.isStepValid(this.currentStep())) {
      this.markStepTouched(this.currentStep());
      return;
    }

    this.currentStep.update(step => Math.min(step + 1, this.mobileStepLabels.length - 1));
  }

  goBack(): void {
    this.currentStep.update(step => Math.max(step - 1, 0));
  }

  goToStep(step: number): void {
    this.currentStep.set(step);
  }

  requestCancel(): void {
    if (this.storeForm.dirty || this.previewImage()) {
      this.confirmLeaveOpen.set(true);
      return;
    }

    this.leaveForm();
  }

  closeLeaveConfirm(): void {
    this.confirmLeaveOpen.set(false);
  }

  leaveForm(): void {
    this.confirmLeaveOpen.set(false);
    void this.mobileRouter.navigate(['/dashboard/stores']);
  }

  storeInitials(): string {
    const name = String(this.storeForm.get('name')?.value || '').trim();
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('') || 'MS';
  }

  displayPhone(): string {
    return this.storeForm.get('whatsappNumber')?.value || this.user()?.personalInfo?.phone || 'Your WhatsApp number';
  }

  private isStepValid(step: number): boolean {
    if (step === 0) {
      return Boolean(
        this.storeForm.get('name')?.valid &&
        this.storeForm.get('category')?.valid &&
        this.storeForm.get('description')?.valid &&
        this.storeForm.get('logo')?.valid
      );
    }

    if (step === 1) {
      return Boolean(this.storeForm.get('whatsappNumber')?.valid || this.storeForm.get('whatsappNumber')?.disabled);
    }

    return this.storeForm.valid;
  }

  private markStepTouched(step: number): void {
    if (step === 0) {
      ['name', 'category', 'description', 'logo'].forEach(field => this.storeForm.get(field)?.markAsTouched());
      this.logoError.set(this.storeForm.get('logo')?.invalid || false);
    }

    if (step === 1) {
      this.storeForm.get('whatsappNumber')?.markAsTouched();
    }
  }
}
