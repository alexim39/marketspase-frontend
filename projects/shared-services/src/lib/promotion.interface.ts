
import { CampaignInterface } from "./campaign.interface";
import { UserInterface } from "./user.interface";

export interface PromotionClickStats {
  totalClicks: number;
  billableClicks: number;
  invalidClicks: number;
  duplicateClicks: number;
  earnedAmount: number;
  lastClickAt?: Date | string;
}

export interface PromotionFraudStatus {
  isFlagged: boolean;
  reviewStatus: 'clear' | 'warning' | 'final_warning' | 'blocked' | 'resolved' | string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical' | string;
  reasonSummary?: string;
  reasons?: string[];
  warningCount?: number;
  firstFlaggedAt?: Date | string;
  lastFlaggedAt?: Date | string;
  blockedAt?: Date | string;
  lastCaseId?: string | null;
}

export interface PromotionInterface {
  _id: string;
  status: 'accepted' | 'paid' | 'rejected' | string;
  payoutModel?: 'pay_per_click' | string;
  costPerClick?: number;
  payoutAmount?: number;
  payoutSnapshot?: {
    model?: string;
    unitCost?: number;
    budgetAtAcceptance?: number;
      acceptedAt?: Date | string;
  };
  acceptedAt?: Date | string;
  downloadedAt?: Date | string;
  submittedAt?: Date;
  validatedAt?: Date;
  rejectedAt?: Date | string;
  paidAt?: Date;
  proofMedia?: string[];
  proofViews?: number;
  viewsAchieved?: number;
  campaign: CampaignInterface;
  promoter: UserInterface;
  createdAt: Date;
  updatedAt: Date;
  rejectionReason?: string;
  notes?: string;
  upi: string | number;
  promotionUrl?: string;
  destinationUrl?: string;
  isActive?: boolean;
  clickStats?: PromotionClickStats;
  fraudStatus?: PromotionFraudStatus;
  isDownloaded?: boolean;
  isExpired?: boolean;
  timeRemaining?: string;
  progressPercentage?: number;
  viewsNeeded?: number;


  // check
  activityLog: any;
  targetAudience: any;
}
