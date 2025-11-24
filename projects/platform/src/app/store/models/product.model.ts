// models/product.model.ts
export interface Product {
  _id?: string;
  store: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  quantity: number;
  category: string;
  tags: string[];
  promoterTracking: PromoterTracking;
  lowStockAlert: number;
  isActive: boolean;
  isFeatured: boolean;
  seo: ProductSEO;
  variants?: ProductVariant[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PromoterTracking {
  uniqueId: string;
  viewCount: number;
  clickCount: number;
  conversionCount: number;
  lastPromoted?: Date;
  totalCommissionPaid: number;
}

export interface ProductSEO {
  title: string;
  description: string;
  keywords: string[];
  slug: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  options: VariantOption[];
  priceAdjustment: number;
}

export interface VariantOption {
  id: string;
  name: string;
  value: string;
  price?: number;
  quantity: number;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: File[];
  quantity: number;
  category: string;
  tags: string[];
  lowStockAlert: number;
  isFeatured: boolean;
  seo?: Partial<ProductSEO>;
  variants?: ProductVariant[];
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  originalPrice?: number;
  images?: File[];
  quantity?: number;
  category?: string;
  tags?: string[];
  lowStockAlert?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  seo?: Partial<ProductSEO>;
  variants?: ProductVariant[];
}

export interface ProductStats {
  totalViews: number;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  totalRevenue: number;
  promoterPerformance: ProductPromoterPerformance[];
}

export interface ProductPromoterPerformance {
  promoterId: string;
  promoterName: string;
  clicks: number;
  conversions: number;
  commission: number;
  conversionRate: number;
}