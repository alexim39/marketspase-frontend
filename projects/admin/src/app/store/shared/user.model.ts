export interface User {
  _id: string;
  uid: string;
  username: string;
  displayName: string;
  name?: string;
  email?: string;
  password?: string;
  authenticationMethod: 'local' | 'google.com' | 'facebook.com' | 'twitter.com';
  role: 'marketer' | 'promoter' | 'admin' | 'marketing_rep';
  isMarketingRep: boolean;
  avatar?: string;
  
  // Wallets
  wallets?: {
    marketer?: {
      currency: string;
      balance: number;
      reserved: number;
      transactions: any[];
    };
    promoter?: {
      currency: string;
      balance: number;
      reserved: number;
      transactions: any[];
    };
  };
  
  // Personal info
  personalInfo?: {
    address?: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
    };
    phone?: string;
    dob?: Date;
    biography?: string;
    gender?: string;
  };
  
  professionalInfo?: {
    skills?: string[];
    jobTitle?: string;
    experience?: {
      company: string;
      startDate: Date;
      endDate: Date;
      description: string;
      current: boolean;
    };
    education?: {
      institution: string;
      certificate: string;
      fieldOfStudy: string;
      startDate: Date;
      endDate: Date;
      description: string;
    };
  };
  
  // Status flags
  isActive: boolean;
  isVerified: boolean;
  isDeleted: boolean;
  
  // Verification
  verificationTier?: 'basic' | 'premium';
  
  // Dates
  createdAt: Date;
  updatedAt: Date;
}

export interface UserFilterOptions {
  search?: string;
  role?: User['role'];
  isActive?: boolean;
  isVerified?: boolean;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  marketers: number;
  promoters: number;
  admins: number;
  averageRating: number;
}