// store-controls.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-store-controls',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    ReactiveFormsModule
  ],
  templateUrl: './store-controls.component.html',
  styleUrls: ['./store-controls.component.scss']
})
export class StoreControlsComponent {
  @Input() viewMode: 'grid' | 'list' | 'compact' = 'grid';
  @Input() searchControl!: FormControl;
  @Input() sortControl!: FormControl;
  @Input() isScrolled = false;
  @Input() filteredProductsCount = 0;
  @Input() totalProductsCount = 0;
  @Input() activeFilters: {
    selectedCategory?: string | null;
    priceRange?: [number, number];
    minPrice?: number;
    maxPrice?: number;
    ratingFilter?: number;
    tagsFilter?: string[];
    brandFilter?: string[];
  } = {};
  
  @Output() viewModeChange = new EventEmitter<'grid' | 'list' | 'compact'>();
  @Output() clearFilters = new EventEmitter<void>();
  @Output() toggleFilterSidebar = new EventEmitter<void>();
  @Output() clearSearch = new EventEmitter<void>();
  @Output() setCategory = new EventEmitter<string | null>();
  @Output() priceRangeReset = new EventEmitter<void>();
  @Output() ratingFilterReset = new EventEmitter<void>();
  @Output() tagFilterRemove = new EventEmitter<string>();
  @Output() brandFilterRemove = new EventEmitter<string>();

  onViewModeChange(mode: 'grid' | 'list' | 'compact'): void {
    this.viewModeChange.emit(mode);
  }

  onToggleFilterSidebar(): void {
    this.toggleFilterSidebar.emit();
  }

  onClearSearch(): void {
    this.clearSearch.emit();
  }

  onSetCategoryNull(): void {
    this.setCategory.emit(null);
  }

  onPriceRangeReset(): void {
    this.priceRangeReset.emit();
  }

  onRatingFilterReset(): void {
    this.ratingFilterReset.emit();
  }

  onTagFilterRemove(tag: string): void {
    this.tagFilterRemove.emit(tag);
  }

  onBrandFilterRemove(brand: string): void {
    this.brandFilterRemove.emit(brand);
  }

  hasActiveFilters(): boolean | undefined {
    return (
      !!this.activeFilters.selectedCategory ||
      !!this.searchControl.value ||
      (this.activeFilters.priceRange && 
       this.activeFilters.minPrice !== undefined && 
       this.activeFilters.maxPrice !== undefined &&
       (this.activeFilters.priceRange[0] > this.activeFilters.minPrice || 
        this.activeFilters.priceRange[1] < this.activeFilters.maxPrice)) ||
      (this.activeFilters.ratingFilter && this.activeFilters.ratingFilter > 0) ||
      (this.activeFilters.tagsFilter && this.activeFilters.tagsFilter.length > 0) ||
      (this.activeFilters.brandFilter && this.activeFilters.brandFilter.length > 0)
    );
  }
}