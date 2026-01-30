// models/promoter-product.model.ts
export interface PromoterProduct {
  _id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  images?: Array<{
    url: string;
    altText?: string;
    isMain?: boolean;
  }>;
  category: string;
  store: {
    _id: string;
    name: string;
    logo?: string;
    description?: string;
    verificationTier?: 'basic' | 'premium';
    storeLink?: string;
    isVerified?: boolean;
    rating?: number;
    reviewCount?: number;
    productCount?: number;
    createdAt: Date;
  };
  promotion: {
    commissionRate: number;
    commissionType: 'percentage' | 'fixed';
    fixedCommission?: number;
    isActive: boolean;
    trackingCode: string;
    views: number;
    clicks: number;
    conversions: number;
    earnings: number;
  };
  averageRating?: number;
  ratingCount?: number;
  purchaseCount?: number;
  createdAt: Date;
  tags?: string[];
  sku?: string;
  brand?: string;
  specifications?: { name: string; value: string }[];
  viewCount?: number;
  isActive?: boolean;
  quantity?: number;

}

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