export interface Service {
  _id?: string;
  store: string;
  provider: string;
  name: string;
  description: string;
  category: string;
  pricingType: 'fixed' | 'hourly' | 'package' | 'quote';
  price?: number;
  hourlyRate?: number;
  packages?: ServicePackage[];
  acceptsQuotes?: boolean;
  media?: ServiceMedia[];
  portfolio?: { url: string; caption?: string; type?: string }[];
  deliveryTime?: string;
  includes?: string[];
  location?: { city?: string; state?: string; remote?: boolean };
  affiliate?: { commissionType: 'per_lead' | 'per_booking'; leadCommission?: number; bookingCommissionRate?: number };
  availability?: 'available' | 'busy' | 'away';
  slotsPerWeek?: number;
  filledSlots?: number;
  averageResponseTime?: number;
  responseCount?: number;
  averageRating?: number;
  ratingCount?: number;
  bookingCount?: number;
  inquiryCount?: number;
  subscriptionTier?: 'free' | 'basic' | 'pro';
  subscriptionExpiresAt?: string;
  inGracePeriod?: boolean;
  isActive?: boolean;
  isPublished?: boolean;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ServicePackage {
  name: string;
  price: number;
  description?: string;
  includes?: string[];
}

export interface ServiceMedia {
  url: string;
  type: 'image' | 'video';
  altText?: string;
  isMain?: boolean;
}
