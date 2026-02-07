export type ProductStatus = 'draft' | 'active' | 'archived' | 'pending';
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'not_tracking';

export interface ProductImage {
  url: string;
  altText?: string;
  isMain: boolean;
  order: number;
}

export interface ProductVariant {
  _id?: string;
  name: string;
  sku?: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  attributes: Record<string, string>;
  isActive: boolean;
  lowStockAlert?: number;
}

export interface ProductAttribute {
  name: string;
  values: string[];
  visible: boolean;
  variation: boolean;
  order: number;
}

export interface ProductDimensions {
  length?: number;
  width?: number;
  height?: number;
  unit?: 'cm' | 'm' | 'in' | 'ft';
}

export interface DigitalProduct {
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  downloadLimit?: number;
  downloadExpiry?: number;
  downloadCount?: number;
}

export interface SEOData {
  title?: string;
  description?: string;
  keywords?: string[];
}

export interface Product {
  _id: string;
  store: string;
  name: string;
  slug?: string;
  description?: string;
  category: string;
  brand?: string;
  tags?: string[];
  
  // Pricing
  price: number;
  originalPrice?: number;
  costPrice?: number;
  
  // Inventory
  sku?: string;
  quantity: number;
  lowStockAlert: number;
  manageStock: boolean;
  backorderAllowed: boolean;
  soldIndividually: boolean;
  
  // Status
  status: ProductStatus;
  isActive: boolean;
  isFeatured: boolean;
  
  // Media
  images: ProductImage[];
  mainImage?: string;
  
  // Stock status (computed)
  stockStatus: StockStatus;
  isInStock: boolean;
  isLowStock: boolean;
  isOutOfStock: boolean;
  
  // Variants
  hasVariants: boolean;
  attributes?: ProductAttribute[];
  variants?: ProductVariant[];
  
  // Shipping
  requiresShipping: boolean;
  weight?: number;
  weightUnit?: 'kg' | 'g' | 'lb' | 'oz';
  dimensions?: ProductDimensions;
  shippingClass?: '' | 'fragile' | 'oversized' | 'refrigerated';
  
  // Tax
  taxable: boolean;
  taxClass?: 'standard' | 'reduced' | 'zero' | 'exempt';
  
  // Digital product
  isDigital: boolean;
  digitalProduct?: DigitalProduct;
  
  // Performance metrics
  viewCount: number;
  purchaseCount: number;
  averageRating: number;
  ratingCount: number;
  
  // SEO
  seo?: SEOData;
  
  // Scheduling
  scheduledStart?: Date;
  scheduledEnd?: Date;
  
  // Dates
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductFilterOptions {
  search?: string;
  category?: string;
  status?: ProductStatus | 'all';
  stockStatus?: StockStatus | 'all';
  minPrice?: number;
  maxPrice?: number;
  startDate?: Date;
  endDate?: Date;
  tags?: string[];
  isFeatured?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  outOfStock: number;
  lowStock: number;
  totalValue: number;
  averagePrice: number;
  topCategories: Array<{ category: string; count: number }>;
  recentProducts: Product[];
}

export interface BulkOperationResult {
  matchedCount: number;
  modifiedCount: number;
  deletedCount?: number;
}

export interface PriceUpdateData {
  type: 'fixed' | 'percentage';
  value: number;
  operation?: 'increase' | 'decrease' | 'set';
}

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  includeImages?: boolean;
  includeVariants?: boolean;
  includeSEO?: boolean;
}

// Helper types for form handling
export interface ProductFormData extends Omit<Product, '_id' | 'createdAt' | 'updatedAt' | 'stockStatus' | 'isInStock' | 'isLowStock' | 'isOutOfStock'> {
  _id?: string;
}

// Type guard for Product
export function isProduct(obj: any): obj is Product {
  return obj && typeof obj === 'object' && 'name' in obj && 'price' in obj;
}