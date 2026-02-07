// targeting.component.ts (REFACTORED FOR LOCATION TARGETING ONLY)
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Import components
import { CampaignTargetingHeaderComponent } from './components/targeting-header/targeting-header.component';
import { TargetingComponent } from './components/targeting/targeting.component';
import { LoadingStateComponent } from './components/loading-state/loading-state.component';
import { ErrorStateComponent } from './components/error-state/error-state.component';

import { CampaignInterface, TargetingArea, TargetingSettings } from '../../../../../shared-services/src/public-api';
import { CampaignTargetingService } from './targeting.service';

@Component({
  selector: 'app-campaign-targeting',
  standalone: true,
  providers: [CampaignTargetingService],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    CampaignTargetingHeaderComponent,
    TargetingComponent,
    LoadingStateComponent,
    ErrorStateComponent
  ],
  templateUrl: './targeting.component.html',
  styleUrls: ['./targeting.component.scss']
})
export class CampaignTargetingComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private campaignTargetingService = inject(CampaignTargetingService);
  private snackBar = inject(MatSnackBar);

  campaign = signal<CampaignInterface | null>(null);
  isLoading = signal(true);
  isSaving = signal(false);
  error = signal<string | null>(null);

  public readonly api = this.campaignTargetingService.api;

  // Targeting signals
  targetLocations = signal<TargetingArea[]>([]);
  enableTarget = signal<boolean>(false);

  ngOnInit(): void {
    this.loadCampaign();
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

    this.campaignTargetingService.getCampaignById(campaignId).subscribe({
      next: (response) => {
        if (response.success) {
          this.campaign.set(response.data);
          this.populateTargetingData(response.data);
          this.isLoading.set(false);
        }
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load campaign');
        this.isLoading.set(false);
      }
    });
  }

  populateTargetingData(campaign: CampaignInterface): void {
    if (campaign.targetLocations && Array.isArray(campaign.targetLocations)) {
      this.targetLocations.set(campaign.targetLocations as TargetingArea[]);
    }
    
    if (campaign.enableTarget !== undefined) {
      this.enableTarget.set(campaign.enableTarget);
    }
  }

  // Location management methods
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

  removeLocation(areaId: string): void {
    if (areaId === 'all') {
      this.targetLocations.set([]);
    } else {
      this.targetLocations.update(locations => locations.filter(l => l.id !== areaId));
    }
  }

  onTargetingSettingsChange(settings: TargetingSettings): void {
    // Update enableTarget if changed
    if (settings.enabled !== this.enableTarget()) {
      this.enableTarget.set(settings.enabled);
    }
    
    // Only update locations if there are actual changes to avoid loops
    if (JSON.stringify(this.targetLocations()) !== JSON.stringify(settings.areas)) {
      this.targetLocations.set(settings.areas);
    }
  }

  onEnableTargetChange(enabled: boolean): void {
    this.enableTarget.set(enabled);
  }

  saveCampaign(): void {
    this.isSaving.set(true);
    
    const campaignData = {
      targetLocations: this.targetLocations(),
      enableTarget: this.enableTarget()
    };

    this.campaignTargetingService.updateCampaign(
      this.campaign()?._id || '', 
      this.campaign()?.owner._id, 
      campaignData
    ).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.snackBar.open('Campaign targeting updated successfully', 'Dismiss', { duration: 3000 });
        this.router.navigate(['/dashboard/campaigns', this.campaign()?._id]);
      },
      error: (err) => {
        this.isSaving.set(false);
        this.snackBar.open(err.message || 'Failed to update campaign targeting', 'Dismiss', { duration: 5000 });
      }
    });
  }

  markFormGroupTouched(): void {
    // No form in this refactored version
  }

  cancelEdit(): void {
    this.router.navigate(['/dashboard/campaigns', this.campaign()?._id]);
  }

  goBack(): void {
    this.router.navigate(['/dashboard/campaigns', this.campaign()?._id]);
  }
}