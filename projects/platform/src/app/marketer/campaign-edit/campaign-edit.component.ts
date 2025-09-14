// campaign-edit.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl, FormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

import { MarketerService } from '../marketer.service';
import { CampaignInterface } from '../../../../../shared-services/src/public-api';
import { NIGERIAN_STATES } from '../../common/utils/nigerian-states';

@Component({
  selector: 'app-campaign-edit',
  standalone: true,
  providers: [MarketerService],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatButtonToggleModule
  ],
  templateUrl: './campaign-edit.component.html',
  styleUrls: ['./campaign-edit.component.scss']
})
export class CampaignEditComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private marketerService = inject(MarketerService);
  private snackBar = inject(MatSnackBar);

  campaign = signal<CampaignInterface | null>(null);
  isLoading = signal(true);
  isSaving = signal(false);
  error = signal<string | null>(null);
  uploadProgress = signal(0);
  previewImageUrl = signal<string | null>(null);
  previewVideoUrl = signal<string | null>(null);
  targetLocations = signal<string[]>([]);

  campaignForm!: FormGroup;

   // API base URL for media
  public readonly api = this.marketerService.api;

  categories = [
    { value: 'fashion', label: 'Fashion & Beauty' },
    { value: 'food', label: 'Food & Beverage' },
    { value: 'tech', label: 'Technology' },
    { value: 'health', label: 'Health & Fitness' },
    { value: 'travel', label: 'Travel & Tourism' },
    { value: 'education', label: 'Education' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'business', label: 'Business & Finance' },
    { value: 'lifestyle', label: 'Lifestyle' },
    { value: 'other', label: 'Other' }
  ];

  readonly locationSuggestions = NIGERIAN_STATES;


  // Add these new properties for location handling
  locationInputControl = new FormControl('');
  filteredLocationSuggestions = computed(() => {
    const inputValue = this.locationInputControl.value?.toLowerCase() || '';
    return this.locationSuggestions.filter(location => 
      location.toLowerCase().includes(inputValue) && 
      !this.targetLocations().includes(location)
    );
  });


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
      budget: [null, [Validators.required, Validators.min(1000)]],
      payoutPerPromotion: [{ value: null, disabled: true }, [Validators.required, Validators.min(100)]],
      maxPromoters: [{ value: null, disabled: true }],
      minViewsPerPromotion: [{ value: 25, disabled: true }, [Validators.required, Validators.min(25)]],
      campaignType: ['standard'],
      enableTarget: [false],
      startDate: [null, Validators.required],
      endDate: [null],
      hasEndDate: [true],
      requirements: [''],
      minRating: [0],
      priority: ['medium']
    });

    // Watch for budget or payout changes to recalculate max promoters
    this.campaignForm.get('budget')?.valueChanges.subscribe(() => this.calculateMaxPromoters());
    this.campaignForm.get('payoutPerPromotion')?.valueChanges.subscribe(() => this.calculateMaxPromoters());
    
    // Watch for end date toggle changes
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

    this.marketerService.getCampaignById(campaignId).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('response ',response.data)
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
      budget: campaign.budget,
      payoutPerPromotion: campaign.payoutPerPromotion,
      minViewsPerPromotion: campaign.minViewsPerPromotion,
      campaignType: campaign.campaignType,
      startDate: new Date(campaign.startDate),
      endDate: campaign.endDate ? new Date(campaign.endDate) : null,
      hasEndDate: campaign.hasEndDate,
      requirements: campaign.requirements?.join(', ') || '',
      minRating: 0, // Default value, adjust based on your business logic
      priority: campaign.priority
    });

    // Set media preview if exists
    if (campaign.mediaUrl) {
      if (campaign.mediaType === 'image') {
        this.previewImageUrl.set(this.api + campaign.mediaUrl);
      } else if (campaign.mediaType === 'video') {
        this.previewVideoUrl.set(this.api + campaign.mediaUrl);
      }
    }

    // Set target locations if available
    // This would need to be implemented based on your data structure
    this.calculateMaxPromoters();
  }

  calculateMaxPromoters(): void {
    const budget = this.campaignForm.get('budget')?.value;
    const payout = this.campaignForm.get('payoutPerPromotion')?.value;
    
    if (budget && payout && payout > 0) {
      const maxPromoters = Math.floor(budget / payout);
      this.campaignForm.get('maxPromoters')?.setValue(maxPromoters);
    } else {
      this.campaignForm.get('maxPromoters')?.setValue(0);
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size and type
    const maxSize = this.campaignForm.get('mediaType')?.value === 'image' ? 5 * 1024 * 1024 : 20 * 1024 * 1024;
    if (file.size > maxSize) {
      this.snackBar.open(
        `File is too large. Maximum size is ${this.campaignForm.get('mediaType')?.value === 'image' ? '5MB' : '20MB'}`,
        'Dismiss',
        { duration: 5000 }
      );
      return;
    }

    // Set file in form
    this.campaignForm.patchValue({ mediaFile: file });
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      if (this.campaignForm.get('mediaType')?.value === 'image') {
        this.previewImageUrl.set(reader.result as string);
      } else {
        this.previewVideoUrl.set(reader.result as string);
      }
    };
    reader.readAsDataURL(file);

    // Simulate upload progress (in a real app, this would be an actual upload)
    //this.simulateUpload();
  }

  // simulateUpload(): void {
  //   this.uploadProgress.set(0);
  //   const interval = setInterval(() => {
  //     if (this.uploadProgress() < 100) {
  //       this.uploadProgress.set(this.uploadProgress() + 10);
  //     } else {
  //       clearInterval(interval);
  //       this.snackBar.open('Media uploaded successfully', 'Dismiss', { duration: 3000 });
  //     }
  //   }, 200);
  // }

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
    
    // Prepare form data
    const formValue = this.campaignForm.value;
    const campaignData = {
      ...formValue,
      requirements: formValue.requirements ? formValue.requirements.split(',').map((r: string) => r.trim()) : [],
      targetLocations: this.targetLocations(),
      // Add other necessary fields
    };

    // In a real app, you would call your service to update the campaign
    this.marketerService.updateCampaign(this.campaign()?._id || '', this.campaign()?.owner._id, campaignData).subscribe({
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

    addLocation(event: any): void {
    const value = (event.value || '').trim();
    this.addLocationValue(value);
    event.chipInput!.clear();
    this.locationInputControl.setValue('');
  }

  addLocationFromAutocomplete(event: any): void {
    const value = event.option.value.trim();
    this.addLocationValue(value);
    // Clear the input after selection
    this.locationInputControl.setValue('');
    
    // Focus back on the input
    setTimeout(() => {
      const inputElement = document.querySelector('input[matChipInputFor]') as HTMLInputElement;
      if (inputElement) {
        inputElement.focus();
      }
    });
  }

  private addLocationValue(value: string): void {
    if (value && !this.targetLocations().includes(value)) {
      this.targetLocations.update(locations => [...locations, value]);
    }
  }

  removeLocation(location: string): void {
    this.targetLocations.update(locations => locations.filter(l => l !== location));
  }

}