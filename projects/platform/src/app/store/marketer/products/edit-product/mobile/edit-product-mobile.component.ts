import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProductService } from '../../product.service';
import { EditProductComponent } from '../edit-product.component';

@Component({
  selector: 'app-edit-product-mobile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  providers: [ProductService],
  templateUrl: './edit-product-mobile.component.html',
  styleUrls: ['./edit-product-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditProductMobileComponent extends EditProductComponent {
  private readonly mobileRouter = inject(Router);

  readonly confirmLeaveOpen = signal(false);
  readonly tagDraft = signal('');
  readonly keywordDraft = signal('');

  readonly mobileStepLabels = [
    'Details',
    'Price',
    'Promote',
    'Delivery',
    'Publish',
    'Review',
  ];

  readonly quickTags = ['New', 'Trending', 'Limited', 'Best seller', 'Gift', 'Wholesale'];

  get dimensionsGroup(): FormGroup {
    return this.shipping.get('dimensions') as FormGroup;
  }

  newImagePreviews(): string[] {
    return this.imagePreviews().slice(this.existingImages().length);
  }

  requestCancel(): void {
    if (this.productForm?.dirty || this.images().length > 0 || this.removedImages().length > 0) {
      this.confirmLeaveOpen.set(true);
      return;
    }

    this.leaveForm();
  }

  leaveForm(): void {
    this.confirmLeaveOpen.set(false);
    void this.mobileRouter.navigate(['/dashboard/stores', this.storeId, 'products']);
  }

  closeLeaveConfirm(): void {
    this.confirmLeaveOpen.set(false);
  }

  handleImageInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const availableSlots = Math.max(0, this.maxImages - this.imagePreviews().length);
    const files = Array.from(input.files || []).slice(0, availableSlots);
    if (!files.length) return;

    const currentFiles = [...this.images()];
    const currentNewPreviews = this.newImagePreviews();
    const previews: string[] = [];

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        previews.push(String(reader.result || ''));
        if (previews.length === files.length) {
          this.onImagesChanged({
            files: [...currentFiles, ...files],
            previews: [...currentNewPreviews, ...previews],
          });
          input.value = '';
        }
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number): void {
    const existingCount = this.existingImages().length;
    if (index < existingCount) {
      this.removeExistingImage(index);
      return;
    }

    const newIndex = index - existingCount;
    this.onImagesChanged({
      files: this.images().filter((_, imageIndex) => imageIndex !== newIndex),
      previews: this.newImagePreviews().filter((_, imageIndex) => imageIndex !== newIndex),
    });
  }

  addTag(value = this.tagDraft()): void {
    const tag = value.trim();
    if (!tag || this.tagsArray.value.includes(tag)) return;

    this.tagsArray.push(new FormControl(tag, { nonNullable: true }));
    this.tagDraft.set('');
    this.onTagsChanged(this.tagsArray.value);
  }

  removeTag(index: number): void {
    this.tagsArray.removeAt(index);
    this.onTagsChanged(this.tagsArray.value);
  }

  addKeyword(): void {
    const keyword = this.keywordDraft().trim();
    if (!keyword || this.keywordsArray.value.includes(keyword)) return;

    this.keywordsArray.push(new FormControl(keyword, { nonNullable: true }));
    this.keywordDraft.set('');
    this.onKeywordsChanged(this.keywordsArray.value);
  }

  removeKeyword(index: number): void {
    this.keywordsArray.removeAt(index);
    this.onKeywordsChanged(this.keywordsArray.value);
  }

  goNext(): void {
    if (!this.isStepValid(this.currentStep())) {
      this.markCurrentStepTouched();
      return;
    }

    this.nextStep();
  }

  progressPercent(): number {
    return Math.round(((this.currentStep() + 1) / this.mobileStepLabels.length) * 100);
  }

  priceValue(): number {
    return Number(this.pricing.get('price')?.value || 0);
  }

  commissionValue(): number {
    const type = this.pricing.get('commissionType')?.value;
    const price = this.priceValue();
    if (type === 'fixed') {
      return Math.min(price, Number(this.pricing.get('fixedCommission')?.value || 0));
    }

    return Math.round(price * (Number(this.pricing.get('commissionRate')?.value || 0) / 100));
  }

  receivableValue(): number {
    return Math.max(0, this.priceValue() - this.commissionValue());
  }

  private markCurrentStepTouched(): void {
    const step = this.currentStep();
    if (step === 0) {
      this.basicInfo.markAllAsTouched();
    }
    if (step === 1) {
      this.pricing.markAllAsTouched();
      this.inventory.markAllAsTouched();
    }
  }
}
