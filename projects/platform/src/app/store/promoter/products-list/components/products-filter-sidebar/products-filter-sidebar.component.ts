// components/products-filter-sidebar/products-filter-sidebar.component.ts
import { Component, Input, Output, EventEmitter, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSliderModule } from '@angular/material/slider';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { FilterState, SortBy } from '../../models/filter-state.model';

@Component({
  selector: 'app-products-filter-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatSliderModule
  ],
  templateUrl: './products-filter-sidebar.component.html',
  styleUrls: ['./products-filter-sidebar.component.scss']
})
export class ProductsFilterSidebarComponent implements OnInit, OnDestroy {
  @Input({ required: true }) categories!: string[];
  @Input({ required: true }) priceRange!: [number, number];
  @Input({ required: true }) commissionRange!: [number, number];
  
  @Output() filterChange = new EventEmitter<FilterState>();

  // Local state
  searchQuery = signal<string>('');
  selectedCategories = signal<string[]>([]);
  selectedPriceRange = signal<[number, number]>([0, 0]);
  selectedCommissionRange = signal<[number, number]>([0, 0]);
  sortBy = signal<SortBy>('commission');
  sortDirection = signal<'asc' | 'desc'>('desc');

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Initialize with provided ranges
    this.selectedPriceRange.set(this.priceRange);
    this.selectedCommissionRange.set(this.commissionRange);

    // Setup search debouncing
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.searchQuery.set(query);
      this.emitFilters();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.searchSubject.next(query);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.emitFilters();
  }

  toggleCategorySelection(checked: boolean, category: string): void {
    if (checked) {
      this.selectedCategories.update(categories => [...categories, category]);
    } else {
      this.selectedCategories.update(categories => categories.filter(c => c !== category));
    }
    this.emitFilters();
  }

  onPriceRangeChange(range: [number, number]): void {
    this.selectedPriceRange.set(range);
    this.emitFilters();
  }

  onCommissionRangeChange(range: [number, number]): void {
    this.selectedCommissionRange.set(range);
    this.emitFilters();
  }

  onSortChange(sortBy: SortBy): void {
    if (this.sortBy() === sortBy) {
      this.sortDirection.update(dir => dir === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(sortBy);
      this.sortDirection.set('desc');
    }
    this.emitFilters();
  }

  clearFilters(): void {
    this.selectedCategories.set([]);
    this.selectedPriceRange.set(this.priceRange);
    this.selectedCommissionRange.set(this.commissionRange);
    this.searchQuery.set('');
    this.sortBy.set('commission');
    this.sortDirection.set('desc');
    this.emitFilters();
  }

  private emitFilters(): void {
    this.filterChange.emit({
      searchQuery: this.searchQuery(),
      selectedCategories: this.selectedCategories(),
      selectedPriceRange: this.selectedPriceRange(),
      selectedCommissionRange: this.selectedCommissionRange(),
      sortBy: this.sortBy(),
      sortDirection: this.sortDirection()
    });
  }
}