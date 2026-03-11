// components/product-management/add-product/components/basic-info-form/basic-info-form.component.ts
import { Component, input, output, OnInit, OnDestroy, ViewChild, ElementRef, InputSignal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators, FormBuilder, ValidationErrors, ValidatorFn, AbstractControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { CategoryOption } from '../../../../../../common/utils/categories';

const nonEmptyArray: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value as any[];
  return Array.isArray(value) && value.length > 0 ? null : { required: true };
};

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
  private fb = inject(FormBuilder);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('tagInput') tagInput!: ElementRef<HTMLInputElement>;
  
  // Inputs
  formGroup: InputSignal<FormGroup> = input.required<FormGroup>();
  categories = input<CategoryOption[]>([]);
  images = input<string[]>([]);
  maxImages = input<number>(5);

  // Outputs
  imagesChanged = output<{ files: File[], previews: string[] }>();
  tagsChanged = output<string[]>();
  
  // Local state
  selectedFiles: File[] = [];
  tagSuggestions = ['New', 'Popular', 'Sale', 'Limited', 'Exclusive', 'Trending'];

  private addingTag = false;  // Prevents re-entry into addTagFromInput
  private isInternalTagChange = false;  // Prevents emitting tagsChanged during internal changes

  get tagsArray(): FormArray {
    return this.formGroup().get('tags') as FormArray;
  }

  constructor() {
    // Keep the images control in sync with the signal
    effect(() => {
      const imgs = this.images();
      const ctrl = this.formGroup().get('images');
      if (!ctrl) return;

      ctrl.setValue(imgs, { emitEvent: false });
      ctrl.updateValueAndValidity({ emitEvent: false });
    });
  }


  ngOnInit(): void {
    // Subscribe to tags changes with debouncing and distinct checks
    this.tagsArray.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),  // Wait 300ms after last change to reduce emissions
        distinctUntilChanged()  // Only emit if value actually changed
      )
      .subscribe((tags: string[]) => {
        if (!this.isInternalTagChange) {  // Skip emission if change is internal
          this.tagsChanged.emit(tags);
        }
      });

    // Ensure an "images" control exists and is required
    const imagesControl = this.formGroup().get('images');
    if (!imagesControl) {
      this.formGroup().addControl('images', new FormControl(this.images() || [], Validators.required));
    } else {
      imagesControl.setValidators(Validators.required);
      imagesControl.updateValueAndValidity({ emitEvent: false });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  addTagFromInput(event: MatChipInputEvent | MatAutocompleteSelectedEvent): void {
    if (this.addingTag) return;  // Prevent re-entry
    this.addingTag = true;
    this.isInternalTagChange = true;  // Flag to prevent external emission

    const value = (event instanceof MatAutocompleteSelectedEvent) 
      ? event.option.viewValue 
      : (event.value || '').trim();

    if (value && !this.tagsArray.value.includes(value)) {
      this.tagsArray.push(this.fb.control(value));
    }

    // Clear the input
    if (event instanceof MatAutocompleteSelectedEvent) {
      this.tagInput.nativeElement.value = '';
    } else {
      event.chipInput!.clear();
    }

    this.isInternalTagChange = false;  // Reset flag
    this.addingTag = false;
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

  onDragOver(event: DragEvent): void {
    event.preventDefault();  // Allow drop
    event.stopPropagation();
    // Optional: Add visual feedback (e.g., CSS class for highlighting)
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    // Optional: Remove visual feedback
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFiles(files);
    }
  }

  private processFiles(files: FileList): void {
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
}