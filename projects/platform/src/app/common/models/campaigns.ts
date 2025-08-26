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
  EXPIRED = 'expired'
}
//enum: ["active", "paused", "completed", "exhausted", "expired", "pending"],
/**
 * Interface representing a campaign object.
 *
 * This interface provides strong typing for campaign data, ensuring consistency
 * and type safety throughout the application.
 */
export interface Campaign {
  _id: string;
  owner: string;
  title: string;
  caption: string;
  link: string;
  budget: number;
  payoutPerPromotion: number;
  currency: string;
  maxPromoters: number;
  minViewsPerPromotion: number;
  totalPromotions: number;
  validatedPromotions: number;
  paidPromotions: number;
  spentBudget: number;
  startDate: string;
  endDate: string | null;
  status: CampaignStatus;
  activityLog: ActivityLogItem[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}
