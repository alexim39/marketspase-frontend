
import { CampaignInterface } from "./campaign.interface";
import { UserInterface } from "./user.interface";


export interface PromotionInterface {
  _id: string;
  status: 'accepted' | 'submitted' | 'validated' | 'paid' | 'rejected' | 'downloaded';
  payoutAmount?: number;
  submittedAt?: Date;
  validatedAt?: Date;
  paidAt?: Date;
  proofMedia: string[];
  proofViews?: number;
  campaign: CampaignInterface;
  promoter: UserInterface;
  createdAt: Date;
  updatedAt: Date;
  rejectionReason?: string;
  notes?: string;
  upi: number;
  isDownloaded: boolean;


  // check
  activityLog: any;
  targetAudience: any;
}