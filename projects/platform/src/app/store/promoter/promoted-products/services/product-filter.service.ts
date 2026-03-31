// services/product-filter.service.ts
import { Injectable } from '@angular/core';
import { PromotedProduct, DateRange } from '../promoted-products.component';

@Injectable()
export class ProductFilterService {

  filterProducts(
    products: PromotedProduct[],
    searchQuery: string,
    performanceFilter: string,
    dateRange: DateRange
  ): PromotedProduct[] {
    let filtered = [...products];
    const query = searchQuery.toLowerCase();

    // Apply search filter
    if (query) {
      filtered = filtered.filter(p => 
        p.productName.toLowerCase().includes(query) ||
        p.uniqueCode.toLowerCase().includes(query)
      );
    }

    // Apply performance filter
    if (performanceFilter !== 'all') {
      filtered = filtered.filter(p => p.performance === performanceFilter);
    }

    // Apply date range filter
    if (dateRange !== 'all') {
      const cutoff = this.getDateCutoff(dateRange);
      if (cutoff) {
        filtered = filtered.filter(p => new Date(p.lastActivityAt) >= cutoff);
      }
    }

    return filtered;
  }

  private getDateCutoff(range: DateRange): Date | null {
    const now = new Date();
    const rangeMap: Record<DateRange, number | null> = {
      today: 1,
      week: 7,
      month: 30,
      all: null
    };
    
    const daysAgo = rangeMap[range];
    if (daysAgo) {
      return new Date(now.setDate(now.getDate() - daysAgo));
    }
    return null;
  }
}