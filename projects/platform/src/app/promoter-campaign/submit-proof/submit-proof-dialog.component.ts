import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CampaignService } from '../../campaign/campaign.service';
import { PromotionInterface } from '../../../../../shared-services/src/public-api';
import { Subject, takeUntil } from 'rxjs';

export interface SubmitProofDialogData {
  promotion: PromotionInterface;
}

@Component({
  selector: 'app-submit-proof-dialog',
  standalone: true,
  providers: [CampaignService],
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
export class SubmitProofDialogComponent implements OnInit, OnDestroy {
  proofForm: FormGroup;
  isSubmitting = false;
  selectedFiles: File[] = [];
  previewUrls: string[] = [];
  maxFiles = 3;
  maxFileSize = 5 * 1024 * 1024; // 5MB

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<SubmitProofDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SubmitProofDialogData,
    private campaignService: CampaignService,
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

  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

    this.campaignService.submitProof(formData)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.snackBar.open('Proof submitted successfully!', 'Close', { duration: 3000 });
        this.dialogRef.close('submitted');
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Error submitting proof:', error);
        this.snackBar.open('Failed to submit proof. Please try again.', 'Close', { duration: 3000 });
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