// components/product-management/add-product/components/seo-advanced-form/seo-advanced-form.component.ts
import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormArray, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';

type StrCtrl = FormControl<string>;

@Component({
  selector: 'app-seo-advanced-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatSlideToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule
  ],
  templateUrl: './seo-advanced-form.component.html',
  styleUrls: ['./seo-advanced-form.component.scss']
})
export class SeoAdvancedFormComponent {
  seoForm = input.required<FormGroup>();
  advancedForm = input.required<FormGroup>();
  digitalForm = input.required<FormGroup>();
  
  keywordsChanged = output<string[]>();

  get keywordsArray(): FormArray<StrCtrl> {
    return this.seoForm().get('metaKeywords') as FormArray<StrCtrl>;
  }

  addKeyword(event: any): void {
    const input = event.input;
    const value = (event.value ?? '').trim();
    if (value) {
      this.keywordsArray.push(new FormControl(value));
      if (input) input.value = '';
      this.keywordsChanged.emit(this.keywordsArray.value);
    }
  }

  removeKeyword(index: number): void {
    this.keywordsArray.removeAt(index);
    this.keywordsChanged.emit(this.keywordsArray.value);
  }

  triggerFileInput(): void {
    // Implement file input trigger if needed
    console.log('Trigger file input for digital product');
  }
}