import { Component, Inject, signal, computed, effect, inject, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PromotionInterface, UserInterface } from '../../../../../../shared-services/src/public-api';
import { PromoterService } from '../../../promoter/promoter.service';
import { HttpErrorResponse } from '@angular/common/http';
import { UserService } from '../../../common/services/user.service';

export interface SubmitProofDialogData {
  promotion: PromotionInterface;
}

@Component({
  selector: 'app-submit-proof-dialog',
  standalone: true,
  providers: [PromoterService],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule
  ],
  templateUrl: './submit-proof-dialog.component.html',
  styleUrls: ['./submit-proof-dialog.component.scss']
})
export class SubmitProofDialogComponent {

  private userService: UserService = inject(UserService);
  public user: Signal<UserInterface | null> = this.userService.user;

  proofForm: FormGroup;
  
  // Using signals for state management
  selectedFiles = signal<File[]>([]);
  previewUrls = signal<string[]>([]);
  isSubmitting = signal(false);
  submissionStatus = signal<'idle' | 'success' | 'error'>('idle');
  statusMessage = signal('');

  readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  // readonly minFiles = 2;
  readonly minFiles = 3;
  readonly maxFiles = 3;

  // Computed signals
  //hasFiles = computed(() => this.selectedFiles().length > 0);
  hasFiles = computed(() => this.selectedFiles().length >= this.minFiles);
  
  // Debug computed signal to help identify issues
  formValidity = computed(() => ({
    formValid: this.proofForm.valid,
    viewsCountValid: this.proofForm.get('viewsCount')?.valid,
    hasFiles: this.hasFiles(),
    isSubmitting: this.isSubmitting()
  }));

  // canSubmit = computed(() => {
  //   const formValid = this.proofForm.valid;
  //   const hasFiles = this.selectedFiles().length > 0;
  //   const notSubmitting = !this.isSubmitting();
    
  //   console.log('canSubmit check:', { formValid, hasFiles, notSubmitting });
    
  //   return formValid && hasFiles && notSubmitting;
  // });

  canSubmit = computed(() => {
    const formValid = this.proofForm.valid;
    const hasRequiredFiles = this.selectedFiles().length >= this.minFiles;
    const notSubmitting = !this.isSubmitting();
    
    //console.log('canSubmit check:', { formValid, hasRequiredFiles, notSubmitting });
    
    return formValid && hasRequiredFiles && notSubmitting;
  });

  // daysRemaining = computed(() => {
  //   if (!this.campaign().endDate) return 0;
  //   const end = new Date(this.campaign().endDate);
  //   const now = new Date();
  //   const diffTime = end.getTime() - now.getTime();
  //   return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  // });

  campaign = computed(() => this.data.promotion.campaign);

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<SubmitProofDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SubmitProofDialogData,
    private promoterService: PromoterService
  ) {
    // Initialize form with proper validation
    this.proofForm = this.fb.group({
      viewsCount: ['', [Validators.required, Validators.min(1), Validators.max(1000)]],
      notes: ['']
    });

    // Add validation based on campaign requirements
    effect(() => {
      const minViews = this.campaign().minViewsPerPromotion;
      if (minViews) {
        const viewsControl = this.proofForm.get('viewsCount');
        if (viewsControl) {
          // Update validators
          viewsControl.setValidators([
            Validators.required,
            Validators.min(minViews),
            Validators.max(1000)
          ]);
          viewsControl.updateValueAndValidity();
        }
      }
    });

    // Log form changes for debugging
    this.proofForm.valueChanges.subscribe(() => {
      console.log('Form changed, validity:', this.proofForm.valid);
    });
  }

  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    
    // if (this.selectedFiles().length + files.length > this.maxFiles) {
    //   this.showMessage('error', `Maximum ${this.maxFiles} files allowed`);
    //   return;
    // }

    if (this.selectedFiles().length + files.length > this.maxFiles) {
      this.showMessage('error', `Maximum ${this.maxFiles} files allowed`);
      return;
    }

    const newFiles: File[] = [];
    const newPreviewUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (file.size > this.maxFileSize) {
        this.showMessage('error', 'File size must be less than 5MB');
        continue;
      }

      if (!file.type.startsWith('image/')) {
        this.showMessage('error', 'Only image files are allowed');
        continue;
      }

      newFiles.push(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        newPreviewUrls.push(e.target.result);
        if (newPreviewUrls.length === newFiles.length) {
          this.previewUrls.update(urls => [...urls, ...newPreviewUrls]);
        }
      };
      reader.readAsDataURL(file);
    }

    this.selectedFiles.update(current => [...current, ...newFiles]);
    
    // Force form validation check after files are added
    this.proofForm.updateValueAndValidity();
    
    event.target.value = '';
  }

  removeFile(index: number): void {
    this.selectedFiles.update(files => files.filter((_, i) => i !== index));
    this.previewUrls.update(urls => urls.filter((_, i) => i !== index));
    
    // Force form validation check after files are removed
    this.proofForm.updateValueAndValidity();
  }

  onSubmit(): void {
    // console.log('Submitting form:', {
    //   valid: this.proofForm.valid,
    //   values: this.proofForm.value,
    //   files: this.selectedFiles().length
    // });

    if (this.proofForm.invalid || !this.hasFiles()) {
      this.showMessage('error', `Please fill all required fields and upload at least ${this.minFiles} proof images`);
      return;
    }

    // if (this.proofForm.invalid || !this.hasFiles()) {
    //   this.showMessage('error', 'Please fill all required fields and upload at least one proof image');
    //   return;
    // }

    this.isSubmitting.set(true);
    this.submissionStatus.set('idle');

    const formData = new FormData();
    formData.append('promotionId', this.data.promotion._id);
    formData.append('viewsCount', this.proofForm.get('viewsCount')?.value);
    formData.append('notes', this.proofForm.get('notes')?.value || '');

    this.selectedFiles().forEach((file) => {
      formData.append('proofImages', file);
    });

    this.promoterService.submitProof(formData, this.user()!._id).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        if (response.success) {
          this.submissionStatus.set('success');
          this.showMessage('success', response.message);
          setTimeout(() => this.dialogRef.close('submitted'), 2000);
        } else {
          this.submissionStatus.set('error');
          this.showMessage('error', response.message || 'Submission failed');
        }
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.submissionStatus.set('error');
        const errorMessage = error.error?.message || 'Server error occurred, please try again.';
        this.showMessage('error', errorMessage);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private showMessage(status: 'success' | 'error', message: string): void {
    this.submissionStatus.set(status);
    this.statusMessage.set(message);
    
    // Auto-clear success messages after 5 seconds
    if (status === 'success') {
      setTimeout(() => {
        if (this.submissionStatus() === 'success') {
          this.submissionStatus.set('idle');
          this.statusMessage.set('');
        }
      }, 5000);
    }
  }
}