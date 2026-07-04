import { PerformanceMetric } from "./performance-metric.model";
import { StoreSettings } from "./store-promotion.model";

// models/store.model.ts
export interface Store {
  _id?: string;
  owner: {
    _id: string;
    email: string;
    personalInfo: {
      phone: string;
    };
    displayName: string;
    avatar: string;
  };
  name: string;
  description: string;
  logo: string;
  category: string;
  type?: 'product' | 'service';
  subscriptionTier?: 'free' | 'basic' | 'pro';
  subscriptionExpiresAt?: string | Date;
  isVerified: boolean;
  verificationTier: 'basic' | 'premium';
  analytics: StoreAnalytics;
  whatsappNumber: string;
  whatsappTemplates: string[];
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
  settings?: StoreSettings;
  isActive: boolean;
  isDefaultStore: boolean;
  storeLink: string;
  followers: number;

  // Service store profile
  gallery?: GalleryItem[];
  certifications?: Certification[];
  businessHours?: BusinessHour[];
  serviceAreas?: string[];
  faqs?: FAQ[];

  coverImage?: string;
  serviceStats?: any;
  statistics?: any;
}

export interface GalleryItem {
  _id?: string;
  url: string;
  type: 'image' | 'video';
  caption?: string;
  serviceId?: string;
  createdAt?: Date;
}

export interface Certification {
  _id?: string;
  name: string;
  issuer?: string;
  year?: number;
  file?: string;
}

export interface BusinessHour {
  day: string;
  open?: string;
  close?: string;
  closed?: boolean;
}

export interface FAQ {
  _id?: string;
  question: string;
  answer: string;
}

export interface StoreAnalytics {
  totalViews: number;
  totalSales: number;
  conversionRate: number;
  promoterTraffic: number;
  rating: number;
  totalReviews?: number;
  dailyViews: DailyView[];
  salesData: SalesData;
  promoterPerformance: PromoterPerformance[];
  performanceMetrics: PerformanceMetric[];
}

export interface DailyView {
  date: Date;
  views: number;
  uniqueVisitors: number;
  promoterTraffic: number;
  sales: number;
  revenue: number;
}

export interface SalesData {
  totalRevenue: number;
  promoterDrivenSales: number;
  conversionRate: number;
  averageOrderValue: number;
  topProducts: TopProduct[];
  revenueByCategory: RevenueByCategory[];
}

export interface TopProduct {
  productId: string;
  name: string;
  sales: number;
  revenue: number;
  conversionRate: number;
  image?: string;
}

export interface RevenueByCategory {
  category: string;
  revenue: number;
  percentage: number;
}

export interface PromoterPerformance {
  promoterId: string;
  promoterName: string;
  clicks: number;
  conversions: number;
  commissionEarned: number;
  conversionRate: number;
  totalSales: number;
}

// export interface StoreSettings {
//   notifications: {
//     lowStock: boolean;
//     newOrder: boolean;
//     promotionEnding: boolean;
//     weeklyReport: boolean;
//   };
//   inventory: {
//     lowStockThreshold: number;
//     autoArchiveOutOfStock: boolean;
//     restockNotifications: boolean;
//   };
//   promotions: {
//     autoApprovePromoters: boolean;
//     minPromoterRating: number;
//     defaultCommission: number;
//   };
//   appearance: {
//     theme: 'light' | 'dark' | 'auto';
//     primaryColor: string;
//     logoPosition: 'left' | 'center';
//   };
// }

// export interface CreateStoreRequest {
//   name: string;
//   description: string;
//   category: string;
//   logo?: File;
//   whatsappNumber: string;
//   settings?: Partial<StoreSettings>;
// }

// export interface UpdateStoreRequest {
//   name?: string;
//   description?: string;
//   category?: string;
//   logo?: File;
//   whatsappNumber?: string;
//   settings?: Partial<StoreSettings>;
// }