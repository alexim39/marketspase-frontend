export interface StoreOwner {
  _id: string;
  name?: string;
  email?: string;
  avatar?: string;
  role: string;
  isVerified: boolean;
}

export interface StoreAnalytics {
  totalViews: number;
  totalSales: number;
  conversionRate: number;
  promoterTraffic: number;
  dailyViews?: Array<{
    date: Date;
    views: number;
    uniqueVisitors: number;
    promoterTraffic: number;
  }>;
  salesData?: {
    totalRevenue: number;
    promoterDrivenSales: number;
    conversionRate: number;
    topProducts: Array<{
      product: any;
      sales: number;
      revenue: number;
    }>;
  };
  promoterPerformance?: Array<{
    promoter: any;
    clicks: number;
    conversions: number;
    commissionEarned: number;
  }>;
}

export interface WhatsAppIntegration {
  templates: Array<{
    name: string;
    message: string;
    variables: string[];
    isActive: boolean;
  }>;
  quickReplies: string[];
  autoResponses: Array<{
    trigger: string;
    response: string;
  }>;
}

export interface Store {
  _id: string;
  owner: StoreOwner;
  name: string;
  description?: string;
  logo?: string;
  category?: string;
  isVerified: boolean;
  isActive: boolean;
  isDefaultStore: boolean;
  verificationTier: 'basic' | 'premium';
  storeLink: string;
  
  analytics: StoreAnalytics;
  
  activeCampaigns?: string[];
  storeProducts?: string[];
  
  whatsappNumber?: string;
  whatsappTemplates?: string[];
  whatsAppIntegration?: WhatsAppIntegration;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface StoreFilterOptions {
  search?: string;
  verification?: 'all' | 'verified' | 'unverified' | 'premium';
  category?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}