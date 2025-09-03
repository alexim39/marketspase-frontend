
import { CampaignInterface } from "./campaign.interface";

// export interface PromotionInterface {
//   _id: string;
//   status: 'pending' | 'submitted' | 'validated' | 'paid' | 'rejected';
//   payoutAmount?: number;
//   campaign: CampaignInterface
//   // Other properties that might exist based on the service response
//   // but aren't explicitly used in this component
// }

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
  // campaign: {
  //   _id: string;
  //   title: string;
  //   mediaUrl: string;
  //   caption: string;
  //   link?: string;
  //   category: string;
  //   mediaType: string;
  //   payoutPerPromotion: number;
  //   minViewsPerPromotion: number;
  //   startDate: Date;
  //   endDate: Date;
  //   status: string;
  // };
  createdAt?: Date;
  updatedAt?: Date;
  promoter?: string | any
}