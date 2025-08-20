import { Component, OnInit, OnDestroy, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSliderModule } from '@angular/material/slider';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Subscription } from 'rxjs';

interface CampaignPreview {
  title: string;
  description: string;
  mediaUrl: string;
  caption: string;
  link: string;
  budget: number;
  payoutPerPromotion: number;
  maxPromoters: number;
  endDate: Date;
  startDate: Date
}

interface MediaFile {
  file: File;
  url: string;
  type: 'image' | 'video';
  size: number;
  duration?: number; // for videos
}

@Component({
  selector: 'app-create-campaign',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSliderModule,
    MatDividerModule,
    MatProgressBarModule,
    MatChipsModule,
    MatToolbarModule,
    DragDropModule
  ],
  templateUrl: './create-campaign.component.html',
  styleUrls: ['./create-campaign.component.scss']
})
export class CreateCampaignComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('mediaPreview') mediaPreview!: ElementRef<HTMLVideoElement | HTMLImageElement>;

  // Form groups for each step
  contentForm!: FormGroup;
  budgetForm!: FormGroup;
  scheduleForm!: FormGroup;

  // Signals for reactive state management
  currentStep = signal<number>(1);
  isLoading = signal(false);
  uploadProgress = signal(0);
  selectedMedia = signal<MediaFile | null>(null);
  walletBalance = signal(125000); // This should come from your service
  
  // Form validation signals
  isContentValid = signal(false);
  isBudgetValid = signal(false);
  isScheduleValid = signal(false);

  private subscriptions: Subscription[] = [];

  // Campaign preview data
  campaignPreview = computed(() => this.generatePreview());
  
  // New computed signals for template
  estimatedCost = computed(() => this.calculateEstimatedCost());
  estimatedReach = computed(() => this.calculateEstimatedReach());
  maxPossiblePromoters = computed(() => this.calculateMaxPossiblePromoters());
  campaignIsReady = computed(() => this.isContentValid() && this.isBudgetValid() && this.isScheduleValid());
  canGoToNextStep = computed(() => {
    const step = this.currentStep();
    if (step === 1) return this.isContentValid();
    if (step === 2) return this.isBudgetValid();
    if (step === 3) return this.isScheduleValid();
    return false;
  });

  // Media constraints
  readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  readonly MAX_VIDEO_DURATION = 30; // 30 seconds
  readonly ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  readonly ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/mov'];

  ngOnInit(): void {
    this.initializeForms();
    this.setupFormValidation();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private initializeForms(): void {
    // Step 1: Content Form
    this.contentForm = this.fb.group({
      title: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(100)
      ]],
      description: ['', [
        Validators.required,
        Validators.minLength(20),
        Validators.maxLength(500)
      ]],
      caption: ['', [
        Validators.required,
        Validators.maxLength(300)
      ]],
      link: ['', [this.urlValidator]],
      category: ['other', Validators.required]
    });

    // Step 2: Budget Form
    this.budgetForm = this.fb.group({
      budget: [1000, [
        Validators.required,
        Validators.min(500),
        Validators.max(1000000)
      ]],
      payoutPerPromotion: [50, [
        Validators.required,
        Validators.min(25),
        Validators.max(1000)
      ]],
      maxPromoters: [20, [
        Validators.required,
        Validators.min(5),
        Validators.max(500)
      ]]
    });

    // Step 3: Schedule Form
    this.scheduleForm = this.fb.group({
      startDate: [new Date(), Validators.required],
      endDate: [this.getDefaultEndDate(), Validators.required],
      duration: [7, [Validators.required, Validators.min(1), Validators.max(30)]]
    }, { validators: this.dateRangeValidator });
  }

  private setupFormValidation(): void {
    // Monitor form validity
    this.subscriptions.push(
      this.contentForm.statusChanges.subscribe(status => {
        this.isContentValid.set(status === 'VALID' && !!this.selectedMedia());
      })
    );

    this.subscriptions.push(
      this.budgetForm.statusChanges.subscribe(status => {
        this.isBudgetValid.set(status === 'VALID' && this.estimatedCost() <= this.walletBalance());
      })
    );

    this.subscriptions.push(
      this.scheduleForm.statusChanges.subscribe(status => {
        this.isScheduleValid.set(status === 'VALID');
      })
    );

    // Auto-calculate max promoters based on budget
    this.subscriptions.push(
      this.budgetForm.valueChanges.subscribe(values => {
        if (values.budget && values.payoutPerPromotion) {
          const maxPossible = Math.floor(values.budget / values.payoutPerPromotion);
          const currentMax = values.maxPromoters;
          
          if (currentMax > maxPossible) {
            this.budgetForm.patchValue({ maxPromoters: maxPossible }, { emitEvent: false });
          }
        }
      })
    );
  }

  // --- Step Navigation Methods ---
  goToNextStep(): void {
    if (this.canGoToNextStep()) {
      this.currentStep.update(step => step + 1);
    }
  }

  goToPreviousStep(): void {
    this.currentStep.update(step => step - 1);
  }

  submitCampaign(): void {
    if (this.campaignIsReady()) {
      const campaignData = {
        ...this.contentForm.value,
        ...this.budgetForm.value,
        ...this.scheduleForm.value,
        mediaUrl: this.selectedMedia()?.url,
        currency: 'NGN'
      };

      console.log('Campaign Submitted:', campaignData);
      this.snackBar.open('Campaign created successfully!', 'OK', { duration: 3000 });
      this.router.navigate(['/dashboard']);
    } else {
      this.snackBar.open('Please complete all required fields.', 'OK', { duration: 3000 });
    }
  }

  // File upload handling
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.processFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files[0]) {
      this.processFile(files[0]);
    }
  }

  private processFile(file: File): void {
    // Validate file
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      this.snackBar.open(validation.message, 'OK', { duration: 5000 });
      return;
    }

    this.uploadProgress.set(0);
    const reader = new FileReader();

    reader.onloadstart = () => this.isLoading.set(true);
    
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = (event.loaded / event.total) * 100;
        this.uploadProgress.set(progress);
      }
    };

    reader.onload = (event) => {
      const url = event.target?.result as string;
      const mediaFile: MediaFile = {
        file,
        url,
        type: file.type.startsWith('image/') ? 'image' : 'video',
        size: file.size
      };

      if (mediaFile.type === 'video') {
        this.getVideoDuration(url).then(duration => {
          mediaFile.duration = duration;
          this.selectedMedia.set(mediaFile);
          this.isLoading.set(false);
          this.uploadProgress.set(100);
        });
      } else {
        this.selectedMedia.set(mediaFile);
        this.isLoading.set(false);
        this.uploadProgress.set(100);
      }
    };

    reader.onerror = () => {
      this.snackBar.open('Error reading file. Please try again.', 'OK', { duration: 3000 });
      this.isLoading.set(false);
    };

    reader.readAsDataURL(file);
  }

  private validateFile(file: File): { isValid: boolean; message: string } {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        message: `File size must be less than ${this.MAX_FILE_SIZE / 1024 / 1024}MB`
      };
    }

    // Check file type
    const isImage = this.ACCEPTED_IMAGE_TYPES.includes(file.type);
    const isVideo = this.ACCEPTED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      return {
        isValid: false,
        message: 'Please upload a valid image (JPEG, PNG, WebP) or video (MP4, WebM, MOV) file'
      };
    }

    return { isValid: true, message: '' };
  }

  private getVideoDuration(url: string): Promise<number> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        resolve(video.duration);
      };
      video.src = url;
    });
  }

  removeMedia(): void {
    this.selectedMedia.set(null);
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  // Validation helpers
  private urlValidator(control: AbstractControl): {[key: string]: any} | null {
    if (!control.value) return null;
    
    try {
      new URL(control.value);
      return null;
    } catch {
      return { invalidUrl: true };
    }
  }

  private dateRangeValidator(group: AbstractControl): {[key: string]: any} | null {
    const startDate = group.get('startDate')?.value;
    const endDate = group.get('endDate')?.value;
    if (startDate && endDate && endDate < startDate) {
      group.get('endDate')?.setErrors({ dateRange: true });
      return { dateRange: true };
    }
    group.get('endDate')?.setErrors(null);
    return null;
  }

  // Calculation helpers
  private calculateEstimatedCost(): number {
    const values = this.budgetForm.value;
    if (!values.payoutPerPromotion || !values.maxPromoters) return 0;
    
    return values.payoutPerPromotion * values.maxPromoters;
  }

  private calculateEstimatedReach(): number {
    const maxPromoters = this.budgetForm.get('maxPromoters')?.value || 0;
    // Estimate 25-75 views per promoter (average 50)
    return maxPromoters * 50;
  }
  
  private calculateMaxPossiblePromoters(): number {
    const budget = this.budgetForm.get('budget')?.value;
    const payout = this.budgetForm.get('payoutPerPromotion')?.value;
    if (budget && payout && payout > 0) {
      return Math.floor(budget / payout);
    }
    return 0;
  }

  private getDefaultEndDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date;
  }

  private generatePreview(): CampaignPreview {
    return {
      title: this.contentForm.get('title')?.value || '',
      description: this.contentForm.get('description')?.value || '',
      mediaUrl: this.selectedMedia()?.url || '',
      caption: this.contentForm.get('caption')?.value || '',
      link: this.contentForm.get('link')?.value || '',
      budget: this.budgetForm.get('budget')?.value || 0,
      payoutPerPromotion: this.budgetForm.get('payoutPerPromotion')?.value || 0,
      maxPromoters: this.budgetForm.get('maxPromoters')?.value || 0,
      startDate: this.scheduleForm.get('endDate')?.value || new Date(),
      endDate: this.scheduleForm.get('endDate')?.value || new Date()
    };
  }

  // Form submission
  async createCampaign(): Promise<void> {
    if (!this.campaignIsReady()) {
      this.snackBar.open('Please complete all required fields', 'OK', { duration: 3000 });
      return;
    }

    this.isLoading.set(true);

    try {
      // In a real app, you would upload the media file first
      // const mediaUrl = await this.uploadMedia(this.selectedMedia()!.file);

      const campaignData = {
        ...this.contentForm.value,
        ...this.budgetForm.value,
        ...this.scheduleForm.value,
        mediaUrl: 'uploaded-media-url', // Replace with actual upload result
        currency: 'NGN'
      };

      // Call your campaign service here
      // await this.campaignService.createCampaign(campaignData);

      this.snackBar.open('Campaign created successfully!', 'OK', { duration: 3000 });
      this.router.navigate(['/dashboard']);

    } catch (error) {
      this.snackBar.open('Failed to create campaign. Please try again.', 'OK', { duration: 3000 });
    } finally {
      this.isLoading.set(false);
    }
  }

  // Navigation helpers
  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  saveDraft(): void {
    // Implement draft saving functionality
    this.snackBar.open('Draft saved', 'OK', { duration: 2000 });
  }

  // Getters for template
  get categories() {
    return [
      { value: 'fashion', label: 'Fashion & Beauty' },
      { value: 'food', label: 'Food & Restaurants' },
      { value: 'tech', label: 'Technology' },
      { value: 'health', label: 'Health & Fitness' },
      { value: 'travel', label: 'Travel & Tourism' },
      { value: 'education', label: 'Education' },
      { value: 'entertainment', label: 'Entertainment' },
      { value: 'business', label: 'Business & Finance' },
      { value: 'other', label: 'Other' }
    ];
  }
}