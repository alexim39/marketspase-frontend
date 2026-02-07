// campaign-edit.component.ts (REFACTORED)
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

// Import all the new components
import { CampaignEditHeaderComponent } from './components/campaign-edit-header/campaign-edit-header.component';
import { BasicInfoFormComponent } from './components/basic-info-form/basic-info-form.component';
import { BudgetSettingsComponent } from './components/budget-settings/budget-settings.component';
import { ScheduleFormComponent } from './components/schedule-form/schedule-form.component';
import { RequirementsFormComponent } from './components/requirements-form/requirements-form.component';
import { LoadingStateComponent } from './components/loading-state/loading-state.component';
import { ErrorStateComponent } from './components/error-state/error-state.component';

import { CampaignInterface } from '../../../../../shared-services/src/public-api';
import { CampaignEditService } from './campaign-edit.service';
import { CATEGORIES } from '../../common/utils/categories';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

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
    BudgetSettingsComponent,
    ScheduleFormComponent,
    RequirementsFormComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    MatIconModule,
    MatButtonModule
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

  campaignForm!: FormGroup;

  public readonly api = this.campaignEditService.api;

  categories = CATEGORIES;

  ngOnInit(): void {
    this.initializeForm();
    this.loadCampaign();
  }

  initializeForm(): void {
    this.campaignForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      caption: ['', [Validators.maxLength(300)]],
      category: ['', Validators.required],
      link: ['', [Validators.pattern(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/)]],
      campaignType: ['standard'],
      startDate: [null, Validators.required],
      endDate: [null],
      hasEndDate: [true],
      requirements: [''],
      minRating: [0],
      priority: ['medium']
    });

    // Handle end date validation based on hasEndDate toggle
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
          this.campaign.set(response.data);
          this.populateForm(response.data);
          this.isLoading.set(false);
        } else {
          this.error.set('Failed to load campaign data');
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
      caption: campaign.caption || '',
      category: campaign.category,
      link: campaign.link || '',
      campaignType: campaign.campaignType || 'standard',
      startDate: new Date(campaign.startDate),
      endDate: campaign.endDate ? new Date(campaign.endDate) : null,
      hasEndDate: campaign.hasEndDate !== false,
      requirements: campaign.requirements?.join(', ') || '',
      minRating: campaign.minRating || 0,
      priority: campaign.priority || 'medium'
    });

    // Optional: Mark form as pristine after population
    this.campaignForm.markAsPristine();
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
      requirements: formValue.requirements ? 
        formValue.requirements.split(',').map((r: string) => r.trim()).filter(Boolean) : 
        [],
    };

    const campaignId = this.campaign()?._id || '';
    const userId = this.campaign()?.owner._id || '';

    if (!campaignId || !userId) {
      this.snackBar.open('Invalid campaign data', 'Dismiss', { duration: 5000 });
      this.isSaving.set(false);
      return;
    }

    this.campaignEditService.updateCampaign(campaignId, userId, campaignData).subscribe({
      next: (response) => {
        this.isSaving.set(false);
        if (response.success) {
          this.snackBar.open('Campaign updated successfully', 'Dismiss', { duration: 3000 });
          this.campaignForm.markAsPristine();
          // Optionally reload campaign data to get updated values
          // this.loadCampaign();
          this.router.navigate(['/dashboard/campaigns', campaignId]);
        } else {
          this.snackBar.open(response.message || 'Failed to update campaign', 'Dismiss', { duration: 5000 });
        }
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
    const campaignId = this.campaign()?._id;
    this.router.navigate(['/dashboard/campaigns', campaignId]);
  }

  goBack(): void {
    const campaignId = this.campaign()?._id;
    this.router.navigate(['/dashboard/campaigns', campaignId]);
  }

  // Helper method to check if form has changes
  hasUnsavedChanges(): boolean {
    return this.campaignForm.dirty;
  }

  // Add this method to the CampaignEditComponent class
  navigateToTargeting(): void {
    const campaignId = this.campaign()?._id;
    if (campaignId) {
      // Check if there are unsaved changes
      if (this.campaignForm.dirty) {
        const confirm = window.confirm('You have unsaved changes. Save before editing targeting?');
        if (confirm) {
          // Save first, then navigate
          this.saveCampaign();
          // Note: Navigation will happen after save in the saveCampaign method
          return;
        } else {
          // Navigate without saving
          this.router.navigate(['/dashboard/campaigns', campaignId, 'targeting']);
        }
      } else {
        // No unsaved changes, navigate directly
        this.router.navigate(['/dashboard/campaigns', campaignId, 'targeting']);
      }
    }
  }
}