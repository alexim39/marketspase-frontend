import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IntersectionObserverDirective } from '../../../../storefront/shared/directives/intersection-observer.directive';
import { NotificationCenterComponent } from '../notification-center.component';

@Component({
  selector: 'app-mobile-notification-center',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    IntersectionObserverDirective,
  ],
  templateUrl: './index.component.html',
  styleUrl: './index.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileNotificationCenterComponent extends NotificationCenterComponent {
  readonly filtersOpen = signal(false);
  readonly preferencesOpen = signal(false);

  readonly activeFilterCount = computed(() => {
    let count = 0;
    if (this.statusFilter() !== 'all') count += 1;
    if (this.categoryFilter() !== 'all') count += 1;
    if (this.priorityFilter() !== 'all') count += 1;
    if (this.searchTerm().trim()) count += 1;
    return count;
  });

  readonly activeFilterSummary = computed(() => {
    const parts: string[] = [];

    if (this.statusFilter() !== 'all') {
      parts.push(this.statusOptions.find((opt) => opt.key === this.statusFilter())?.label || 'Status');
    }

    if (this.categoryFilter() !== 'all') {
      parts.push(this.categoryLabel(this.categoryFilter()));
    }

    if (this.priorityFilter() !== 'all') {
      parts.push(this.priorityOptions.find((opt) => opt.key === this.priorityFilter())?.label || 'Priority');
    }

    if (this.searchTerm().trim()) {
      parts.push('Search');
    }

    return parts.length ? parts.join(' · ') : 'All notifications';
  });

  clearMobileFilters(): void {
    this.statusFilter.set('all');
    this.categoryFilter.set('all');
    this.priorityFilter.set('all');
    this.onSearchInput('');
  }

  closeSheets(): void {
    this.filtersOpen.set(false);
    this.preferencesOpen.set(false);
  }
}
