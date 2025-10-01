import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

interface FilterOptions {
  status: string;
  category: string;
  campaignType: string;
  dateRange: { start: Date | null; end: Date | null };
  budgetRange: { min: number; max: number };
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface StatusOption {
  value: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-campaign-filters',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './campaign-filters.component.html',
  styleUrls: ['./campaign-filters.component.scss']
})
export class CampaignFiltersComponent {
  @Input() statusOptions: StatusOption[] = [];
  @Input() currentFilter!: FilterOptions;
  @Input() campaignCounts: Record<string, number> = {};
  @Input() searchControl!: FormControl;
  @Input() currentView: 'grid' | 'list' = 'grid';
  @Input() hasActiveFilters = false;
  @Input() filteredCount = 0;
  @Input() totalCount = 0;
  
  @Output() filterChange = new EventEmitter<Partial<FilterOptions>>();
  @Output() viewChange = new EventEmitter<'grid' | 'list'>();
  @Output() clearFilters = new EventEmitter<void>();

  onStatusFilter(status: string): void {
    this.filterChange.emit({ status });
  }

  onViewChange(view: 'grid' | 'list'): void {
    this.viewChange.emit(view);
  }

  onClearFilters(): void {
    this.clearFilters.emit();
  }

  getCount(status: string): number {
    return this.campaignCounts[status] || 0;
  }
}