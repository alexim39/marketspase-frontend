// components/products-filters/products-filters.component.ts
import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ViewMode, DateRange } from '../../promoted-products.component';

@Component({
  selector: 'app-products-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTooltipModule],
  templateUrl: './products-filters.component.html',
  styleUrls: ['./products-filters.component.scss']
})
export class ProductsFiltersComponent {
  searchQuery = input<string>('');
  selectedPerformanceFilter = input<string>('all');
  selectedDateRange = input<DateRange>('week');
  viewMode = input<ViewMode>('grid');
  hasActiveFilters = input<boolean>(false);

  searchChange = output<string>();
  performanceFilterChange = output<string>();
  dateRangeChange = output<DateRange>();
  viewModeChange = output<ViewMode>();
  clearFilters = output<void>();

  onSearchChange(value: string): void {
    this.searchChange.emit(value);
  }

  onPerformanceFilterChange(value: string): void {
    this.performanceFilterChange.emit(value);
  }

  onDateRangeChange(value: DateRange): void {
    this.dateRangeChange.emit(value);
  }

  setViewMode(mode: ViewMode): void {
    this.viewModeChange.emit(mode);
  }

  onClearFilters(): void {
    this.clearFilters.emit();
  }
}