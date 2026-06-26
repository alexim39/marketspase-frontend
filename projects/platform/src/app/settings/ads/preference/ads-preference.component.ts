import {
  Component,
  DestroyRef,
  Input,
  Signal,
  WritableSignal,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DeviceService } from '@shared/services/device';
import { UserInterface } from '@shared/services';

import { CATEGORIES } from '../../../common/utils/categories';
import { AdPreferencesPayload, SettingsService } from '../../system/system.service';
import { UserService } from '../../../common/services/user.service';

interface AdPreferences {
  locationBasedAds: boolean;
  categoryBasedAds: boolean;
  selectedCategories: string[];
}

const MAX_AD_CATEGORIES = 6;
const ALLOWED_AD_CATEGORIES = new Set(CATEGORIES.map((category) => category.value));

@Component({
  selector: 'async-ads-preference',
  templateUrl: './ads-preference.component.html',
  styleUrls: ['./ads-preference.component.scss'],
  standalone: true,
  providers: [SettingsService],
  imports: [
    CommonModule,
    MatSlideToggleModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    FormsModule,
  ],
})
export class AdsPreferenceSettingsComponent {
  //@Input({ required: true }) user!: Signal<UserInterface | null>;

    private userService = inject(UserService);
    // Expose the signal directly to the template
    public user: Signal<UserInterface | null> = this.userService.user;

    private readonly snackBar = inject(MatSnackBar);
    private readonly settingsService = inject(SettingsService);
    private readonly deviceService = inject(DeviceService);
    private readonly destroyRef = inject(DestroyRef);


  readonly maxSelectedCategories = MAX_AD_CATEGORIES;
  readonly allCategories = CATEGORIES;
  readonly deviceType = computed(() => this.deviceService.type());
  readonly selectedCategoryCount = computed(() => this.preferences().selectedCategories.length);
  readonly preferences: WritableSignal<AdPreferences> = signal({
    locationBasedAds: true,
    categoryBasedAds: false,
    selectedCategories: [],
  });

  readonly originalPreferences: WritableSignal<AdPreferences> = signal({
    locationBasedAds: true,
    categoryBasedAds: false,
    selectedCategories: [],
  });

  readonly isSaving = signal(false);
  readonly hasChanges = signal(false);
  readonly preferencesSaved = signal(false);
  readonly isInitialized = signal(false);
  readonly showLocationProfileHint = computed(() => this.preferences().locationBasedAds && !this.hasLocationProfile());

  readonly adTypes = [
    {
      icon: 'local_offer',
      title: 'Special Offers',
      description: 'Campaigns and promotions based on your interests',
    },
    {
      icon: 'store',
      title: 'Local Businesses',
      description: 'Campaigns from businesses in your area',
    },
  ];


  constructor() {
    effect(() => {
      const currentUser = this.user();
      if (!currentUser) {
        return;
      }

      const shouldSyncFromUser = untracked(() => !this.isInitialized() || !this.hasChanges());
      if (!shouldSyncFromUser) {
        return;
      }

      const normalizedPreferences = this.normalizePreferences({
        locationBasedAds: currentUser.preferences?.locationBasedAds,
        categoryBasedAds: currentUser.preferences?.categoryBasedAds,
        adCategories: currentUser.preferences?.adCategories,
      });

      untracked(() => {
        this.preferences.set(normalizedPreferences);
        this.originalPreferences.set(this.clonePreferences(normalizedPreferences));
        this.isInitialized.set(true);
        this.hasChanges.set(false);
      });
    });
  }

  updateLocationBasedAds(enabled: boolean): void {
    if (this.isSaving()) {
      return;
    }

    this.preferences.update((prefs) => ({
      ...prefs,
      locationBasedAds: enabled,
    }));

    this.onPreferenceChange();
  }

  updateCategoryBasedAds(enabled: boolean): void {
    if (this.isSaving()) {
      return;
    }

    this.preferences.update((prefs) => ({
      ...prefs,
      categoryBasedAds: enabled,
      selectedCategories: enabled ? prefs.selectedCategories : [],
    }));

    this.checkForChanges();
    this.preferencesSaved.set(false);
  }

  onPreferenceChange(): void {
    this.checkForChanges();
    this.preferencesSaved.set(false);
  }

  toggleCategory(categoryValue: string): void {
    if (this.isSaving() || !this.preferences().categoryBasedAds) {
      return;
    }

    this.preferences.update((prefs) => {
      const isSelected = prefs.selectedCategories.includes(categoryValue);

      if (isSelected) {
        return {
          ...prefs,
          selectedCategories: prefs.selectedCategories.filter((category) => category !== categoryValue),
        };
      }

      if (prefs.selectedCategories.length >= this.maxSelectedCategories) {
        this.snackBar.open(`Select up to ${this.maxSelectedCategories} categories`, 'Close', { duration: 2500 });
        return prefs;
      }

      return {
        ...prefs,
        selectedCategories: [...prefs.selectedCategories, categoryValue],
      };
    });

    this.checkForChanges();
    this.preferencesSaved.set(false);
  }

  savePreferences(): void {
    if (this.isSaving() || !this.hasChanges()) {
      return;
    }

    const currentUser = this.user();
    if (!currentUser?._id) {
      this.snackBar.open('User not found', 'Close', { duration: 3000 });
      return;
    }

    const normalizedPreferences = this.normalizePreferences({
      locationBasedAds: this.preferences().locationBasedAds,
      categoryBasedAds: this.preferences().categoryBasedAds,
      adCategories: this.preferences().selectedCategories,
    });

    const payload: { userId?: string; preferences: AdPreferencesPayload } = {
      userId: currentUser._id,
      preferences: {
        locationBasedAds: normalizedPreferences.locationBasedAds,
        categoryBasedAds: normalizedPreferences.categoryBasedAds,
        adCategories: normalizedPreferences.categoryBasedAds ? normalizedPreferences.selectedCategories : [],
      },
    };

    this.isSaving.set(true);
    this.preferencesSaved.set(false);

    this.settingsService.submitAdsPreferences(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const serverPreferences = this.normalizePreferences(response?.data?.preferences ?? payload.preferences);

          this.preferences.set(serverPreferences);
          this.originalPreferences.set(this.clonePreferences(serverPreferences));
          this.hasChanges.set(false);
          this.preferencesSaved.set(true);
          this.isSaving.set(false);

          if (currentUser.uid) {
            this.userService.getUser(currentUser.uid)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({ error: () => void 0 });
          }
        },
        error: (error: HttpErrorResponse) => {
          this.isSaving.set(false);
          const errorMessage = error.error?.message || error.message || 'Failed to save preferences';
          this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
        },
      });
  }

  discardChanges(): void {
    if (this.isSaving()) {
      return;
    }

    this.preferences.set(this.clonePreferences(this.originalPreferences()));
    this.hasChanges.set(false);
    this.preferencesSaved.set(false);
  }

  private hasLocationProfile(): boolean {
    const address = this.user()?.personalInfo?.address;
    return [address?.street, address?.city, address?.state, address?.country]
      .some((value) => typeof value === 'string' && value.trim().length > 0);
  }

  private checkForChanges(): void {
    const current = this.preferences();
    const original = this.originalPreferences();

    const changesDetected =
      current.locationBasedAds !== original.locationBasedAds ||
      current.categoryBasedAds !== original.categoryBasedAds ||
      JSON.stringify([...current.selectedCategories].sort()) !==
        JSON.stringify([...original.selectedCategories].sort());

    this.hasChanges.set(changesDetected);
  }

  private normalizePreferences(source: {
    locationBasedAds?: boolean;
    categoryBasedAds?: boolean;
    adCategories?: string[] | null;
  }): AdPreferences {
    const selectedCategories = Array.isArray(source.adCategories)
      ? Array.from(
          new Set(
            source.adCategories
              .map((category) => String(category || '').trim().toLowerCase())
              .filter((category) => ALLOWED_AD_CATEGORIES.has(category)),
          ),
        ).slice(0, this.maxSelectedCategories)
      : [];

    const categoryBasedAds = Boolean(source.categoryBasedAds);

    return {
      locationBasedAds: source.locationBasedAds ?? true,
      categoryBasedAds,
      selectedCategories: categoryBasedAds ? selectedCategories : [],
    };
  }

  private clonePreferences(preferences: AdPreferences): AdPreferences {
    return {
      ...preferences,
      selectedCategories: [...preferences.selectedCategories],
    };
  }
}
