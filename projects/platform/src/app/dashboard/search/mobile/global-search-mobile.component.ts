import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PageEvent } from '@angular/material/paginator';
import { GlobalSearchResult } from '../global-search.model';
import { GlobalSearchPageComponent } from '../global-search-page.component';

@Component({
  selector: 'app-global-search-mobile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './global-search-mobile.component.html',
  styleUrls: ['./global-search-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalSearchMobileComponent extends GlobalSearchPageComponent {
  readonly filtersOpen = signal(false);

  readonly activeFilterCount = computed(() => {
    let count = 0;
    if (this.selectedType() !== 'all') count += 1;
    if (this.selectedUserType() !== 'all') count += 1;
    if (this.selectedStatus() !== 'all') count += 1;
    if (this.regionControl.value.trim()) count += 1;
    return count;
  });

  readonly summaryLabel = computed(() => {
    const total = this.pagination().total;
    if (!this.query() && !this.activeFilterCount()) return 'Search your workspace';
    return `${total} result${total === 1 ? '' : 's'} found`;
  });

  readonly visibleResults = computed<GlobalSearchResult[]>(() => this.results());

  openFilters(): void {
    this.filtersOpen.set(true);
  }

  closeFilters(): void {
    this.filtersOpen.set(false);
  }

  clearFiltersAndClose(): void {
    this.clearFilters();
    this.filtersOpen.set(false);
  }

  goToPreviousPage(): void {
    const page = this.pagination().page;
    if (page <= 1) return;
    this.handleMobilePage(page - 1);
  }

  goToNextPage(): void {
    const pagination = this.pagination();
    if (pagination.page >= pagination.totalPages) return;
    this.handleMobilePage(pagination.page + 1);
  }

  private handleMobilePage(page: number): void {
    const event: PageEvent = {
      pageIndex: page - 1,
      pageSize: this.pagination().limit,
      length: this.pagination().total,
      previousPageIndex: this.pagination().page - 1,
    };
    this.handlePageChange(event);
  }
}
