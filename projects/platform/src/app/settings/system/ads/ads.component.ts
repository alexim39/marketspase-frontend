import { Component, DestroyRef, inject, Input, signal, Signal, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SettingsService } from '../system.service';
import { HttpErrorResponse } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DeviceService, UserInterface } from '../../../../../../shared-services/src/public-api';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { CATEGORIES } from '../../../common/utils/categories';
import { Subject, takeUntil } from 'rxjs';

interface AdPreferences {
  locationBased: boolean;
  categoryBased: boolean;
  selectedCategories: string[];
}

@Component({
  selector: 'async-ads',
  templateUrl: './ads.component.html',
  styleUrls: ['./ads.component.scss'],
  standalone: true,
  providers: [SettingsService],
  imports: [
    CommonModule, 
    MatSlideToggleModule, 
    MatIconModule, 
    MatCardModule, 
    MatChipsModule,
    FormsModule
  ],
})
export class AdsSettingsComponent implements OnInit, OnDestroy {
  @Input({ required: true }) user!: Signal<UserInterface | null>;
  private deviceService = inject(DeviceService);
  deviceType = computed(() => this.deviceService.type());

  preferences = signal<AdPreferences>({
    locationBased: true, // Default to true for better UX
    categoryBased: false,
    selectedCategories: []
  });

  originalPreferences = signal<AdPreferences>({
    locationBased: true,
    categoryBased: false,
    selectedCategories: []
  });

  isSaving = signal(false);
  hasChanges = signal(false);
  preferencesSaved = signal(false);
  isInitialized = signal(false);

  allCategories = CATEGORIES;

  adTypes = [
    {
      icon: 'local_offer',
      title: 'Special Offers',
      description: 'Discounts and promotions based on your interests'
    },
    {
      icon: 'store',
      title: 'Local Businesses',
      description: 'Deals from businesses in your area'
    },
    {
      icon: 'event',
      title: 'Events',
      description: 'Local events and activities you might enjoy'
    }
  ];

  private readonly snackBar = inject(MatSnackBar);
  private readonly settingsService = inject(SettingsService);
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.loadUserPreferences();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUserPreferences(): void {
    // Use a more reliable way to watch for user changes
    const user = this.user();
    if (!user) return;

    const userPrefs: AdPreferences = {
      locationBased: user.preferences?.locationBasedAds ?? true, // Default to true if undefined
      categoryBased: user.preferences?.categoryBasedAds ?? false,
      selectedCategories: user.preferences?.adCategories || []
    };
    
    // Only update if this is the initial load or if preferences haven't been modified locally
    if (!this.isInitialized() || !this.hasChanges()) {
      this.preferences.set(userPrefs);
      this.originalPreferences.set({...userPrefs});
      this.isInitialized.set(true);
    }
    
    this.checkForChanges();
    this.preferencesSaved.set(false);
  }

  onPreferenceChange(): void {
    this.checkForChanges();
    this.preferencesSaved.set(false);
  }

  onCategoryToggleChange(): void {
    const currentPrefs = this.preferences();
    
    // If disabling category-based ads, clear selections but don't reset to original
    if (!currentPrefs.categoryBased) {
      this.preferences.set({
        ...currentPrefs,
        selectedCategories: []
      });
    }
    
    this.checkForChanges();
    this.preferencesSaved.set(false);
  }

  toggleCategory(categoryValue: string): void {
    if (this.isSaving() || !this.preferences().categoryBased) return;

    this.preferences.update(prefs => {
      const isSelected = prefs.selectedCategories.includes(categoryValue);
      let newSelectedCategories = [...prefs.selectedCategories];

      if (isSelected) {
        newSelectedCategories = newSelectedCategories.filter(cat => cat !== categoryValue);
      } else if (newSelectedCategories.length < 6) {
        newSelectedCategories.push(categoryValue);
      }

      return {
        ...prefs,
        selectedCategories: newSelectedCategories
      };
    });

    this.checkForChanges();
    this.preferencesSaved.set(false);
  }

  checkForChanges(): void {
    const current = this.preferences();
    const original = this.originalPreferences();
    
    const changesDetected = 
      current.locationBased !== original.locationBased ||
      current.categoryBased !== original.categoryBased ||
      JSON.stringify([...current.selectedCategories].sort()) !== JSON.stringify([...original.selectedCategories].sort());
    
    this.hasChanges.set(changesDetected);
  }

  savePreferences(): void {
    if (this.isSaving() || !this.hasChanges()) return;
    
    this.isSaving.set(true);
    this.preferencesSaved.set(false);

    const userId = this.user()?._id;
    if (!userId) {
      this.snackBar.open('User not found', 'Close', { duration: 3000 });
      this.isSaving.set(false);
      return;
    }

    const currentPrefs = this.preferences();
    
    const formObject = {
      userId: userId,
      preferences: {
        locationBasedAds: currentPrefs.locationBased,
        categoryBasedAds: currentPrefs.categoryBased,
        adCategories: currentPrefs.categoryBased ? currentPrefs.selectedCategories : []
      }
    };

    this.settingsService.submitAdsPreferences(formObject)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedUser) => {
          this.isSaving.set(false);
          
          // Update original preferences with the saved ones
          this.originalPreferences.set({...currentPrefs});
          this.checkForChanges();
          this.preferencesSaved.set(true);
          
          // Optional: Update the user signal if your service returns updated user data
          // This would require a different architecture to update the parent component's signal
        },
        error: (error: HttpErrorResponse) => {
          this.isSaving.set(false);
          
          const errorMessage = error.error?.message || error.message || 'Failed to save preferences';
          this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
          
          // Don't revert changes on error - let user try again or reset manually
        }
      });
  }

  resetToDefault(): void {
    if (this.isSaving()) return;
    
    this.preferences.set({...this.originalPreferences()});
    this.checkForChanges();
    this.preferencesSaved.set(false);
  }

  // Helper method to manually refresh from server if needed
  // refreshPreferences(): void {
  //   const userId = this.user()?._id;
  //   if (!userId) return;

  //   this.settingsService.getUserPreferences(userId)
  //     .pipe(takeUntil(this.destroy$))
  //     .subscribe({
  //       next: (userData) => {
  //         const userPrefs: AdPreferences = {
  //           locationBased: userData.preferences?.locationBasedAds ?? true,
  //           categoryBased: userData.preferences?.categoryBasedAds ?? false,
  //           selectedCategories: userData.preferences?.adCategories || []
  //         };
          
  //         this.preferences.set(userPrefs);
  //         this.originalPreferences.set({...userPrefs});
  //         this.checkForChanges();
  //       },
  //       error: (error) => {
  //         console.error('Failed to refresh preferences:', error);
  //       }
  //     });
  // }
}