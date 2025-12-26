// models/store-promotion.model.ts

export interface CreateStoreRequest {
  name: string;
  description: string;
  category: string;
  whatsappNumber: string;
  logo?: File;
  settings?: Partial<StoreSettings>;
  userId: string;
}

export interface UpdateStoreRequest {
  name?: string;
  description?: string;
  category?: string;
  whatsappNumber?: string;
  logo?: File;
  settings?: Partial<StoreSettings>;
  status?: 'active' | 'inactive' | 'suspended';
}


export interface StoreSettings {
  notifications: {
    lowStock: boolean;
    newOrder: boolean;
    promotionEnding: boolean;
    weeklyReport: boolean;
  };
  inventory: {
    lowStockThreshold: number;
    autoArchiveOutOfStock: boolean;
    restockNotifications: boolean;
  };
  promotions: {
    autoApprovePromoters: boolean;
    minPromoterRating: number;
    defaultCommission: number;
  };
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    primaryColor: string;
    logoPosition: 'left' | 'center';
  };
  privacy: {
    showSalesData: boolean;
    allowPromoterContact: boolean;
    publicStore: boolean;
  };
}

export interface StorePromotion {
  _id?: string;
  store: string;
  title: string;
  description: string;
  type: 'product' | 'category' | 'store_wide';
  targetProducts: string[];
  targetCategory?: string;
  budget: number;
  payoutPerPromotion: number;
  maxPromoters: number;
  requirements: string[];
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  analytics: PromotionAnalytics;
  settings: PromotionSettings;
}

export interface PromotionAnalytics {
  totalViews: number;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  totalSpent: number;
  totalRevenue: number;
  roi: number;
  promoterPerformance: PromotionPromoterPerformance[];
}

export interface PromotionPromoterPerformance {
  promoterId: string;
  promoterName: string;
  clicks: number;
  conversions: number;
  commission: number;
  conversionRate: number;
  status: 'active' | 'completed' | 'cancelled';
}

export interface PromotionSettings {
  autoApprove: boolean;
  minPromoterRating: number;
  targetAudience: TargetAudience;
  tracking: PromotionTracking;
}

export interface TargetAudience {
  locations: string[];
  interests: string[];
  ageRange?: {
    min: number;
    max: number;
  };
  gender?: 'male' | 'female' | 'any';
}

export interface PromotionTracking {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  customParameters: { [key: string]: string };
}