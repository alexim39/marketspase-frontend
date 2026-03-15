export interface ProductDimensions {
  length?: string;
  width?: string;
  height?: string;
}

export interface ProductVariant {
  name: string;
  sku?: string;
  price: number;
  quantity: number;
}

export interface ProductAttribute {
  name: string;
  values: string[];
  visible: boolean;
  variation: boolean;
}

export interface ProductImage {
  url: string;
  altText?: string;
  isMain?: boolean;
  order?: number;
}

export interface ProductDigitalInfo {
  fileName?: string;
  downloadLimit?: number;
  downloadExpiry?: string;
}

export interface ProductResponse {
  _id?: string;
  name: string;
  description?: string;
  category: string;
  brand?: string;
  tags?: string[];

  price: number;
  originalPrice?: number;
  costPrice?: number;
  taxClass?: string;
  taxable?: boolean;

  sku?: string;
  quantity: number;
  lowStockAlert?: number;
  manageStock?: boolean;
  backorderAllowed?: boolean;
  soldIndividually?: boolean;

  requiresShipping?: boolean;
  weight?: string;
  dimensions?: ProductDimensions;
  shippingClass?: string;

  hasVariants?: boolean;
  attributes?: ProductAttribute[];
  variants?: ProductVariant[];

  isDigital?: boolean;
  digitalProduct?: ProductDigitalInfo;

  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };

  isFeatured?: boolean;
  isActive?: boolean;
  scheduledStart?: string;
  scheduledEnd?: string;

  images?: ProductImage[];
}



export interface Product {
  _id?: string;
  store: string; // Store ID
  name: string;
  description?: string;
  price: number;
  amountReceivable: number;
  currency: string;
  originalPrice?: number; // For discounts
  images: Array<{
    url: string;
    altText?: string;
    isMain: boolean;
    order: number;
    thumbnail?: string;
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
    unit: number;
  };
  costPrice?: number;
  taxRate?: number;
  specifications?: any;
  weightUnit?: 'kg' | 'lb' | 'g' | 'oz';
  returnRate?: number;
  reviews?: any[];

  
  
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

  manageStock?: boolean;
  ratingCount?: number;

  isPublished?: boolean;
  publishedAt?: Date;
  publishedBy?: string;
  promotionStartDate?: Date;
  promotionEndDate?: Date;

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
  _id: string;
  name: string;
  options: VariantOption[];
  priceAdjustment: number;

  price: number;
  sku?: string;
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