import { Component, DestroyRef, inject, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PromotionInterface } from '../../../../../../shared-services/src/public-api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PromoterService } from '../../../promoter/promoter.service';
import { HttpErrorResponse } from '@angular/common/http';

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
    MatProgressBarModule,
    MatSnackBarModule
  ],
  templateUrl: './submit-proof-dialog.component.html',
  styleUrls: ['./submit-proof-dialog.component.scss']
})
export class SubmitProofDialogComponent implements OnInit {
  proofForm: FormGroup;
  isSubmitting = false;
  selectedFiles: File[] = [];
  previewUrls: string[] = [];
  maxFiles = 3;
  maxFileSize = 5 * 1024 * 1024; // 5MB

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<SubmitProofDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SubmitProofDialogData,
    private promoterService: PromoterService,
    private snackBar: MatSnackBar
  ) {
    this.proofForm = this.fb.group({
      viewsCount: ['', [Validators.required, Validators.min(25), Validators.max(1000)]],
      notes: ['']
    });
  }

  ngOnInit(): void {
    console.log('Dialog opened for promotion:', this.data.promotion);
  }


  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    
    if (this.selectedFiles.length + files.length > this.maxFiles) {
      this.snackBar.open(`Maximum ${this.maxFiles} files allowed`, 'Close', { duration: 3000 });
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (file.size > this.maxFileSize) {
        this.snackBar.open('File size must be less than 5MB', 'Close', { duration: 3000 });
        continue;
      }

      if (!file.type.startsWith('image/')) {
        this.snackBar.open('Only image files are allowed', 'Close', { duration: 3000 });
        continue;
      }

      this.selectedFiles.push(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrls.push(e.target.result);
      };
      reader.readAsDataURL(file);
    }

    // Clear file input
    event.target.value = '';
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.previewUrls.splice(index, 1);
  }

  onSubmit(): void {
    if (this.proofForm.invalid || this.selectedFiles.length === 0) {
      this.snackBar.open('Please fill all required fields and upload at least one proof image', 'Close', { duration: 3000 });
      return;
    }

    this.isSubmitting = true;

    const formData = new FormData();
    formData.append('promotionId', this.data.promotion._id);
    formData.append('viewsCount', this.proofForm.get('viewsCount')?.value);
    formData.append('notes', this.proofForm.get('notes')?.value || '');

    this.selectedFiles.forEach((file, index) => {
      formData.append('proofImages', file);
    });

    this.promoterService.submitProof(formData)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (response) => {
        if (response.success) {
          this.isSubmitting = false;
          this.snackBar.open(response.message, 'Close', { duration: 3000 });
          this.dialogRef.close('submitted');
        }
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting = false;
        console.error('Error submitting proof:', error);
        const errorMessage = error.error?.message || 'Server error occurred, please try again.';
        this.snackBar.open(errorMessage, 'Ok', { duration: 5000 });
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  get campaign() {
    return this.data.promotion.campaign;
  }

  get daysRemaining(): number {
    if (!this.campaign.endDate) return 0;
    const end = new Date(this.campaign.endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}