/**
 * @file This file defines the `Campaign` interface for use in an Angular application.
 *
 * It represents the structure of a campaign object as returned from a backend API,
 * including details about its status, budget, and promotional activity.
 */

/**
 * Interface representing a single entry in the activity log of a campaign.
 * This is a nested interface used within the main Campaign interface.
 */
export interface ActivityLogItem {
  _id: string;
  action: string;
  details: string;
  timestamp: string;
}

/**
 * An enum to represent the possible statuses of a campaign.
 * Using an enum provides better type safety and code readability compared to a string.
 */
export enum CampaignStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  ENDED = 'ended',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  EXHAUSTED = 'exhausted',
  EXPIRED = 'expired',
  DRAFT = 'draft'
}
//enum: ["active", "paused", "completed", "exhausted", "expired", "pending"],
/**
 * Interface representing a campaign object.
 *
 * This interface provides strong typing for campaign data, ensuring consistency
 * and type safety throughout the application.
 */
export interface CampaignInterface {
  hasEndDate: boolean;
  link?: string;
  caption: string; // Short description or caption for the campaign
  currency: string;
  owner: string; // The user ID
  activityLog: ActivityLogItem[];

  _id: string;
  title: string;
  //description: string; // checked for removal
  status: CampaignStatus;
  budget: number;
  spent: number;
  payoutPerPromotion: number;
  maxPromoters: number;
  currentPromoters: number;
  views: number;
  estimatedReach: number;
  startDate: Date;
  endDate?: Date | null; // It can be null or undefined
  createdAt: Date;
  mediaUrl?: string;
  mediaType?: string;
  category: string;
  progress: number;
  remainingDays?: number | string | 'N/A' | 'Expired' | 'Budget Exhausted' | 'Budget-based';
  campaignType: 'standard' | 'premium' | 'boost';
  targetAudience: string;
  minViews: number;
  isApproved: boolean;
  priority: 'low' | 'medium' | 'high';

  updatedAt: string;
  spentBudget: number; // This is a key from your provided object
  paidPromotions: number;
  minViewsPerPromotion: number;
  validatedPromotions: number;
  totalPromotions: number;
}


