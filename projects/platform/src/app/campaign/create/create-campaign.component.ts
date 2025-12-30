import { Component, OnInit, inject, signal, computed, Signal, DestroyRef } from '@angular/core';
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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { WalletFundingComponent } from '../../wallet/funding/funding.component';
import { UserService } from '../../common/services/user.service';
import { CampaignService } from './create.service';
import { HttpErrorResponse } from '@angular/common/http';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DeviceService, UserInterface } from '../../../../../shared-services/src/public-api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CampaignContentFormComponent } from './components/campaign-content-form/campaign-content-form.component';
import { CampaignBudgetFormComponent } from './components/campaign-budget-form/campaign-budget-form.component';
import { CampaignScheduleFormComponent } from './components/campaign-schedule-form/campaign-schedule-form.component';
import { CampaignSummaryComponent } from './components/campaign-summary/campaign-summary.component';
import { MediaFile } from './media-file.model';

@Component({
  selector: 'app-create-campaign',
  standalone: true,
  providers: [CampaignService],
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
    MatSlideToggleModule,
    DragDropModule,
    MatTooltipModule,
    // Refactored Components
    CampaignContentFormComponent,
    CampaignBudgetFormComponent,
    CampaignScheduleFormComponent,
    CampaignSummaryComponent
  ],
  templateUrl: './create-campaign.component.html',
  styleUrls: ['./create-campaign.component.scss']
})
export class CreateCampaignComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  private campaignService = inject(CampaignService);
  private readonly deviceService = inject(DeviceService);

  // Public properties for the template
  protected readonly deviceType = computed(() => this.deviceService.type());

  private userService: UserService = inject(UserService);
  public user: Signal<UserInterface | null> = this.userService.user;
  
  public today: Date = new Date();
  public currentStep = signal<number>(1);
  public isSubmitting = signal(false);

  // Form groups to be passed down to child components
  contentForm!: FormGroup;
  budgetForm!: FormGroup;
  scheduleForm!: FormGroup;

  // Signals to track validity of each step
  isContentValid = signal(false);
  isBudgetValid = signal(false);
  isScheduleValid = signal(false);
  selectedMedia = signal<MediaFile | null>(null);

  // Computed signals for derived state
  walletBalance = computed(() => this.user()?.wallets?.marketer?.balance ?? 0);
  campaignIsReady = computed(() => this.isContentValid() && this.isBudgetValid() && this.isScheduleValid() && this.walletBalance() >= this.budgetForm.get('budget')?.value);

  ngOnInit(): void {
    this.initializeForms();
  }

  // private initializeForms(): void {
  //   this.contentForm = this.fb.group({
  //     title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
  //     caption: ['', [Validators.required, Validators.maxLength(300)]],
  //     link: ['', [this.urlValidator]],
  //     category: ['other', Validators.required]
  //   });

  //   this.budgetForm = this.fb.group({
  //     budget: [null, [Validators.required, Validators.min(500), Validators.max(1000000)]],
  //     enableTarget: [true] 
  //   });

  //   this.scheduleForm = this.fb.group({
  //     startDate: [new Date(), Validators.required],
  //     hasEndDate: [true],
  //     endDate: [null],
  //     duration: [{ value: 7, disabled: true }]
  //   });
  // }

  private initializeForms(): void {
    this.contentForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      caption: ['', [Validators.required, Validators.maxLength(300)]],
      link: ['', [this.urlValidator]],
      category: ['other', Validators.required]
    });

    this.budgetForm = this.fb.group({
      budget: [null, [Validators.required, Validators.min(500), Validators.max(1000000)]],
      enableTarget: [true],
      ageTarget: ['all', Validators.required] // Add age targeting control
    });

    this.scheduleForm = this.fb.group({
      startDate: [new Date(), Validators.required],
      hasEndDate: [true],
      endDate: [null],
      duration: [{ value: 7, disabled: true }]
    });
  }

  // --- Step Navigation Methods ---
  goToNextStep(): void {
    const current = this.currentStep();
    if (current === 1 && this.isContentValid()) {
      this.currentStep.set(2);
    } else if (current === 2 && this.isBudgetValid() && this.walletBalance() >= this.budgetForm.get('budget')?.value) {
      this.currentStep.set(3);
    } else if (current === 3 && this.isScheduleValid()) {
      this.currentStep.set(4);
    }
  }

  goToPreviousStep(): void {
    const current = this.currentStep();
    if (current > 1) {
      this.currentStep.set(current - 1);
    }
  }

  isStepActive(step: number): boolean {
    if (step === 1) return this.isContentValid();
    if (step === 2) return this.isBudgetValid();
    if (step === 3) return this.isScheduleValid();
    if (step === 4) return this.campaignIsReady();
    return false;
  }

  isStepCurrent(step: number): boolean {
    return this.currentStep() === step;
  }

  // Event handlers from child components
  onContentValidityChange(isValid: boolean): void {
    this.isContentValid.set(isValid);
  }

  onMediaChange(media: MediaFile | null): void {
    this.selectedMedia.set(media);
  }

  onBudgetValidityChange(isValid: boolean): void {
    this.isBudgetValid.set(isValid);
  }

  onScheduleValidityChange(isValid: boolean): void {
    this.isScheduleValid.set(isValid);
  }

  // Final submission logic
  submitCampaign(): void {

    if (this.user()?.personalInfo?.phone === '') {
    // if (this.user()?.personalInfo?.phone == null || this.user()?.personalInfo?.address == null) {
    // if (this.user()?.personalInfo?.phone && this.user()?.personalInfo?.address) {
      this.snackBar.open(
        'Please complete your profile setup to create campaign',
        'Go to Settings',
        {
          duration: 3000,
          panelClass: 'snackbar-link'
        }
      ).onAction().subscribe(() => {
        this.router.navigate(['/dashboard/settings/account']);
      });

      return;
    }

    this.isSubmitting.set(true);

    if (this.campaignIsReady()) {
      const formData = new FormData();
      formData.append('title', this.contentForm.get('title')?.value);
      formData.append('caption', this.contentForm.get('caption')?.value);
      formData.append('link', this.contentForm.get('link')?.value);
      formData.append('category', this.contentForm.get('category')?.value);
      formData.append('budget', this.budgetForm.get('budget')?.value);
      formData.append('enableTarget', this.budgetForm.get('enableTarget')?.value);
      formData.append('startDate', this.scheduleForm.get('startDate')?.value?.toISOString());
      formData.append('currency', 'NGN');
      formData.append('owner', this.user()?._id ?? '');
      formData.append('ageTarget', this.budgetForm.get('ageTarget')?.value);

      if (this.scheduleForm.get('hasEndDate')?.value && this.scheduleForm.get('endDate')?.value) {
        formData.append('endDate', this.scheduleForm.get('endDate')?.value?.toISOString());
      }

      const selected = this.selectedMedia();
      if (selected && selected.file) {
        formData.append('media', selected.file);
      }

      this.campaignService.create(formData)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open(response.message, 'OK', { duration: 3000 });
              this.router.navigate(['/dashboard/campaigns']);
            }
            this.isSubmitting.set(false);
          },
          error: (error: HttpErrorResponse) => {
            const errorMessage = error.error?.message || 'Server error occurred, please try again.';
            this.snackBar.open(errorMessage, 'Ok', { duration: 3000 });
            this.isSubmitting.set(false);
          }
        });
    } else {
      this.snackBar.open('Please complete all required fields and ensure you have sufficient funds.', 'OK', { duration: 3000 });
      this.isSubmitting.set(false);
    }
  }

  // Validation helpers
  // private urlValidator(control: AbstractControl): { [key: string]: any } | null {
  //   if (!control.value) return null;
  //   try {
  //     new URL(control.value);
  //     return null;
  //   } catch {
  //     return { invalidUrl: true };
  //   }
  // }

  private urlValidator(control: AbstractControl): { [key: string]: any } | null {
    if (!control.value) return null;
    
    const urlPattern = /^(https?|ftp):\/\/(-\.)?([^\s\/?\.#]+\.?)+(\/[^\s]*)?$/i;
    const localhostPattern = /^(https?):\/\/localhost(:\d+)?(\/.*)?$/i;
    const ipPattern = /^(https?):\/\/(\d{1,3}\.){3}\d{1,3}(:\d+)?(\/.*)?$/i;
    
    let urlToTest = control.value.trim();
    
    // Add protocol if missing (default to http)
    if (!/^https?:\/\//i.test(urlToTest)) {
      urlToTest = 'https://' + urlToTest;
    }
    
    try {
      // Test against various URL patterns
      if (urlPattern.test(urlToTest) || 
          localhostPattern.test(urlToTest) || 
          ipPattern.test(urlToTest)) {
        
        const url = new URL(urlToTest);
        
        // Additional validation for basic URL structure
        if (url.hostname && url.protocol && url.protocol.match(/^(https?|ftp):$/)) {
          return null;
        }
      }
      return { invalidUrl: true };
    } catch {
      return { invalidUrl: true };
    }
  }

  // private urlValidator(control: AbstractControl): { [key: string]: any } | null {
  //   if (!control.value) return null;
    
  //   try {
  //     let urlString = control.value;
      
  //     // Create a test URL by adding protocol if missing
  //     const testUrl = urlString.startsWith('http://') || urlString.startsWith('https://') 
  //       ? urlString 
  //       : 'https://' + urlString;
      
  //     // Validate the URL
  //     new URL(testUrl);
      
  //     // Extract hostname and normalize to www. format
  //     const urlObj = new URL(testUrl);
  //     let normalizedUrl = '';
      
  //     // If it already has www., use it as is
  //     if (urlObj.hostname.startsWith('www.')) {
  //       normalizedUrl = urlObj.hostname + urlObj.pathname + urlObj.search;
  //     } else {
  //       // Add www. prefix
  //       normalizedUrl = 'www.' + urlObj.hostname + urlObj.pathname + urlObj.search;
  //     }
      
  //     // Remove trailing slash if present
  //     normalizedUrl = normalizedUrl.replace(/\/$/, '');
      
  //     // Update control value with normalized www. version
  //     if (control.value !== normalizedUrl) {
  //       control.setValue(normalizedUrl, { emitEvent: false });
  //     }
      
  //     return null;
  //   } catch {
  //     return { invalidUrl: true };
  //   }
  // }


  // Navigation and other actions
  goBack(): void {
    this.router.navigate(['/dashboard/campaigns']);
  }

  saveDraft(): void {
    
    this.isSubmitting.set(true);

    if (this.campaignIsReady()) {
      const formData = new FormData();
      formData.append('title', this.contentForm.get('title')?.value);
      formData.append('caption', this.contentForm.get('caption')?.value);
      formData.append('link', this.contentForm.get('link')?.value);
      formData.append('category', this.contentForm.get('category')?.value);
      formData.append('budget', this.budgetForm.get('budget')?.value);
      formData.append('enableTarget', this.budgetForm.get('enableTarget')?.value);
      formData.append('startDate', this.scheduleForm.get('startDate')?.value?.toISOString());
      formData.append('currency', 'NGN');
      formData.append('owner', this.user()?._id ?? '');
      formData.append('ageTarget', this.budgetForm.get('ageTarget')?.value);

      if (this.scheduleForm.get('hasEndDate')?.value && this.scheduleForm.get('endDate')?.value) {
        formData.append('endDate', this.scheduleForm.get('endDate')?.value?.toISOString());
      }

      const selected = this.selectedMedia();
      if (selected && selected.file) {
        formData.append('media', selected.file);
      }

      this.campaignService.save(formData)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open(response.message, 'OK', { duration: 3000 });
              this.router.navigate(['/dashboard/campaigns']);
            }
            this.isSubmitting.set(false);
          },
          error: (error: HttpErrorResponse) => {
            const errorMessage = error.error?.message || 'Server error occurred, please try again.';
            this.snackBar.open(errorMessage, 'Ok', { duration: 3000 });
            this.isSubmitting.set(false);
          }
        });
    } else {
      this.snackBar.open('Please complete all required fields and ensure you have sufficient funds.', 'OK', { duration: 3000 });
      this.isSubmitting.set(false);
    }

  }

  fundWallet(): void {
    this.dialog.open(WalletFundingComponent, { panelClass: 'custom-dialog-container' });
  }

}