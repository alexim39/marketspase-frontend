import { Component, Input, Output, EventEmitter, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export type ViewMode = 'grid' | 'list';
export type FilterType = 'all' | 'active' | 'highPayout' | 'expiringSoon' | 'quickTasks';

@Component({
  selector: 'campaign-filters-mobile',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './campaign-filters-mobile.component.html',
  styleUrls: ['./campaign-filters-mobile.component.scss']
})
export class CampaignFiltersMobileComponent {

  @Input({ required: true }) searchTerm!: string;
  @Input({ required: true }) allCampaignsCount!: number;
  @Input({ required: true }) highPayoutCount!: number;
  @Input({ required: true }) expiringSoonCount!: number;
  @Input({ required: true }) quickTasksCount!: number;
  @Input() viewMode: ViewMode = 'grid';
  @Input() activeFilter: FilterType = 'all';

  @Output() searchTermChange = new EventEmitter<string>();
  @Output() viewModeChange = new EventEmitter<ViewMode>();
  @Output() filterChange = new EventEmitter<FilterType>();

  isSearchActive = true;
  isFiltersExpanded = false;
  screenWidth = 0;

  ngOnInit() {
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    this.screenWidth = window.innerWidth;
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode = mode;
    this.viewModeChange.emit(mode);
  }

  setFilter(filter: FilterType): void {
    this.activeFilter = filter;
    this.filterChange.emit(filter);
    this.collapseFilters();
  }

  toggleSearch(): void {
    this.isSearchActive = !this.isSearchActive;
    if (!this.isSearchActive) {
      this.searchTermChange.emit('');
    }
  }

  toggleFilters(): void {
    this.isFiltersExpanded = !this.isFiltersExpanded;
    if (this.isFiltersExpanded) {
      this.isSearchActive = true;
    }
  }

  collapseFilters(): void {
    this.isFiltersExpanded = false;
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTermChange.emit(value);
  }

  clearSearch(): void {
    this.searchTermChange.emit('');
    this.isSearchActive = false;
  }

  getFilterCount(filter: FilterType): number {
    switch (filter) {
      case 'all': return this.allCampaignsCount;
      case 'active': return this.allCampaignsCount;
      case 'highPayout': return this.highPayoutCount;
      case 'expiringSoon': return this.expiringSoonCount;
      case 'quickTasks': return this.quickTasksCount;
      default: return 0;
    }
  }

  getFilterLabel(filter: FilterType): string {
    switch (filter) {
      case 'all': return 'All';
      case 'highPayout': return 'High Payout';
      case 'expiringSoon': return 'Ending Soon';
      case 'quickTasks': return 'Quick Tasks';
      default: return '';
    }
  }

  getFilterIcon(filter: FilterType): string {
    switch (filter) {
      case 'all': return 'all_inclusive';
      case 'highPayout': return 'trending_up';
      case 'expiringSoon': return 'schedule';
      case 'quickTasks': return 'flash_on';
      default: return '';
    }
  }
}