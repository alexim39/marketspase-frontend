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
  template: `
    <div class="form-step">
      <div class="two-column-layout">
        <!-- SEO Card -->
        <mat-card class="form-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>search</mat-icon>
              SEO Settings
            </mat-card-title>
          </mat-card-header>
          
          <mat-card-content>
            <div class="form-grid" [formGroup]="seoForm()">
              <!-- SEO Title -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>SEO Title</mat-label>
                <input matInput formControlName="seoTitle" maxlength="60">
                <mat-icon matSuffix>title</mat-icon>
                <mat-hint>Recommended: 50-60 characters</mat-hint>
              </mat-form-field>

              <!-- SEO Description -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>SEO Description</mat-label>
                <textarea matInput formControlName="seoDescription" rows="3" maxlength="160"></textarea>
                <mat-icon matSuffix>description</mat-icon>
                <mat-hint>Recommended: 150-160 characters</mat-hint>
              </mat-form-field>

              <!-- Keywords -->
              <div class="full-width">
                <mat-form-field appearance="outline" class="keywords-field">
                  <mat-label>Meta Keywords</mat-label>
                  <mat-chip-grid #keywordGrid>
                    @for (keyword of keywordsArray.controls; track $index) {
                      <mat-chip-row (removed)="removeKeyword($index)">
                        {{ keyword.value }}
                        <button matChipRemove>
                          <mat-icon>cancel</mat-icon>
                        </button>
                      </mat-chip-row>
                    }
                  </mat-chip-grid>
                  <input 
                    placeholder="Add a keyword..." 
                    [matChipInputFor]="keywordGrid" 
                    (matChipInputTokenEnd)="addKeyword($event)"
                  />
                </mat-form-field>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Advanced Settings Card -->
        <mat-card class="form-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>settings</mat-icon>
              Advanced Settings
            </mat-card-title>
          </mat-card-header>
          
          <mat-card-content>
            <div class="advanced-settings">
              <!-- Product Status -->
              <div class="setting-group" [formGroup]="advancedForm()">
                <h4>Product Status</h4>
                <mat-slide-toggle formControlName="isActive" color="primary">
                  Product is active
                </mat-slide-toggle>
                
                <mat-slide-toggle formControlName="isFeatured" color="accent">
                  Mark as featured
                </mat-slide-toggle>
              </div>

              <!-- Scheduling -->
              <div class="setting-group" [formGroup]="advancedForm()">
                <h4>Scheduling</h4>
                <p class="setting-description">Schedule when this product should be published</p>
                
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Publish Date</mat-label>
                  <input matInput [matDatepicker]="startPicker" formControlName="scheduledStart">
                  <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
                  <mat-datepicker #startPicker></mat-datepicker>
                </mat-form-field>
                
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>End Date</mat-label>
                  <input matInput [matDatepicker]="endPicker" formControlName="scheduledEnd">
                  <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
                  <mat-datepicker #endPicker></mat-datepicker>
                </mat-form-field>
              </div>

              <!-- Digital Product -->
              <div class="setting-group" [formGroup]="digitalForm()">
                <h4>Digital Product</h4>
                <mat-slide-toggle formControlName="isDigital" color="primary">
                  This is a digital product
                </mat-slide-toggle>
                
                @if (digitalForm().get('isDigital')?.value) {
                  <div class="digital-options">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Downloadable File</mat-label>
                      <input matInput formControlName="digitalFile">
                      <button mat-icon-button matSuffix (click)="triggerFileInput()">
                        <mat-icon>attach_file</mat-icon>
                      </button>
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline">
                      <mat-label>Download Limit</mat-label>
                      <input matInput type="number" formControlName="downloadLimit" min="0">
                      <mat-hint>0 = unlimited downloads</mat-hint>
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline">
                      <mat-label>Download Expiry (days)</mat-label>
                      <input matInput type="number" formControlName="downloadExpiry" min="0">
                      <mat-hint>0 = never expires</mat-hint>
                    </mat-form-field>
                  </div>
                }
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
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