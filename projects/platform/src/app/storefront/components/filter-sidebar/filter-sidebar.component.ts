// components/filter-sidebar/filter-sidebar.component.ts
import { Component, Input, Output, EventEmitter, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSliderModule } from '@angular/material/slider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';

export interface Category {
  category: string;
  count: number;
}

export interface Brand {
  brand: string;
  count: number;
}

export interface Tag {
  tag: string;
  count: number;
}

@Component({
  selector: 'app-filter-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatSliderModule,
    MatCheckboxModule,
    MatRadioModule,
    MatExpansionModule,
    MatChipsModule
  ],
  templateUrl: './filter-sidebar.component.html',
  styleUrls: ['./filter-sidebar.component.scss']
})
export class FilterSidebarComponent implements OnInit {
  @Input() show: boolean = false;
  @Input() categories: Category[] = [];
  @Input() brands: Brand[] = [];
  @Input() tags: Tag[] = [];
  @Input() priceRange: [number, number] = [0, 1000];
  @Input() minPrice: number = 0;
  @Input() maxPrice: number = 1000;
  @Input() availability: 'all' | 'in-stock' | 'out-of-stock' = 'all';
  @Input() ratingFilter: number = 0;
  @Input() selectedTags: string[] = [];
  @Input() selectedBrands: string[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() priceRangeChange = new EventEmitter<[number, number]>();
  @Output() availabilityChange = new EventEmitter<'all' | 'in-stock' | 'out-of-stock'>();
  @Output() ratingFilterChange = new EventEmitter<number>();
  @Output() tagToggle = new EventEmitter<string>();
  @Output() brandToggle = new EventEmitter<string>();
  @Output() clearAll = new EventEmitter<void>();

  // Local signals for form controls
  localPriceRange = signal<[number, number]>([0, 1000]);
  localAvailability = signal<'all' | 'in-stock' | 'out-of-stock'>('all');
  localRatingFilter = signal<number>(0);
  localSelectedTags = signal<string[]>([]);
  localSelectedBrands = signal<string[]>([]);

  // Computed values
  formattedPriceRange = computed(() => {
    const [min, max] = this.localPriceRange();
    return `$${min} - $${max}`;
  });

  hasActiveFilters = computed(() => {
    const [min, max] = this.localPriceRange();
    return (
      min !== this.minPrice ||
      max !== this.maxPrice ||
      this.localAvailability() !== 'all' ||
      this.localRatingFilter() > 0 ||
      this.localSelectedTags().length > 0 ||
      this.localSelectedBrands().length > 0
    );
  });

  // Rating options
  ratingOptions = [
    { value: 4.5, label: '4.5 & up', count: 0 },
    { value: 4, label: '4 & up', count: 0 },
    { value: 3.5, label: '3.5 & up', count: 0 },
    { value: 3, label: '3 & up', count: 0 }
  ];

  ngOnInit(): void {
    // Initialize local signals with input values
    this.localPriceRange.set(this.priceRange);
    this.localAvailability.set(this.availability);
    this.localRatingFilter.set(this.ratingFilter);
    this.localSelectedTags.set([...this.selectedTags]);
    this.localSelectedBrands.set([...this.selectedBrands]);
  }

  // Price Range Handlers
  onPriceRangeChange(event: any): void {
    this.localPriceRange.set([event.value, event.highValue]);
  }

  onPriceRangeInputChange(): void {
    this.priceRangeChange.emit(this.localPriceRange());
  }

  // Availability Handlers
  onAvailabilityChange(value: 'all' | 'in-stock' | 'out-of-stock'): void {
    this.localAvailability.set(value);
    this.availabilityChange.emit(value);
  }

  // Rating Handlers
  onRatingChange(rating: number): void {
    this.localRatingFilter.set(rating);
    this.ratingFilterChange.emit(rating);
  }

  // Tag Handlers
  onTagToggle(tag: string): void {
    const current = this.localSelectedTags();
    if (current.includes(tag)) {
      this.localSelectedTags.set(current.filter(t => t !== tag));
    } else {
      this.localSelectedTags.set([...current, tag]);
    }
    this.tagToggle.emit(tag);
  }

  removeTag(tag: string): void {
    this.localSelectedTags.set(
      this.localSelectedTags().filter(t => t !== tag)
    );
    this.tagToggle.emit(tag);
  }

  // Brand Handlers
  onBrandToggle(brand: string): void {
    const current = this.localSelectedBrands();
    if (current.includes(brand)) {
      this.localSelectedBrands.set(current.filter(b => b !== brand));
    } else {
      this.localSelectedBrands.set([...current, brand]);
    }
    this.brandToggle.emit(brand);
  }

  removeBrand(brand: string): void {
    this.localSelectedBrands.set(
      this.localSelectedBrands().filter(b => b !== brand)
    );
    this.brandToggle.emit(brand);
  }

  // Category Handlers
  onCategorySelect(category: string): void {
    // Emit to parent if needed
  }

  // Clear Handlers
  clearPriceFilter(): void {
    this.localPriceRange.set([this.minPrice, this.maxPrice]);
    this.priceRangeChange.emit([this.minPrice, this.maxPrice]);
  }

  clearAvailabilityFilter(): void {
    this.localAvailability.set('all');
    this.availabilityChange.emit('all');
  }

  clearRatingFilter(): void {
    this.localRatingFilter.set(0);
    this.ratingFilterChange.emit(0);
  }

  clearTagsFilter(): void {
    this.localSelectedTags.set([]);
    // Emit toggle for each tag to update parent
    this.selectedTags.forEach(tag => this.tagToggle.emit(tag));
  }

  clearBrandsFilter(): void {
    this.localSelectedBrands.set([]);
    // Emit toggle for each brand to update parent
    this.selectedBrands.forEach(brand => this.brandToggle.emit(brand));
  }

  clearAllFilters(): void {
    this.localPriceRange.set([this.minPrice, this.maxPrice]);
    this.localAvailability.set('all');
    this.localRatingFilter.set(0);
    this.localSelectedTags.set([]);
    this.localSelectedBrands.set([]);
    
    this.clearAll.emit();
  }

  // Apply filters (optional - for mobile)
  applyFilters(): void {
    // Update parent with all current values
    this.priceRangeChange.emit(this.localPriceRange());
    this.availabilityChange.emit(this.localAvailability());
    this.ratingFilterChange.emit(this.localRatingFilter());
    
    this.close.emit();
  }

  // Close sidebar
  onClose(): void {
    this.close.emit();
  }

  formatLabel(value: number): string {
    return `$${value}`;
  }

  onMinPriceChange(event: any): void {
    const [_, max] = this.localPriceRange();
    this.localPriceRange.set([event.target.value, max]);
    this.priceRangeChange.emit(this.localPriceRange());
  }

  onMaxPriceChange(event: any): void {
    const [min, _] = this.localPriceRange();
    this.localPriceRange.set([min, event.target.value]);
    this.priceRangeChange.emit(this.localPriceRange());
  }

  calculateFilteredCount() {
  }

  // Prevent click propagation
  onSidebarClick(event: MouseEvent): void {
    event.stopPropagation();
  }
}