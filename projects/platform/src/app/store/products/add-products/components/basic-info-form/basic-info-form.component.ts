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
import { CategoryOption } from '../../../../../common/utils/categories';

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
  templateUrl: './basic-info-form.component.html',
  styleUrls: ['./basic-info-form.component.scss']
})
export class BasicInfoFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // Inputs
  formGroup = input.required<FormGroup>();
  categories = input<CategoryOption[]>([]);
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