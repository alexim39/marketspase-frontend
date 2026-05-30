import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StoreService } from '../../../services/store.service';
import { StoreEditComponent } from '../store-edit.component';

@Component({
  selector: 'app-store-edit-mobile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  providers: [StoreService],
  templateUrl: './store-edit-mobile.component.html',
  styleUrls: ['./store-edit-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoreEditMobileComponent extends StoreEditComponent {
  private readonly mobileRouter = inject(Router);

  readonly currentStep = signal(0);
  readonly confirmLeaveOpen = signal(false);
  readonly logoChanged = signal(false);
  readonly mobileStepLabels = ['Identity', 'Logo', 'Review'];

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
    if (this.storeForm.dirty || this.logoChanged()) {
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
    const name = String(this.storeForm.get('name')?.value || this.storeToEdit()?.name || '').trim();
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('') || 'MS';
  }

  categoryLabel(): string {
    const value = this.storeForm.get('category')?.value;
    return this.categories.find(category => category.value === value)?.label || value || 'Store category';
  }

  logoValueIsFile(): boolean {
    return this.storeForm.get('logo')?.value instanceof File;
  }

  override onFileSelected(event: Event): void {
    const previousLogo = this.storeForm.get('logo')?.value;
    super.onFileSelected(event);

    if (this.storeForm.get('logo')?.value !== previousLogo && this.logoValueIsFile()) {
      this.logoChanged.set(true);
      this.storeForm.markAsDirty();
    }
  }

  override removeLogo(): void {
    super.removeLogo();
    this.logoChanged.set(true);
    this.storeForm.markAsDirty();
  }

  private isStepValid(step: number): boolean {
    if (step === 0) {
      return Boolean(
        this.storeForm.get('name')?.valid &&
        this.storeForm.get('category')?.valid &&
        this.storeForm.get('description')?.valid
      );
    }

    if (step === 1) {
      return true;
    }

    return this.storeForm.valid;
  }

  private markStepTouched(step: number): void {
    if (step === 0) {
      ['name', 'category', 'description'].forEach(field => this.storeForm.get(field)?.markAsTouched());
    }

    if (step === 1) {
      this.storeForm.get('logo')?.markAsTouched();
    }
  }
}
