

export interface ProductFilter {
  categories: string[];
  priceRange: {
    min: number;
    max: number;
  };
  commissionRange: {
    min: number;
    max: number;
  };
  sortBy: 'commission' | 'popularity' | 'price' | 'newest' | 'name';
  sortDirection: 'asc' | 'desc';
  searchQuery: string;
}

export interface PromotionTracking {
  commissionRate: number;
  commissionType: 'percentage' | 'fixed';
  fixedCommission: number;
  isActive: boolean;
  isApproved: boolean;
  trackingCode: string;
  viewCount: number;
  clickCount: number;
  conversionCount: number;
  earnings: number;
  uniqueId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface ProductImage {
  url: string;
  altText: string;
  isMain: boolean;
  order: number;
  _id: string;
  id: string;
}