import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AppMetricsService } from '../../common/services/metrics.service';
import { TruncatePipe } from '@shared/services';
import { TutorialsComponent } from '../tutorials.component';
import { TutorialService, VideoItem } from '../services/tutorial.service';

type TutorialSheet = 'filters' | 'sections' | null;

@Component({
  selector: 'app-tutorials-mobile',
  standalone: true,
  providers: [TutorialService, AppMetricsService],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TruncatePipe,
  ],
  templateUrl: './tutorials-mobile.component.html',
  styleUrls: ['./tutorials-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TutorialsMobileComponent extends TutorialsComponent {
  readonly activeSheet = signal<TutorialSheet>(null);
  readonly visibleVideoLimit = signal(12);

  readonly activeFilterCount = computed(() => {
    return (this.searchQuery() ? 1 : 0)
      + (this.selectedCategory() !== 'all' ? 1 : 0)
      + (this.selectedDifficulty() !== 'all' ? 1 : 0);
  });

  readonly primaryVideo = computed(() => {
    return this.featuredVideos()[0] || this.allVideos()[0] || null;
  });

  readonly mobileVideos = computed(() => this.filteredVideos().slice(0, this.visibleVideoLimit()));

  readonly hasMoreVideos = computed(() => this.filteredVideos().length > this.visibleVideoLimit());

  readonly sectionSummary = computed(() => {
    return this.filteredSections().map(section => ({
      title: section.title,
      icon: section.icon,
      count: section.videos.length,
    }));
  });

  openSheet(sheet: TutorialSheet): void {
    this.activeSheet.set(sheet);
  }

  closeSheet(): void {
    this.activeSheet.set(null);
  }

  setCategory(categoryId: string): void {
    this.selectedCategory.set(categoryId);
    this.visibleVideoLimit.set(12);
  }

  setDifficulty(difficultyId: string): void {
    this.selectedDifficulty.set(difficultyId);
    this.visibleVideoLimit.set(12);
  }

  updateSearch(value: string): void {
    this.searchQuery.set(value);
    this.visibleVideoLimit.set(12);
  }

  loadMoreVideos(): void {
    this.visibleVideoLimit.update(limit => limit + 12);
  }

  clearRecentlyWatched(): void {
    this.recentlyWatched.set([]);
    localStorage.removeItem('recentlyWatched');
  }

  override clearFilters(): void {
    super.clearFilters();
    this.visibleVideoLimit.set(12);
    this.closeSheet();
  }

  trackVideo(index: number, video: VideoItem): string {
    return video.id || String(index);
  }

  trackCategory(index: number, category: { id: string }): string {
    return category.id || String(index);
  }

  trackSection(index: number, section: { title: string }): string {
    return section.title || String(index);
  }
}
