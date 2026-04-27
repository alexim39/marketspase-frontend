// stores-filter-sidebar.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

interface FilterState {
  searchQuery: string;
  selectedCategories: string[];
  selectedVerificationTiers: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  minProducts: number;
}

@Component({
  selector: 'app-stores-filter-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './stores-filter-sidebar.component.html',
  styleUrls: ['./stores-filter-sidebar.component.scss']
})
export class StoresFilterSidebarComponent {
  @Input() categories: Array<{ name: string; count: number }> = [];
  @Input() verificationTiers: Array<{ name: string; count: number }> = [];
  @Input() currentFilters!: FilterState;
  @Output() filterChange = new EventEmitter<Partial<FilterState>>();
  @Output() clearFilters = new EventEmitter<void>();

  sortOptions = [
    { label: 'Latest', value: 'createdAt' },
    { label: 'Name', value: 'name' },
    { label: 'Products', value: 'productCount' },
    { label: 'Popularity', value: 'totalViews' }
  ];

  isCategorySelected(category: string): boolean {
    return this.currentFilters.selectedCategories.includes(category);
  }

  isTierSelected(tier: string): boolean {
    return this.currentFilters.selectedVerificationTiers.includes(tier);
  }

  toggleCategory(category: string): void {
    const selected = [...this.currentFilters.selectedCategories];
    const index = selected.indexOf(category);
    if (index > -1) {
      selected.splice(index, 1);
    } else {
      selected.push(category);
    }
    this.filterChange.emit({ selectedCategories: selected });
  }

  toggleTier(tier: string): void {
    const selected = [...this.currentFilters.selectedVerificationTiers];
    const index = selected.indexOf(tier);
    if (index > -1) {
      selected.splice(index, 1);
    } else {
      selected.push(tier);
    }
    this.filterChange.emit({ selectedVerificationTiers: selected });
  }

  updateSort(sortBy: string): void {
    let sortOrder = 'desc';
    if (this.currentFilters.sortBy === sortBy) {
      sortOrder = this.currentFilters.sortOrder === 'asc' ? 'desc' : 'asc';
    }
    this.filterChange.emit({ sortBy: sortBy as any, sortOrder: sortOrder as any });
  }

  updateMinProducts(value: number): void {
    this.filterChange.emit({ minProducts: value });
  }

  clearAll(): void {
    this.clearFilters.emit();
  }
}