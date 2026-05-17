import { CampaignInterface, PromotionInterface } from '@shared/services';
import { formatRemainingDays, isDatePast } from './time.util';

const DEFAULT_COST_PER_CLICK = 80;

export type CampaignAvailabilityState =
  | 'expired'
  | 'budget_exhausted'
  | 'inactive'
  | 'new'
  | 'popular'
  | 'active';

export const getCampaignCostPerClick = (campaign: CampaignInterface): number => {
  const value = Number(campaign.costPerClick ?? campaign.payoutPerPromotion ?? DEFAULT_COST_PER_CLICK);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_COST_PER_CLICK;
};

export const getCampaignRemainingBudget = (campaign: CampaignInterface): number => {
  const explicitRemainingBudget = Number(campaign.remainingBudget);
  if (Number.isFinite(explicitRemainingBudget)) {
    return Math.max(explicitRemainingBudget, 0);
  }

  const budget = Number(campaign.budget ?? 0);
  const spentBudget = Number(campaign.spentBudget ?? 0);

  return Math.max(budget - spentBudget, 0);
};

export const hasCampaignPromoterLimit = (campaign: CampaignInterface): boolean => {
  void campaign;
  return false;
};

export const hasCampaignOpenPromoterSlots = (campaign: CampaignInterface): boolean => {
  void campaign;
  return true;
};

export const isCampaignExpired = (campaign: CampaignInterface): boolean => {
  if (['completed', 'expired'].includes(String(campaign.status))) {
    return true;
  }

  if (!campaign.endDate) {
    return false;
  }

  return isDatePast(new Date(campaign.endDate));
};

export const isCampaignBudgetExhausted = (campaign: CampaignInterface): boolean => {
  if (String(campaign.status) === 'exhausted') {
    return true;
  }

  return getCampaignRemainingBudget(campaign) < getCampaignCostPerClick(campaign);
};

export const getCampaignAvailabilityState = (campaign: CampaignInterface): CampaignAvailabilityState => {
  if (isCampaignExpired(campaign)) {
    return 'expired';
  }

  if (isCampaignBudgetExhausted(campaign)) {
    return 'budget_exhausted';
  }

  if (String(campaign.status) !== 'active') {
    return 'inactive';
  }

  const currentPromoters = Number(
    campaign.promotionSummary?.uniquePromoters
    ?? campaign.totalPromotions
    ?? 0
  );

  if (currentPromoters === 0) {
    return 'new';
  }

  if (currentPromoters >= 5 || getCampaignBillableClicks(campaign) >= 50) {
    return 'popular';
  }

  return 'active';
};

export const canCampaignBeAccepted = (campaign: CampaignInterface): boolean => {
  return ['new', 'popular', 'active'].includes(getCampaignAvailabilityState(campaign));
};

export const getCampaignStatusBadgeClass = (campaign: CampaignInterface): string => {
  const state = getCampaignAvailabilityState(campaign);

  if (['expired', 'budget_exhausted', 'inactive'].includes(state)) {
    return 'status-completed';
  }

  return 'status-active';
};

export const getCampaignStatusBadgeText = (campaign: CampaignInterface): string => {
  switch (getCampaignAvailabilityState(campaign)) {
    case 'expired':
      return 'Completed';
    case 'budget_exhausted':
      return 'Exhausted';
    case 'inactive':
      return 'Unavailable';
    case 'new':
      return 'New';
    case 'popular':
      return 'Popular';
    default:
      return 'Active';
  }
};

export const getCampaignAcceptButtonText = (campaign: CampaignInterface): string => {
  const state = getCampaignAvailabilityState(campaign);

  switch (state) {
    case 'expired':
      return 'Expired';
    case 'budget_exhausted':
      return 'Budget Exhausted';
    case 'inactive':
      return String(campaign.status) === 'paused' ? 'Paused' : 'Not Available';
    default:
      return 'Accept Campaign';
  }
};

export const getCampaignEstimatedClicks = (campaign: CampaignInterface): number => {
  const remainingBudget = getCampaignRemainingBudget(campaign);
  const costPerClick = getCampaignCostPerClick(campaign);
  return costPerClick > 0 ? Math.floor(remainingBudget / costPerClick) : 0;
};

export const getCampaignTimingLabel = (campaign: CampaignInterface): string => {
  if (isCampaignExpired(campaign)) {
    return 'Expired';
  }

  if (isCampaignBudgetExhausted(campaign)) {
    return 'Budget exhausted';
  }

  if (campaign.endDate) {
    return `Expires in ${formatRemainingDays(new Date(campaign.endDate))}`;
  }

  return 'Budget based';
};

export const getCampaignLocationMatchLabel = (campaign: CampaignInterface): string | null => {
  switch (campaign.ownerAddressMatchLevel) {
    case 'street':
      return 'Same area as you';
    case 'city':
      return 'Same city as you';
    case 'state':
      return 'Same state as you';
    case 'country':
      return 'Same country as you';
    default:
      return campaign.marketerLocationSummary || null;
  }
};

export const getCampaignSlotValue = (campaign: CampaignInterface): string => {
  const promoterCount = Number(
    campaign.promotionSummary?.uniquePromoters
    ?? campaign.totalPromotions
    ?? 0
  );
  return `${promoterCount}`;
};

export const getCampaignSlotLabel = (campaign: CampaignInterface): string => {
  return Number(campaign.promotionSummary?.uniquePromoters ?? 0) > 0
    ? 'Active Promoters'
    : 'Promoter Reach';
};

export const getCampaignLifecycleLabel = (campaign: CampaignInterface): string => {
  switch (String(campaign.status)) {
    case 'draft':
      return 'Draft';
    case 'pending':
      return 'Awaiting Approval';
    case 'paused':
      return 'Paused';
    case 'exhausted':
      return 'Budget Exhausted';
    case 'expired':
      return 'Expired';
    case 'completed':
      return 'Completed';
    case 'rejected':
      return 'Rejected';
    case 'active':
      if (isCampaignBudgetExhausted(campaign)) {
        return 'Budget Exhausted';
      }
      if (isCampaignExpired(campaign)) {
        return 'Expired';
      }
      return 'Live';
    default:
      return String(campaign.status || 'Campaign');
  }
};

export const getCampaignLifecycleClass = (campaign: CampaignInterface): string => {
  const status = String(campaign.status);

  if (status === 'active' && !isCampaignBudgetExhausted(campaign) && !isCampaignExpired(campaign)) {
    return 'status-active';
  }

  if (status === 'pending' || status === 'draft') {
    return 'status-pending';
  }

  if (status === 'paused') {
    return 'status-paused';
  }

  return 'status-completed';
};

export const getCampaignBudgetProgress = (campaign: CampaignInterface): number => {
  if (!campaign.budget) {
    return 0;
  }

  return Math.min((Number(campaign.spentBudget ?? 0) / Number(campaign.budget)) * 100, 100);
};

export const getCampaignTotalClicks = (campaign: CampaignInterface): number => {
  if (Number.isFinite(Number(campaign.totalClicks))) {
    return Number(campaign.totalClicks ?? 0);
  }

  return (campaign.promotions || []).reduce((sum, promotion) => {
    return sum + Number(promotion.clickStats?.totalClicks ?? 0);
  }, 0);
};

export const getCampaignBillableClicks = (campaign: CampaignInterface): number => {
  if (Number.isFinite(Number(campaign.billableClicks))) {
    return Number(campaign.billableClicks ?? 0);
  }

  return (campaign.promotions || []).reduce((sum, promotion) => {
    return sum + Number(promotion.clickStats?.billableClicks ?? 0);
  }, 0);
};

export const getCampaignInvalidClicks = (campaign: CampaignInterface): number => {
  if (Number.isFinite(Number(campaign.invalidClicks))) {
    return Number(campaign.invalidClicks ?? 0);
  }

  return (campaign.promotions || []).reduce((sum, promotion) => {
    const invalidClicks = Number(promotion.clickStats?.invalidClicks ?? 0);
    const duplicateClicks = Number(promotion.clickStats?.duplicateClicks ?? 0);
    return sum + invalidClicks + duplicateClicks;
  }, 0);
};

export const getCampaignUniquePromoterCount = (promotions: PromotionInterface[]): number => {
  const promoterIds = new Set<string>();

  promotions?.forEach((promotion) => {
    const promoter = promotion.promoter as { _id?: string } | string | undefined;
    const promoterId = typeof promoter === 'string' ? promoter : promoter?._id;
    if (promoterId) {
      promoterIds.add(String(promoterId));
    }
  });

  return promoterIds.size;
};
