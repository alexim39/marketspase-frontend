
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


export interface PromotionInterface {
  _id: string;
  status: 'accepted' | 'submitted' | 'validated' | 'paid' | 'rejected' | 'downloaded';
  payoutModel?: 'pay_per_click' | 'pay_per_view' | string;
  costPerClick?: number;
  payoutAmount?: number;
  payoutSnapshot?: {
    model?: string;
    unitCost?: number;
    budgetAtAcceptance?: number;
    acceptedAt?: Date | string;
  };
  submittedAt?: Date;
  validatedAt?: Date;
  paidAt?: Date;
  proofMedia: string[];
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
  isDownloaded: boolean;


  // check
  activityLog: any;
  targetAudience: any;
}
