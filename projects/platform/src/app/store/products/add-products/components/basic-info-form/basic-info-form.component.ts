// components/product-management/add-product/components/basic-info-form/basic-info-form.component.ts
import { Component, input, output, OnInit, OnDestroy, ViewChild, ElementRef, InputSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
  @ViewChild('tagInput') tagInput!: ElementRef<HTMLInputElement>;
  
  // Inputs - KEEP as input signal for parent component to pass data
  formGroup: InputSignal<FormGroup> = input.required<FormGroup>();
  categories = input<CategoryOption[]>([]);
  images = input<string[]>([]);
  maxImages = input<number>(5);

  // Outputs
  imagesChanged = output<{ files: File[], previews: string[] }>();
  tagsChanged = output<string[]>();
  
  // Remove this local formGroup and use the input signal instead
  // formGroup = new FormGroup({
  //   tags: new FormArray([]),
  //   // ...other form controls
  // });

  // Local state
  selectedFiles: File[] = [];
  tagSuggestions = ['New', 'Popular', 'Sale', 'Limited', 'Exclusive', 'Trending'];

  get tagsArray(): FormArray {
    return this.formGroup().get('tags') as FormArray;
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

  // Fix method name to match HTML template
  addTagFromInput(event: any): void {
    let value: string;
    let inputElement: HTMLInputElement | null = null;

    if (event.input) {
        // Called from matChipInputTokenEnd
        value = (event.value ?? '').trim();
        inputElement = event.input;
    } else if (event.option) {
        // Called from autocomplete optionSelected
        value = (event.option.value ?? '').trim();
        // Set the input field value to the selected tag
        this.tagInput.nativeElement.value = value;
    } else {
        // Direct call
        value = (event ?? '').trim();
    }

    if (value) {
        // Check if tag already exists
        const currentTags = this.tagsArray.value as string[];
        if (!currentTags.includes(value)) {
            // Push a new FormControl with the tag value
            this.tagsArray.push(new FormControl(value));
            this.tagsChanged.emit(this.tagsArray.value);
        }

        // Clear the input if it was from a token end
        if (inputElement) {
            inputElement.value = '';
        }
    }
  }

  // Add this method to handle autocomplete selection
  addTag(event: any): void {
    const value = (event.option?.value ?? '').trim();
    if (value) {
      const currentTags = this.tagsArray.value as string[];
      if (!currentTags.includes(value)) {
        this.tagsArray.push(new FormControl(value));
      }
      // Clear the input
      if (this.tagInput?.nativeElement) {
        this.tagInput.nativeElement.value = '';
      }
    }
  }

 removeTag(index: number): void {
    // Remove the tag at the specified index
    this.tagsArray.removeAt(index);

    // Automatically select the next tag, if available
    const remainingTags = this.tagsArray.controls;
    if (remainingTags.length > 0) {
      const nextIndex = index < remainingTags.length ? index : remainingTags.length - 1;
      const nextTag = remainingTags[nextIndex] as FormControl;
      if (nextTag) {
        // Set the value of the input to the next tag
        this.tagInput.nativeElement.value = nextTag.value;
        this.tagInput.nativeElement.focus();
      }
    } else {
      // Clear the input if no tags are left
      this.tagInput.nativeElement.value = '';
    }

    // Emit the updated tags
    this.tagsChanged.emit(this.tagsArray.value);
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