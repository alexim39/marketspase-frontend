import { Component, OnInit, inject, signal, computed, Signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse, HttpEventType, HttpResponse } from '@angular/common/http';
import { firstValueFrom, filter, map, tap } from 'rxjs';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DeviceService, UserInterface } from '@shared/services';
import { WalletFundingIndexComponent } from '../../wallet/funding';
import { UserService } from '../../common/services/user.service';
import {
  CampaignMediaAsset,
  CampaignMediaUploadResponse,
  CampaignService,
} from './create.service';

import { CampaignContentFormComponent } from './components/campaign-content-form/campaign-content-form.component';
import { CampaignGoalFormComponent } from './components/campaign-goal-form/campaign-goal-form.component';
import { CampaignBudgetFormComponent } from './components/campaign-budget-form/campaign-budget-form.component';
import { CampaignScheduleFormComponent } from './components/campaign-schedule-form/campaign-schedule-form.component';
import { CampaignSummaryComponent } from './components/campaign-summary/campaign-summary.component';
import { MediaFile } from './media-file.model';

const DEFAULT_CAMPAIGN_COST_PER_CLICK = 80;

type SubmissionStage = 'idle' | 'uploading' | 'creating';

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
    CampaignContentFormComponent,
    CampaignGoalFormComponent,
    CampaignBudgetFormComponent,
    CampaignScheduleFormComponent,
    CampaignSummaryComponent,
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

  protected readonly deviceType = computed(() => this.deviceService.type());

  private userService: UserService = inject(UserService);
  public user: Signal<UserInterface | null> = this.userService.user;

  public today: Date = new Date();
  public currentStep = signal<number>(1);
  public isSubmitting = signal(false);
  public submissionStage = signal<SubmissionStage>('idle');
  public uploadProgress = signal<number | null>(null);

  contentForm!: FormGroup;
  goalForm!: FormGroup;
  budgetForm!: FormGroup;
  scheduleForm!: FormGroup;

  isContentValid = signal(false);
  isGoalValid = signal(false);
  isBudgetValid = signal(false);
  isScheduleValid = signal(true);
  selectedMedia = signal<MediaFile | null>(null);

  private uploadedMediaAsset = signal<CampaignMediaAsset | null>(null);
  private uploadedMediaKey = signal<string | null>(null);

  walletBalance = computed(() => this.user()?.wallets?.marketer?.balance ?? 0);
  budgetValue = signal<number>(0);
  campaignHasMedia = computed(() => Boolean(this.selectedMedia()?.file));

  campaignIsReady = computed(() =>
    this.isContentValid() &&
    this.isGoalValid() &&
    this.isBudgetValid() &&
    this.isScheduleValid() &&
    this.campaignHasMedia() &&
    this.walletBalance() >= this.budgetValue()
  );

  campaignIsReadyAsDraft = computed(() =>
    this.isContentValid() &&
    this.isGoalValid() &&
    this.isBudgetValid() &&
    this.isScheduleValid() &&
    this.campaignHasMedia()
  );

  submissionTitle = computed(() =>
    this.submissionStage() === 'uploading'
      ? 'Uploading campaign media'
      : this.submissionStage() === 'creating'
        ? 'Creating campaign'
        : ''
  );

  submissionDescription = computed(() => {
    if (this.submissionStage() === 'uploading') {
      return 'We are uploading your media first so the final campaign request stays fast and reliable.';
    }

    if (this.submissionStage() === 'creating') {
      return 'Your media is ready. We are now saving the campaign and finishing the setup.';
    }

    return '';
  });

  ngOnInit(): void {
    this.initializeForms();
    this.setupFormListeners();

    this.budgetForm.get('budget')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.budgetValue.set(value || 0);
      });
  }

  private initializeForms(): void {
    this.contentForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      caption: ['', [Validators.required, Validators.maxLength(300)]],
      link: ['', [this.urlValidator]],
      enableDirectChat: [false],
      category: ['other', Validators.required]
    });

    this.goalForm = this.fb.group({
      campaignGoal: ['awareness', Validators.required]
    });
    this.isGoalValid.set(this.goalForm.valid);

    this.budgetForm = this.fb.group({
      budget: [null, [Validators.required, Validators.min(1000), Validators.max(1000000)]],
      enableTarget: [{ value: true, disabled: true }],
      ageTarget: ['all', Validators.required]
    });

    this.scheduleForm = this.fb.group({
      startDate: [new Date(), Validators.required],
      hasEndDate: [false],
      endDate: [null],
      duration: [{ value: 7, disabled: true }]
    });
  }

  goToNextStep(): void {
    const current = this.currentStep();
    if (current === 1 && this.isContentValid()) {
      this.currentStep.set(2);
    } else if (current === 2 && this.isGoalValid()) {
      this.currentStep.set(3);
    } else if (current === 3 && this.isBudgetValid() && this.walletBalance() >= this.budgetForm.get('budget')?.value) {
      this.currentStep.set(4);
    } else if (current === 4 && this.isScheduleValid()) {
      this.currentStep.set(5);
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
    if (step === 2) return this.isGoalValid();
    if (step === 3) return this.isBudgetValid();
    if (step === 4) return this.isScheduleValid();
    if (step === 5) return this.campaignIsReady();
    return false;
  }

  isStepCurrent(step: number): boolean {
    return this.currentStep() === step;
  }

  onContentValidityChange(isValid: boolean): void {
    this.isContentValid.set(isValid);
  }

  onMediaChange(media: MediaFile | null): void {
    this.selectedMedia.set(media);

    const mediaKey = this.getMediaKey(media);
    if (!mediaKey || mediaKey !== this.uploadedMediaKey()) {
      this.uploadedMediaAsset.set(null);
      this.uploadedMediaKey.set(null);
    }

    this.uploadProgress.set(null);
  }

  onGoalValidityChange(isValid: boolean): void {
    this.isGoalValid.set(isValid);
  }

  onBudgetValidityChange(isValid: boolean): void {
    this.isBudgetValid.set(isValid);
  }

  onScheduleValidityChange(isValid: boolean): void {
    this.isScheduleValid.set(isValid);
  }

  async submitCampaign(): Promise<void> {
    if (!this.user()?.personalInfo?.phone || !this.user()?.personalInfo?.address) {
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

    if (!this.campaignIsReady()) {
      this.snackBar.open('Please complete all required fields, add campaign media, and ensure you have sufficient funds.', 'OK', { duration: 3000 });
      return;
    }

    await this.persistCampaign('create');
  }

  private urlValidator(control: AbstractControl): { [key: string]: any } | null {
    const formGroup = control.parent;

    if (!formGroup) {
      return null;
    }

    const enableDirectChat = formGroup.get('enableDirectChat')?.value;

    if (enableDirectChat) {
      return null;
    }

    if (!control.value) return null;

    const urlPattern = /^(https?|ftp):\/\/(-\.)?([^\s\/?\.#]+\.?)+(\/[^\s]*)?$/i;
    const localhostPattern = /^(https?):\/\/localhost(:\d+)?(\/.*)?$/i;
    const ipPattern = /^(https?):\/\/(\d{1,3}\.){3}\d{1,3}(:\d+)?(\/.*)?$/i;

    let urlToTest = control.value.trim();

    if (!/^https?:\/\//i.test(urlToTest)) {
      urlToTest = 'https://' + urlToTest;
    }

    try {
      if (
        urlPattern.test(urlToTest) ||
        localhostPattern.test(urlToTest) ||
        ipPattern.test(urlToTest)
      ) {
        const url = new URL(urlToTest);

        if (url.hostname && url.protocol && url.protocol.match(/^(https?|ftp):$/)) {
          return null;
        }
      }
      return { invalidUrl: true };
    } catch {
      return { invalidUrl: true };
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard/campaigns']);
  }

  async saveDraft(): Promise<void> {
    if (!this.user()?.personalInfo?.phone || !this.user()?.personalInfo?.address) {
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

    if (!this.campaignIsReadyAsDraft()) {
      this.snackBar.open('Please complete all required fields and add campaign media before saving as draft.', 'OK', { duration: 3000 });
      return;
    }

    await this.persistCampaign('save');
  }

  fundWallet(): void {
    const isMobileExperience = this.deviceType() === 'mobile' || this.deviceType() === 'tablet';
    this.dialog.open(WalletFundingIndexComponent, {
      panelClass: 'custom-dialog-container',
      width: isMobileExperience ? '100vw' : undefined,
      maxWidth: isMobileExperience ? '480px' : undefined,
      maxHeight: isMobileExperience ? '92vh' : undefined,
      disableClose: isMobileExperience
    });
  }

  onSaveAsDraft(): void {
    if (this.currentStep() === 3) {
      if (this.budgetForm.get('ageTarget')?.valid) {
        this.currentStep.set(4);
        this.snackBar.open('Proceeding to save campaign as draft', 'OK', { duration: 2000 });
      } else {
        this.snackBar.open('Please select age target first', 'OK', { duration: 3000 });
      }
    }
  }

  private setupFormListeners(): void {
    this.contentForm.get('enableDirectChat')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((enabled) => {
        const linkControl = this.contentForm.get('link');

        if (enabled) {
          linkControl?.disable();
          linkControl?.clearValidators();
          linkControl?.setValue('');
        } else {
          linkControl?.enable();
          linkControl?.setValidators([this.urlValidator.bind(this)]);
        }

        linkControl?.updateValueAndValidity();
      });
  }

  private async persistCampaign(mode: 'create' | 'save'): Promise<void> {
    this.isSubmitting.set(true);

    try {
      const mediaAsset = await this.ensureUploadedMedia();
      this.submissionStage.set('creating');
      this.uploadProgress.set(null);

      const payload = this.buildCampaignPayload(mediaAsset);
      const request$ = mode === 'create'
        ? this.campaignService.create(payload)
        : this.campaignService.save(payload);

      const response = await firstValueFrom(request$);

      if (!response?.success) {
        throw new Error(
          response?.message ||
          (mode === 'create'
            ? 'Failed to create campaign.'
            : 'Failed to save campaign as draft.')
        );
      }

      this.snackBar.open(response.message, 'OK', { duration: 3000 });
      this.router.navigate(['/dashboard/campaigns']);
    } catch (error) {
      this.snackBar.open(
        this.getSubmissionErrorMessage(
          error,
          mode === 'create'
            ? 'Server error occurred while creating campaign. Please try again.'
            : 'Server error occurred while saving campaign draft. Please try again.'
        ),
        'OK',
        { duration: 4000 }
      );
    } finally {
      this.isSubmitting.set(false);
      this.submissionStage.set('idle');
      this.uploadProgress.set(null);
    }
  }

  private async ensureUploadedMedia(): Promise<CampaignMediaAsset> {
    const selected = this.selectedMedia();
    if (!selected?.file) {
      throw new Error('Please add campaign media before continuing.');
    }

    const mediaKey = this.getMediaKey(selected);
    const existingAsset = this.uploadedMediaAsset();

    if (mediaKey && existingAsset && this.uploadedMediaKey() === mediaKey) {
      return existingAsset;
    }

    this.submissionStage.set('uploading');
    this.uploadProgress.set(0);

    const uploadResponse = await firstValueFrom(
      this.campaignService.uploadMedia(selected.file).pipe(
        tap((event) => {
          if (event.type === HttpEventType.UploadProgress) {
            const total = event.total ?? selected.file.size;
            if (total > 0) {
              this.uploadProgress.set(Math.round((event.loaded / total) * 100));
            }
          }
        }),
        filter((event): event is HttpResponse<CampaignMediaUploadResponse> => event.type === HttpEventType.Response),
        map((event) => event.body)
      )
    );

    if (!uploadResponse?.success || !uploadResponse.data) {
      throw new Error(uploadResponse?.message || 'Failed to upload campaign media.');
    }

    this.uploadedMediaAsset.set(uploadResponse.data);
    this.uploadedMediaKey.set(mediaKey);
    this.uploadProgress.set(100);

    return uploadResponse.data;
  }

  private buildCampaignPayload(mediaAsset: CampaignMediaAsset): Record<string, unknown> {
    const startDate = this.scheduleForm.get('startDate')?.value;
    const endDate = this.scheduleForm.get('endDate')?.value;
    const hasEndDate = Boolean(this.scheduleForm.get('hasEndDate')?.value);

    const payload: Record<string, unknown> = {
      title: this.contentForm.get('title')?.value ?? '',
      caption: this.contentForm.get('caption')?.value ?? '',
      link: this.contentForm.get('link')?.value ?? '',
      category: this.contentForm.get('category')?.value ?? 'other',
      campaignGoal: this.goalForm.get('campaignGoal')?.value ?? 'awareness',
      budget: this.budgetForm.get('budget')?.value ?? '',
      costPerClick: DEFAULT_CAMPAIGN_COST_PER_CLICK,
      enableTarget: this.budgetForm.get('enableTarget')?.value ?? true,
      ageTarget: this.budgetForm.get('ageTarget')?.value ?? 'all',
      currency: 'NGN',
      owner: this.user()?._id ?? '',
      hasEndDate,
      mediaUrl: mediaAsset.mediaUrl,
      mediaType: mediaAsset.mediaType,
      thumbnailUrl: mediaAsset.thumbnailUrl,
      mediaPublicId: mediaAsset.mediaPublicId ?? '',
    };

    if (startDate) {
      payload['startDate'] = startDate.toISOString();
    }

    if (hasEndDate && endDate) {
      payload['endDate'] = endDate.toISOString();
    }

    return payload;
  }

  private getMediaKey(media: MediaFile | null): string | null {
    if (!media?.file) {
      return null;
    }

    return `${media.file.name}:${media.file.size}:${media.file.lastModified}`;
  }

  private getSubmissionErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message || fallbackMessage;
    }

    if (error instanceof Error) {
      return error.message || fallbackMessage;
    }

    return fallbackMessage;
  }
}
