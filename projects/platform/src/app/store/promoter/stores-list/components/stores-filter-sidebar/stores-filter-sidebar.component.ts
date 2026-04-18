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
  template: `
    <div class="filter-sidebar">
      <div class="filter-header">
        <h3>Filters</h3>
        <button class="clear-all" (click)="clearAll()">Clear All</button>
      </div>
      
      <!-- Sort By -->
      <div class="filter-section">
        <h4>Sort By</h4>
        <div class="sort-options">
          <button 
            *ngFor="let option of sortOptions"
            class="sort-btn"
            [class.active]="currentFilters.sortBy === option.value"
            (click)="updateSort(option.value)">
            {{ option.label }}
            <mat-icon *ngIf="currentFilters.sortBy === option.value" class="sort-icon">
              {{ currentFilters.sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
            </mat-icon>
          </button>
        </div>
      </div>
      
      <!-- Categories -->
      <div class="filter-section" *ngIf="categories.length > 0">
        <h4>Categories</h4>
        <div class="category-list">
          <label *ngFor="let category of categories" class="checkbox-label">
            <input 
              type="checkbox" 
              [value]="category.name"
              [checked]="isCategorySelected(category.name)"
              (change)="toggleCategory(category.name)">
            <span>{{ category.name | titlecase }}</span>
            <span class="count">({{ category.count }})</span>
          </label>
        </div>
      </div>
      
      <!-- Verification Tier -->
      <div class="filter-section" *ngIf="verificationTiers.length > 0">
        <h4>Store Tier</h4>
        <div class="tier-options">
          <label *ngFor="let tier of verificationTiers" class="checkbox-label">
            <input 
              type="checkbox" 
              [value]="tier.name"
              [checked]="isTierSelected(tier.name)"
              (change)="toggleTier(tier.name)">
            <span class="tier-badge" [class.premium]="tier.name === 'premium'">
              {{ tier.name | titlecase }}
            </span>
            <span class="count">({{ tier.count }})</span>
          </label>
        </div>
      </div>
      
      <!-- Minimum Products -->
      <div class="filter-section">
        <h4>Minimum Products</h4>
        <input 
          type="range" 
          [min]="0" 
          [max]="50" 
          [value]="currentFilters.minProducts"
          (input)="updateMinProducts($any($event.target).value)"
          class="slider">
        <div class="range-value">
          <span>0</span>
          <span>{{ currentFilters.minProducts }}+ products</span>
          <span>50+</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .filter-sidebar {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      
      .filter-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e5e7eb;
        
        h3 {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
        }
        
        .clear-all {
          background: none;
          border: none;
          color: #667eea;
          cursor: pointer;
          font-size: 0.875rem;
          
          &:hover {
            text-decoration: underline;
          }
        }
      }
      
      .filter-section {
        margin-bottom: 1.5rem;
        
        h4 {
          margin: 0 0 0.75rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #4b5563;
        }
      }
      
      .sort-options {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        
        .sort-btn {
          padding: 0.5rem 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          
          &:hover {
            background: #f9fafb;
          }
          
          &.active {
            background: #667eea;
            color: white;
            border-color: #667eea;
          }
          
          .sort-icon {
            font-size: 1rem;
            width: 1rem;
            height: 1rem;
          }
        }
      }
      
      .category-list, .tier-options {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-height: 250px;
        overflow-y: auto;
      }
      
      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        font-size: 0.875rem;
        
        input {
          cursor: pointer;
        }
        
        .count {
          color: #9ca3af;
          font-size: 0.75rem;
        }
        
        .tier-badge {
          padding: 0.125rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          
          &.premium {
            background: #fef3c7;
            color: #d97706;
          }
          
          &:not(.premium) {
            background: #e5e7eb;
            color: #4b5563;
          }
        }
      }
      
      .slider {
        width: 100%;
        margin: 0.5rem 0;
      }
      
      .range-value {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        color: #6b7280;
      }
    }
    
    @media (max-width: 768px) {
      .filter-sidebar {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 1000;
        border-radius: 12px 12px 0 0;
        max-height: 80vh;
        overflow-y: auto;
        transform: translateY(100%);
        transition: transform 0.3s ease;
        
        &.open {
          transform: translateY(0);
        }
      }
    }
  `]
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