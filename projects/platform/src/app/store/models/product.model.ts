
export interface Product {
  _id?: string;
  store: string; // Store ID
  name: string;
  description?: string;
  price: number;
  originalPrice?: number; // For discounts
  // images: string[];
  images: Array<{
    url: string;
    altText?: string;
    isMain: boolean;
    order: number;
  }>;
  quantity: number;
  category: string;
  tags?: string[];
  sku?: string;
  brand?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };

  
  
  // Promoter tracking
  promoterTracking: PromoterTracking;
  
  // Inventory management
  lowStockAlert: number;
  isActive: boolean;
  isFeatured?: boolean;
  isDigital?: boolean;
  hasVariants: boolean;

  viewCount: number;
  purchaseCount: number;
  averageRating: number;
  
  // SEO Fields
  seo: ProductSEO;
  
  // Variants
  variants?: ProductVariant[];
  attributes?: ProductAttribute[];
  
  // Shipping
  requiresShipping?: boolean;
  shippingClass?: string;
  
  // Tax
  taxable?: boolean;
  taxClass?: string;
  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PromoterTracking {
  promoter: string; // User ID
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

  price: number;
  sku: string;
  quantity: number;
  attributes: {
    [key: string]: string;
  };
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

export interface ProductAttribute {
  name: string;
  values: string[];
  visible: boolean;
  variation: boolean;
}