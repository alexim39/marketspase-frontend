// models/store.model.ts
export interface Store {
  _id?: string;
  owner: string;
  name: string;
  description: string;
  logo: string;
  category: string;
  isVerified: boolean;
  verificationTier: 'basic' | 'premium';
  analytics: StoreAnalytics;
  whatsappNumber: string;
  whatsappTemplates: string[];
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

export interface StoreAnalytics {
  totalViews: number;
  totalSales: number;
  conversionRate: number;
  promoterTraffic: number;
  dailyViews: DailyView[];
  salesData: SalesData;
  promoterPerformance: PromoterPerformance[];
}

export interface DailyView {
  date: Date;
  views: number;
  uniqueVisitors: number;
  promoterTraffic: number;
}

export interface SalesData {
  totalRevenue: number;
  promoterDrivenSales: number;
  conversionRate: number;
  topProducts: TopProduct[];
}

export interface TopProduct {
  productId: string;
  name: string;
  sales: number;
  revenue: number;
}

export interface PromoterPerformance {
  promoterId: string;
  promoterName: string;
  clicks: number;
  conversions: number;
  commissionEarned: number;
}

// models/product.model.ts
export interface Product {
  _id?: string;
  store: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  quantity: number;
  category: string;
  promoterTracking: PromoterTracking;
  lowStockAlert: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PromoterTracking {
  uniqueId: string;
  viewCount: number;
  clickCount: number;
  conversionCount: number;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  images: File[];
  quantity: number;
  category: string;
}