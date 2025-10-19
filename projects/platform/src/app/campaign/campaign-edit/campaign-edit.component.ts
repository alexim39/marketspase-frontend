// campaign-edit.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

// Import all the new components
import { CampaignEditHeaderComponent } from './components/campaign-edit-header/campaign-edit-header.component';
import { BasicInfoFormComponent } from './components/basic-info-form/basic-info-form.component';
import { MediaUploadComponent } from './components/media-upload/media-upload.component';
import { BudgetSettingsComponent } from './components/budget-settings/budget-settings.component';
import { TargetingComponent } from './components/targeting/targeting.component';
import { ScheduleFormComponent } from './components/schedule-form/schedule-form.component';
import { RequirementsFormComponent } from './components/requirements-form/requirements-form.component';
import { LoadingStateComponent } from './components/loading-state/loading-state.component';
import { ErrorStateComponent } from './components/error-state/error-state.component';

import { CampaignInterface, TargetingArea, TargetingSettings } from '../../../../../shared-services/src/public-api';
import { CampaignEditService } from './campaign-edit.service';
import { CATEGORIES } from '../../common/utils/categories';

@Component({
  selector: 'app-campaign-edit',
  standalone: true,
  providers: [CampaignEditService],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    CampaignEditHeaderComponent,
    BasicInfoFormComponent,
    MediaUploadComponent,
    BudgetSettingsComponent,
    TargetingComponent,
    ScheduleFormComponent,
    RequirementsFormComponent,
    LoadingStateComponent,
    ErrorStateComponent
  ],
  templateUrl: './campaign-edit.component.html',
  styleUrls: ['./campaign-edit.component.scss']
})
export class CampaignEditComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private campaignEditService = inject(CampaignEditService);
  private snackBar = inject(MatSnackBar);

  campaign = signal<CampaignInterface | null>(null);
  isLoading = signal(true);
  isSaving = signal(false);
  error = signal<string | null>(null);
  uploadProgress = signal(0);
  previewImageUrl = signal<string | null>(null);
  previewVideoUrl = signal<string | null>(null);

  campaignForm!: FormGroup;
  locationInputControl = new FormControl('');

  public readonly api = this.campaignEditService.api;

  categories = CATEGORIES;


  // Change targetLocations to handle TargetingArea objects
  targetLocations = signal<TargetingArea[]>([]);

// Update the addLocation method to handle TargetingArea objects
  addLocation(area: TargetingArea): void {
    this.targetLocations.update(locations => {
      const exists = locations.some(loc => 
        loc.place_id === area.place_id || 
        (loc.name.toLowerCase() === area.name.toLowerCase() && loc.type === area.type)
      );
      
      if (!exists) {
        return [...locations, area];
      }
      return locations;
    });
  }

// Update removeLocation to handle TargetingArea IDs
removeLocation(areaId: string): void {
    if (areaId === 'all') {
      this.targetLocations.set([]);
    } else {
      this.targetLocations.update(locations => locations.filter(l => l.id !== areaId));
    }
  }

filteredLocationSuggestions = computed(() => {
  const inputValue = this.locationInputControl.value?.toLowerCase() || '';
  const existingLocationNames = this.targetLocations().map(area => area.name);
  
});


onTargetingSettingsChange(settings: TargetingSettings): void {
    console.log('Targeting settings changed:', settings);
    
    // Only update if there are actual changes to avoid loops
    if (JSON.stringify(this.targetLocations()) !== JSON.stringify(settings.areas)) {
      this.targetLocations.set(settings.areas);
    }
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadCampaign();
  }

  initializeForm(): void {
    this.campaignForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      caption: ['', [Validators.maxLength(250)]],
      category: ['', Validators.required],
      link: ['', [Validators.pattern(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/)]],
      mediaType: ['image'],
      mediaFile: [null],
      //budget: [{ value: null, disabled: true }, [Validators.required, Validators.min(1000)]],
      //payoutPerPromotion: [{ value: null, disabled: true }, [Validators.required, Validators.min(100)]],
      //maxPromoters: [{ value: null, disabled: true }],
      //minViewsPerPromotion: [{ value: 25, disabled: true }, [Validators.required, Validators.min(25)]],
      campaignType: ['standard'],
      enableTarget: [false],
      startDate: [null, Validators.required],
      endDate: [null],
      hasEndDate: [true],
      requirements: [''],
      minRating: [0],
      priority: ['medium']
    });

    //this.campaignForm.get('budget')?.valueChanges.subscribe(() => this.calculateMaxPromoters());
    //this.campaignForm.get('payoutPerPromotion')?.valueChanges.subscribe(() => this.calculateMaxPromoters());
    
    this.campaignForm.get('hasEndDate')?.valueChanges.subscribe(hasEndDate => {
      const endDateControl = this.campaignForm.get('endDate');
      if (hasEndDate) {
        endDateControl?.setValidators(Validators.required);
      } else {
        endDateControl?.clearValidators();
        endDateControl?.setValue(null);
      }
      endDateControl?.updateValueAndValidity();
    });
  }

  loadCampaign(): void {
    this.isLoading.set(true);
    this.error.set(null);
    
    const campaignId = this.route.snapshot.paramMap.get('id');
    if (!campaignId) {
      this.error.set('Invalid campaign ID');
      this.isLoading.set(false);
      return;
    }

    this.campaignEditService.getCampaignById(campaignId).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('Campaign data:', response.data); // Debug log
          this.campaign.set(response.data);
          this.populateForm(response.data);
          this.isLoading.set(false);
        }
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load campaign');
        this.isLoading.set(false);
      }
    });
  }

    populateForm(campaign: CampaignInterface): void {
        this.campaignForm.patchValue({
          title: campaign.title,
          caption: campaign.caption,
          category: campaign.category,
          link: campaign.link || '',
          mediaType: campaign.mediaType || 'image',
          campaignType: campaign.campaignType,
          startDate: new Date(campaign.startDate),
          endDate: campaign.endDate ? new Date(campaign.endDate) : null,
          hasEndDate: campaign.hasEndDate,
          requirements: campaign.requirements?.join(', ') || '',
          minRating: 0,
          priority: campaign.priority,
          enableTarget: campaign.enableTarget || false
        });

    if (campaign.targetLocations && Array.isArray(campaign.targetLocations)) {
      this.targetLocations.set(campaign.targetLocations as TargetingArea[]);
    }

    if (campaign.mediaUrl) {
      if (campaign.mediaType === 'image') {
        this.previewImageUrl.set(this.api + campaign.mediaUrl);
      } else if (campaign.mediaType === 'video') {
        this.previewVideoUrl.set(this.api + campaign.mediaUrl);
      }
    }
  }

  // calculateMaxPromoters(): void {
  //   const budget = this.campaignForm.get('budget')?.value;
  //   const payout = this.campaignForm.get('payoutPerPromotion')?.value;
    
  //   if (budget && payout && payout > 0) {
  //     const maxPromoters = Math.floor(budget / payout);
  //     this.campaignForm.get('maxPromoters')?.setValue(maxPromoters);
  //   } else {
  //     this.campaignForm.get('maxPromoters')?.setValue(0);
  //   }
  // }

  onFileSelected(file: File): void {
    const maxSize = this.campaignForm.get('mediaType')?.value === 'image' ? 5 * 1024 * 1024 : 20 * 1024 * 1024;
    if (file.size > maxSize) {
      this.snackBar.open(
        `File is too large. Maximum size is ${this.campaignForm.get('mediaType')?.value === 'image' ? '5MB' : '20MB'}`,
        'Dismiss',
        { duration: 5000 }
      );
      return;
    }

    this.campaignForm.patchValue({ mediaFile: file });
    
    const reader = new FileReader();
    reader.onload = () => {
      if (this.campaignForm.get('mediaType')?.value === 'image') {
        this.previewImageUrl.set(reader.result as string);
      } else {
        this.previewVideoUrl.set(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  }

  removeMedia(): void {
    this.previewImageUrl.set(null);
    this.previewVideoUrl.set(null);
    this.campaignForm.patchValue({ mediaFile: null });
    this.uploadProgress.set(0);
  }

  saveCampaign(): void {
    if (this.campaignForm.invalid) {
      this.markFormGroupTouched();
      this.snackBar.open('Please fix the errors in the form', 'Dismiss', { duration: 5000 });
      return;
    }

    this.isSaving.set(true);
    
    const formValue = this.campaignForm.value;
    const campaignData = {
      ...formValue,
      requirements: formValue.requirements ? formValue.requirements.split(',').map((r: string) => r.trim()) : [],
      targetLocations: this.targetLocations(), // *** FIX: Use the signal value ***
      enableTarget: this.campaignForm.get('enableTarget')?.value // *** FIX: Include enableTarget ***
    };

    this.campaignEditService.updateCampaign(this.campaign()?._id || '', this.campaign()?.owner._id, campaignData).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.snackBar.open('Campaign updated successfully', 'Dismiss', { duration: 3000 });
        this.router.navigate(['/dashboard/campaigns', this.campaign()?._id]);
      },
      error: (err) => {
        this.isSaving.set(false);
        this.snackBar.open(err.message || 'Failed to update campaign', 'Dismiss', { duration: 5000 });
      }
    });
  }

  markFormGroupTouched(): void {
    Object.keys(this.campaignForm.controls).forEach(key => {
      const control = this.campaignForm.get(key);
      control?.markAsTouched();
    });
  }

  cancelEdit(): void {
    if (this.campaignForm.dirty) {
      const confirm = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirm) return;
    }
    this.router.navigate(['/dashboard/campaigns', this.campaign()?._id]);
  }

  goBack(): void {
    this.router.navigate(['/dashboard/campaigns', this.campaign()?._id]);
  }


}