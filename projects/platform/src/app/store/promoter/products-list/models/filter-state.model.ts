// models/filter-state.model.ts
export type SortBy = 'commission' | 'popularity' | 'price' | 'newest' | 'name';
export type SortDirection = 'asc' | 'desc';
export type ViewMode = 'grid' | 'list';

export interface FilterState {
  searchQuery?: string;
  selectedCategories?: string[];
  selectedPriceRange?: [number, number];
  selectedCommissionRange?: [number, number];
  sortBy?: SortBy;
  sortDirection?: SortDirection;
  viewMode?: ViewMode;
  pageSize?: number;
  currentPage?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  total: number;
  totalPages: number;
  currentPage: number;
  filters: {
    categories: Array<{ name: string; count: number }>;
    priceRange: { minPrice: number; maxPrice: number; avgPrice: number };
    commissionRange: { minCommission: number; maxCommission: number; avgCommission: number };
  };
}