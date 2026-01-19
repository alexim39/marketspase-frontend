// components/product-management/add-product/components/basic-info-form/basic-info-form.component.ts
import { Component, input, output, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';

type StrCtrl = FormControl<string>;

@Component({
  selector: 'app-basic-info-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatMenuModule,
    MatButtonModule
  ],
  template: `
    <div class="form-step">
      <!-- Basic Information Card -->
      <mat-card class="form-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>info</mat-icon>
            Basic Information
          </mat-card-title>
          <mat-card-subtitle>Tell us about your product</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <div class="form-grid" [formGroup]="formGroup()">
            <!-- Product Name -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Product Name *</mat-label>
              <input matInput formControlName="name">
              <mat-icon matSuffix>title</mat-icon>
              @if (formGroup().get('name')?.hasError('required')) {
                <mat-error>Product name is required</mat-error>
              }
              @if (formGroup().get('name')?.hasError('minlength')) {
                <mat-error>Minimum 3 characters required</mat-error>
              }
            </mat-form-field>

            <!-- Category -->
            <mat-form-field appearance="outline">
              <mat-label>Category *</mat-label>
              <mat-select formControlName="category">
                @for (category of categories(); track category) {
                  <mat-option [value]="category">{{ category }}</mat-option>
                }
              </mat-select>
              @if (formGroup().get('category')?.hasError('required')) {
                <mat-error>Please select a category</mat-error>
              }
            </mat-form-field>

            <!-- Brand -->
            <mat-form-field appearance="outline">
              <mat-label>Brand</mat-label>
              <input matInput formControlName="brand">
              <mat-icon matSuffix>business</mat-icon>
            </mat-form-field>

            <!-- Tags -->
            <div class="full-width">
              <mat-form-field appearance="outline" class="tags-field">
                <mat-label>Tags</mat-label>
                <mat-chip-grid #chipGrid>
                  @for (tag of tagsArray.controls; track $index) {
                    <mat-chip-row (removed)="removeTag($index)">
                      {{ tag.value }}
                      <button matChipRemove>
                        <mat-icon>cancel</mat-icon>
                      </button>
                    </mat-chip-row>
                  }
                </mat-chip-grid>
                <input 
                  placeholder="Add a tag..." 
                  [matChipInputFor]="chipGrid" 
                  (matChipInputTokenEnd)="addTag($event)"
                  [matAutocomplete]="auto"
                />
                <mat-autocomplete #auto="matAutocomplete">
                  @for (suggestion of tagSuggestions; track suggestion) {
                    <mat-option [value]="suggestion">{{ suggestion }}</mat-option>
                  }
                </mat-autocomplete>
              </mat-form-field>
            </div>

            <!-- Description -->
            <mat-form-field appearance="outline" class="full-width description-field">
              <mat-label>Description</mat-label>
              <textarea matInput formControlName="description" rows="4"></textarea>
              <mat-icon matSuffix>description</mat-icon>
              <mat-hint>Describe your product in detail. You can use rich text formatting.</mat-hint>
            </mat-form-field>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Product Images Card -->
      <mat-card class="form-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>image</mat-icon>
            Product Images
          </mat-card-title>
          <mat-card-subtitle>Upload up to {{ maxImages() }} images (First image will be the main image)</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <div class="images-upload">
            <!-- Image Upload Area -->
            <div class="upload-area" (click)="fileInput.click()">
              <input type="file" #fileInput accept="image/*" multiple (change)="onImageSelect($event)" hidden>
              <mat-icon class="upload-icon">cloud_upload</mat-icon>
              <p>Drag & drop images here or click to browse</p>
              <span class="upload-hint">Supports JPG, PNG, WebP up to 5MB each</span>
            </div>

            <!-- Image Previews -->
            @if (images().length > 0) {
              <div class="image-previews">
                <div class="image-grid">
                  @for (image of images(); track $index; let i = $index) {
                    <div class="image-preview" [class.main-image]="i === 0">
                      <div class="image-overlay">
                        <button mat-icon-button class="image-remove" (click)="removeImage(i)">
                          <mat-icon>close</mat-icon>
                        </button>
                        @if (i === 0) {
                          <div class="main-label">Main</div>
                        }
                        <button mat-icon-button class="image-reorder" [matMenuTriggerFor]="reorderMenu">
                          <mat-icon>more_vert</mat-icon>
                        </button>
                        <mat-menu #reorderMenu="matMenu">
                          @if (i > 0) {
                            <button mat-menu-item (click)="reorderImages(i, i - 1)">
                              <mat-icon>arrow_upward</mat-icon>
                              Move Up
                            </button>
                          }
                          @if (i < images().length - 1) {
                            <button mat-menu-item (click)="reorderImages(i, i + 1)">
                              <mat-icon>arrow_downward</mat-icon>
                              Move Down
                            </button>
                          }
                        </mat-menu>
                      </div>
                      <img [src]="image" [alt]="'Product image ' + (i + 1)">
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styleUrls: ['./basic-info-form.component.scss']
})
export class BasicInfoFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // Inputs
  formGroup = input.required<FormGroup>();
  categories = input<string[]>([]);
  images = input<string[]>([]);
  maxImages = input<number>(5);

  // Outputs
  imagesChanged = output<{ files: File[], previews: string[] }>();
  tagsChanged = output<string[]>();

  // Local state
  selectedFiles: File[] = [];
  tagSuggestions = ['New', 'Popular', 'Sale', 'Limited', 'Exclusive', 'Trending'];

  get tagsArray() {
    return this.formGroup().get('tags') as any;
  }

  ngOnInit(): void {
    // Subscribe to tags changes
    this.tagsArray.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((tags: string[]) => {
        this.tagsChanged.emit(tags);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  addTag(event: any): void {
    const input = event.input;
    const value = (event.value ?? '').trim();
    if (value) {
      this.tagsArray.push(value);
      if (input) input.value = '';
    }
  }

  removeTag(index: number): void {
    this.tagsArray.removeAt(index);
  }

  onImageSelect(event: any): void {
    const files: FileList = event.target.files;
    const newFiles: File[] = [];
    const newPreviews: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      if (this.images().length + newPreviews.length >= this.maxImages()) break;
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        newFiles.push(file);
        newPreviews.push(e.target.result);
        
        if (newPreviews.length === files.length || this.images().length + newPreviews.length >= this.maxImages()) {
          this.imagesChanged.emit({
            files: [...this.selectedFiles, ...newFiles],
            previews: [...this.images(), ...newPreviews]
          });
          this.selectedFiles = [...this.selectedFiles, ...newFiles];
        }
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(index: number): void {
    const newFiles = this.selectedFiles.filter((_, i) => i !== index);
    const newPreviews = this.images().filter((_, i) => i !== index);
    
    this.imagesChanged.emit({
      files: newFiles,
      previews: newPreviews
    });
    this.selectedFiles = newFiles;
  }

  reorderImages(from: number, to: number): void {
    const files = [...this.selectedFiles];
    const previews = [...this.images()];
    
    const [movedFile] = files.splice(from, 1);
    const [movedPreview] = previews.splice(from, 1);
    
    files.splice(to, 0, movedFile);
    previews.splice(to, 0, movedPreview);
    
    this.imagesChanged.emit({
      files: files,
      previews: previews
    });
    this.selectedFiles = files;
  }
}