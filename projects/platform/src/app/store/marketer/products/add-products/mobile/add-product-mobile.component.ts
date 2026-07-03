import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProductService } from '../../product.service';
import { AddProductComponent } from '../add-product.component';

@Component({
  selector: 'app-add-product-mobile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  providers: [ProductService],
  templateUrl: './add-product-mobile.component.html',
  styleUrls: ['./add-product-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddProductMobileComponent extends AddProductComponent {
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

  requestCancel(): void {
    if (this.productForm?.dirty || this.imagePreviews().length > 0) {
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
    const files = Array.from(input.files || []).slice(0, this.maxImages - this.images().length);
    if (!files.length) return;

    const existingFiles = [...this.images()];
    const existingPreviews = [...this.imagePreviews()];
    const previews: string[] = [];

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        previews.push(String(reader.result || ''));
        if (previews.length === files.length) {
          this.onImagesChanged({
            files: [...existingFiles, ...files],
            previews: [...existingPreviews, ...previews],
          });
          input.value = '';
        }
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number): void {
    this.onImagesChanged({
      files: this.images().filter((_, imageIndex) => imageIndex !== index),
      previews: this.imagePreviews().filter((_, imageIndex) => imageIndex !== index),
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
