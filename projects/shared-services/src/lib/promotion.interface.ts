
import { CampaignInterface } from "./campaign.interface";


export interface PromotionInterface {
  _id: string;
  status: 'pending' | 'submitted' | 'validated' | 'paid' | 'rejected';
  payoutAmount?: number;
  submittedAt?: Date;
  validatedAt?: Date;
  paidAt?: Date;
  proofMedia?: string[];
  proofViews?: number;
  campaign: CampaignInterface;
  createdAt: Date;
  updatedAt: Date;
  promoter?: string | any

  //submissionDate: Date;
  //submissionEndDate: Date;
}