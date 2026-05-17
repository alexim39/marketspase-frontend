import { PromotionInterface } from "../public-api";
import { CampaignInterface } from "./campaign.interface";

export interface UserInterface {
  _id: string;
  uid: string;
  status: boolean;
  displayName: string;
  email: string;
  username: string;
  biography?: string;
  role: 'marketer' | 'promoter' | 'marketing_rep' | 'admin' | undefined;
  type: 'user' | 'admin' |  'moderator' | undefined;
  avatar?: string;
  createdAt?: Date;
  preferences?: {
    notification?: boolean;
    locationBasedAds?: boolean;
    categoryBasedAds?: boolean;
    adCategories?: string[];
    financial?: {
      displayCurrency?: string;
    };
    theme?: {
      darkMode?: boolean;
      systemDefault?: boolean;
      highContrast?: boolean;
    };
  };
  darkMode?: boolean;
  testimonial?: {
    message?: string;
  };
  dob?: Date;
  isActive?: boolean;
  verified?: boolean;
  isDeleted?: boolean;
  rating: number;
  ratingCount: number;
  authenticationMethod: string;
  updatedAt?: Date;
  personalInfo: {
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
    }
    email: string;
    phone: string;
    phoneDetails: {
      countryCode: string,
      nationalNumber: string,
      fullNumber: string,
      iso2: string, // Country ISO code (e.g., "US", "NG")
      lastUpdated: Date
    },
    dob: Date;
    biography: string;
    gender: string;
  };
  professionalInfo?: {
    skills?: string[];
    jobTitle: string;
    profileHeadline?: string;
    businessProfile?: {
      brandName?: string;
      brandSummary?: string;
      uniqueSellingPoints?: string[];
    };
    socialProfiles?: {
      website?: string;
      instagram?: string;
      tiktok?: string;
      facebook?: string;
      x?: string;
      youtube?: string;
      linkedin?: string;
    };
    experience: {
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
  interests?: {
    hobbies?: string[];
    favoriteTopics?: string[];
  };
  savedAccounts?: {
    _id: string;
    bank: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
  }[];
  wallets?: {
    marketer: {
      balance: number;
      reserved: number;
      currency: string;
      baseCurrency?: string;
      balancesByCurrency?: Record<string, number>;
      reservedByCurrency?: Record<string, number>;
     transactions: {
        _id: string;
        amount?: number;
        baseAmount?: number;
        settlementAmount?: number;
        category?: string;
        createdAt: Date;
        currency?: string;
        baseCurrency?: string;
        settlementCurrency?: string;
        exchangeRate?: number;
        description?: string;
        status?: string;
        type?: string;
        isDefault?: boolean;
        bankDetails?: {
          bank?: string;
          accountNumber?: string;
          accountName?: string;
          bankCode?: string;
          isDefault?: boolean;
        };
      }[];
    };
    promoter: {
      balance: number;
      reserved: number;
      currency: string;
      baseCurrency?: string;
      balancesByCurrency?: Record<string, number>;
      reservedByCurrency?: Record<string, number>;
      transactions: {
        _id: string;
        amount?: number;
        baseAmount?: number;
        settlementAmount?: number;
        category?: string;
        createdAt: Date;
        currency?: string;
        baseCurrency?: string;
        settlementCurrency?: string;
        exchangeRate?: number;
        description?: string;
        status?: string;
        type?: string;
        isDefault?: boolean;
        bankDetails?: {
          bank?: string;
          accountNumber?: string;
          accountName?: string;
          bankCode?: string;
          isDefault?: boolean;
        };
      }[];
    };

    //ratingCount: number;
   
  };
  campaigns?: [CampaignInterface];
  promotion?: [PromotionInterface];


  testimonials: {
    message: string;
    createdAt: Date;
    _id: string;
    rating: number;
    status: string;
    isFeatured: boolean;
  }[];

  isMarketingRep: boolean;

  loginStreak?: {
    currentStreak: number;
    longestStreak: number;
    lastQualifiedDateKey?: string | null;
    lastQualifiedAt?: Date | null;
    rewardCycleDayCount: number;
    pendingCyclePoints: number;
    withdrawablePoints: number;
    totalPointsEarned: number;
    totalPointsWithdrawn: number;
    totalNairaWithdrawn: number;
    lastRewardPoints: number;
    lastRewardDateKey?: string | null;
    lastWithdrawalAt?: Date | null;
  };

  badgeProfile?: {
    level: number;
    levelTitle: string;
    experiencePoints: number;
    badgesEarned: number;
    lastBadgeUnlockedAt?: Date | null;
    lastBadgeKey?: string | null;
    lastEvaluatedAt?: Date | null;
  };

  gamificationProfile?: {
    totalExperiencePoints: number;
    currentLevel: number;
    currentLevelTitle: string;
    currentLevelMinExperiencePoints: number;
    nextLevel?: number | null;
    nextLevelTitle?: string | null;
    nextLevelMinExperiencePoints?: number | null;
    experiencePointsToNextLevel: number;
    progressPercent: number;
    totalEvents: number;
    milestonesUnlocked: number;
    badgesUnlocked: number;
    lastActionKey?: string | null;
    lastExperiencePointsAwarded: number;
    lastEventAt?: Date | null;
    recentLevelUpAt?: Date | null;
    highestLevelReachedAt?: Date | null;
    lastMilestoneKey?: string | null;
    lastMilestoneUnlockedAt?: Date | null;
    lastCalculatedAt?: Date | null;
  };

  fraudProfile?: {
    trustScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical' | string;
    warningCount: number;
    strikeCount: number;
    activeCaseCount: number;
    lastFlaggedAt?: Date | string | null;
    lastWarningAt?: Date | string | null;
    lastFinalWarningAt?: Date | string | null;
    suspendedUntil?: Date | string | null;
    suspensionReason?: string;
    latestCase?: string | null;
  };

  activityLog?: Array<{
    _id?: string;
    action: string;
    description: string;
    resourceType?: string;
    resourceId?: string;
    metadata?: Record<string, any>;
    severity?: 'info' | 'warning' | 'critical' | string;
    timestamp: Date | string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  }>;
}
