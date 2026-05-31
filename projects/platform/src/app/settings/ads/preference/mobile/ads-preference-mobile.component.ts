import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RouterModule } from '@angular/router';
import { SettingsService } from '../../../system/system.service';
import { AdsPreferenceSettingsComponent } from '../ads-preference.component';

@Component({
  selector: 'async-ads-preference-mobile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
  ],
  providers: [SettingsService],
  templateUrl: './ads-preference-mobile.component.html',
  styleUrls: ['./ads-preference-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdsPreferenceMobileComponent extends AdsPreferenceSettingsComponent {
  readonly relevanceScore = computed(() => {
    const preferences = this.preferences();
    const locationScore = preferences.locationBasedAds ? 42 : 0;
    const categoryScore = preferences.categoryBasedAds ? 34 : 0;
    const selectedScore = Math.min(preferences.selectedCategories.length, this.maxSelectedCategories) * 4;

    return Math.min(locationScore + categoryScore + selectedScore, 100);
  });

  readonly relevanceTone = computed<'good' | 'warn' | 'bad'>(() => {
    const score = this.relevanceScore();
    if (score >= 72) return 'good';
    if (score >= 42) return 'warn';
    return 'bad';
  });

  readonly selectedCategoryLabels = computed(() =>
    this.preferences().selectedCategories.map((category) => this.categoryLabel(category)),
  );

  readonly statusCards = computed(() => [
    {
      icon: 'my_location',
      label: 'Location match',
      value: this.preferences().locationBasedAds ? 'On' : 'Off',
      tone: this.preferences().locationBasedAds ? 'good' : 'neutral',
    },
    {
      icon: 'interests',
      label: 'Interests',
      value: `${this.selectedCategoryCount()}/${this.maxSelectedCategories}`,
      tone: this.preferences().categoryBasedAds ? 'good' : 'neutral',
    },
    {
      icon: this.hasChanges() ? 'edit_note' : this.preferencesSaved() ? 'check_circle' : 'verified_user',
      label: 'Save state',
      value: this.hasChanges() ? 'Unsaved' : this.preferencesSaved() ? 'Saved' : 'Synced',
      tone: this.hasChanges() ? 'warn' : 'good',
    },
  ]);

  readonly guidanceText = computed(() => {
    if (!this.preferences().locationBasedAds && !this.preferences().categoryBasedAds) {
      return 'You will still see ads, but they may be less useful because MarketSpase has fewer signals to match campaigns to you.';
    }

    if (this.preferences().categoryBasedAds && this.selectedCategoryCount() === 0) {
      return 'Pick a few categories so promoted campaigns and marketplace offers feel more relevant.';
    }

    if (this.showLocationProfileHint()) {
      return 'Add your city or state in account settings so location-based ads can match local offers more accurately.';
    }

    return 'Your ad preferences are tuned. You can change these controls whenever your interests change.';
  });

  categoryLabel(categoryValue: string): string {
    return this.allCategories.find((category) => category.value === categoryValue)?.label || categoryValue;
  }
}
